import "dotenv/config";
import { pool } from "./src/db/pool.js";

const queries = [
  `
  SELECT
    indexname,
    indexdef
  FROM pg_indexes
  WHERE tablename = 'cutoffs'
  ORDER BY indexname
  `,
  `
  SELECT
    indexname,
    indexdef
  FROM pg_indexes
  WHERE tablename = 'branches'
  ORDER BY indexname
  `,
  `
  SELECT
    indexname,
    indexdef
  FROM pg_indexes
  WHERE tablename = 'colleges'
  ORDER BY indexname
  `
];

for (const q of queries) {
  const r = await pool.query(q);

  console.log(
    "\n========================================"
  );

  console.table(r.rows);
}

await pool.end();
