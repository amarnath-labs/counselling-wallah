const fs =
  require('fs');


const backendPath =
  process.argv[2];


const frontendPath =
  process.argv[3];


if (
  !backendPath ||
  !fs.existsSync(
    backendPath
  )
) {
  throw new Error(
    `Backend file not found: ${backendPath}`
  );
}


let source =
  fs
    .readFileSync(
      backendPath,
      'utf8'
    )
    .replace(
      /^\uFEFF/,
      ''
    )
    .replace(
      /\r\n/g,
      '\n'
    );


function replaceOnce(
  name,
  oldText,
  newText
) {

  const index =
    source.indexOf(
      oldText
    );


  if (
    index === -1
  ) {

    throw new Error(
      `PATCH FAILED: ${name} anchor not found`
    );
  }


  source =
    source.slice(
      0,
      index
    ) +

    newText +

    source.slice(
      index +
      oldText.length
    );


  console.log(
    `OK: ${name}`
  );
}


/*
|--------------------------------------------------------------------------
| 1. HELPERS
|--------------------------------------------------------------------------
*/

const helperAnchor =
`

/* =========================================================
   REAL RECOMMENDATION DATA
========================================================= */
`;


const helpers =
`

function numberOrNull(value) {

  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null;
  }


  const parsed =
    Number(
      value
    );


  return Number.isFinite(
    parsed
  )
    ? parsed
    : null;
}


function buildHistoricalAdmissionFit({

  studentRank,

  r1OpeningRank,

  lastRoundClosingRank,

}) {

  const rank =
    numberOrNull(
      studentRank
    );


  const opening =
    numberOrNull(
      r1OpeningRank
    );


  const closing =
    numberOrNull(
      lastRoundClosingRank
    );


  let key =
    'dream';


  let position =
    null;


  /*
  |--------------------------------------------------------------------------
  | R1 OPENING -> LAST ROUND CLOSING
  |--------------------------------------------------------------------------
  |
  | Backup:
  | student rank is equal/better than Round-1 opening rank.
  |
  | Safe:
  | student lies in first 60% of historical admission window.
  |
  | Target:
  | student lies in remaining historical admitted window.
  |
  | Dream:
  | student is beyond last-round closing rank.
  |
  */


  if (

    rank !== null &&

    opening !== null &&

    closing !== null &&

    closing > opening

  ) {

    position =
      (
        rank -
        opening
      ) /
      (
        closing -
        opening
      );


    if (
      rank <= opening
    ) {

      key =
        'backup';

    }


    else if (
      position <= 0.60
    ) {

      key =
        'safe';

    }


    else if (
      rank <= closing
    ) {

      key =
        'target';

    }


    else {

      key =
        'dream';

    }

  }


  /*
  |--------------------------------------------------------------------------
  | FALLBACK
  |--------------------------------------------------------------------------
  |
  | Only used when Round-1 opening is unavailable.
  |
  */


  else if (

    rank !== null &&

    closing !== null &&

    closing > 0

  ) {

    const ratio =
      rank /
      closing;


    if (
      ratio <= 0.60
    ) {

      key =
        'backup';

    }


    else if (
      ratio <= 0.85
    ) {

      key =
        'safe';

    }


    else if (
      ratio <= 1.00
    ) {

      key =
        'target';

    }


    else {

      key =
        'dream';

    }

  }


  const labels = {

    backup:
      'Backup',

    safe:
      'Safe',

    target:
      'Target',

    dream:
      'Dream',

  };


  return {

    key,

    bucket:
      labels[key],

    label:
      labels[key],


    r1OpeningRank:
      opening,


    lastRoundClosingRank:
      closing,


    position:

      position === null

        ? null

        : Number(
            position.toFixed(
              6
            )
          ),

  };
}


async function mapWithConcurrency(

  items,

  concurrency,

  mapper

) {

  if (
    !items.length
  ) {

    return;

  }


  const count =
    Math.max(

      1,

      Math.min(

        Number(
          concurrency
        ) || 1,

        items.length

      )

    );


  let cursor =
    0;


  async function worker() {

    while (
      true
    ) {

      const index =
        cursor++;


      if (
        index >=
        items.length
      ) {

        return;

      }


      await mapper(

        items[index],

        index

      );

    }

  }


  await Promise.all(

    Array.from(

      {
        length:
          count,
      },

      () =>
        worker()

    )

  );
}
`;


replaceOnce(

  'helpers',

  helperAnchor,

  helpers +
  helperAnchor

);


/*
|--------------------------------------------------------------------------
| 2. SELECT HISTORICAL FIELDS
|--------------------------------------------------------------------------
*/

replaceOnce(

  'historical SELECT fields',

`      co.closing_rank
        AS "closingRank",


      co.source_label`,

`      co.closing_rank
        AS "closingRank",

      history_data.r1_opening_rank
        AS "r1OpeningRank",

      history_data.last_round_closing_rank
        AS "lastRoundClosingRank",

      history_data.last_round_number
        AS "lastRoundNumber",


      co.source_label`

);


