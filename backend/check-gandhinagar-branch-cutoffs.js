import { pool } from "./src/db/pool.js";

try {
  const r = await pool.query(`
    SELECT
      b.id AS branch_id,
      b.college_id,
      b.name,
      COUNT(co.id)::int AS cutoff_count
    FROM branches b
    LEFT JOIN cutoffs co
      ON co.branch_id = b.id
    WHERE b.id IN (
      45,46,47,225,226,227,228,229,230,231,232
    )
    GROUP BY b.id, b.college_id, b.name
    ORDER BY b.id;
  `);

  console.table(r.rows);
} finally {
  await pool.end();
}
