import fs from "node:fs";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const connectionString =
  process.env.DATABASE_URL ||
  process.env.DB_URL ||
  process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error("Database connection string missing");
}

const pool = new Pool({ connectionString });

const QUEUE_FILE = "./fee-completion-work-queue.json";
const BATCH_SIZE = 25;

/*
  IMPORTANT:
  Ye script research nahi karta.
  Ye queue ko batch-wise prepare karta hai taaki
  hum 25 colleges per batch fee data collect/import karein.

  Manual one-by-one nahi.
*/

function cleanJson(text) {
  return text.replace(/^\uFEFF/, "");
}

function uniqueByCollegeId(rows) {
  const seen = new Set();
  const out = [];

  for (const row of rows) {
    if (!row?.college_id) continue;

    if (seen.has(row.college_id)) continue;

    seen.add(row.college_id);
    out.push(row);
  }

  return out;
}

try {

  if (!fs.existsSync(QUEUE_FILE)) {
    throw new Error(
      "fee-completion-work-queue.json not found"
    );
  }

  const queue =
    JSON.parse(
      cleanJson(
        fs.readFileSync(
          QUEUE_FILE,
          "utf8"
        )
      )
    );

  /*
    First priority:
    1. NO_FEE_DATA
    2. NEEDS_ENRICHMENT
    3. MOSTLY_COMPLETE
  */

  const priority = {
    NO_FEE_DATA: 0,
    NEEDS_ENRICHMENT: 1,
    MOSTLY_COMPLETE: 2
  };

  const sorted =
    [...queue].sort((a, b) => {

      const pa =
        priority[a.status] ?? 99;

      const pb =
        priority[b.status] ?? 99;

      if (pa !== pb) {
        return pa - pb;
      }

      return (
        Number(b.missing_count || 0) -
        Number(a.missing_count || 0)
      );
    });

  const unique =
    uniqueByCollegeId(sorted);

  const batch =
    unique.slice(
      0,
      BATCH_SIZE
    );

  const batchNumber =
    new Date()
      .toISOString()
      .replace(/[:.]/g, "-");

  const outFile =
    `./fee-bulk-batch-${batchNumber}.json`;

  const prepared =
    batch.map(row => ({
      college_id:
        row.college_id,

      college_name:
        row.college_name,

      program:
        "B.Tech",

      academic_year:
        2026,

      missing_fields:
        row.missing_fields || [
          "tuition_fee_per_semester",
          "academic_fee_per_semester",
          "hostel_fee_per_semester",
          "mess_fee_per_semester",
          "first_semester_fee",
          "annual_academic_fee",
          "annual_total_fee",
          "total_course_fee"
        ],

      research_status:
        "pending",

      source_strategy: [
        "official",
        "official_admission_or_counselling",
        "collegedunia_or_shiksha",
        "careers360_or_other_secondary"
      ],

      rules: {
        official_first: true,
        fallback_only_for_missing_fields: true,
        unclear_value: "null",
        conflict_status: "review_recommended",
        do_not_guess: true
      }
    }));

  fs.writeFileSync(
    outFile,
    JSON.stringify(
      prepared,
      null,
      2
    ),
    "utf8"
  );

  console.log("");
  console.log(
    "========================================"
  );
  console.log(
    "BULK FEE BATCH PREPARED"
  );
  console.log(
    "========================================"
  );

  console.log(
    "Batch size:",
    prepared.length
  );

  console.log(
    "Saved:",
    outFile
  );

  console.log("");

  console.table(
    prepared.map(
      (x, i) => ({
        no: i + 1,
        college:
          x.college_name,
        missing:
          x.missing_fields.length
      })
    )
  );

  console.log("");
  console.log(
    "NEXT:"
  );

  console.log(
    "Is batch ke 25 colleges ka fee data collect/import karna hai."
  );

} finally {
  await pool.end();
}
