import { pool } from "./src/db/pool.js";

const result = await pool.query(`
  SELECT
    column_name,
    data_type,
    is_nullable
  FROM information_schema.columns
  WHERE table_name = 'payments'
  ORDER BY ordinal_position
`);

console.table(result.rows);
await pool.end();
