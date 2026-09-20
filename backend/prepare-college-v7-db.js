import { pool } from './src/db/pool.js';

await pool.query(`
  ALTER TABLE career_questions
  ADD COLUMN IF NOT EXISTS college_years
  TEXT[] NOT NULL DEFAULT '{}'
`);

console.log(
  'career_questions.college_years ready.'
);

await pool.end();
