import { pool } from './src/db/pool.js';

try {
  console.log(
    '\n========================================'
  );
  console.log(
    'EXISTING JOSAA 2026 SOURCE AUDIT'
  );
  console.log(
    '========================================\n'
  );

  const summary =
    await pool.query(`
      SELECT
        round,
        source_label,
        source_url,
        verification_status,
        is_verified,
        COUNT(*)::int AS rows,
        COUNT(opening_rank)::int
          AS opening_rows,
        COUNT(closing_rank)::int
          AS closing_rows,
        MIN(created_at)
          AS first_created,
        MAX(created_at)
          AS last_created
      FROM cutoffs
      WHERE year = 2026
        AND UPPER(
          COALESCE(
            counselling_type,
            ''
          )
        ) = 'JOSAA'
      GROUP BY
        round,
        source_label,
        source_url,
        verification_status,
        is_verified
      ORDER BY
        rows DESC,
        round
    `);

  console.log(
    'SOURCE / ROUND SUMMARY'
  );

  console.table(
    summary.rows
  );


  const samples =
    await pool.query(`
      SELECT
        co.id,
        co.round,
        c.name AS college,
        b.name AS branch,
        co.category,
        co.quota,
        co.gender,
        co.opening_rank,
        co.closing_rank,
        co.source_label,
        co.source_url,
        co.verification_status,
        co.created_at
      FROM cutoffs co
      JOIN branches b
        ON b.id = co.branch_id
      JOIN colleges c
        ON c.id = b.college_id
      WHERE co.year = 2026
        AND UPPER(
          COALESCE(
            co.counselling_type,
            ''
          )
        ) = 'JOSAA'
      ORDER BY
        co.created_at,
        co.id
      LIMIT 30
    `);

  console.log(
    '\nFIRST 30 EXISTING ROWS'
  );

  console.table(
    samples.rows
  );


  const roundLabels =
    await pool.query(`
      SELECT
        round,
        COUNT(*)::int AS rows
      FROM cutoffs
      WHERE year = 2026
        AND UPPER(
          COALESCE(
            counselling_type,
            ''
          )
        ) = 'JOSAA'
      GROUP BY round
      ORDER BY round
    `);

  console.log(
    '\nRAW ROUND LABELS'
  );

  console.table(
    roundLabels.rows
  );


  /*
  |--------------------------------------------------------------------------
  | Gandhinagar mapping search
  |--------------------------------------------------------------------------
  */

  const gandhinagar =
    await pool.query(`
      SELECT
        id,
        name,
        city,
        state,
        type,
        institute_code,
        josaa_participating
      FROM colleges
      WHERE
        LOWER(name) LIKE '%gandhinagar%'
        OR LOWER(city) LIKE '%gandhinagar%'
      ORDER BY name
    `);

  console.log(
    '\nGANDHINAGAR COLLEGE CANDIDATES'
  );

  console.table(
    gandhinagar.rows
  );


  console.log(
    '\nNO DATABASE CHANGES MADE.'
  );

} finally {
  await pool.end();
}