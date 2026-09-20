import { pool } from "./src/db/pool.js";

try {
  console.log("Creating recommendation performance index...");

  await pool.query(`
    CREATE INDEX CONCURRENTLY IF NOT EXISTS
      idx_capacity_uptac_results_fast
    ON cutoffs (
      counselling_type,
      year,
      closing_rank,
      branch_id
    )
    WHERE
      is_verified = true
      AND verification_status = 'VERIFIED'
  `);

  console.log("✅ recommendation index ready");
} catch (error) {
  console.error("❌", error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
