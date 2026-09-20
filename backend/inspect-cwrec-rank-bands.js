import 'dotenv/config';

import {
  pool,
} from './src/db/pool.js';


const STUDENT_RANK =
  50000;

const YEAR =
  2025;

const ROUND =
  '1';

const CATEGORY =
  'OPEN';


function clamp(
  value,
  min = 0,
  max = 100
) {
  return Math.max(
    min,
    Math.min(
      max,
      value
    )
  );
}


function calculateHistoricalFitScore(
  studentRank,
  closingRank
) {
  const rank =
    Number(
      studentRank
    );

  const closing =
    Number(
      closingRank
    );


  if (
    !Number.isFinite(
      rank
    ) ||
    !Number.isFinite(
      closing
    ) ||
    rank <= 0 ||
    closing <= 0
  ) {
    return null;
  }


  const relativeMargin =
    (
      closing -
      rank
    ) /
    closing;


  if (
    relativeMargin >=
    0.20
  ) {
    return 100;
  }


  if (
    relativeMargin >=
    0.10
  ) {
    return clamp(
      80 +
      15 *
      (
        (
          relativeMargin -
          0.10
        ) /
        0.10
      )
    );
  }


  if (
    relativeMargin >=
    0
  ) {
    return clamp(
      60 +
      20 *
      (
        relativeMargin /
        0.10
      )
    );
  }


  if (
    relativeMargin >=
    -0.05
  ) {
    return clamp(
      40 +
      20 *
      (
        (
          relativeMargin +
          0.05
        ) /
        0.05
      )
    );
  }


  return clamp(
    40 +
    400 *
    (
      relativeMargin +
      0.05
    )
  );
}


function getBucket(
  score
) {
  if (
    !Number.isFinite(
      score
    )
  ) {
    return 'UNKNOWN';
  }


  if (
    score >= 85
  ) {
    return 'Backup';
  }


  if (
    score >= 65
  ) {
    return 'Safe';
  }


  if (
    score >= 35
  ) {
    return 'Target';
  }


  return 'Dream';
}


