import { pool } from "./src/db/pool.js";

try {
  const r = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM colleges) AS colleges,
      (SELECT COUNT(*) FROM branches) AS branches,
      (SELECT COUNT(*) FROM cutoffs) AS total_cutoffs,
      (
        SELECT COUNT(*)
        FROM cutoffs
        WHERE year = 2026
          AND round = '1'
          AND data_source_id = 70
      ) AS josaa_round1_cutoffs
  `);

  console.table(r.rows);
} finally {
  await pool.end();
}
