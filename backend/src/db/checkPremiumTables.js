import 'dotenv/config';
import { pool } from './pool.js';

try {
  const result =
    await pool.query(`
      SELECT
        to_regclass(
          'public.college_quality_metrics'
        ) AS quality,

        to_regclass(
          'public.college_fees'
        ) AS fees,

        to_regclass(
          'public.college_reviews'
        ) AS reviews,

        to_regclass(
          'public.college_review_sentiment'
        ) AS sentiment
    `);

  console.log(
    'PREMIUM TABLES:'
  );

  console.log(
    result.rows[0]
  );
} catch (error) {
  console.error(
    'Premium table check failed:',
    error.message
  );
} finally {
  await pool.end();
}