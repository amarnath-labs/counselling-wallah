import { pool } from './src/db/pool.js';

const result = await pool.query(`
  SELECT
    quota,
    round,
    gender,
    COUNT(*)::int AS rows
  FROM cw_rec_uptac_cutoffs_2025
  WHERE quota = 'All India'
  GROUP BY quota, round, gender
  ORDER BY
    round::int,
    gender
`);

console.table(result.rows);

await pool.end();
