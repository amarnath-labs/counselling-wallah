import 'dotenv/config';

import {
  pool,
} from './src/db/pool.js';


const YEAR = 2025;
const ROUND = '1';
const CATEGORY = 'OPEN';


async function main() {
  try {
    const {
      rows,
    } =
      await pool.query(
        `
        SELECT

          COALESCE(
            NULLIF(
              TRIM(
                co.gender
              ),
              ''
            ),
            'NULL'
          )
            AS gender,

          COALESCE(
            NULLIF(
              TRIM(
                co.quota
              ),
              ''
            ),
            'NULL'
          )
            AS quota,

          COUNT(*)
            AS row_count,

          COUNT(
            DISTINCT b.id
          )
            AS unique_branches,

          COUNT(
            DISTINCT b.college_id
          )
            AS unique_colleges,

          MIN(
            co.closing_rank
          )
            AS min_closing_rank,

          MAX(
            co.closing_rank
          )
            AS max_closing_rank


        FROM cutoffs co


        INNER JOIN branches b

          ON b.id =
             co.branch_id


        WHERE

          co.year =
            $1

          AND co.round =
            $2

          AND UPPER(
            TRIM(
              co.category
            )
          ) =
            UPPER(
              TRIM(
                $3
              )
            )

          AND co.counselling_type =
            'UPTAC'

          AND co.is_verified =
            TRUE

          AND co.verification_status =
            'VERIFIED'


        GROUP BY

          COALESCE(
            NULLIF(
              TRIM(
                co.gender
              ),
              ''
            ),
            'NULL'
          ),

          COALESCE(
            NULLIF(
              TRIM(
                co.quota
              ),
              ''
            ),
            'NULL'
          )


        ORDER BY

          COUNT(*) DESC,

          gender,

          quota
        `,
        [
          YEAR,
          ROUND,
          CATEGORY,
        ]
      );


    console.log(
      '\n========================================'
    );

    console.log(
      'CW-REC CONTEXT AUDIT'
    );

    console.log(
      '========================================'
    );

    console.log(
      'Year:',
      YEAR
    );

    console.log(
      'Round:',
      ROUND
    );

    console.log(
      'Category:',
      CATEGORY
    );


    console.log(
      '\n=== GENDER + QUOTA DISTRIBUTION ==='
    );

    console.table(
      rows.map(
        (
          row
        ) => ({
          gender:
            row.gender,

          quota:
            row.quota,

          rows:
            Number(
              row.row_count
            ),

          colleges:
            Number(
              row.unique_colleges
            ),

          branches:
            Number(
              row.unique_branches
            ),

          minClosing:
            Number(
              row.min_closing_rank
            ),

          maxClosing:
            Number(
              row.max_closing_rank
            ),
        })
      )
    );


    /*
    |--------------------------------------------------------------------------
    | GENDER ONLY
    |--------------------------------------------------------------------------
    */

    const genderResult =
      await pool.query(
        `
        SELECT

          COALESCE(
            NULLIF(
              TRIM(
                co.gender
              ),
              ''
            ),
            'NULL'
          )
            AS gender,

          COUNT(*)
            AS count

        FROM cutoffs co

        WHERE
          co.year = $1

          AND co.round = $2

          AND UPPER(
            TRIM(
              co.category
            )
          ) =
            UPPER(
              TRIM(
                $3
              )
            )

          AND co.counselling_type =
            'UPTAC'

          AND co.is_verified =
            TRUE

          AND co.verification_status =
            'VERIFIED'

        GROUP BY 1

        ORDER BY
          COUNT(*) DESC
        `,
        [
          YEAR,
          ROUND,
          CATEGORY,
        ]
      );


    console.log(
      '\n=== GENDER ONLY ==='
    );


    console.table(
      genderResult.rows.map(
        (
          row
        ) => ({
          gender:
            row.gender,

          count:
            Number(
              row.count
            ),
        })
      )
    );


    /*
    |--------------------------------------------------------------------------
    | QUOTA ONLY
    |--------------------------------------------------------------------------
    */

    const quotaResult =
      await pool.query(
        `
        SELECT

          COALESCE(
            NULLIF(
              TRIM(
                co.quota
              ),
              ''
            ),
            'NULL'
          )
            AS quota,

          COUNT(*)
            AS count

        FROM cutoffs co

        WHERE
          co.year = $1

          AND co.round = $2

          AND UPPER(
            TRIM(
              co.category
            )
          ) =
            UPPER(
              TRIM(
                $3
              )
            )

          AND co.counselling_type =
            'UPTAC'

          AND co.is_verified =
            TRUE

          AND co.verification_status =
            'VERIFIED'

        GROUP BY 1

        ORDER BY
          COUNT(*) DESC
        `,
        [
          YEAR,
          ROUND,
          CATEGORY,
        ]
      );


    console.log(
      '\n=== QUOTA ONLY ==='
    );


    console.table(
      quotaResult.rows.map(
        (
          row
        ) => ({
          quota:
            row.quota,

          count:
            Number(
              row.count
            ),
        })
      )
    );
  } catch (
    error
  ) {
    console.error(
      '\nCW-REC CONTEXT AUDIT ERROR:\n',
      error
    );

    process.exitCode =
      1;
  } finally {
    await pool.end();
  }
}


main();