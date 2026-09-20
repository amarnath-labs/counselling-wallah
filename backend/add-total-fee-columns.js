import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const connectionString =
  process.env.DATABASE_URL ||
  process.env.DB_URL ||
  process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL / DB_URL / POSTGRES_URL missing"
  );
}

const pool = new Pool({
  connectionString
});

try {
  await pool.query(`
    ALTER TABLE college_fee_profiles
      ADD COLUMN IF NOT EXISTS
        hostel_fee_per_semester NUMERIC(12,2),

      ADD COLUMN IF NOT EXISTS
        annual_total_fee NUMERIC(12,2),

      ADD COLUMN IF NOT EXISTS
        total_course_fee NUMERIC(12,2);
  `);

  console.log("");
  console.log(
    "FEE PROFILE SCHEMA UPDATED"
  );

  const result =
    await pool.query(`
      SELECT
        column_name,
        data_type
      FROM information_schema.columns
      WHERE table_name =
        'college_fee_profiles'
        AND column_name IN (
          'tuition_fee_per_semester',
          'academic_fee_per_semester',
          'hostel_fee_per_semester',
          'mess_fee_per_semester',
          'first_semester_fee',
          'annual_academic_fee',
          'annual_total_fee',
          'total_course_fee'
        )
      ORDER BY column_name;
    `);

  console.table(
    result.rows
  );

} finally {
  await pool.end();
}
