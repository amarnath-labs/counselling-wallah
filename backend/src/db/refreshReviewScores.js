import 'dotenv/config';
import { pool } from './pool.js';

/*
 * Bayesian review score:
 *
 * weightedRating =
 *   (v / (v + m)) * R
 * + (m / (v + m)) * C
 *
 * R = college rating
 * v = review count
 * C = platform average
 * m = minimum confidence threshold
 */

const M = Number(
  process.env.REVIEW_BAYESIAN_M || 50
);

async function main() {
  const globalResult =
    await pool.query(`
      SELECT
        AVG(rating)::float8 AS avg_rating
      FROM college_review_stats
      WHERE rating IS NOT NULL
        AND rating > 0
        AND review_count > 0
    `);

  const C =
    Number(
      globalResult.rows[0]
        ?.avg_rating
    );

  if (
    !Number.isFinite(C)
  ) {
    throw new Error(
      'No review ratings available in college_review_stats.'
    );
  }

  const result =
    await pool.query(`
      SELECT
        college_id,
        source,
        rating::float8 AS rating,
        COALESCE(
          review_count,
          0
        )::int AS review_count
      FROM college_review_stats
      WHERE rating IS NOT NULL
        AND rating > 0
    `);

  console.log(
    'Global mean rating:',
    C.toFixed(3)
  );

  console.log(
    'Confidence threshold m:',
    M
  );

  let updated = 0;

  for (
    const row of result.rows
  ) {
    const R =
      Number(row.rating);

    const v =
      Number(
        row.review_count || 0
      );

    const bayesian =
      (
        (v / (v + M)) * R
      ) +
      (
        (M / (v + M)) * C
      );

    const reviewScore =
      Math.max(
        0,
        Math.min(
          100,
          (bayesian / 5) * 100
        )
      );

    await pool.query(
      `
      UPDATE
        college_review_stats
      SET
        bayesian_rating = $1,
        review_score = $2,
        updated_at = NOW()
      WHERE college_id = $3
        AND source = $4
      `,
      [
        bayesian,
        reviewScore,
        row.college_id,
        row.source,
      ]
    );

    updated++;
  }

  console.log(
    'Updated review stats:',
    updated
  );

  await pool.end();
}

main().catch(
  async (error) => {
    console.error(
      'Review score refresh failed:',
      error
    );

    try {
      await pool.end();
    } catch {}

    process.exit(1);
  }
);
