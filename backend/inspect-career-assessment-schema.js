import { pool } from './src/db/pool.js';

const { rows } = await pool.query(`
  SELECT
    column_name,
    data_type,
    udt_name,
    is_nullable,
    column_default
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'career_assessments'
  ORDER BY ordinal_position
`);

console.table(rows);

await pool.end();
