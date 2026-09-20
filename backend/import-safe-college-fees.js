import fs from "node:fs";
import path from "node:path";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const connectionString =
  process.env.DATABASE_URL ||
  process.env.DB_URL ||
  process.env.POSTGRES_URL;

if (!connectionString) {
  console.error(
    "DATABASE_URL / DB_URL / POSTGRES_URL not found in environment."
  );
  process.exit(1);
}

const inputFile =
  process.argv[2] ||
  path.resolve(
    process.cwd(),
    "fee-import-safe.json"
  );

if (!fs.existsSync(inputFile)) {
  console.error(`Input file not found: ${inputFile}`);
  process.exit(1);
}

const rawJson = fs
  .readFileSync(inputFile, "utf8")
  .replace(/^\uFEFF/, "");

const rows = JSON.parse(rawJson);

if (!Array.isArray(rows)) {
  console.error(
    "Expected fee-import-safe.json to contain an array."
  );
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl:
    process.env.NODE_ENV === "production" ||
    /render\.com/i.test(connectionString)
      ? { rejectUnauthorized: false }
      : undefined,
});

function cleanText(value) {
  if (value == null) return null;

  const text = String(value).trim();

  return text || null;
}

function money(value) {
  if (value == null || value === "") {
    return null;
  }

  const n = Number(value);

  if (
    !Number.isFinite(n) ||
    n < 0 ||
    n > 10000000
  ) {
    return null;
  }

  return Math.round(n);
}

function score(value) {
  const n = Number(value);

  if (!Number.isFinite(n)) return 0;

  return Math.max(
    0,
    Math.min(100, Math.round(n))
  );
}

function normalizeCollegeName(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/\(iiit\)/g, "iiit")
    .replace(/\bindian institute of information technology\b/g, "iiit")
    .replace(/\bindian institute of technology\b/g, "iit")
    .replace(/\bnational institute of technology\b/g, "nit")
    .replace(/\bgujrat\b/g, "gujarat")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function createTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS college_fee_profiles (
      id BIGSERIAL PRIMARY KEY,

      college_id TEXT NULL,

      college_name_raw TEXT NOT NULL,
      college_name_normalized TEXT NOT NULL,

      fee_year INTEGER NOT NULL DEFAULT 2026,

      tuition_fee_per_semester INTEGER NULL,
      academic_fee_per_semester INTEGER NULL,
      first_semester_fee INTEGER NULL,
      mess_fee_per_semester INTEGER NULL,
      annual_academic_fee INTEGER NULL,

      source_url TEXT NULL,
      extraction_status TEXT NULL,

      confidence_score INTEGER NOT NULL DEFAULT 0,

      verification_status TEXT NOT NULL
        DEFAULT 'needs_review',

      source_kind TEXT NOT NULL
        DEFAULT 'official_scrape',

      is_manually_verified BOOLEAN NOT NULL
        DEFAULT FALSE,

      created_at TIMESTAMPTZ NOT NULL
        DEFAULT NOW(),

      updated_at TIMESTAMPTZ NOT NULL
        DEFAULT NOW(),

      CONSTRAINT college_fee_profiles_confidence_check
        CHECK (
          confidence_score >= 0
          AND confidence_score <= 100
        ),

      CONSTRAINT college_fee_profiles_status_check
        CHECK (
          verification_status IN (
            'needs_review',
            'review_recommended',
            'high_confidence',
            'verified'
          )
        )
    );
  `);

  await client.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS
      college_fee_profiles_name_year_uidx
    ON college_fee_profiles (
      college_name_normalized,
      fee_year
    );
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS
      college_fee_profiles_college_id_idx
    ON college_fee_profiles (college_id);
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS
      college_fee_profiles_verification_idx
    ON college_fee_profiles (
      verification_status,
      confidence_score DESC
    );
  `);
}

