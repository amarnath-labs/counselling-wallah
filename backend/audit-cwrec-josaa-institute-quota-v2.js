import { pool } from './src/db/pool.js';

const result = await pool.query(`
  SELECT DISTINCT
    c.name,
    c.state,
    c.type,
    co.quota
  FROM cutoffs co

  JOIN branches b
    ON b.id = co.branch_id

  JOIN colleges c
    ON c.id = b.college_id

  WHERE co.counselling_type = 'JOSAA'

  ORDER BY
    c.type,
    c.state,
    c.name,
    co.quota
`);

console.table(
  result.rows.slice(
    0,
    300
  )
);

await pool.end();
