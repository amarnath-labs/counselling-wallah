import 'dotenv/config';
import { pool } from './src/db/pool.js';

const result = await pool.query(
  "SELECT id, name, active FROM exams WHERE id = 'neet'"
);

console.table(result.rows);

await pool.end();
