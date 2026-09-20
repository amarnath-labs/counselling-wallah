import { pool } from './src/db/pool.js';

const client = await pool.connect();

try {
  await client.query('BEGIN');

  await client.query(`
    ALTER TABLE career_questions
    DROP CONSTRAINT IF EXISTS career_questions_context_scope_check
  `);

  await client.query(`
    ALTER TABLE career_questions
    ADD CONSTRAINT career_questions_context_scope_check
    CHECK (
      context_scope IN (
        'universal',
        'school',
        'school-transition',
        'senior-secondary',
        'post-school-transition',
        'college',
        'graduate',
        'professional'
      )
    )
  `);

  await client.query('COMMIT');

  console.log(
    'career_questions context_scope constraint updated.'
  );
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
  await pool.end();
}
