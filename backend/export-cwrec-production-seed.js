import 'dotenv/config';
import fs from 'fs';
import { pool } from './src/db/pool.js';

const tables = [
  'college_quality_metrics',
  'college_fee_profiles',
  'branch_fees',
  'college_reviews'
];

try {
  const output = {};

  for (const table of tables) {
    const { rows } = await pool.query(
      `SELECT * FROM ${table} ORDER BY 1`
    );

    output[table] = rows;

    console.log(`${table}: ${rows.length}`);
  }

  fs.writeFileSync(
    './cwrec-production-seed.json',
    JSON.stringify(output, null, 2),
    'utf8'
  );

  console.log('');
  console.log('Saved: cwrec-production-seed.json');

} catch (error) {
  console.error('FAILED:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
