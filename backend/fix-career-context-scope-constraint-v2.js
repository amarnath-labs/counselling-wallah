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
      context_scope IS NULL
      OR context_scope IN (
        'career-discriminator',
        'class',
        'college',
        'interest',
        'post-school-transition',
        'school',
        'school-transition',
        'senior-secondary',
        'subject',
        'professional'
      )
    )
    NOT VALID
  `);

  await client.query('COMMIT');

  console.log(
    'V7 context_scope constraint installed safely as NOT VALID.'
  );
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
  await pool.end();
}


