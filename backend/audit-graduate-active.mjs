import { pool } from './src/db/pool.js';

const { rows } = await pool.query(`
  SELECT
    version,
    active,
    COUNT(*)::int AS count
  FROM career_questions
  WHERE stage = 'graduate'
  GROUP BY version, active
  ORDER BY version, active
`);

console.table(rows);

await pool.end();
