import { pool } from "./src/db/pool.js";

try {
  const r = await pool.query(`
    SELECT
      conname,
      pg_get_constraintdef(oid) AS definition
    FROM pg_constraint
    WHERE conrelid = 'counselling_events'::regclass
      AND contype = 'c'
  `);

  console.table(r.rows);
} catch (error) {
  console.error(error);
} finally {
  await pool.end();
}
