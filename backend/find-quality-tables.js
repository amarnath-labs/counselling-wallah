import { pool } from "./src/db/pool.js";

try {
  const result = await pool.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND (
        LOWER(table_name) LIKE '%quality%'
        OR LOWER(table_name) LIKE '%nirf%'
        OR LOWER(table_name) LIKE '%placement%'
      )
    ORDER BY table_name
  `);

  console.table(result.rows);
} catch (error) {
  console.error(error);
} finally {
  await pool.end();
}
