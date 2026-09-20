import pg from "pg";
import "dotenv/config";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

async function main() {
  try {
    const result = await pool.query(`
      SELECT id, name
      FROM colleges
      WHERE
        LOWER(name) LIKE '%nehru%allahabad%'
        OR LOWER(name) LIKE '%vallabhbhai%surat%'
        OR LOWER(name) LIKE '%manit%bhopal%'
        OR LOWER(name) LIKE '%maulana azad%'
      ORDER BY name
    `);

    console.table(result.rows);
  } catch (error) {
    console.error(error);
  } finally {
    await pool.end();
  }
}

main();