import 'dotenv/config';
import { pool } from './src/db/pool.js';

try {
  const result = await pool.query(`
    SELECT
      COUNT(*)::int AS total_quality_rows,

      COUNT(*) FILTER (
        WHERE median_package IS NOT NULL
      )::int AS median_available,

      COUNT(*) FILTER (
        WHERE average_package IS NOT NULL
      )::int AS average_available,

      COUNT(*) FILTER (
        WHERE highest_package IS NOT NULL
      )::int AS highest_available,

      COUNT(*) FILTER (
        WHERE placement_rate IS NOT NULL
      )::int AS placement_rate_available

    FROM college_quality_metrics
  `);

  console.log('');
  console.log('=======================================');
  console.log('PLACEMENT DATA CURRENT STATUS');
  console.log('=======================================');

  console.table(result.rows);

} catch (error) {
  console.error(
    'FAILED:',
    error.message
  );

  process.exitCode = 1;
} finally {
  await pool.end();
}
