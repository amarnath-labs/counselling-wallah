const fs =
  require('fs');

const path =
  require('path');


function read(file) {

  if (
    !fs.existsSync(file)
  ) {

    throw new Error(
      `FILE NOT FOUND: ${file}`
    );

  }

  return fs
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

}


function write(
  file,
  text
) {

  fs.writeFileSync(
    file,
    text,
    'utf8'
  );

}


function log(
  message
) {

  console.log(
    `OK: ${message}`
  );

}


const root =
  process.cwd();


const dataFile =
  path.join(
    root,
    'backend',
    'src',
    'services',
    'cwRecDataV1.js'
  );


const scoringFile =
  path.join(
    root,
    'backend',
    'src',
    'services',
    'cwRecV1.js'
  );


const adapterFile =
  path.join(
    root,
    'backend',
    'src',
    'services',
    'cwRecAdapterV1.js'
  );


const historicalFile =
  path.join(
    root,
    'backend',
    'src',
    'services',
    'historicalAdmissionIntelligence.js'
  );


const routeFile =
  path.join(
    root,
    'backend',
    'src',
    'routes',
    'cwRecV1-dev.js'
  );


/*
|--------------------------------------------------------------------------
| 1. CW-REC DATA
|--------------------------------------------------------------------------
|
| - Remove 0.85 SQL elimination.
| - Increase review concurrency.
| - Deep V3 enrichment only for first 60 closest rows.
|
| Base SQL reviewScore still exists for every row.
|
*/

