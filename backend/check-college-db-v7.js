import { pool } from './src/db/pool.js';

const { rows } = await pool.query(`
  SELECT
    stage,
    COUNT(*)::int AS count
  FROM career_questions
  WHERE active = TRUE
    AND stage = 'college'
  GROUP BY stage
`);

console.table(rows);

await pool.end();
