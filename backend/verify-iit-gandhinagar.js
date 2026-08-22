import { pool } from "./src/db/pool.js";

try {
  const r = await pool.query(`
    SELECT
      c.id AS college_id,
      c.name AS college,
      b.id AS branch_id,
      b.name AS branch,
      co.year,
      co.round,
      co.category,
      co.quota,
      co.gender,
      co.opening_rank,
      co.closing_rank,
      co.source_label,
      co.is_verified
    FROM colleges c
    JOIN branches b
      ON b.college_id = c.id
    JOIN cutoffs co
      ON co.branch_id = b.id
    WHERE LOWER(c.name) LIKE '%gandhinagar%'
      AND co.year = 2026
      AND co.round = '1'
    ORDER BY b.name, co.category, co.quota, co.gender
  `);

  console.log("========================================");
  console.log("IIT GANDHINAGAR ROUND 1 VERIFICATION");
  console.log("========================================");

  console.log("TOTAL RECORDS:", r.rows.length);

  console.table(r.rows.slice(0, 30));

} catch (error) {
  console.error("ERROR:");
  console.error(error.stack || error.message);
} finally {
  await pool.end();
}
