import 'dotenv/config';
import { pool } from './src/db/pool.js';

const tables = [
  'college_quality_metrics',
  'college_fee_profiles',
  'branch_fees',
  'college_reviews'
];

try {
  for (const table of tables) {
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS count FROM ${table}`
    );

    console.log(
      `${table}:`,
      rows[0].count
    );
  }
} catch (error) {
  console.error('FAILED:', error.message);
} finally {
  await pool.end();
}
