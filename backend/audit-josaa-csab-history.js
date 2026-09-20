import { pool } from './src/db/pool.js';

async function run() {
  try {
    console.log(
      '\n========================================'
    );
    console.log(
      'TRUMARG JOSAA / CSAB DATA AUDIT'
    );
    console.log(
      '========================================\n'
    );

    const summary =
      await pool.query(`
        SELECT
          UPPER(
            COALESCE(
              counselling_type,
              'UNKNOWN'
            )
          ) AS counselling_type,

          year,

          COUNT(*)::int AS rows,

          COUNT(
            opening_rank
          )::int AS opening_rank_rows,

          COUNT(
            closing_rank
          )::int AS closing_rank_rows,

          COUNT(
            DISTINCT branch_id
          )::int AS branch_records

        FROM cutoffs

        WHERE UPPER(
          COALESCE(
            counselling_type,
            ''
          )
        ) IN (
          'JOSAA',
          'CSAB'
        )

        GROUP BY
          UPPER(
            COALESCE(
              counselling_type,
              'UNKNOWN'
            )
          ),
          year

        ORDER BY
          counselling_type,
          year DESC;
      `);

    console.log(
      'YEAR-WISE SUMMARY'
    );

    console.table(
      summary.rows
    );


    const rounds =
      await pool.query(`
        SELECT
          UPPER(
            counselling_type
          ) AS counselling_type,

          year,
          round,

          COUNT(*)::int AS rows,

          COUNT(
            opening_rank
          )::int AS opening_rank_rows,

          COUNT(
            closing_rank
          )::int AS closing_rank_rows

        FROM cutoffs

        WHERE UPPER(
          COALESCE(
            counselling_type,
            ''
          )
        ) IN (
          'JOSAA',
          'CSAB'
        )

        GROUP BY
          counselling_type,
          year,
          round

        ORDER BY
          counselling_type,
          year DESC,
          round;
      `);

    console.log(
      '\nROUND-WISE SUMMARY'
    );

    console.table(
      rounds.rows
    );


    const coverage =
      await pool.query(`
        SELECT
          UPPER(
            co.counselling_type
          ) AS counselling_type,

          co.year,

          COUNT(
            DISTINCT c.id
          )::int AS colleges,

          COUNT(
            DISTINCT co.branch_id
          )::int AS branches,

          COUNT(*)::int AS cutoff_rows

        FROM cutoffs co

        INNER JOIN branches b
          ON b.id =
             co.branch_id

        INNER JOIN colleges c
          ON c.id =
             b.college_id

        WHERE UPPER(
          COALESCE(
            co.counselling_type,
            ''
          )
        ) IN (
          'JOSAA',
          'CSAB'
        )

        GROUP BY
          co.counselling_type,
          co.year

        ORDER BY
          counselling_type,
          year DESC;
      `);

    console.log(
      '\nCOLLEGE / BRANCH COVERAGE'
    );

    console.table(
      coverage.rows
    );


    const missing =
      await pool.query(`
        SELECT
          UPPER(
            counselling_type
          ) AS counselling_type,

          year,

          COUNT(*) FILTER (
            WHERE
              opening_rank IS NULL
          )::int
            AS missing_opening,

          COUNT(*) FILTER (
            WHERE
              closing_rank IS NULL
          )::int
            AS missing_closing

        FROM cutoffs

        WHERE UPPER(
          COALESCE(
            counselling_type,
            ''
          )
        ) IN (
          'JOSAA',
          'CSAB'
        )

        GROUP BY
          counselling_type,
          year

        ORDER BY
          counselling_type,
          year DESC;
      `);

    console.log(
      '\nMISSING RANK AUDIT'
    );

    console.table(
      missing.rows
    );

  } catch (error) {

    console.error(
      '\nAUDIT FAILED:\n',
      error
    );

    process.exitCode = 1;

  } finally {

    await pool.end();
  }
}

run();
