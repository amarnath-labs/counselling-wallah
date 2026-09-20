import { pool } from './src/db/pool.js';

const { rows } = await pool.query(
  "SELECT COUNT(*)::int AS count FROM career_questions WHERE active = TRUE AND stage = 'class-11'"
);

console.log(
  'Active Class-11 DB questions:',
  rows[0].count
);

await pool.end();
