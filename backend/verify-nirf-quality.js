import 'dotenv/config';
import { pool } from './src/db/pool.js';

try {
  const result = await pool.query(`
    SELECT
      COUNT(*)::int AS total_nirf_rows,
      COUNT(DISTINCT college_id)::int AS unique_colleges,
      COUNT(*) FILTER (
        WHERE nirf_rank IS NOT NULL
      )::int AS exact_rank_rows,
      COUNT(*) FILTER (
        WHERE verification_status = 'verified'
      )::int AS verified_rows
    FROM college_quality_metrics
    WHERE academic_year = 2025
      AND source_label ILIKE '%NIRF%'
  `);

  console.table(result.rows);
} finally {
  await pool.end();
}
