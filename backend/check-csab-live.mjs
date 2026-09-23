import "dotenv/config";
import { pool } from "./src/db/pool.js";

const r = await pool.query(`
  SELECT
    COUNT(*)::int AS rows,
    COUNT(DISTINCT b.college_id)::int AS colleges,
    COUNT(DISTINCT co.branch_id)::int AS branches
  FROM cutoffs co
  INNER JOIN branches b
    ON b.id = co.branch_id
  WHERE co.counselling_type = 'CSAB_SPECIAL'
    AND co.year = 2026
    AND co.round = '1'
`);

console.table(r.rows);

await pool.end();
