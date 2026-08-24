import 'dotenv/config';
import { pool } from './pool.js';

const client = await pool.connect();

try {
  await client.query('BEGIN');

  await client.query(`
    INSERT INTO exams (
      id,
      name,
      description,
      active
    )
    VALUES (
      'uptac',
      'UPTAC',
      'Uttar Pradesh Technical Admission Counselling for engineering admissions.',
      TRUE
    )
    ON CONFLICT (id)
    DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      active = EXCLUDED.active,
      updated_at = NOW()
  `);

  await client.query('COMMIT');

  console.log('UPTAC added successfully');
} catch (error) {
  await client.query('ROLLBACK');

  console.error('Failed to add UPTAC:', error.message);

  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}