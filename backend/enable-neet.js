import { pool } from './src/db/pool.js';

try {
  await pool.query(`
    INSERT INTO exams (
      id,
      name,
      description,
      active
    )
    VALUES (
      'neet',
      'NEET UG',
      'National Eligibility cum Entrance Test for undergraduate medical admissions.',
      true
    )
    ON CONFLICT (id)
    DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      active = true,
      updated_at = NOW();
  `);

  const result = await pool.query(`
    SELECT
      id,
      name,
      description,
      active
    FROM exams
    WHERE id = 'neet';
  `);

  console.log('\nNEET exam configured successfully:\n');
  console.table(result.rows);

} catch (error) {
  console.error(error);
  process.exitCode = 1;

} finally {
  await pool.end();
}