/*
|--------------------------------------------------------------------------
| 3. HISTORICAL R1 -> LAST ROUND JOIN
|--------------------------------------------------------------------------
*/

const collegeJoinAnchor =
`INNER JOIN colleges c

      ON c.id =
         b.college_id


    /*
    |--------------------------------------------------------------------------
    | VERIFIED COLLEGE QUALITY`;


const historyJoin =
`INNER JOIN colleges c

      ON c.id =
         b.college_id


    /*
    |--------------------------------------------------------------------------
    | HISTORICAL ADMISSION WINDOW
    |--------------------------------------------------------------------------
    |
    | Same:
    | branch
    | year
    | category
    | quota
    | gender
    | counselling type
    |
    | We use:
    | Round 1 opening rank
    | Last available round closing rank
    |
    */

    LEFT JOIN LATERAL (

      SELECT

        MIN(

          CASE

            WHEN

              NULLIF(

                REGEXP_REPLACE(

                  LOWER(

                    COALESCE(
                      h.round::text,
                      ''
                    )

                  ),

                  '[^0-9]',

                  '',

                  'g'

                ),

                ''

              )::int = 1

            THEN
              h.opening_rank

            ELSE
              NULL

          END

        )
          AS r1_opening_rank,


        (

          ARRAY_AGG(

            h.closing_rank

            ORDER BY

              NULLIF(

                REGEXP_REPLACE(

                  LOWER(

                    COALESCE(
                      h.round::text,
                      ''
                    )

                  ),

                  '[^0-9]',

                  '',

                  'g'

                ),

                ''

              )::int
                DESC NULLS LAST

          )

          FILTER (

            WHERE

              h.closing_rank
                IS NOT NULL

          )

        )[1]
          AS last_round_closing_rank,


        MAX(

          NULLIF(

            REGEXP_REPLACE(

              LOWER(

                COALESCE(
                  h.round::text,
                  ''
                )

              ),

              '[^0-9]',

              '',

              'g'

            ),

            ''

          )::int

        )
          AS last_round_number


      FROM \${cutoffTable} h


      WHERE

        h.branch_id =
          co.branch_id


        AND h.year =
          co.year


        AND h.category =
          co.category


        AND COALESCE(
          h.quota,
          ''
        ) =
        COALESCE(
          co.quota,
          ''
        )


        AND COALESCE(
          h.gender,
          ''
        ) =
        COALESCE(
          co.gender,
          ''
        )


        AND COALESCE(
          h.counselling_type,
          ''
        ) =
        COALESCE(
          co.counselling_type,
          ''
        )


        AND COALESCE(
          h.is_verified,
          false
        ) =
          true

    ) history_data
      ON TRUE


    /*
    |--------------------------------------------------------------------------
    | VERIFIED COLLEGE QUALITY`;


replaceOnce(

  'historical lateral join',

  collegeJoinAnchor,

  historyJoin

);


/*
|--------------------------------------------------------------------------
| 4. REMOVE OLD 5-DIGIT RANK ELIMINATION
|--------------------------------------------------------------------------
*/

replaceOnce(

  'remove old 0.85 rank filter',

`

      AND co.closing_rank >= CEIL($1 * 0.85)`,

  ''

);


/*
|--------------------------------------------------------------------------
| 5. SORT USING LAST ROUND CLOSING RANK
|--------------------------------------------------------------------------
*/

replaceOnce(

  'historical proximity sort',

`    ORDER BY

      co.closing_rank ASC,

      c.name ASC,

      b.name ASC`,

`    ORDER BY

      ABS(

        COALESCE(

          history_data
            .last_round_closing_rank,

          co.closing_rank,

          $1

        ) -

        $1

      ) ASC,


      COALESCE(

        history_data
          .last_round_closing_rank,

        co.closing_rank

      )
        DESC NULLS LAST,


      c.name ASC,

      b.name ASC`

);


/*
|--------------------------------------------------------------------------
| 6. CANONICAL BUCKET
|--------------------------------------------------------------------------
*/

const reviewAnchor =
`  /* =======================================================
     V3 REVIEW INTELLIGENCE ENRICHMENT
  ======================================================= */`;


