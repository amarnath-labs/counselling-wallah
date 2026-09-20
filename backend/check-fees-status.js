import 'dotenv/config';
import { pool } from './src/db/pool.js';

try {
  console.log('');
  console.log('=======================================');
  console.log('COLLEGE FEES CURRENT STATUS');
  console.log('=======================================');
  console.log('');

  const schema = await pool.query(`
    SELECT
      column_name,
      data_type,
      is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'college_fees'
    ORDER BY ordinal_position
  `);

  console.log('COLLEGE_FEES SCHEMA');
  console.table(schema.rows);

  const count = await pool.query(`
    SELECT COUNT(*)::int AS total_rows
    FROM college_fees
  `);

  console.log('');
  console.log('CURRENT ROW COUNT');
  console.table(count.rows);

} catch (error) {
  console.error(
    'FAILED:',
    error.message
  );

  process.exitCode = 1;
} finally {
  await pool.end();
}
