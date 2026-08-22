import { pool } from "./src/db/pool.js";

try {
  const r = await pool.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `);

  console.table(r.rows);
} catch (error) {
  console.error(error);
} finally {
  await pool.end();
}