async function tryResolveCollegeId(
  client,
  rawName,
  normalizedName
) {
  /*
   * First try exact college name.
   *
   * If your colleges table has a different schema,
   * this lookup safely falls back to NULL.
   */
  try {
    const exact = await client.query(
      `
      SELECT id
      FROM colleges
      WHERE LOWER(TRIM(name)) =
            LOWER(TRIM($1))
      LIMIT 1
      `,
      [rawName]
    );

    if (exact.rows.length) {
      return exact.rows[0].id;
    }
  } catch {
    return null;
  }

  /*
   * Conservative normalized lookup.
   * We deliberately avoid fuzzy matching because
   * wrong college mapping is worse than NULL.
   */
  try {
    const result = await client.query(`
      SELECT id, name
      FROM colleges
    `);

    const matches = result.rows.filter(
      row =>
        normalizeCollegeName(row.name) ===
        normalizedName
    );

    if (matches.length === 1) {
      return matches[0].id;
    }
  } catch {
    // Keep college_id NULL.
  }

  return null;
}

async function upsertFee(client, item) {
  const rawName =
    cleanText(item.college_name);

  if (!rawName) {
    return {
      action: "skipped",
      reason: "missing college name",
    };
  }

  const normalizedName =
    normalizeCollegeName(rawName);

  const incomingConfidence =
    score(item.confidence_score);

  const incomingStatus =
    [
      "needs_review",
      "review_recommended",
      "high_confidence",
      "verified",
    ].includes(item.verification_status)
      ? item.verification_status
      : "needs_review";

  const collegeId =
    await tryResolveCollegeId(
      client,
      rawName,
      normalizedName
    );

  const existing = await client.query(
    `
    SELECT *
    FROM college_fee_profiles
    WHERE college_name_normalized = $1
      AND fee_year = 2026
    LIMIT 1
    `,
    [normalizedName]
  );

  if (existing.rows.length) {
    const current = existing.rows[0];

    /*
     * Absolute protection:
     * manually verified data cannot be overwritten
     * by automated scraping.
     */
    if (current.is_manually_verified) {
      return {
        action: "protected",
        reason:
          "existing record is manually verified",
        college: rawName,
      };
    }

    /*
     * VERIFIED also wins over scrape.
     */
    if (
      current.verification_status ===
      "verified"
    ) {
      return {
        action: "protected",
        reason:
          "existing record status is verified",
        college: rawName,
      };
    }

    /*
     * Lower confidence can never overwrite
     * higher confidence.
     */
    if (
      Number(current.confidence_score) >
      incomingConfidence
    ) {
      return {
        action: "protected",
        reason:
          `existing confidence ${current.confidence_score} > incoming ${incomingConfidence}`,
        college: rawName,
      };
    }
  }

  const result = await client.query(
    `
    INSERT INTO college_fee_profiles (
      college_id,
      college_name_raw,
      college_name_normalized,
      fee_year,

      tuition_fee_per_semester,
      academic_fee_per_semester,
      first_semester_fee,
      mess_fee_per_semester,
      annual_academic_fee,

      source_url,
      extraction_status,
      confidence_score,
      verification_status,
      source_kind,

      updated_at
    )
    VALUES (
      $1, $2, $3, 2026,
      $4, $5, $6, $7, $8,
      $9, $10, $11, $12,
      'official_scrape',
      NOW()
    )

    ON CONFLICT (
      college_name_normalized,
      fee_year
    )

    DO UPDATE SET
      college_id =
        COALESCE(
          college_fee_profiles.college_id,
          EXCLUDED.college_id
        ),

      college_name_raw =
        EXCLUDED.college_name_raw,

      tuition_fee_per_semester =
        CASE
          WHEN EXCLUDED.confidence_score >=
               college_fee_profiles.confidence_score
          THEN COALESCE(
            EXCLUDED.tuition_fee_per_semester,
            college_fee_profiles.tuition_fee_per_semester
          )
          ELSE
            college_fee_profiles.tuition_fee_per_semester
        END,

      academic_fee_per_semester =
        CASE
          WHEN EXCLUDED.confidence_score >=
               college_fee_profiles.confidence_score
          THEN COALESCE(
            EXCLUDED.academic_fee_per_semester,
            college_fee_profiles.academic_fee_per_semester
          )
          ELSE
            college_fee_profiles.academic_fee_per_semester
        END,

      first_semester_fee =
        CASE
          WHEN EXCLUDED.confidence_score >=
               college_fee_profiles.confidence_score
          THEN COALESCE(
            EXCLUDED.first_semester_fee,
            college_fee_profiles.first_semester_fee
          )
          ELSE
            college_fee_profiles.first_semester_fee
        END,

      mess_fee_per_semester =
        CASE
          WHEN EXCLUDED.confidence_score >=
               college_fee_profiles.confidence_score
          THEN COALESCE(
            EXCLUDED.mess_fee_per_semester,
            college_fee_profiles.mess_fee_per_semester
          )
          ELSE
            college_fee_profiles.mess_fee_per_semester
        END,

      annual_academic_fee =
        CASE
          WHEN EXCLUDED.confidence_score >=
               college_fee_profiles.confidence_score
          THEN COALESCE(
            EXCLUDED.annual_academic_fee,
            college_fee_profiles.annual_academic_fee
          )
          ELSE
            college_fee_profiles.annual_academic_fee
        END,

      source_url =
        CASE
          WHEN EXCLUDED.confidence_score >=
               college_fee_profiles.confidence_score
          THEN EXCLUDED.source_url
          ELSE college_fee_profiles.source_url
        END,

      extraction_status =
        CASE
          WHEN EXCLUDED.confidence_score >=
               college_fee_profiles.confidence_score
          THEN EXCLUDED.extraction_status
          ELSE college_fee_profiles.extraction_status
        END,

      confidence_score =
        GREATEST(
          college_fee_profiles.confidence_score,
          EXCLUDED.confidence_score
        ),

      verification_status =
        CASE
          WHEN college_fee_profiles.is_manually_verified
            THEN 'verified'

          WHEN college_fee_profiles.verification_status =
               'verified'
            THEN 'verified'

          WHEN EXCLUDED.confidence_score >=
               college_fee_profiles.confidence_score
            THEN EXCLUDED.verification_status

          ELSE college_fee_profiles.verification_status
        END,

      updated_at = NOW()

    WHERE
      college_fee_profiles.is_manually_verified = FALSE
      AND
      college_fee_profiles.verification_status <> 'verified'
      AND
      EXCLUDED.confidence_score >=
        college_fee_profiles.confidence_score

    RETURNING
      id,
      college_id,
      college_name_raw,
      confidence_score,
      verification_status;
    `,
    [
      collegeId,
      rawName,
      normalizedName,

      money(item.tuition_fee_per_semester),
      money(item.academic_fee_per_semester),
      money(item.first_semester_fee),
      money(item.mess_fee_per_semester),
      money(item.annual_academic_fee),

      cleanText(item.source_url),
      cleanText(item.extraction_status),
      incomingConfidence,
      incomingStatus,
    ]
  );

  if (!result.rows.length) {
    return {
      action: "protected",
      reason:
        "database safeguard prevented overwrite",
      college: rawName,
    };
  }

  return {
    action:
      existing.rows.length
        ? "updated"
        : "inserted",

    college: rawName,
    row: result.rows[0],
  };
}

