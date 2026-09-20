import pg from "pg";
import dotenv from "dotenv";
import fs from "node:fs";

dotenv.config();

const { Pool } = pg;

const connectionString =
  process.env.DATABASE_URL ||
  process.env.DB_URL ||
  process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error("Database connection string missing");
}

const pool = new Pool({
  connectionString
});

try {

  const result = await pool.query(`
    SELECT
      c.id::text AS college_id,
      c.name AS college_name,

      fp.fee_year,

      fp.tuition_fee_per_semester,
      fp.academic_fee_per_semester,
      fp.hostel_fee_per_semester,
      fp.mess_fee_per_semester,
      fp.first_semester_fee,
      fp.annual_academic_fee,
      fp.annual_total_fee,
      fp.total_course_fee,

      fp.source_kind,
      fp.source_url,
      fp.confidence_score,
      fp.verification_status

    FROM colleges c

    LEFT JOIN college_fee_profiles fp
      ON fp.college_id = c.id::text

    ORDER BY c.name;
  `);

  const rows = result.rows;

  const processed = rows.map(row => {

    const missing = [];

    if (row.tuition_fee_per_semester == null)
      missing.push("tuition_fee_per_semester");

    if (row.academic_fee_per_semester == null)
      missing.push("academic_fee_per_semester");

    if (row.hostel_fee_per_semester == null)
      missing.push("hostel_fee_per_semester");

    if (row.mess_fee_per_semester == null)
      missing.push("mess_fee_per_semester");

    if (row.first_semester_fee == null)
      missing.push("first_semester_fee");

    if (row.annual_academic_fee == null)
      missing.push("annual_academic_fee");

    if (row.annual_total_fee == null)
      missing.push("annual_total_fee");

    if (row.total_course_fee == null)
      missing.push("total_course_fee");

    let status;

    if (!row.fee_year) {
      status = "NO_FEE_DATA";
    }
    else if (missing.length === 0) {
      status = "COMPLETE";
    }
    else if (missing.length <= 2) {
      status = "MOSTLY_COMPLETE";
    }
    else {
      status = "NEEDS_ENRICHMENT";
    }

    return {
      college_id: row.college_id,
      college_name: row.college_name,

      fee_year: row.fee_year,

      available_fields:
        8 - missing.length,

      missing_count:
        missing.length,

      missing_fields:
        missing,

      source_kind:
        row.source_kind,

      source_url:
        row.source_url,

      confidence_score:
        row.confidence_score,

      verification_status:
        row.verification_status,

      status
    };
  });

  /*
   * PRIORITY:
   *
   * 1. NO_FEE_DATA
   * 2. NEEDS_ENRICHMENT
   * 3. MOSTLY_COMPLETE
   * 4. COMPLETE
   */

  const priority = {
    NO_FEE_DATA: 0,
    NEEDS_ENRICHMENT: 1,
    MOSTLY_COMPLETE: 2,
    COMPLETE: 3
  };

  processed.sort((a, b) => {

    const p =
      priority[a.status] -
      priority[b.status];

    if (p !== 0)
      return p;

    return (
      b.missing_count -
      a.missing_count
    );
  });

  const workQueue =
    processed.filter(
      row =>
        row.status !== "COMPLETE"
    );

  fs.writeFileSync(
    "./fee-completion-work-queue.json",
    JSON.stringify(
      workQueue,
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
    "363 COLLEGE FEE COMPLETION AUDIT"
  );
  console.log(
    "========================================"
  );

  console.table(
    processed.map(row => ({
      college:
        row.college_name,

      available:
        `${row.available_fields}/8`,

      missing:
        row.missing_count,

      status:
        row.status
    }))
  );

  const complete =
    processed.filter(
      x =>
        x.status === "COMPLETE"
    ).length;

  const mostly =
    processed.filter(
      x =>
        x.status === "MOSTLY_COMPLETE"
    ).length;

  const enrichment =
    processed.filter(
      x =>
        x.status === "NEEDS_ENRICHMENT"
    ).length;

  const noData =
    processed.filter(
      x =>
        x.status === "NO_FEE_DATA"
    ).length;

  console.log("");
  console.log(
    "========================================"
  );

  console.log(
    "Total colleges:",
    processed.length
  );

  console.log(
    "Complete:",
    complete
  );

  console.log(
    "Mostly complete:",
    mostly
  );

  console.log(
    "Need enrichment:",
    enrichment
  );

  console.log(
    "No fee data:",
    noData
  );

  console.log(
    "Remaining:",
    workQueue.length
  );

  console.log("");
  console.log(
    "Saved:",
    "./fee-completion-work-queue.json"
  );

} finally {

  await pool.end();

}
