import "dotenv/config";
import { pool } from "./src/db/pool.js";

const r = await pool.query(`
  EXPLAIN
  ANALYZE
  SELECT
    co.id,
    co.branch_id,
    co.year,
    co.round,
    co.category,
    co.quota,
    co.gender,
    co.opening_rank,
    co.closing_rank
  FROM cutoffs co
  INNER JOIN branches b
    ON b.id = co.branch_id
  INNER JOIN colleges c
    ON c.id = b.college_id
  WHERE co.counselling_type = 'JOSAA'
    AND co.year = 2026
    AND co.round = '1'
    AND co.category = 'OPEN'
  ORDER BY co.closing_rank ASC
  LIMIT 100
`);

console.log(
  r.rows
    .map(row => row["QUERY PLAN"])
    .join("\n")
);

await pool.end();