const canonicalBucket =
`  /* =======================================================
     CANONICAL HISTORICAL ADMISSION BUCKET
  ======================================================= */

  for (
    const row of unique
  ) {

    const historicalFit =
      buildHistoricalAdmissionFit({

        studentRank,


        r1OpeningRank:

          row.r1OpeningRank ??

          row.openingRank,


        lastRoundClosingRank:

          row.lastRoundClosingRank ??

          row.closingRank,

      });


    row.r1OpeningRank =
      historicalFit
        .r1OpeningRank;


    row.lastRoundClosingRank =
      historicalFit
        .lastRoundClosingRank;


    /*
    |--------------------------------------------------------------------------
    | SINGLE SOURCE OF TRUTH
    |--------------------------------------------------------------------------
    */

    row.bucket =
      historicalFit
        .bucket;


    row.admissionBucket = {

      key:
        historicalFit.key,

      label:
        historicalFit.label,

    };


    row.historicalFit = {

      ...historicalFit,


      lastRoundNumber:

        numberOrNull(
          row.lastRoundNumber
        ),

    };


    row.admission = {

      ...(
        row.admission ||
        {}
      ),


      bucket:
        historicalFit
          .bucket,


      bucketKey:
        historicalFit
          .key,


      label:
        historicalFit
          .label,


      r1OpeningRank:
        historicalFit
          .r1OpeningRank,


      lastRoundClosingRank:
        historicalFit
          .lastRoundClosingRank,


      lastRoundNumber:

        numberOrNull(
          row.lastRoundNumber
        ),


      historicalPosition:
        historicalFit
          .position,

    };

  }


`;


replaceOnce(

  'canonical bucket',

  reviewAnchor,

  canonicalBucket +
  reviewAnchor

);


/*
|--------------------------------------------------------------------------
| 7. REVIEW PERFORMANCE
|--------------------------------------------------------------------------
|
| OLD:
| for each result:
|   await review
|   await aspects
|
| NEW:
| maximum 8 rows processed concurrently.
|
*/


replaceOnce(

  'parallel review start',

`  for (
    const row of unique
  ) {
    const reviewCollegeId =`,

`  await mapWithConcurrency(

    unique,

    8,

    async (row) => {

    const reviewCollegeId =`

);


replaceOnce(

  'parallel review end',

`    }
  }


  /* =======================================================
     RESPONSE`,

`    }

    }

  );


  /* =======================================================
     RESPONSE`

);


/*
|--------------------------------------------------------------------------
| BACKEND VALIDATION
|--------------------------------------------------------------------------
*/


if (

  source.includes(
    'co.closing_rank >= CEIL($1 * 0.85)'
  )

) {

  throw new Error(
    'PATCH FAILED: old 0.85 filter still exists'
  );

}


const requiredBackend =
  [

    'r1OpeningRank',

    'lastRoundClosingRank',

    'history_data',

    'buildHistoricalAdmissionFit',

    'mapWithConcurrency',

    'row.bucket =',

    'row.admissionBucket',

  ];


for (
  const required of
  requiredBackend
) {

  if (
    !source.includes(
      required
    )
  ) {

    throw new Error(
      `PATCH FAILED: missing ${required}`
    );

  }

}


fs.writeFileSync(

  backendPath,

  source,

  'utf8'

);


console.log(
  ''
);

console.log(
  'BACKEND PATCH COMPLETE'
);


/*
|--------------------------------------------------------------------------
| FRONTEND
|--------------------------------------------------------------------------
*/

if (

  frontendPath &&

  fs.existsSync(
    frontendPath
  )

) {

  let frontend =
    fs
      .readFileSync(
        frontendPath,
        'utf8'
      )
      .replace(
        /^\uFEFF/,
        ''
      );


  /*
  |--------------------------------------------------------------------------
  | HEADER SAFE / TARGET MISMATCH FIX
  |--------------------------------------------------------------------------
  */


  const admissionRegex =

    /const\s+admission\s*=\s*[^;]{0,1000}'Admission fit'\s*;/;


  const canonicalAdmission =
`const admission =
    row?.admission?.label ||
    row?.historicalFit?.label ||
    row?.bucket ||
    historicalFit?.bucket ||
    premium?.admissionBucket?.label ||
    premium?.admissionBucket ||
    'Admission fit';`;


  if (

    admissionRegex.test(
      frontend
    )

  ) {

    frontend =
      frontend.replace(

        admissionRegex,

        canonicalAdmission

      );


    console.log(
      'OK: frontend admission label canonicalized'
    );

  }

  else {

    console.log(
      'INFO: frontend admission block not matched; leaving it unchanged'
    );

  }


  /*
  |--------------------------------------------------------------------------
  | GROUPING PRIORITY
  |--------------------------------------------------------------------------
  */


  frontend =
    frontend.replace(

      /row\?\.premium\s*\?\.\s*admissionBucket\s*\?\.\s*key\s*\|\|\s*row\?\.bucket\s*\|\|/g,

`row?.bucket ||
      row?.admission?.bucket ||
      row?.premium?.admissionBucket?.key ||`

    );


  fs.writeFileSync(

    frontendPath,

    frontend,

    'utf8'

  );


  console.log(
    'FRONTEND PATCH COMPLETE'
  );

}


console.log(
  ''
);

console.log(
  'TRUMARG FINAL PATCH COMPLETE'
);
