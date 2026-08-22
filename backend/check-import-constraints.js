import { pool } from "./src/db/pool.js";

try {
  const r = await pool.query(`
    SELECT
      conrelid::regclass AS table_name,
      conname,
      pg_get_constraintdef(oid) AS definition
    FROM pg_constraint
    WHERE conrelid::regclass::text IN (
      'colleges',
      'branches',
      'cutoffs'
    )
    ORDER BY table_name, conname
  `);

  console.table(r.rows);
} catch (error) {
  console.error(error);
} finally {
  await pool.end();
}
