import 'dotenv/config';
import { pool } from './src/db/pool.js';

try {
  const result = await pool.query(`
    SELECT
      COUNT(*)::int AS total_quality_colleges,

      COUNT(*) FILTER (
        WHERE c.website IS NOT NULL
          AND TRIM(c.website) <> ''
      )::int AS website_available,

      COUNT(*) FILTER (
        WHERE c.website IS NULL
           OR TRIM(c.website) = ''
      )::int AS website_missing

    FROM college_quality_metrics q

    JOIN colleges c
      ON c.id = q.college_id

    WHERE q.academic_year = 2025
  `);

  console.table(result.rows);

} finally {
  await pool.end();
}
