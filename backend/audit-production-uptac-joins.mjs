import 'dotenv/config';
import { pool } from './src/db/pool.js';

try {
  const { rows } = await pool.query(`
    SELECT
      COUNT(*) FILTER (
        WHERE
          co.year = 2025
          AND co.round = '1'
          AND co.category = 'OPEN'
          AND LOWER(COALESCE(co.counselling_type, '')) = 'uptac'
      )::int AS raw_cutoffs,

      COUNT(*) FILTER (
        WHERE
          co.year = 2025
          AND co.round = '1'
          AND co.category = 'OPEN'
          AND LOWER(COALESCE(co.counselling_type, '')) = 'uptac'
          AND b.id IS NOT NULL
      )::int AS branch_join_ok,

      COUNT(*) FILTER (
        WHERE
          co.year = 2025
          AND co.round = '1'
          AND co.category = 'OPEN'
          AND LOWER(COALESCE(co.counselling_type, '')) = 'uptac'
          AND b.id IS NOT NULL
          AND c.id IS NOT NULL
      )::int AS college_join_ok,

      COUNT(*) FILTER (
        WHERE
          co.year = 2025
          AND co.round = '1'
          AND co.category = 'OPEN'
          AND LOWER(COALESCE(co.counselling_type, '')) = 'uptac'
          AND b.id IS NOT NULL
          AND c.id IS NOT NULL
          AND co.closing_rank >= 1
      )::int AS eligible_rank_1,

      COUNT(*) FILTER (
        WHERE
          co.year = 2025
          AND co.round = '1'
          AND co.category = 'OPEN'
          AND LOWER(COALESCE(co.counselling_type, '')) = 'uptac'
          AND b.id IS NOT NULL
          AND c.id IS NOT NULL
          AND co.closing_rank >= 50000
      )::int AS eligible_rank_50000

    FROM cutoffs co

    LEFT JOIN branches b
      ON b.id = co.branch_id

    LEFT JOIN colleges c
      ON c.id = b.college_id
  `);

  console.table(rows);

  const missingBranches = await pool.query(`
    SELECT
      co.branch_id,
      COUNT(*)::int AS cutoff_count
    FROM cutoffs co
    LEFT JOIN branches b
      ON b.id = co.branch_id
    WHERE
      LOWER(COALESCE(co.counselling_type, '')) = 'uptac'
      AND b.id IS NULL
    GROUP BY co.branch_id
    ORDER BY cutoff_count DESC
    LIMIT 20
  `);

  console.log('\nMISSING BRANCH IDS:');
  console.table(missingBranches.rows);

} finally {
  await pool.end();
}
