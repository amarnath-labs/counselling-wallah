import { pool } from './src/db/pool.js';

const { rows } = await pool.query(`
  SELECT
    conname,
    pg_get_constraintdef(oid) AS definition
  FROM pg_constraint
  WHERE conrelid =
    'career_questions'::regclass
    AND conname =
      'career_questions_context_scope_check'
`);

console.table(rows);

await pool.end();