async function main() {
  try {
    /*
    |--------------------------------------------------------------------------
    | IMPORTANT
    |--------------------------------------------------------------------------
    |
    | cutoffs DOES NOT have college_id.
    |
    | Correct relationship:
    |
    | cutoffs.branch_id
    |      ->
    | branches.id
    |      ->
    | branches.college_id
    |      ->
    | colleges.id
    |
    |--------------------------------------------------------------------------
    */


    const {
      rows,
    } =
      await pool.query(
        `
        SELECT

          c.id
            AS college_id,

          c.name
            AS college_name,

          c.type
            AS college_type,

          c.city,

          c.state,


          b.id
            AS branch_id,

          b.name
            AS branch_name,


          co.id
            AS cutoff_id,

          co.opening_rank,

          co.closing_rank,

          co.gender,

          co.quota,

          co.year,

          co.round,

          co.category,

          co.counselling_type,

          co.is_verified,

          co.verification_status


        FROM cutoffs co


        INNER JOIN branches b

          ON b.id =
             co.branch_id


        INNER JOIN colleges c

          ON c.id =
             b.college_id


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

          AND co.closing_rank
            IS NOT NULL

          AND co.closing_rank >
            0


        ORDER BY

          co.closing_rank ASC,

          c.name ASC,

          b.name ASC
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
      'CW-REC RANK BAND AUDIT'
    );

    console.log(
      '========================================'
    );


    console.log(
      'Student rank:',
      STUDENT_RANK
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
      'Raw matching rows:',
      rows.length
    );


    /*
    |--------------------------------------------------------------------------
    | SCORE ALL RAW ROWS
    |--------------------------------------------------------------------------
    */

    const scored =
      rows.map(
        (
          row
        ) => {
          const fit =
            calculateHistoricalFitScore(
              STUDENT_RANK,
              row.closing_rank
            );


          return {
            ...row,

            historicalFit:
              fit,

            bucket:
              getBucket(
                fit
              ),

            distance:
              Math.abs(
                Number(
                  row.closing_rank
                ) -
                STUDENT_RANK
              ),
          };
        }
      );


    /*
    |--------------------------------------------------------------------------
    | RAW BUCKET COUNTS
    |--------------------------------------------------------------------------
    */

    const bucketCounts =
      scored.reduce(
        (
          accumulator,
          row
        ) => {
          accumulator[
            row.bucket
          ] =
            (
              accumulator[
                row.bucket
              ] ??
              0
            ) +
            1;


          return accumulator;
        },
        {}
      );


    console.log(
      '\n=== RAW DATABASE BUCKET COUNTS ==='
    );


    console.table(
      Object.entries(
        bucketCounts
      )
        .map(
          (
            [
              bucket,
              count,
            ]
          ) => ({
            bucket,
            count,
          })
        )
    );


    /*
    |--------------------------------------------------------------------------
    | MIN / MAX CLOSING RANK
    |--------------------------------------------------------------------------
    */

    const closingRanks =
      scored
        .map(
          (
            row
          ) =>
            Number(
              row.closing_rank
            )
        )
        .filter(
          Number.isFinite
        );


    if (
      closingRanks.length
    ) {
      console.log(
        '\nClosing rank minimum:',
        Math.min(
          ...closingRanks
        )
      );


      console.log(
        'Closing rank maximum:',
        Math.max(
          ...closingRanks
        )
      );
    }


    /*
    |--------------------------------------------------------------------------
    | CLOSING-RANK DISTRIBUTION
    |--------------------------------------------------------------------------
    */

    const bands = [
      {
        label:
          '< 40000',

        min:
          1,

        max:
          39999,
      },

      {
        label:
          '40000 - 42499',

        min:
          40000,

        max:
          42499,
      },

      {
        label:
          '42500 - 44999',

        min:
          42500,

        max:
          44999,
      },

      {
        label:
          '45000 - 46999',

        min:
          45000,

        max:
          46999,
      },

      {
        label:
          '47000 - 49999',

        min:
          47000,

        max:
          49999,
      },

      {
        label:
          '50000 - 51299',

        min:
          50000,

        max:
          51299,
      },

      {
        label:
          '51300 - 57699',

        min:
          51300,

        max:
          57699,
      },

      {
        label:
          '57700 - 75000',

        min:
          57700,

        max:
          75000,
      },

      {
        label:
          '75001 - 100000',

        min:
          75001,

        max:
          100000,
      },

      {
        label:
          '> 100000',

        min:
          100001,

        max:
          Number.MAX_SAFE_INTEGER,
      },
    ];


    const bandRows =
      bands.map(
        (
          band
        ) => {
          const matches =
            scored.filter(
              (
                row
              ) => {
                const closing =
                  Number(
                    row.closing_rank
                  );


                return (
                  closing >=
                    band.min &&
                  closing <=
                    band.max
                );
              }
            );


          return {
            band:
              band.label,

            count:
              matches.length,
          };
        }
      );


    console.log(
      '\n=== CLOSING RANK DISTRIBUTION ==='
    );


    console.table(
      bandRows
    );


    /*
    |--------------------------------------------------------------------------
    | 100 NEAREST CUTOFFS
    |--------------------------------------------------------------------------
    */

    const nearest =
      [
        ...scored,
      ]
        .sort(
          (
            a,
            b
          ) =>
            a.distance -
            b.distance
        )
        .slice(
          0,
          100
        );


    console.log(
      '\n=== 100 NEAREST CUTOFFS TO STUDENT RANK ==='
    );


    console.table(
      nearest.map(
        (
          row
        ) => ({
          college:
            row.college_name,

          branch:
            row.branch_name,

          opening:
            row.opening_rank,

          closing:
            row.closing_rank,

          fit:
            row.historicalFit ===
              null
              ? null
              : Number(
                  row
                    .historicalFit
                    .toFixed(
                      2
                    )
                ),

          bucket:
            row.bucket,

          distance:
            row.distance,

          gender:
            row.gender,

          quota:
            row.quota,
        })
      )
    );


    /*
    |--------------------------------------------------------------------------
    | TARGET ONLY
    |--------------------------------------------------------------------------
    */

    const targets =
      scored
        .filter(
          (
            row
          ) =>
            row.bucket ===
            'Target'
        )
        .sort(
          (
            a,
            b
          ) =>
            a.distance -
            b.distance
        );


    console.log(
      '\n========================================'
    );

    console.log(
      'TARGET AUDIT'
    );

    console.log(
      '========================================'
    );


    console.log(
      'Target rows:',
      targets.length
    );


    console.table(
      targets
        .slice(
          0,
          100
        )
        .map(
          (
            row
          ) => ({
            college:
              row.college_name,

            branch:
              row.branch_name,

            opening:
              row.opening_rank,

            closing:
              row.closing_rank,

            fit:
              Number(
                row
                  .historicalFit
                  .toFixed(
                    2
                  )
              ),

            gender:
              row.gender,

            quota:
              row.quota,
          })
        )
    );


    /*
    |--------------------------------------------------------------------------
    | DREAM ONLY
    |--------------------------------------------------------------------------
    */

    const dreams =
      scored
        .filter(
          (
            row
          ) =>
            row.bucket ===
            'Dream'
        )
        .sort(
          (
            a,
            b
          ) =>
            a.distance -
            b.distance
        );


    console.log(
      '\n========================================'
    );

    console.log(
      'DREAM AUDIT'
    );

    console.log(
      '========================================'
    );


    console.log(
      'Dream rows:',
      dreams.length
    );


    console.table(
      dreams
        .slice(
          0,
          50
        )
        .map(
          (
            row
          ) => ({
            college:
              row.college_name,

            branch:
              row.branch_name,

            opening:
              row.opening_rank,

            closing:
              row.closing_rank,

            fit:
              Number(
                row
                  .historicalFit
                  .toFixed(
                    2
                  )
              ),

            gender:
              row.gender,

            quota:
              row.quota,
          })
        )
    );


    /*
    |--------------------------------------------------------------------------
    | DUPLICATION AUDIT
    |--------------------------------------------------------------------------
    */

    const pairCounts =
      new Map();


    for (
      const row of scored
    ) {
      const key =
        [
          row.college_id,
          row.branch_id,
        ].join(
          '::'
        );


      pairCounts.set(
        key,
        (
          pairCounts.get(
            key
          ) ??
          0
        ) +
        1
      );
    }


    const duplicatePairs =
      [
        ...pairCounts
          .entries(),
      ]
        .filter(
          (
            [
              ,
              count,
            ]
          ) =>
            count > 1
        )
        .sort(
          (
            a,
            b
          ) =>
            b[1] -
            a[1]
        );


    console.log(
      '\n========================================'
    );

    console.log(
      'DUPLICATION AUDIT'
    );

    console.log(
      '========================================'
    );


    console.log(
      'Unique college/branch pairs:',
      pairCounts.size
    );


    console.log(
      'Pairs appearing more than once:',
      duplicatePairs.length
    );


    console.table(
      duplicatePairs
        .slice(
          0,
          30
        )
        .map(
          (
            [
              key,
              count,
            ]
          ) => ({
            key,
            count,
          })
        )
    );
  } catch (
    error
  ) {
    console.error(
      '\nCW-REC RANK BAND AUDIT ERROR:\n',
      error
    );


    process.exitCode =
      1;
  } finally {
    await pool.end();
  }
}


main();