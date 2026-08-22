import { pool } from "./src/db/pool.js";

try {
  const r = await pool.query(`
    SELECT
      column_name,
      data_type,
      is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'cutoffs'
    ORDER BY ordinal_position
  `);

  console.table(r.rows);
} finally {
  await pool.end();
}
