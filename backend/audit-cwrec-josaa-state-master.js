import { pool } from './src/db/pool.js';

const result = await pool.query(`
  SELECT DISTINCT
    c.id,
    c.name,
    c.city,
    c.state,
    c.type
  FROM cutoffs co

  JOIN branches b
    ON b.id = co.branch_id

  JOIN colleges c
    ON c.id = b.college_id

  WHERE co.counselling_type = 'JOSAA'
    AND co.quota IN ('HS', 'OS', 'GO', 'JK', 'LA')

  ORDER BY c.name
`);

console.table(result.rows);

await pool.end();
