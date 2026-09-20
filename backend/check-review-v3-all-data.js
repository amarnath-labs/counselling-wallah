import 'dotenv/config';
import { pool } from './src/db/pool.js';

for (const table of [
  'review_sources',
  'college_review_items',
  'review_aspect_sentiments',
  'review_aggregate_snapshots'
]) {
  try {
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS count FROM ${table}`
    );
    console.log(`${table}: ${rows[0].count}`);
  } catch (e) {
    console.log(`${table}: ERROR - ${e.message}`);
  }
}

await pool.end();
