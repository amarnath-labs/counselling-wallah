import { pool } from './src/db/pool.js';

const result = await pool.query(`
  SELECT
    quota,
    gender,
    COUNT(*)::int AS rows
  FROM cutoffs
  WHERE counselling_type = 'JOSAA'
  GROUP BY quota, gender
  ORDER BY quota, gender
`);

console.table(result.rows);

await pool.end();
