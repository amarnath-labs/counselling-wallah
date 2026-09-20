import { pool } from './src/db/pool.js';

const types = await pool.query(`
  SELECT
    counselling_type,
    COUNT(*)::int AS rows
  FROM cutoffs
  GROUP BY counselling_type
  ORDER BY counselling_type
`);

console.log('\n===== COUNSELLING TYPES =====');
console.table(types.rows);


const csab = await pool.query(`
  SELECT
    year,
    round,
    category,
    quota,
    gender,
    COUNT(*)::int AS rows
  FROM cutoffs
  WHERE UPPER(COALESCE(counselling_type, ''))
        LIKE '%CSAB%'
  GROUP BY
    year,
    round,
    category,
    quota,
    gender
  ORDER BY
    year DESC,
    round,
    category,
    quota,
    gender
`);

console.log('\n===== CSAB DATA =====');
console.table(csab.rows);

await pool.end();