{
  let text =
    read(
      dataFile
    );


  text =
    text.replace(
      /\s+AND\s+co\.closing_rank\s*>=\s*CEIL\(\$1\s*\*\s*0\.85\)/g,
      ''
    );


  text =
    text.replace(
      /const\s+REVIEW_ENRICHMENT_CONCURRENCY\s*=\s*\d+\s*;/,
`const REVIEW_ENRICHMENT_CONCURRENCY =
  12;`
    );


  text =
    text.replace(
      /await\s+mapWithConcurrency\(\s*unique,\s*REVIEW_ENRICHMENT_CONCURRENCY,/,
`await mapWithConcurrency(
    unique.slice(
      0,
      60
    ),
    REVIEW_ENRICHMENT_CONCURRENCY,`
    );


  if (
    text.includes(
      'co.closing_rank >= CEIL($1 * 0.85)'
    )
  ) {

    throw new Error(
      'Old 0.85 SQL filter still exists'
    );

  }


  write(
    dataFile,
    text
  );


  log(
    'cwRecDataV1 eligibility + performance'
  );
}


/*
|--------------------------------------------------------------------------
| 2. CW-REC CORE ADMISSION SCORER
|--------------------------------------------------------------------------
|
| FINAL BUCKET:
|
| R1 opening ---------------------- last round closing
|
| <= opening       = Backup
| first 60%        = Safe
| remaining window = Target
| > final closing  = Dream
|
| This is now used by the ACTUAL scorer.
|
*/

{
  let text =
    read(
      scoringFile
    );


  const start =
    text.indexOf(
      'export function calculateHistoricalFit({'
    );


  if (
    start === -1
  ) {

    throw new Error(
      'calculateHistoricalFit start not found'
    );

  }


  const marker =
`/* -------------------------------------------------------------------------- */
/* ADMISSION CONFIDENCE`;


  const end =
    text.indexOf(
      marker,
      start
    );


  if (
    end === -1
  ) {

    throw new Error(
      'calculateHistoricalFit end marker not found'
    );

  }


  const newFunction =
`export function calculateHistoricalFit({
  studentRank,

  closingRanks = [],

  r1OpeningRank = null,

  lastRoundClosingRank = null,
}) {

  const rank =
    toNumber(
      studentRank
    );


  const opening =
    toNumber(
      r1OpeningRank
    );


  const finalClosing =
    toNumber(
      lastRoundClosingRank
    );


  /*
  |--------------------------------------------------------------------------
  | FINAL R1 -> LAST ROUND MODEL
  |--------------------------------------------------------------------------
  */


  if (

    rank !== null &&

    rank > 0 &&

    opening !== null &&

    finalClosing !== null &&

    finalClosing > opening

  ) {

    const position =
      (
        rank -
        opening
      ) /
      (
        finalClosing -
        opening
      );


    let bucket;

    let historicalFitScore;


    /*
    |--------------------------------------------------------------------------
    | BACKUP
    |--------------------------------------------------------------------------
    */

    if (
      rank <= opening
    ) {

      bucket =
        'Backup';

      historicalFitScore =
        100;

    }


    /*
    |--------------------------------------------------------------------------
    | SAFE
    |--------------------------------------------------------------------------
    */

    else if (
      position <= 0.60
    ) {

      bucket =
        'Safe';


      historicalFitScore =
        clamp(

          85 -

          (
            position /
            0.60
          ) *

          20

        );

    }


    /*
    |--------------------------------------------------------------------------
    | TARGET
    |--------------------------------------------------------------------------
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
              position -
              0.60
            ) /
            0.40
          ) *

          30

        );

    }


    /*
    |--------------------------------------------------------------------------
    | DREAM
    |--------------------------------------------------------------------------
    */

    else {

      bucket =
        'Dream';


      historicalFitScore =
        clamp(

          35 -

          Math.min(
            1,
            Math.max(
              0,
              position -
              1
            )
          ) *

          35

        );

    }


    const relativeMargin =
      (
        finalClosing -
        rank
      ) /
      finalClosing;


    return {

      historicalFitScore,

      bucket,

      medianClosingRank:
        finalClosing,

      relativeMargin,

      yearsUsed:
        1,

      r1OpeningRank:
        opening,

      lastRoundClosingRank:
        finalClosing,

      historicalPosition:
        position,

      admissionModel:
        'R1_OPENING_TO_LAST_ROUND_CLOSING',

      status:
        FACTOR_STATUS.AVAILABLE,

    };

  }


  /*
  |--------------------------------------------------------------------------
  | LEGACY FALLBACK
  |--------------------------------------------------------------------------
  |
  | Only when R1 / final closing data is genuinely unavailable.
  |
  */


  const cleanClosingRanks =
    closingRanks

      .map(
        Number
      )

      .filter(
        Number.isFinite
      )

      .filter(
        value =>
          value > 0
      );


  if (

    rank === null ||

    rank <= 0 ||

    !cleanClosingRanks.length

  ) {

    return {

      historicalFitScore:
        null,

      bucket:
        'Admission data pending',

      medianClosingRank:
        null,

      relativeMargin:
        null,

      yearsUsed:
        cleanClosingRanks.length,

      r1OpeningRank:
        opening,

      lastRoundClosingRank:
        finalClosing,

      historicalPosition:
        null,

      admissionModel:
        'FALLBACK_UNAVAILABLE',

      status:
        FACTOR_STATUS.UNAVAILABLE,

    };

  }


  const medianClosingRank =
    median(
      cleanClosingRanks
    );


  if (

    !medianClosingRank ||

    medianClosingRank <= 0

  ) {

    return {

      historicalFitScore:
        null,

      bucket:
        'Admission data pending',

      medianClosingRank:
        null,

      relativeMargin:
        null,

      yearsUsed:
        cleanClosingRanks.length,

      r1OpeningRank:
        opening,

      lastRoundClosingRank:
        finalClosing,

      historicalPosition:
        null,

      admissionModel:
        'FALLBACK_UNAVAILABLE',

      status:
        FACTOR_STATUS.UNAVAILABLE,

    };

  }


  const relativeMargin =
    (
      medianClosingRank -
      rank
    ) /
    medianClosingRank;


  const historicalFitScore =
    calculateHistoricalFitScore(
      relativeMargin
    );


  return {

    historicalFitScore,

    bucket:
      getAdmissionBucketFromFit(
        historicalFitScore
      ),

    medianClosingRank,

    relativeMargin,

    yearsUsed:
      cleanClosingRanks.length,

    r1OpeningRank:
      opening,

    lastRoundClosingRank:
      finalClosing,

    historicalPosition:
      null,

    admissionModel:
      'LEGACY_CLOSING_FALLBACK',

    status:
      FACTOR_STATUS.AVAILABLE,

  };
}


`;


  text =
    text.slice(
      0,
      start
    ) +

    newFunction +

    text.slice(
      end
    );


  write(
    scoringFile,
    text
  );


  log(
    'cwRecV1 R1-to-final admission scoring'
  );
}


/*
|--------------------------------------------------------------------------
| 3. ADAPTER
|--------------------------------------------------------------------------
|
| Carry historical window into the ACTUAL scorer.
|
*/

{
  let text =
    read(
      adapterFile
    );


  if (
    !text.includes(
      'r1OpeningRank:'
    )
  ) {

    const functionStart =
      text.indexOf(
        'export function adaptCounsellingRowToCWRecInput'
      );


    if (
      functionStart === -1
    ) {

      throw new Error(
        'Adapter function not found'
      );

    }


    const returnStart =
      text.indexOf(
        '  return {',
        functionStart
      );


    if (
      returnStart === -1
    ) {

      throw new Error(
        'Adapter final return not found'
      );

    }


    const closingPosition =
      text.indexOf(
        '    closingRanks,',
        returnStart
      );


    if (
      closingPosition === -1
    ) {

      throw new Error(
        'Adapter closingRanks return not found'
      );

    }


    const insertionPoint =
      closingPosition +
      '    closingRanks,'.length;


    const extra =
`

    r1OpeningRank:

      row?.r1OpeningRank ??

      row?.admission
        ?.r1OpeningRank ??

      row?.historicalFit
        ?.r1OpeningRank ??

      row?.openingRank ??

      null,


    lastRoundClosingRank:

      row?.lastRoundClosingRank ??

      row?.admission
        ?.lastRoundClosingRank ??

      row?.historicalFit
        ?.lastRoundClosingRank ??

      row?.closingRank ??

      null,
`;


    text =
      text.slice(
        0,
        insertionPoint
      ) +

      extra +

      text.slice(
        insertionPoint
      );

  }


  write(
    adapterFile,
    text
  );


  log(
    'cwRecAdapter historical window passthrough'
  );
}


/*
|--------------------------------------------------------------------------
| 4. ACTIVE CW-REC ROUTE
|--------------------------------------------------------------------------
|
| Every adapted scoring call now passes:
| - r1OpeningRank
| - lastRoundClosingRank
|
*/

{
  let text =
    read(
      routeFile
    );


  if (
    !text.includes(
      'r1OpeningRank:\n'
    )
  ) {

    const pattern =
      /^(\s*)closingRanks:\s*\n\s*adapted\.closingRanks,\s*$/gm;


    let count =
      0;


    text =
      text.replace(
        pattern,
        (
          match,
          indent
        ) => {

          count++;


          return (
`${indent}closingRanks:
${indent}  adapted.closingRanks,

${indent}r1OpeningRank:
${indent}  adapted.r1OpeningRank,

${indent}lastRoundClosingRank:
${indent}  adapted.lastRoundClosingRank,`
          );

        }
      );


    if (
      count === 0
    ) {

      throw new Error(
        'No adapted calculateHistoricalFit calls patched'
      );

    }


    console.log(
      `Patched scorer calls: ${count}`
    );

  }


  write(
    routeFile,
    text
  );


  log(
    'cwRecV1-dev scorer wiring'
  );
}


/*
|--------------------------------------------------------------------------
| 5. HISTORICAL ADMISSION INTELLIGENCE
|--------------------------------------------------------------------------
|
| Old engine:
| historicalBucket = weighted closing-rank ratio
|
| New displayed canonical bucket:
| latest year R1 opening -> latest final closing
|
*/

{
  let text =
    read(
      historicalFile
    );


  if (
    !text.includes(
      'function classifyAdmissionWindow('
    )
  ) {

    const anchor =
      'function classifyRankRatio(';


    const anchorIndex =
      text.indexOf(
        anchor
      );


    if (
      anchorIndex === -1
    ) {

      throw new Error(
        'historical classifyRankRatio anchor not found'
      );

    }


    const helper =
`function classifyAdmissionWindow(
  studentRank,
  r1OpeningRank,
  lastRoundClosingRank
) {

  const rank =
    toNumber(
      studentRank
    );


  const opening =
    toNumber(
      r1OpeningRank
    );


  const closing =
    toNumber(
      lastRoundClosingRank
    );


  if (

    rank === null ||

    opening === null ||

    closing === null ||

    closing <= opening

  ) {

    return null;

  }


  if (
    rank <= opening
  ) {

    return 'Backup';

  }


  const position =
    (
      rank -
      opening
    ) /
    (
      closing -
      opening
    );


  if (
    position <= 0.60
  ) {

    return 'Safe';

  }


  if (
    rank <= closing
  ) {

    return 'Target';

  }


  return 'Dream';
}


`;


    text =
      text.slice(
        0,
        anchorIndex
      ) +

      helper +

      text.slice(
        anchorIndex
      );

  }


  const oldBucketPattern =
/historicalBucket:\s*\n\s*weighted\.bucket,/;


  if (
    oldBucketPattern.test(
      text
    )
  ) {

    text =
      text.replace(
        oldBucketPattern,
`historicalBucket:
      classifyAdmissionWindow(
        normalizedRank,
        latestYear?.openingRank,
        latestYear?.closingRank
      ) ??
      weighted.bucket,`
      );

  }


  text =
    text.replace(
      /openingRankUsage:\s*\n\s*'display-only'/,
`openingRankUsage:
        'R1-classification-window-start'`
    );


  text =
    text.replace(
      /closingRankUsage:\s*\n\s*'admission-boundary'/,
`closingRankUsage:
        'last-round-classification-window-end'`
    );


  write(
    historicalFile,
    text
  );


  log(
    'Historical Admission Intelligence canonical bucket'
  );
}


/*
|--------------------------------------------------------------------------
| FINAL VALIDATION
|--------------------------------------------------------------------------
*/

const finalData =
  read(
    dataFile
  );


const finalScore =
  read(
    scoringFile
  );


const finalAdapter =
  read(
    adapterFile
  );


const finalHistory =
  read(
    historicalFile
  );


const finalRoute =
  read(
    routeFile
  );


const checks = [

  [
    !finalData.includes(
      'co.closing_rank >= CEIL($1 * 0.85)'
    ),
    'old 0.85 rank filter removed',
  ],

  [
    finalData.includes(
      'REVIEW_ENRICHMENT_CONCURRENCY =\n  12'
    ),
    'review concurrency = 12',
  ],

  [
    finalData.includes(
      'unique.slice(\n      0,\n      60'
    ),
    'deep review enrichment limited to 60',
  ],

  [
    finalScore.includes(
      'R1_OPENING_TO_LAST_ROUND_CLOSING'
    ),
    'actual CW-REC scorer uses historical window',
  ],

  [
    finalAdapter.includes(
      'lastRoundClosingRank:'
    ),
    'adapter carries last-round closing rank',
  ],

  [
    finalRoute.includes(
      'adapted.r1OpeningRank'
    ),
    'route sends R1 opening rank to scorer',
  ],

  [
    finalRoute.includes(
      'adapted.lastRoundClosingRank'
    ),
    'route sends final closing rank to scorer',
  ],

  [
    finalHistory.includes(
      'classifyAdmissionWindow('
    ),
    'Admission Intelligence uses window classifier',
  ],

];


for (
  const [
    passed,
    message,
  ]
  of checks
) {

  if (
    !passed
  ) {

    throw new Error(
      `FINAL CHECK FAILED: ${message}`
    );

  }


  console.log(
    `PASS: ${message}`
  );

}


console.log('');
console.log('==========================================');
console.log('TRUMARG 4-PROBLEM FINAL PATCH COMPLETE');
console.log('==========================================');
