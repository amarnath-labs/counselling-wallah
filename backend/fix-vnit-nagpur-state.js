import { pool } from './src/db/pool.js';

const before = await pool.query(`
  SELECT
    id,
    name,
    city,
    state
  FROM colleges
  WHERE id =
    'visvesvaraya-national-institute-of-technology-nagpur'
`);

console.log('BEFORE');
console.table(before.rows);

const result = await pool.query(`
  UPDATE colleges
  SET
    state = 'Maharashtra',
    updated_at = NOW()
  WHERE id =
    'visvesvaraya-national-institute-of-technology-nagpur'
    AND state = 'Gujarat'
  RETURNING
    id,
    name,
    city,
    state
`);

console.log('UPDATED');
console.table(result.rows);

await pool.end();
