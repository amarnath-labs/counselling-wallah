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

  const r = await pool.query(`
    SELECT
      id,
      college_id,
      college_name_raw,
      fee_year,
      tuition_fee_per_semester,
      academic_fee_per_semester,
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
        LIKE '%information technology bhopal%'
      OR
      LOWER(college_id)
        LIKE '%information-technology-bhopal%'
  `);

  console.table(r.rows);

  await pool.end();
}

main().catch(async err => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
