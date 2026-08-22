import { pool } from "./src/db/pool.js";

try {
  const r = await pool.query(`
    SELECT
      column_name,
      data_type,
      is_nullable,
      column_default
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'counselling_events'
    ORDER BY ordinal_position
  `);

  console.table(r.rows);
} catch (error) {
  console.error(error);
} finally {
  await pool.end();
}
