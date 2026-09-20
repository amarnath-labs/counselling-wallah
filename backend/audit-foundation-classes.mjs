import { pool } from './src/db/pool.js';

const { rows } = await pool.query(`
  SELECT
    classes,
    COUNT(*)::int AS count
  FROM career_questions
  WHERE stage = 'foundation'
    AND version = 7
    AND active = TRUE
  GROUP BY classes
  ORDER BY count DESC
`);

console.table(rows);

await pool.end();
