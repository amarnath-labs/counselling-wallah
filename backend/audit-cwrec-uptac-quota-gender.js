import { pool } from './src/db/pool.js';

const result = await pool.query(`
  SELECT
    quota,
    gender,
    COUNT(*)::int AS rows
  FROM cw_rec_uptac_cutoffs_2025
  GROUP BY quota, gender
  ORDER BY quota, gender
`);

console.table(result.rows);

await pool.end();
