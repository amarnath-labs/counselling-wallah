const fs = require('fs');
const path = require('path');

const root = process.cwd();

const files = {
  data: path.join(root, 'backend/src/services/cwRecDataV1.js'),
  score: path.join(root, 'backend/src/services/cwRecV1.js'),
  adapter: path.join(root, 'backend/src/services/cwRecAdapterV1.js'),
  history: path.join(root, 'backend/src/services/historicalAdmissionIntelligence.js'),
  route: path.join(root, 'backend/src/routes/cwRecV1-dev.js'),
};

function read(file) {
  if (!fs.existsSync(file)) {
    throw new Error(`FILE NOT FOUND: ${file}`);
  }

  return fs
    .readFileSync(file, 'utf8')
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n');
}

function write(file, text) {
  fs.writeFileSync(file, text, 'utf8');
}

function backup(file) {
  const target =
    `${file}.before-final-v2-${Date.now()}.bak`;

  fs.copyFileSync(file, target);

  console.log(
    `BACKUP: ${path.basename(file)}`
  );
}

/*
|--------------------------------------------------------------------------
| Robust function finder
|--------------------------------------------------------------------------
*/

function findFunctionRange(
  source,
  functionStartText
) {
  const start =
    source.indexOf(
      functionStartText
    );

  if (start === -1) {
    throw new Error(
      `FUNCTION NOT FOUND: ${functionStartText}`
    );
  }

  const openBrace =
    source.indexOf(
      '{',
      start
    );

  if (openBrace === -1) {
    throw new Error(
      `Opening brace not found: ${functionStartText}`
    );
  }

  let depth = 0;
  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (
    let i = openBrace;
    i < source.length;
    i++
  ) {
    const ch = source[i];
    const next = source[i + 1];

    if (lineComment) {
      if (ch === '\n') {
        lineComment = false;
      }

      continue;
    }

    if (blockComment) {
      if (
        ch === '*' &&
        next === '/'
      ) {
        blockComment = false;
        i++;
      }

      continue;
    }

    if (quote) {
      if (escaped) {
        escaped = false;
        continue;
      }

      if (ch === '\\') {
        escaped = true;
        continue;
      }

      if (ch === quote) {
        quote = null;
      }

      continue;
    }

    if (
      ch === '/' &&
      next === '/'
    ) {
      lineComment = true;
      i++;
      continue;
    }

    if (
      ch === '/' &&
      next === '*'
    ) {
      blockComment = true;
      i++;
      continue;
    }

    if (
      ch === "'" ||
      ch === '"' ||
      ch === '`'
    ) {
      quote = ch;
      continue;
    }

    if (ch === '{') {
      depth++;
      continue;
    }

    if (ch === '}') {
      depth--;

      if (depth === 0) {
        return {
          start,
          end: i + 1,
        };
      }
    }
  }

  throw new Error(
    `Function closing brace not found: ${functionStartText}`
  );
}


/*
|--------------------------------------------------------------------------
| BACKUPS
|--------------------------------------------------------------------------
*/

Object
  .values(files)
  .forEach(backup);


/*
|--------------------------------------------------------------------------
| 1. cwRecDataV1.js
|--------------------------------------------------------------------------
|
| Problem #3:
| Remove 0.85 SQL pre-elimination.
|
| Problem #4:
| Limit expensive review enrichment to first 60 rows
| and increase safe concurrency.
|
*/

{
  let text =
    read(files.data);

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
      /await\s+mapWithConcurrency\(\s*unique\s*,\s*REVIEW_ENRICHMENT_CONCURRENCY\s*,/,
`await mapWithConcurrency(
    unique.slice(
      0,
      60
    ),
    REVIEW_ENRICHMENT_CONCURRENCY,`
    );

  /*
  | Patch may already have changed unique -> unique.slice.
  | Do not duplicate it.
  */

  text =
    text.replace(
      /unique\.slice\(\s*0\s*,\s*60\s*\)\.slice\(\s*0\s*,\s*60\s*\)/g,
      'unique.slice(0, 60)'
    );

  write(
    files.data,
    text
  );

  console.log(
    'OK 1/5 cwRecDataV1 patched'
  );
}


/*
|--------------------------------------------------------------------------
| 2. cwRecV1.js
|--------------------------------------------------------------------------
|
| THIS IS THE IMPORTANT FIX.
|
| The actual scorer will now accept:
|
| r1OpeningRank
| lastRoundClosingRank
|
|--------------------------------------------------------------------------
*/