const client = await pool.connect();

try {
  await client.query("BEGIN");

  await createTable(client);

  console.log("");
  console.log("======================================");
  console.log(" COLLEGE FEE SAFE IMPORT");
  console.log("======================================");
  console.log(`Input records: ${rows.length}`);
  console.log("");

  const results = [];

  for (const item of rows) {
    const result =
      await upsertFee(client, item);

    results.push(result);

    console.log(
      `[${result.action.toUpperCase()}]`,
      result.college || "",
      result.reason
        ? `- ${result.reason}`
        : ""
    );
  }

  await client.query("COMMIT");

  const summary = {
    inserted:
      results.filter(
        x => x.action === "inserted"
      ).length,

    updated:
      results.filter(
        x => x.action === "updated"
      ).length,

    protected:
      results.filter(
        x => x.action === "protected"
      ).length,

    skipped:
      results.filter(
        x => x.action === "skipped"
      ).length,
  };

  console.log("");
  console.log("======================================");
  console.log(" IMPORT COMPLETE");
  console.log("======================================");
  console.table(summary);
  console.log("");

  const check = await client.query(`
    SELECT
      id,
      college_id,
      college_name_raw,
      tuition_fee_per_semester,
      academic_fee_per_semester,
      first_semester_fee,
      mess_fee_per_semester,
      annual_academic_fee,
      confidence_score,
      verification_status
    FROM college_fee_profiles
    WHERE fee_year = 2026
    ORDER BY
      confidence_score DESC,
      college_name_raw
  `);

  console.table(check.rows);
} catch (error) {
  await client.query("ROLLBACK");

  console.error("");
  console.error("IMPORT FAILED");
  console.error(error);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}

