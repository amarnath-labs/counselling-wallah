import 'dotenv/config';
import { pool } from './src/db/pool.js';

try {
  console.log('');
  console.log('=======================================');
  console.log('BRANCH + FEE SCHEMA INSPECTOR');
  console.log('=======================================');

  const branchSchema = await pool.query(`
    SELECT
      column_name,
      data_type,
      is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'branches'
    ORDER BY ordinal_position
  `);

  console.log('');
  console.log('BRANCHES SCHEMA');
  console.table(branchSchema.rows);

  const branchSample = await pool.query(`
    SELECT
      id,
      college_id,
      name
    FROM branches
    ORDER BY college_id, name
    LIMIT 40
  `);

  console.log('');
  console.log('BRANCH SAMPLE');
  console.table(branchSample.rows);

  const feeConstraints = await pool.query(`
    SELECT
      tc.constraint_name,
      tc.constraint_type,
      kcu.column_name
    FROM information_schema.table_constraints tc
    LEFT JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    WHERE tc.table_schema = 'public'
      AND tc.table_name = 'college_fees'
    ORDER BY
      tc.constraint_name,
      kcu.ordinal_position
  `);

  console.log('');
  console.log('COLLEGE_FEES CONSTRAINTS');
  console.table(feeConstraints.rows);

} catch (error) {
  console.error('FAILED:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
