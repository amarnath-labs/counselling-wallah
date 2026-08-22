import { pool } from "./src/db/pool.js";

try {
  const r = await pool.query(`
    SELECT
      c.name AS college,
      b.name AS branch,
      co.category,
      co.quota,
      co.gender,
      co.opening_rank,
      co.closing_rank,
      co.round,
      co.source_label,
      co.is_verified
    FROM colleges c
    JOIN branches b ON b.college_id = c.id
    JOIN cutoffs co ON co.branch_id = b.id
    WHERE co.year = 2026
      AND co.round = '1'
      AND co.counselling_type = 'JOSAA'
      AND co.is_verified = TRUE
      AND co.data_source_id = 70
      AND co.opening_rank <= 3000
      AND co.closing_rank >= 3000
    ORDER BY co.closing_rank;
  `);

  console.log("ELIGIBLE OPTIONS FOR RANK 3000:");
  console.table(r.rows);
  console.log("COUNT:", r.rows.length);
} catch (error) {
  console.error(error);
} finally {
  await pool.end();
}
