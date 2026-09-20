import { pool } from './src/db/pool.js';

const result = await pool.query(`
  SELECT DISTINCT
    c.id,
    c.name,
    c.city,
    c.state,
    c.type,
    co.quota
  FROM cutoffs co

  JOIN branches b
    ON b.id = co.branch_id

  JOIN colleges c
    ON c.id = b.college_id

  WHERE co.counselling_type = 'CSAB_SPECIAL'
    AND co.year = 2026

  ORDER BY
    c.name,
    co.quota
`);

console.table(result.rows);

await pool.end();
