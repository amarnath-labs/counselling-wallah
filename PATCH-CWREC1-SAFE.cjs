const fs =
  require('fs');


const file =
  process.argv[2];


let source =
  fs
    .readFileSync(
      file,
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


/*
|--------------------------------------------------------------------------
| SIGNATURE
|--------------------------------------------------------------------------
*/

const signatureRegex =
  /export function calculateHistoricalFit\(\{\s*studentRank,\s*closingRanks\s*=\s*\[\],\s*\}\)\s*\{/;


if (
  !signatureRegex.test(
    source
  )
) {

  throw new Error(
    'Original calculateHistoricalFit signature not found'
  );

}


source =
  source.replace(

    signatureRegex,

`export function calculateHistoricalFit({
  studentRank,

  closingRanks = [],

  r1OpeningRank = null,

  lastRoundClosingRank = null,
}) {`

  );


/*
|--------------------------------------------------------------------------
| INSERT NEW PRIMARY MODEL
|--------------------------------------------------------------------------
*/

const rankAnchorRegex =
  /const rank\s*=\s*toNumber\(\s*studentRank\s*\);\s*\n\s*const cleanClosingRanks\s*=/;


const match =
  source.match(
    rankAnchorRegex
  );


if (
  !match
) {

  throw new Error(
    'Rank / cleanClosingRanks anchor not found'
  );

}


const replacement =
`const rank =
    toNumber(
      studentRank
    );


  const r1Opening =
    toNumber(
      r1OpeningRank
    );


  const finalClosing =
    toNumber(
      lastRoundClosingRank
    );


  /*
  |--------------------------------------------------------------------------
  | PRIMARY ADMISSION MODEL
  |--------------------------------------------------------------------------
  |
  | Round 1 Opening Rank -> Last Round Closing Rank
  |
  | <= R1 opening               = Backup
  | first 60% of cutoff window = Safe
  | remaining cutoff window    = Target
  | beyond last closing        = Dream
  |
  */


  if (

    rank !== null &&

    rank > 0 &&

    r1Opening !== null &&

    r1Opening > 0 &&

    finalClosing !== null &&

    finalClosing > r1Opening

  ) {

    const historicalPosition =
      (
        rank -
        r1Opening
      ) /
      (
        finalClosing -
        r1Opening
      );


    let bucket;

    let historicalFitScore;


    /*
    | BACKUP
    */

    if (
      rank <= r1Opening
    ) {

      bucket =
        'Backup';

      historicalFitScore =
        100;

    }


    /*
    | SAFE
    */

    else if (
      historicalPosition <= 0.60
    ) {

      bucket =
        'Safe';


      historicalFitScore =
        clamp(

          85 -

          (
            Math.max(
              0,
              historicalPosition
            ) /
            0.60
          ) *

          20

        );

    }


    /*
    | TARGET
    */

    else if (
      rank <= finalClosing
    ) {

      bucket =
        'Target';


      historicalFitScore =
        clamp(

          65 -

          (
            (
              historicalPosition -
              0.60
            ) /
            0.40
          ) *

          30

        );

    }


    /*
    | DREAM
    */

    else {

      bucket =
        'Dream';


      const excess =
        (
          rank -
          finalClosing
        ) /
        finalClosing;


      historicalFitScore =
        clamp(

          35 -

          Math.min(

            1,

            Math.max(
              0,
              excess
            )

          ) *

          35

        );

    }


    return {

      historicalFitScore,

      bucket,


      medianClosingRank:
        finalClosing,


      relativeMargin:

        (
          finalClosing -
          rank
        ) /
        finalClosing,


      yearsUsed:
        1,


      r1OpeningRank:
        r1Opening,


      lastRoundClosingRank:
        finalClosing,


      historicalPosition,


      admissionModel:
        'R1_OPENING_TO_LAST_ROUND_CLOSING',


      status:
        FACTOR_STATUS.AVAILABLE,

    };

  }


  /*
  |--------------------------------------------------------------------------
  | Existing closing-rank model remains only as fallback.
  |--------------------------------------------------------------------------
  */


  const cleanClosingRanks =`;


source =
  source.replace(
    rankAnchorRegex,
    replacement
  );


/*
|--------------------------------------------------------------------------
| VALIDATE SOURCE
|--------------------------------------------------------------------------
*/

const required =
  [

    'r1OpeningRank = null',

    'lastRoundClosingRank = null',

    'historicalPosition <= 0.60',

    "'R1_OPENING_TO_LAST_ROUND_CLOSING'",

  ];


for (
  const item of
  required
) {

  if (
    !source.includes(
      item
    )
  ) {

    throw new Error(
      `Missing after patch: ${item}`
    );

  }

}


fs.writeFileSync(
  file,
  source,
  'utf8'
);


console.log(
  'cwRecV1 safe patch written'
);
