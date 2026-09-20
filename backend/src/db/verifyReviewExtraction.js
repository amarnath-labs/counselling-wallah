import 'dotenv/config';
import { pool } from './pool.js';

try {
  const summary =
    await pool.query(`
      SELECT
        COUNT(*)::int AS colleges_with_stats,
        COUNT(*) FILTER (
          WHERE rating IS NOT NULL
        )::int AS colleges_with_rating,
        COUNT(*) FILTER (
          WHERE review_count > 0
        )::int AS colleges_with_review_count,
        COUNT(*) FILTER (
          WHERE review_score IS NOT NULL
        )::int AS colleges_with_review_score,
        ROUND(
          AVG(rating)::numeric,
          2
        ) AS avg_rating
      FROM college_review_stats
    `);

  console.table(
    summary.rows
  );

  const top =
    await pool.query(`
      SELECT
        c.name,
        s.source,
        s.rating,
        s.review_count,
        ROUND(
          s.bayesian_rating::numeric,
          3
        ) AS bayesian_rating,
        ROUND(
          s.review_score::numeric,
          1
        ) AS review_score,
        ROUND(
          s.match_confidence::numeric,
          3
        ) AS confidence
      FROM college_review_stats s
      JOIN colleges c
        ON c.id = s.college_id
      ORDER BY
        s.review_count DESC NULLS LAST
      LIMIT 20
    `);

  console.table(
    top.rows
  );
} finally {
  await pool.end();
}
