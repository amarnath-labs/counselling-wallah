import 'dotenv/config';

import {
  pool,
} from './src/db/pool.js';


async function main() {
  try {
    const sourceResult =
      await pool.query(
        `
        SELECT
          COALESCE(
            source_label,
            'NULL'
          ) AS source,

          year,

          round,

          category,

          quota,

          gender,

          COUNT(*)::int
            AS rows,

          COUNT(
            DISTINCT branch_id
          )::int
            AS branches,

          MIN(
            closing_rank
          )
            AS min_closing,

          MAX(
            closing_rank
          )
            AS max_closing

        FROM cutoffs

        WHERE
          counselling_type =
            'UPTAC'

          AND year =
            2025

        GROUP BY
          source_label,
          year,
          round,
          category,
          quota,
          gender

        ORDER BY
          rows DESC
        `
      );


    console.log(
      '\n========================================'
    );

    console.log(
      'UPTAC SOURCE / CONTEXT AUDIT'
    );

    console.log(
      '========================================'
    );


    console.table(
      sourceResult.rows
    );


    const summaryResult =
      await pool.query(
        `
        SELECT
          COALESCE(
            source_label,
            'NULL'
          ) AS source,

          COUNT(*)::int
            AS rows,

          COUNT(
            DISTINCT branch_id
          )::int
            AS branches,

          COUNT(
            DISTINCT round
          )::int
            AS rounds,

          COUNT(
            DISTINCT gender
          )::int
            AS genders,

          COUNT(
            DISTINCT quota
          )::int
            AS quotas

        FROM cutoffs

        WHERE
          counselling_type =
            'UPTAC'

          AND year =
            2025

        GROUP BY
          source_label

        ORDER BY
          rows DESC
        `
      );


    console.log(
      '\n=== SOURCE SUMMARY ==='
    );

    console.table(
      summaryResult.rows
    );


    const genderResult =
      await pool.query(
        `
        SELECT
          source_label,
          gender,
          COUNT(*)::int
            AS rows

        FROM cutoffs

        WHERE
          counselling_type =
            'UPTAC'

          AND year =
            2025

        GROUP BY
          source_label,
          gender

        ORDER BY
          source_label,
          rows DESC
        `
      );


    console.log(
      '\n=== SOURCE x GENDER ==='
    );

    console.table(
      genderResult.rows
    );


    const roundResult =
      await pool.query(
        `
        SELECT
          source_label,
          round,
          COUNT(*)::int
            AS rows

        FROM cutoffs

        WHERE
          counselling_type =
            'UPTAC'

          AND year =
            2025

        GROUP BY
          source_label,
          round

        ORDER BY
          source_label,
          round
        `
      );


    console.log(
      '\n=== SOURCE x ROUND ==='
    );

    console.table(
      roundResult.rows
    );
  } catch (error) {
    console.error(
      '\nUPTAC SOURCE AUDIT ERROR:\n',
      error
    );

    process.exitCode =
      1;
  } finally {
    await pool.end();
  }
}


main();