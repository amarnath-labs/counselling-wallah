import { pool } from "./backend/src/db/pool.js";

const r = await pool.query(`
  SELECT
    COUNT(*)::int AS rows,
    COUNT(DISTINCT college_id)::int AS colleges,
    COUNT(DISTINCT branch_id)::int AS branches
  FROM cutoffs
  WHERE counselling_type = 'CSAB_SPECIAL'
    AND year = 2026
    AND round = '1'
`);

console.table(r.rows);

await pool.end();
