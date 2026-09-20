import "dotenv/config";
import fs from "fs";
import pg from "pg";

const { Pool } = pg;

const DB_URL = process.env.DATABASE_URL || process.env.DB_URL;

if (!DB_URL) {
  console.error("DATABASE_URL / DB_URL missing in .env");
  process.exit(1);
}

const pool = new Pool({
  connectionString: DB_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : undefined,
});

function clean(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).replace(/\s+/g, " ").trim();
  return s || null;
}

function sourceName(v) {
  return clean(v)?.toUpperCase() || null;
}

function ratingValue(v) {
  if (v === null || v === undefined || v === "") return null;

  const n = Number(v);

  if (!Number.isFinite(n)) return null;
  if (n < 0 || n > 5) return null;

  return n;
}

function dateValue(v) {
  if (!v) return null;

  const d = new Date(v);

  if (Number.isNaN(d.getTime())) return null;

  return d.toISOString();
}

function generatedId(row, index) {
  if (row.external_review_id) {
    return clean(row.external_review_id);
  }

  if (row.review_id) {
    return clean(row.review_id);
  }

  if (row.id) {
    return clean(row.id);
  }

  const raw = [
    sourceName(row.source) || "UNKNOWN",
    clean(row.college_id) || "UNKNOWN",
    clean(row.review_text || row.text || row.content) || "",
    index,
  ].join("|");

  return (
    "generated-" +
    Buffer.from(raw)
      .toString("base64")
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 60)
  );
}

function loadJson(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const data = JSON.parse(
    fs.readFileSync(filePath, "utf8")
  );

  if (Array.isArray(data)) return data;
  if (Array.isArray(data.reviews)) return data.reviews;
  if (Array.isArray(data.data)) return data.data;

  throw new Error(
    "JSON must be an array or contain reviews[] / data[]"
  );
}

async function collegeExists(client, collegeId) {
  const checks = [
    `SELECT 1 FROM colleges WHERE id::text = $1 LIMIT 1`,
    `SELECT 1 FROM colleges WHERE college_id::text = $1 LIMIT 1`,
    `SELECT 1 FROM college_review_sources WHERE college_id = $1 LIMIT 1`,
  ];

  for (const sql of checks) {
    try {
      const r = await client.query(sql, [collegeId]);

      if (r.rowCount > 0) {
        return true;
      }
    } catch {
      // try next schema
    }
  }

  return false;
}

async function ensureSource(
  client,
  collegeId,
  source,
  sourceUrl
) {
  const existing = await client.query(
    `
    SELECT id
    FROM college_review_sources
    WHERE college_id = $1
      AND source = $2
    LIMIT 1
    `,
    [collegeId, source]
  );

  if (existing.rowCount > 0) {
    await client.query(
      `
      UPDATE college_review_sources
      SET source_url = COALESCE($1, source_url),
          source_status = 'DATA_IMPORTED',
          last_synced_at = NOW(),
          updated_at = NOW()
      WHERE id = $2
      `,
      [sourceUrl, existing.rows[0].id]
    );

    return;
  }

  await client.query(
    `
    INSERT INTO college_review_sources
    (
      college_id,
      source,
      source_url,
      source_status,
      last_synced_at,
      created_at,
      updated_at
    )
    VALUES
    (
      $1,
      $2,
      $3,
      'DATA_IMPORTED',
      NOW(),
      NOW(),
      NOW()
    )
    `,
    [collegeId, source, sourceUrl]
  );
}

