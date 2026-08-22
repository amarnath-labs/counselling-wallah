import fs from "node:fs";
import path from "node:path";
import { pool } from "./src/db/pool.js";

const CSV_FILE = path.resolve(
  "./data/official/josaa-2026/josaa-round-1-full.csv"
);

const DATA_SOURCE_ID = 70;
const YEAR = 2026;
const ROUND = "1";

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (
        insideQuotes &&
        line[i + 1] === '"'
      ) {
        current += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === "," && !insideQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);

  return result.map(x => x.trim());
}

function readCSV(file) {
  const text = fs.readFileSync(file, "utf8");

  const lines = text
    .split(/\r?\n/)
    .filter(line => line.trim());

  const headers = parseCSVLine(lines[0]);

  return lines.slice(1).map((line, index) => {
    const values = parseCSVLine(line);

    const row = {};

    headers.forEach((header, i) => {
      row[header] = values[i] ?? "";
    });

    row.__line = index + 2;

    return row;
  });
}

async function getOrCreateCollege(institute) {
  const existing = await pool.query(
    `
    SELECT id
    FROM colleges
    WHERE LOWER(name) = LOWER($1)
    LIMIT 1
    `,
    [institute]
  );

  if (existing.rows.length > 0) {
    return existing.rows[0].id;
  }

  const id = slugify(institute);

  const result = await pool.query(
    `
    INSERT INTO colleges (
      id,
      name,
      city,
      state,
      type,
      established,
      website,
      portal,
      josaa_participating,
      csab_participating,
      csab_special,
      created_at,
      updated_at
    )
    VALUES (
      $1,
      $2,
      $3,
      $4,
      $5,
      NULL,
      NULL,
      NULL,
      TRUE,
      FALSE,
      FALSE,
      NOW(),
      NOW()
    )
    ON CONFLICT (id)
    DO UPDATE SET
      josaa_participating = TRUE,
      updated_at = NOW()
    RETURNING id
    `,
    [
      id,
      institute,
      "Unknown",
      "Unknown",
      "IIT"
    ]
  );

  return result.rows[0].id;
}

async function getOrCreateBranch(
  collegeId,
  programName
) {
  const existing = await pool.query(
    `
    SELECT id
    FROM branches
    WHERE college_id = $1
      AND name = $2
    LIMIT 1
    `,
    [collegeId, programName]
  );

  if (existing.rows.length > 0) {
    return existing.rows[0].id;
  }

  const result = await pool.query(
    `
    INSERT INTO branches (
      college_id,
      name,
      fees,
      median_package,
      average_package,
      highest_package,
      placement_rate,
      created_at,
      updated_at
    )
    VALUES (
      $1,
      $2,
      0,
      0,
      0,
      0,
      0,
      NOW(),
      NOW()
    )
    RETURNING id
    `,
    [collegeId, programName]
  );

  return result.rows[0].id;
}

async function insertCutoff({
  branchId,
  quota,
  seatType,
  gender,
  openingRank,
  closingRank
}) {
  await pool.query(
    `
    INSERT INTO cutoffs (
      branch_id,
      year,
      round,
      category,
      quota,
      gender,
      opening_rank,
      closing_rank,
      source_label,
      is_verified,
      data_source_id,
      source_url,
      retrieved_at,
      verification_status,
      counselling_type,
      created_at
    )
    VALUES (
      $1,
      $2,
      $3,
      $4,
      $5,
      $6,
      $7,
      $8,
      $9,
      TRUE,
      $10,
      $11,
      NOW(),
      'VERIFIED',
      'JOSAA',
      NOW()
    )
    ON CONFLICT (
      branch_id,
      year,
      round,
      category,
      quota,
      gender
    )
    DO UPDATE SET
      opening_rank = EXCLUDED.opening_rank,
      closing_rank = EXCLUDED.closing_rank,
      source_label = EXCLUDED.source_label,
      is_verified = TRUE,
      data_source_id = EXCLUDED.data_source_id,
      source_url = EXCLUDED.source_url,
      retrieved_at = NOW(),
      verification_status = 'VERIFIED',
      counselling_type = 'JOSAA'
    `,
    [
      branchId,
      YEAR,
      ROUND,
      seatType,
      quota,
      gender,
      openingRank,
      closingRank,
      "JoSAA 2026 Round 1 Official OR/CR",
      DATA_SOURCE_ID,
      "https://josaa.admissions.nic.in/applicant/seatallotmentresult/currentorcr.aspx"
    ]
  );
}

async function main() {
  console.log("========================================");
  console.log("JOSAA 2026 ROUND 1 IMPORT");
  console.log("========================================");

  if (!fs.existsSync(CSV_FILE)) {
    throw new Error(
      `CSV not found: ${CSV_FILE}`
    );
  }

  console.log("\nCSV:");
  console.log(CSV_FILE);

  const rows = readCSV(CSV_FILE);

  console.log(
    `\nCSV RECORDS: ${rows.length}`
  );

  if (rows.length !== 12968) {
    console.warn(
      `WARNING: Expected 12968 records, found ${rows.length}`
    );
  }

  let imported = 0;
  let skipped = 0;

  const collegeCache = new Map();
  const branchCache = new Map();

  for (const row of rows) {
    try {
      const institute =
        row["Institute"]?.trim();

      const program =
        row["Academic Program Name"]?.trim();

      const quota =
        row["Quota"]?.trim();

      const seatType =
        row["Seat Type"]?.trim();

      const gender =
        row["Gender"]?.trim();

      const openingRank =
        Number(row["Opening Rank"]);

      const closingRank =
        Number(row["Closing Rank"]);

      if (
        !institute ||
        !program ||
        !quota ||
        !seatType ||
        !gender ||
        !Number.isFinite(openingRank) ||
        !Number.isFinite(closingRank)
      ) {
        console.warn(
          `SKIP CSV LINE ${row.__line}: invalid data`
        );

        skipped++;
        continue;
      }

      // -----------------------------
      // COLLEGE
      // -----------------------------

      let collegeId =
        collegeCache.get(institute);

      if (!collegeId) {
        collegeId =
          await getOrCreateCollege(
            institute
          );

        collegeCache.set(
          institute,
          collegeId
        );
      }

      // -----------------------------
      // BRANCH
      // -----------------------------

      const branchKey =
        `${collegeId}|${program}`;

      let branchId =
        branchCache.get(branchKey);

      if (!branchId) {
        branchId =
          await getOrCreateBranch(
            collegeId,
            program
          );

        branchCache.set(
          branchKey,
          branchId
        );
      }

      // -----------------------------
      // CUTOFF
      // -----------------------------

      await insertCutoff({
        branchId,
        quota,
        seatType,
        gender,
        openingRank,
        closingRank
      });

      imported++;

      if (
        imported % 500 === 0
      ) {
        console.log(
          `Imported: ${imported}/${rows.length}`
        );
      }
    } catch (error) {
      skipped++;

      console.error(
        `ERROR CSV LINE ${row.__line}:`,
        error.message
      );
    }
  }

  console.log("\n========================================");
  console.log("IMPORT FINISHED");
  console.log("========================================");

  console.log(
    "Imported:",
    imported
  );

  console.log(
    "Skipped:",
    skipped
  );

  console.log(
    "Colleges processed:",
    collegeCache.size
  );

  console.log(
    "Branches processed:",
    branchCache.size
  );
}

main()
  .catch(error => {
    console.error("\n========================================");
    console.error("IMPORT FAILED");
    console.error("========================================");
    console.error(
      error.stack || error.message
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });