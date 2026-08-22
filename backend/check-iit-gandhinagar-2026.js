import { pool } from "./src/db/pool.js";

try {
  const r = await pool.query(`
    SELECT
      c.name AS college,
      b.name AS branch,
      co.year,
      co.round,
      co.category,
      co.quota,
      co.gender,
      co.opening_rank,
      co.closing_rank,
      co.source_label,
      co.is_verified,
      co.data_source_id,
      co.verification_status
    FROM colleges c
    JOIN branches b ON b.college_id = c.id
    JOIN cutoffs co ON co.branch_id = b.id
    WHERE c.id = 'iit-gandhinagar'
      AND co.year = 2026
    ORDER BY b.name, co.id
  `);

  console.table(r.rows);
} catch (error) {
  console.error(error);
} finally {
  await pool.end();
}
