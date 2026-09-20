import 'dotenv/config';
import { pool } from './src/db/pool.js';

try {
  const result = await pool.query(`
    SELECT
      COUNT(*)::int AS total_quality_rows,

      COUNT(*) FILTER (
        WHERE accreditation IS NOT NULL
          AND TRIM(accreditation) <> ''
      )::int AS accreditation_available,

      COUNT(*) FILTER (
        WHERE accreditation IS NULL
           OR TRIM(accreditation) = ''
      )::int AS accreditation_missing,

      COUNT(DISTINCT college_id)::int AS unique_colleges
    FROM college_quality_metrics
  `);

  console.log('');
  console.log('=======================================');
  console.log('ACCREDITATION CURRENT STATUS');
  console.log('=======================================');
  console.table(result.rows);

  const sample = await pool.query(`
    SELECT
      college_id,
      accreditation,
      academic_year,
      source_label,
      verification_status
    FROM college_quality_metrics
    WHERE accreditation IS NOT NULL
      AND TRIM(accreditation) <> ''
    ORDER BY college_id
    LIMIT 20
  `);

  console.log('');
  console.log('EXISTING ACCREDITATION SAMPLE');
  console.table(sample.rows);

} catch (error) {
  console.error('FAILED:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
