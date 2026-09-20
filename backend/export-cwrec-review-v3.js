import 'dotenv/config';
import fs from 'fs';
import { pool } from './src/db/pool.js';

const tables = [
  'review_sources',
  'college_review_items',
  'review_aspect_sentiments',
  'review_aggregate_snapshots'
];

try {
  const output = {};

  for (const table of tables) {
    const { rows } = await pool.query(
      `SELECT * FROM ${table} ORDER BY id`
    );

    output[table] = rows;

    console.log(`${table}: ${rows.length}`);
  }

  fs.writeFileSync(
    './cwrec-review-v3-seed.json',
    JSON.stringify(output, null, 2),
    'utf8'
  );

  console.log('');
  console.log('Saved: cwrec-review-v3-seed.json');

} catch (error) {
  console.error('FAILED:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
