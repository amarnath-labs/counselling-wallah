import { pool } from './src/db/pool.js';

const { rows } = await pool.query(`
  SELECT
    id,
    stage,
    version,
    section,
    trait,
    text
  FROM career_questions
  WHERE stage = 'graduate'
  ORDER BY id
  LIMIT 30
`);

console.table(rows);

await pool.end();
