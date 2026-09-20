import { pool } from './src/db/pool.js';

const result = await pool.query(`
  SELECT
    gender,
    COUNT(*)::int AS rows
  FROM cw_rec_uptac_cutoffs_2025
  GROUP BY gender
  ORDER BY gender
`);

console.table(result.rows);

await pool.end();
