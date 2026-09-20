import { pool } from './src/db/pool.js';

const result = await pool.query(`
  SELECT
    c.state,
    c.type,
    co.quota,
    COUNT(*)::int AS rows
  FROM cutoffs co
  JOIN colleges c
    ON c.id = co.college_id
  WHERE co.counselling_type = 'JOSAA'
  GROUP BY
    c.state,
    c.type,
    co.quota
  ORDER BY
    c.state,
    c.type,
    co.quota
`);

console.table(result.rows);

await pool.end();
