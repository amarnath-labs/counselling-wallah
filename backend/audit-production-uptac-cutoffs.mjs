import 'dotenv/config';
import { pool } from './src/db/pool.js';

try {
  const total = await pool.query(`
    SELECT COUNT(*)::int AS count
    FROM cutoffs
    WHERE LOWER(COALESCE(counselling_type, '')) = 'uptac'
  `);

  const breakdown = await pool.query(`
    SELECT
      year,
      round,
      category,
      COUNT(*)::int AS count
    FROM cutoffs
    WHERE LOWER(COALESCE(counselling_type, '')) = 'uptac'
    GROUP BY year, round, category
    ORDER BY year DESC, round, category
    LIMIT 50
  `);

  const verification = await pool.query(`
    SELECT
      verification_status,
      is_verified,
      COUNT(*)::int AS count
    FROM cutoffs
    WHERE LOWER(COALESCE(counselling_type, '')) = 'uptac'
    GROUP BY verification_status, is_verified
    ORDER BY count DESC
  `);

  console.log(
    'UPTAC TOTAL:',
    total.rows[0].count
  );

  console.log(
    '\nYEAR / ROUND / CATEGORY:'
  );

  console.table(
    breakdown.rows
  );

  console.log(
    '\nVERIFICATION:'
  );

  console.table(
    verification.rows
  );
} catch (error) {
  console.error(
    'FAILED:',
    error.message
  );
} finally {
  await pool.end();
}
