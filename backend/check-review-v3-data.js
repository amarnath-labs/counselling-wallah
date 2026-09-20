import 'dotenv/config';
import { pool } from './src/db/pool.js';

for (const table of [
  'college_review_items',
  'review_aspect_sentiments'
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
