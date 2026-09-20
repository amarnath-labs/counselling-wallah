import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    process.env.DB_URL
});

async function main() {

  console.log("\n=== college_fee_profiles ===");

  const cfp = await pool.query(`
    SELECT
      id,
      college_id,
      college_name_raw,
      fee_year,
      tuition_fee_per_semester,
      academic_fee_per_semester,
      first_semester_fee,
      mess_fee_per_semester,
      annual_academic_fee,
      hostel_fee_per_semester,
      annual_total_fee,
      total_course_fee,
      source_url,
      confidence_score,
      verification_status,
      source_kind
    FROM college_fee_profiles
    WHERE
      LOWER(college_name_raw)
        LIKE '%national institute of technology agartala%'
      OR
      LOWER(college_name_raw)
        LIKE '%nit agartala%'
  `);

  console.table(cfp.rows);

  console.log("\n=== branch_fees ===");

  const bf = await pool.query(`
    SELECT
      id,
      college_id,
      branch_id,
      program,
      fee_scope,
      tuition_fee,
      hostel_fee,
      other_fee,
      total_annual_fee,
      academic_year,
      source_label,
      source_url,
      verification_status
    FROM branch_fees
    WHERE
      LOWER(college_id)
        LIKE '%agartala%'
  `);

  console.table(bf.rows);

  console.log("\n=== college_fees ===");

  const cf = await pool.query(`
    SELECT *
    FROM college_fees
    WHERE
      LOWER(college_id)
        LIKE '%agartala%'
  `);

  console.table(cf.rows);

  await pool.end();
}

main().catch(async err => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
