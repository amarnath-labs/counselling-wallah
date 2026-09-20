import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

try {
  await pool.query(`
    ALTER TABLE college_fee_profiles
    ALTER COLUMN college_id
    TYPE TEXT
    USING college_id::text
  `);

  console.log("college_id changed to TEXT");
} finally {
  await pool.end();
}
