import { pool } from './src/db/pool.js';

await pool.query(`
  ALTER TABLE career_assessments
  ADD COLUMN IF NOT EXISTS question_pool_ids
  TEXT[] NOT NULL DEFAULT '{}'
`);

console.log(
  'career_assessments.question_pool_ids ready.'
);

await pool.end();
