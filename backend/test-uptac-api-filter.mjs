import { pool } from "./src/db/pool.js";

try {
  const r = await pool.query(`
    SELECT COUNT(*)::int AS count
    FROM cutoffs co
    INNER JOIN branches b
      ON b.id = co.branch_id
    INNER JOIN colleges c
      ON c.id = b.college_id
    WHERE co.year = 2025
      AND co.round = '1'
      AND co.category = 'OPEN'
      AND co.closing_rank >= 50000
      AND co.counselling_type = 'UPTAC'
      AND co.verification_status = 'VERIFIED'
      AND co.is_verified = true
  `);

  console.table(r.rows);
} finally {
  await pool.end();
}
