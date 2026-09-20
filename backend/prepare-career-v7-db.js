import { pool } from './src/db/pool.js';

await pool.query(`
  ALTER TABLE career_questions
  ADD COLUMN IF NOT EXISTS entrance_exams TEXT[] NOT NULL DEFAULT '{}'
`);

await pool.query(`
  ALTER TABLE career_questions
  ADD COLUMN IF NOT EXISTS target_courses TEXT[] NOT NULL DEFAULT '{}'
`);

console.log(
  'career_questions metadata columns ready.'
);

await pool.end();
