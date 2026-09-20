import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const connectionString =
  process.env.DATABASE_URL ||
  process.env.DB_URL ||
  process.env.POSTGRES_URL;

const pool = new Pool({
  connectionString
});

try {
  const result = await pool.query(`
    SELECT
      column_name,
      data_type
    FROM information_schema.columns
    WHERE table_name = 'college_fee_profiles'
      AND column_name = 'college_id'
  `);

  console.table(result.rows);
} finally {
  await pool.end();
}