{
  let text =
    read(files.score);

  const range =
    findFunctionRange(
      text,
      'export function calculateHistoricalFit({'
    );

  const replacement =
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

  const closing =
    toNumber(
      lastRoundClosingRank
    );


  /*
  |--------------------------------------------------------------------------
  | PRIMARY MODEL
  |--------------------------------------------------------------------------
  |
  | R1 OPENING ---------- LAST ROUND CLOSING
  |
  | Rank <= R1 Opening        => Backup
  | First 60% of window       => Safe
  | Remaining cutoff window   => Target
  | Beyond final closing      => Dream
  |
  |--------------------------------------------------------------------------
  */

  if (
    rank !== null &&
    rank > 0 &&
    opening !== null &&
    opening > 0 &&
    closing !== null &&
    closing > opening
  ) {
    const position =
      (
        rank -
        opening
      ) /
      (
        closing -
        opening
      );

    let bucket;

    let historicalFitScore;


    if (
      rank <= opening
    ) {
      bucket =
        'Backup';

      historicalFitScore =
        100;
    }

    else if (
      position <= 0.60
    ) {
      bucket =
        'Safe';

      historicalFitScore =
        clamp(
          85 -
          (
            Math.max(
              0,
              position
            ) /
            0.60
          ) *
          20
        );
    }

    else if (
      rank <= closing
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

    else {
      bucket =
        'Dream';

      const excess =
        (
          rank -
          closing
        ) /
        closing;

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
        closing,

      relativeMargin:
        (
          closing -
          rank
        ) /
        closing,

      yearsUsed:
        1,

      r1OpeningRank:
        opening,

      lastRoundClosingRank:
        closing,

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
  | FALLBACK
  |--------------------------------------------------------------------------
  |
  | Only if historical R1/final data is unavailable.
  |
  |--------------------------------------------------------------------------
  */

  const cleanClosingRanks =
    closingRanks
      .map(Number)
      .filter(Number.isFinite)
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
        closing,

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
    medianClosingRank === null ||
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
        closing,

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
      closing,

    historicalPosition:
      null,

    admissionModel:
      'LEGACY_CLOSING_FALLBACK',

    status:
      FACTOR_STATUS.AVAILABLE,
  };
}`;

  text =
    text.slice(
      0,
      range.start
    ) +
    replacement +
    text.slice(
      range.end
    );

  write(
    files.score,
    text
  );

  console.log(
    'OK 2/5 cwRecV1 actual scorer patched'
  );
}


/*
|--------------------------------------------------------------------------
| 3. cwRecAdapterV1.js
|--------------------------------------------------------------------------
|
| Pass historical ranks from database row into scoring engine.
|
*/

{
  let text =
    read(files.adapter);

  const functionIndex =
    text.indexOf(
      'export function adaptCounsellingRowToCWRecInput'
    );

  if (
    functionIndex === -1
  ) {
    throw new Error(
      'adaptCounsellingRowToCWRecInput not found'
    );
  }

  const returnIndex =
    text.indexOf(
      '  return {',
      functionIndex
    );

  if (
    returnIndex === -1
  ) {
    throw new Error(
      'Adapter return block not found'
    );
  }

  const closingIndex =
    text.indexOf(
      '    closingRanks,',
      returnIndex
    );

  if (
    closingIndex === -1
  ) {
    throw new Error(
      'Adapter closingRanks field not found'
    );
  }


  const nextHistorical =
    text.indexOf(
      '    historicalRows,',
      closingIndex
    );


  const section =
    text.slice(
      closingIndex,
      nextHistorical
    );


  if (
    !section.includes(
      'r1OpeningRank:'
    )
  ) {
    const insertAt =
      closingIndex +
      '    closingRanks,'.length;

    const extra =
`

    r1OpeningRank:
      row?.r1OpeningRank ??
      row?.admission?.r1OpeningRank ??
      row?.historicalFit?.r1OpeningRank ??
      row?.openingRank ??
      null,

    lastRoundClosingRank:
      row?.lastRoundClosingRank ??
      row?.admission?.lastRoundClosingRank ??
      row?.historicalFit?.lastRoundClosingRank ??
      row?.closingRank ??
      null,
`;

    text =
      text.slice(
        0,
        insertAt
      ) +
      extra +
      text.slice(
        insertAt
      );
  }


  write(
    files.adapter,
    text
  );

  console.log(
    'OK 3/5 adapter patched'
  );
}


/*
|--------------------------------------------------------------------------
| 4. cwRecV1-dev.js
|--------------------------------------------------------------------------
|
| Every actual calculateHistoricalFit(adapted...) call
| receives historical window.
|
*/

{
  let text =
    read(files.route);

  let searchFrom =
    0;

  let patched =
    0;

  while (true) {
    const callStart =
      text.indexOf(
        'calculateHistoricalFit({',
        searchFrom
      );

    if (
      callStart === -1
    ) {
      break;
    }

    const callEnd =
      text.indexOf(
        '});',
        callStart
      );

    if (
      callEnd === -1
    ) {
      throw new Error(
        'calculateHistoricalFit call closing not found'
      );
    }

    let block =
      text.slice(
        callStart,
        callEnd + 3
      );


    if (
      block.includes(
        'adapted.studentRank'
      ) &&
      block.includes(
        'adapted.closingRanks'
      ) &&
      !block.includes(
        'adapted.r1OpeningRank'
      )
    ) {
      block =
        block.replace(
          /closingRanks:\s*\n(\s*)adapted\.closingRanks,/,
`closingRanks:
$1adapted.closingRanks,

$1r1OpeningRank:
$1  adapted.r1OpeningRank,

$1lastRoundClosingRank:
$1  adapted.lastRoundClosingRank,`
        );

      text =
        text.slice(
          0,
          callStart
        ) +
        block +
        text.slice(
          callEnd + 3
        );

      searchFrom =
        callStart +
        block.length;

      patched++;

      continue;
    }

    searchFrom =
      callEnd + 3;
  }


  write(
    files.route,
    text
  );

  console.log(
    `OK 4/5 route scorer calls patched: ${patched}`
  );
}


/*
|--------------------------------------------------------------------------
| 5. historicalAdmissionIntelligence.js
|--------------------------------------------------------------------------
|
| UI Admission Intelligence will use SAME classifier.
|
*/

{
  let text =
    read(files.history);


  if (
    !text.includes(
      'function classifyAdmissionWindow('
    )
  ) {
    const anchor =
      text.indexOf(
        'function classifyRankRatio('
      );

    if (
      anchor === -1
    ) {
      throw new Error(
        'classifyRankRatio not found'
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
        anchor
      ) +
      helper +
      text.slice(
        anchor
      );
  }


  text =
    text.replace(
      /historicalBucket:\s*\n\s*weighted\.bucket,/,
`historicalBucket:
      classifyAdmissionWindow(
        normalizedRank,
        latestYear?.openingRank,
        latestYear?.closingRank
      ) ??
      weighted.bucket,`
    );


  text =
    text.replace(
      /openingRankUsage:\s*\n\s*'display-only'/,
`openingRankUsage:
        'R1-opening-rank'`
    );


  text =
    text.replace(
      /closingRankUsage:\s*\n\s*'admission-boundary'/,
`closingRankUsage:
        'last-round-closing-rank'`
    );


  write(
    files.history,
    text
  );

  console.log(
    'OK 5/5 Admission Intelligence patched'
  );
}


/*
|--------------------------------------------------------------------------
| FINAL HARD VALIDATION
|--------------------------------------------------------------------------
*/

const finalData =
  read(files.data);

const finalScore =
  read(files.score);

const finalAdapter =
  read(files.adapter);

const finalRoute =
  read(files.route);

const finalHistory =
  read(files.history);


function requireCheck(
  condition,
  message
) {
  if (!condition) {
    throw new Error(
      `VALIDATION FAILED: ${message}`
    );
  }

  console.log(
    `PASS: ${message}`
  );
}


requireCheck(
  !finalData.includes(
    'co.closing_rank >= CEIL($1 * 0.85)'
  ),
  'old 0.85 eligibility filter absent'
);


requireCheck(
  finalScore.includes(
    'R1_OPENING_TO_LAST_ROUND_CLOSING'
  ),
  'actual CW-REC scorer has new model'
);


requireCheck(
  finalScore.includes(
    'position <= 0.60'
  ),
  'Safe 60 percent window exists'
);


requireCheck(
  finalAdapter.includes(
    'row?.r1OpeningRank'
  ),
  'adapter passes R1 opening'
);


requireCheck(
  finalAdapter.includes(
    'row?.lastRoundClosingRank'
  ),
  'adapter passes final closing'
);


requireCheck(
  finalRoute.includes(
    'adapted.r1OpeningRank'
  ),
  'route uses R1 opening'
);


requireCheck(
  finalRoute.includes(
    'adapted.lastRoundClosingRank'
  ),
  'route uses final closing'
);


requireCheck(
  finalHistory.includes(
    'classifyAdmissionWindow('
  ),
  'Admission Intelligence uses same classifier'
);


console.log('');
console.log('============================================');
console.log('TRUMARG FINAL V2 PATCH SUCCESS');
console.log('============================================');
