import { pool } from "./src/db/pool.js";

try {
  console.log("\n=== UPTAC TOTAL ===");
  let r = await pool.query(`
    SELECT COUNT(*)::int AS count
    FROM cutoffs
    WHERE counselling_type = 'UPTAC'
  `);
  console.table(r.rows);

  console.log("\n=== YEAR / ROUND / CATEGORY / VERIFY ===");
  r = await pool.query(`
    SELECT
      year,
      round,
      category,
      verification_status,
      is_verified,
      COUNT(*)::int AS count
    FROM cutoffs
    WHERE counselling_type = 'UPTAC'
    GROUP BY
      year,
      round,
      category,
      verification_status,
      is_verified
    ORDER BY count DESC
    LIMIT 30
  `);
  console.table(r.rows);

  console.log("\n=== RANK 50000 ELIGIBLE ===");
  r = await pool.query(`
    SELECT
      year,
      round,
      category,
      COUNT(*)::int AS count
    FROM cutoffs
    WHERE counselling_type = 'UPTAC'
      AND closing_rank >= 50000
    GROUP BY year, round, category
    ORDER BY count DESC
    LIMIT 30
  `);
  console.table(r.rows);

} finally {
  await pool.end();
}
