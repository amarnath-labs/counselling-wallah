import { pool } from './src/db/pool.js';

async function main() {

  console.log(
    '\n========================================'
  );

  console.log(
    'CW-REC JOSAA 2025 QUALITY AUDIT'
  );

  console.log(
    '========================================'
  );


  const sources =
    await pool.query(`
      SELECT
        source_label,
        source_url,
        verification_status,
        is_verified,
        COUNT(*)::int AS rows
      FROM cutoffs
      WHERE
        counselling_type = 'JOSAA'
        AND year = 2025
      GROUP BY
        source_label,
        source_url,
        verification_status,
        is_verified
      ORDER BY
        rows DESC
    `);

  console.log(
    '\n=== 2025 SOURCES ==='
  );

  console.table(
    sources.rows
  );


  const rounds =
    await pool.query(`
      SELECT
        round,
        category,
        gender,
        COUNT(*)::int AS rows
      FROM cutoffs
      WHERE
        counselling_type = 'JOSAA'
        AND year = 2025
      GROUP BY
        round,
        category,
        gender
      ORDER BY
        round,
        category,
        gender
    `);

  console.log(
    '\n=== 2025 CONTEXT DISTRIBUTION ==='
  );

  console.table(
    rounds.rows
  );


  const colleges =
    await pool.query(`
      SELECT
        c.name AS college,
        c.type,
        COUNT(*)::int AS rows,
        COUNT(DISTINCT b.id)::int AS branches
      FROM cutoffs co

      INNER JOIN branches b
        ON b.id = co.branch_id

      INNER JOIN colleges c
        ON c.id = b.college_id

      WHERE
        co.counselling_type = 'JOSAA'
        AND co.year = 2025

      GROUP BY
        c.name,
        c.type

      ORDER BY
        rows DESC,
        c.name
    `);

  console.log(
    '\n=== 2025 COLLEGES ==='
  );

  console.table(
    colleges.rows
  );


  const overlap =
    await pool.query(`
      WITH y2025 AS (
        SELECT DISTINCT
          branch_id,
          round,
          category,
          gender,
          quota
        FROM cutoffs
        WHERE
          counselling_type = 'JOSAA'
          AND year = 2025
      ),

      y2026 AS (
        SELECT DISTINCT
          branch_id,
          round,
          category,
          gender,
          quota
        FROM cutoffs
        WHERE
          counselling_type = 'JOSAA'
          AND year = 2026
      )

      SELECT
        COUNT(*)::int AS contexts_2025,

        COUNT(*) FILTER (
          WHERE EXISTS (
            SELECT 1
            FROM y2026 b
            WHERE
              b.branch_id = a.branch_id
              AND b.round = a.round
              AND b.category = a.category
              AND b.gender = a.gender
              AND COALESCE(b.quota, '') =
                  COALESCE(a.quota, '')
          )
        )::int AS exact_overlap_2026

      FROM y2025 a
    `);

  console.log(
    '\n=== EXACT 2025 -> 2026 OVERLAP ==='
  );

  console.table(
    overlap.rows
  );


  const sample =
    await pool.query(`
      SELECT
        c.name AS college,
        b.name AS branch,
        co.round,
        co.category,
        co.gender,
        co.quota,
        co.opening_rank,
        co.closing_rank,
        co.source_label,
        co.verification_status,
        co.is_verified
      FROM cutoffs co

      INNER JOIN branches b
        ON b.id = co.branch_id

      INNER JOIN colleges c
        ON c.id = b.college_id

      WHERE
        co.counselling_type = 'JOSAA'
        AND co.year = 2025

      ORDER BY
        c.name,
        b.name,
        co.round

      LIMIT 100
    `);

  console.log(
    '\n=== 2025 SAMPLE ROWS ==='
  );

  console.table(
    sample.rows
  );


  console.log(
    '\n✅ READ-ONLY JOSAA 2025 AUDIT COMPLETE'
  );
}

main()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
