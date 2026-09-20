import "dotenv/config";
import { pool } from "./src/db/pool.js";

try {
  const db = await pool.query(`
    SELECT
      current_database() AS database_name
  `);

  console.log("Database:", db.rows[0].database_name);

  const result = await pool.query(`
    SELECT
      counselling_type,
      year,
      COUNT(*)::int AS rows
    FROM cutoffs
    WHERE counselling_type IN (
      'JOSAA',
      'CSAB_SPECIAL'
    )
      AND year BETWEEN 2024 AND 2026
    GROUP BY counselling_type, year
    ORDER BY counselling_type, year
  `);

  console.table(result.rows);
} finally {
  await pool.end();
}
