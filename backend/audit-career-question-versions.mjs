import { pool } from './src/db/pool.js';

const { rows } = await pool.query(`
  SELECT
    stage,
    version,
    COUNT(*)::int AS count
  FROM career_questions
  GROUP BY stage, version
  ORDER BY stage, version
`);

console.table(rows);

await pool.end();