async function importRow(client, row, index) {
  const collegeId = clean(row.college_id);
  const source = sourceName(row.source);

  const reviewText = clean(
    row.review_text ??
      row.text ??
      row.content
  );

  if (!collegeId) {
    return {
      status: "INVALID",
      reason: "college_id missing",
    };
  }

  if (!source) {
    return {
      status: "INVALID",
      reason: "source missing",
    };
  }

  if (!reviewText) {
    return {
      status: "INVALID",
      reason: "review_text missing",
    };
  }

  if (!(await collegeExists(client, collegeId))) {
    return {
      status: "UNKNOWN_COLLEGE",
      reason: collegeId,
    };
  }

  const externalId = generatedId(row, index);

  const author = clean(
    row.author_name ??
      row.author ??
      row.username
  );

  const rating = ratingValue(row.rating);

  const reviewDate = dateValue(
    row.review_date ??
      row.date ??
      row.created_at
  );

  const sourceUrl = clean(
    row.source_url ??
      row.url ??
      row.permalink
  );

  const language =
    clean(row.language) || "unknown";

  await ensureSource(
    client,
    collegeId,
    source,
    sourceUrl
  );

  const existing = await client.query(
    `
    SELECT id
    FROM college_reviews
    WHERE college_id = $1
      AND source = $2
      AND external_review_id = $3
    LIMIT 1
    `,
    [collegeId, source, externalId]
  );

  if (existing.rowCount > 0) {
    await client.query(
      `
      UPDATE college_reviews
      SET author_name = $1,
          rating = $2,
          review_text = $3,
          review_date = $4,
          source_url = $5,
          language = $6
      WHERE id = $7
      `,
      [
        author,
        rating,
        reviewText,
        reviewDate,
        sourceUrl,
        language,
        existing.rows[0].id,
      ]
    );

    return { status: "UPDATED" };
  }

  await client.query(
    `
    INSERT INTO college_reviews
    (
      college_id,
      source,
      external_review_id,
      author_name,
      rating,
      review_text,
      review_date,
      source_url,
      language,
      created_at
    )
    VALUES
    (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,NOW()
    )
    `,
    [
      collegeId,
      source,
      externalId,
      author,
      rating,
      reviewText,
      reviewDate,
      sourceUrl,
      language,
    ]
  );

  return { status: "INSERTED" };
}

async function main() {
  const inputFile = process.argv[2];

  if (!inputFile) {
    console.log(`
Usage:

node import-authorized-reviews.js reviews.json
`);
    process.exit(0);
  }

  const rows = loadJson(inputFile);

  console.log("======================================");
  console.log("AUTHORIZED REVIEW IMPORTER");
  console.log("======================================");
  console.log("Input:", inputFile);
  console.log("Rows:", rows.length);

  const client = await pool.connect();

  const stats = {
    inserted: 0,
    updated: 0,
    invalid: 0,
    unknownCollege: 0,
    failed: 0,
  };

  const rejected = [];

  try {
    await client.query("BEGIN");

    for (let i = 0; i < rows.length; i++) {
      try {
        const result = await importRow(
          client,
          rows[i],
          i
        );

        if (result.status === "INSERTED") {
          stats.inserted++;
        } else if (result.status === "UPDATED") {
          stats.updated++;
        } else if (
          result.status === "UNKNOWN_COLLEGE"
        ) {
          stats.unknownCollege++;

          rejected.push({
            row: i + 1,
            reason: "UNKNOWN_COLLEGE",
            college_id: rows[i].college_id,
          });
        } else {
          stats.invalid++;

          rejected.push({
            row: i + 1,
            reason: result.reason,
          });
        }
      } catch (error) {
        stats.failed++;

        rejected.push({
          row: i + 1,
          reason: error.message,
        });
      }

      if ((i + 1) % 100 === 0) {
        console.log(
          `Processed ${i + 1}/${rows.length}`
        );
      }
    }

    await client.query("COMMIT");

    if (rejected.length > 0) {
      fs.writeFileSync(
        "./review-import-rejected.json",
        JSON.stringify(rejected, null, 2)
      );
    }

    console.log("");
    console.log("======================================");
    console.log("IMPORT COMPLETE");
    console.log("======================================");
    console.log("TOTAL:", rows.length);
    console.log("INSERTED:", stats.inserted);
    console.log("UPDATED:", stats.updated);
    console.log("INVALID:", stats.invalid);
    console.log(
      "UNKNOWN COLLEGE:",
      stats.unknownCollege
    );
    console.log("FAILED:", stats.failed);
    console.log("======================================");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error("IMPORT FAILED:");
  console.error(error.stack || error.message);
  process.exit(1);
});