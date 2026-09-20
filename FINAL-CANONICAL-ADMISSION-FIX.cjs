const fs = require('fs');
const path = require('path');

const root = process.cwd();

const dataFile = path.join(
  root,
  'backend/src/services/cwRecDataV1.js'
);

const routeFile = path.join(
  root,
  'backend/src/routes/cwRecV1-dev.js'
);

const frontendFile = path.join(
  root,
  'frontend/src/components/RecommendationSlide.jsx'
);

function read(file) {
  if (!fs.existsSync(file)) {
    throw new Error(`File not found: ${file}`);
  }

  return fs
    .readFileSync(file, 'utf8')
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n');
}

function write(file, content) {
  fs.writeFileSync(
    file,
    content,
    'utf8'
  );
}

function backup(file) {
  const target =
    `${file}.canonical-${Date.now()}.bak`;

  fs.copyFileSync(
    file,
    target
  );

  console.log(
    `BACKUP: ${path.basename(file)}`
  );
}


/*
|--------------------------------------------------------------------------
| BACKUPS
|--------------------------------------------------------------------------
*/

backup(dataFile);
backup(routeFile);

if (
  fs.existsSync(frontendFile)
) {
  backup(frontendFile);
}


/*
|--------------------------------------------------------------------------
| 1. DATA SERVICE
|--------------------------------------------------------------------------
|
| Replace ONLY buildHistoricalAdmissionFit with the final canonical rule.
|
|--------------------------------------------------------------------------
*/

let data =
  read(dataFile);


function replaceNamedFunction(
  source,
  name,
  replacement
) {
  const start =
    source.indexOf(
      `function ${name}(`
    );

  if (start === -1) {
    throw new Error(
      `${name} not found`
    );
  }

  const firstBrace =
    source.indexOf(
      '{',
      start
    );

  if (firstBrace === -1) {
    throw new Error(
      `${name}: opening brace not found`
    );
  }

  let depth = 0;
  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (
    let i = firstBrace;
    i < source.length;
    i++
  ) {
    const c = source[i];
    const n = source[i + 1];

    if (lineComment) {
      if (c === '\n') {
        lineComment = false;
      }

      continue;
    }

    if (blockComment) {
      if (
        c === '*' &&
        n === '/'
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

      if (c === '\\') {
        escaped = true;
        continue;
      }

      if (c === quote) {
        quote = null;
      }

      continue;
    }

    if (
      c === '/' &&
      n === '/'
    ) {
      lineComment = true;
      i++;
      continue;
    }

    if (
      c === '/' &&
      n === '*'
    ) {
      blockComment = true;
      i++;
      continue;
    }

    if (
      c === "'" ||
      c === '"' ||
      c === '`'
    ) {
      quote = c;
      continue;
    }

    if (c === '{') {
      depth++;
    }

    else if (c === '}') {
      depth--;

      if (depth === 0) {
        return (
          source.slice(
            0,
            start
          ) +

          replacement +

          source.slice(
            i + 1
          )
        );
      }
    }
  }

  throw new Error(
    `${name}: closing brace not found`
  );
}


const finalClassifier =
`function buildHistoricalAdmissionFit({
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


  /*
  |--------------------------------------------------------------------------
  | NO DATA
  |--------------------------------------------------------------------------
  */

  if (
    rank === null ||
    opening === null ||
    closing === null ||
    opening <= 0 ||
    closing <= 0
  ) {
    return {
      bucket:
        'Admission data pending',

      key:
        null,

      label:
        'Admission data pending',

      position:
        null,

      r1OpeningRank:
        opening,

      lastRoundClosingRank:
        closing,
    };
  }


  /*
  |--------------------------------------------------------------------------
  | INVALID / SINGLE-RANK WINDOW
  |--------------------------------------------------------------------------
  */

  if (
    closing <= opening
  ) {
    if (
      rank <= closing
    ) {
      return {
        bucket:
          'Safe',

        key:
          'safe',

        label:
          'Safe',

        position:
          0,

        r1OpeningRank:
          opening,

        lastRoundClosingRank:
          closing,
      };
    }


    return {
      bucket:
        'Dream',

      key:
        'dream',

      label:
        'Dream',

      position:
        null,

      r1OpeningRank:
        opening,

      lastRoundClosingRank:
        closing,
    };
  }


  /*
  |--------------------------------------------------------------------------
  | ROUND-1 OPENING -> LAST-ROUND CLOSING
  |--------------------------------------------------------------------------
  */


  const position =
    (
      rank -
      opening
    ) /
    (
      closing -
      opening
    );


  /*
  |--------------------------------------------------------------------------
  | BACKUP
  |--------------------------------------------------------------------------
  |
  | Rank is as good as / better than the Round-1 opening rank.
  |
  */

  if (
    rank <= opening
  ) {
    return {
      bucket:
        'Backup',

      key:
        'backup',

      label:
        'Backup',

      position,

      r1OpeningRank:
        opening,

      lastRoundClosingRank:
        closing,
    };
  }


  /*
  |--------------------------------------------------------------------------
  | SAFE
  |--------------------------------------------------------------------------
  |
  | First 60% of the historical admission window.
  |
  */

  if (
    position <= 0.60
  ) {
    return {
      bucket:
        'Safe',

      key:
        'safe',

      label:
        'Safe',

      position,

      r1OpeningRank:
        opening,

      lastRoundClosingRank:
        closing,
    };
  }


  /*
  |--------------------------------------------------------------------------
  | TARGET
  |--------------------------------------------------------------------------
  |
  | Remaining admitted historical window.
  |
  */

  if (
    rank <= closing
  ) {
    return {
      bucket:
        'Target',

      key:
        'target',

      label:
        'Target',

      position,

      r1OpeningRank:
        opening,

      lastRoundClosingRank:
        closing,
    };
  }


  /*
  |--------------------------------------------------------------------------
  | DREAM
  |--------------------------------------------------------------------------
  |
  | Student rank is beyond the final historical closing rank.
  |
  */

  return {
    bucket:
      'Dream',

    key:
      'dream',

    label:
      'Dream',

    position,

    r1OpeningRank:
      opening,

    lastRoundClosingRank:
      closing,
  };
}`;


data =
  replaceNamedFunction(
    data,
    'buildHistoricalAdmissionFit',
    finalClassifier
  );


/*
|--------------------------------------------------------------------------
| REMOVE OLD 0.85 SQL ELIGIBILITY FILTER
|--------------------------------------------------------------------------
*/

data =
  data.replace(
    /\s+AND\s+co\.closing_rank\s*>=\s*CEIL\(\$1\s*\*\s*0\.85\)/g,
    ''
  );


if (
  data.includes(
    'co.closing_rank >= CEIL($1 * 0.85)'
  )
) {
  throw new Error(
    'Old 0.85 SQL filter still exists'
  );
}


write(
  dataFile,
  data
);

console.log(
  'PASS 1: canonical R1 -> final classifier installed'
);


/*
|--------------------------------------------------------------------------
| 2. ROUTE OUTPUT
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| The recommendation route currently spreads ...scoring.
| That scoring object may contain an old admission bucket.
|
| We therefore FORCE the canonical row.bucket AFTER ...scoring.
|
|--------------------------------------------------------------------------
*/

let route =
  read(routeFile);


/*
| Remove a previously inserted canonical block if one exists.
| This makes patch repeat-safe.
*/

route =
  route.replace(
    /\n\s*\/\*\s*-+\s*\|\s*CANONICAL ADMISSION BUCKET[\s\S]*?(?=\n\s*scoringVersion:)/g,
    '\n'
  );


const scoringMarker =
`              ...scoring,

              scoringVersion:
                CWREC_VERSION,`;


if (
  !route.includes(
    scoringMarker
  )
) {
  throw new Error(
    'Recommendation result scoring marker not found'
  );
}


const canonicalOutput =
`              ...scoring,


              /*
              |--------------------------------------------------------------------------
              | CANONICAL ADMISSION RESULT
              |--------------------------------------------------------------------------
              |
              | SOURCE OF TRUTH:
              |
              | Round 1 opening rank
              |         ->
              | Last available round closing rank
              |
              */


              bucket:
                row?.bucket ??
                row?.admission?.bucket ??
                'Admission data pending',


              admissionBucket: {

                key:
                  String(
                    row?.bucket ??
                    row?.admission?.bucket ??
                    ''
                  )
                    .trim()
                    .toLowerCase(),

                label:
                  row?.bucket ??
                  row?.admission?.label ??
                  row?.admission?.bucket ??
                  'Admission data pending',

              },


              admission: {

                ...(
                  scoring?.admission ||
                  {}
                ),

                ...(
                  row?.admission ||
                  {}
                ),


                bucket:
                  row?.bucket ??
                  row?.admission?.bucket ??
                  'Admission data pending',


                label:
                  row?.bucket ??
                  row?.admission?.label ??
                  row?.admission?.bucket ??
                  'Admission data pending',


                r1OpeningRank:
                  row?.r1OpeningRank ??
                  row?.historicalFit?.r1OpeningRank ??
                  row?.admission?.r1OpeningRank ??
                  null,


                lastRoundClosingRank:
                  row?.lastRoundClosingRank ??
                  row?.historicalFit?.lastRoundClosingRank ??
                  row?.admission?.lastRoundClosingRank ??
                  null,


                historicalPosition:
                  row?.historicalFit?.position ??
                  row?.admission?.historicalPosition ??
                  null,


                admissionModel:
                  'R1_OPENING_TO_LAST_ROUND_CLOSING',

              },


              historicalFit: {

                ...(
                  row?.historicalFit ||
                  {}
                ),


                bucket:
                  row?.bucket ??
                  row?.historicalFit?.bucket ??
                  row?.admission?.bucket ??
                  'Admission data pending',


                label:
                  row?.bucket ??
                  row?.historicalFit?.label ??
                  row?.admission?.label ??
                  'Admission data pending',

              },


              scoringVersion:
                CWREC_VERSION,`;


route =
  route.replace(
    scoringMarker,
    canonicalOutput
  );


write(
  routeFile,
  route
);


console.log(
  'PASS 2: recommendation output forced to canonical bucket'
);


/*
|--------------------------------------------------------------------------
| 3. FRONTEND
|--------------------------------------------------------------------------
|
| Top JoSAA Match must use canonical backend bucket first.
|
|--------------------------------------------------------------------------
*/

if (
  fs.existsSync(
    frontendFile
  )
) {
  let frontend =
    read(frontendFile);


  const admissionStart =
    frontend.indexOf(
      'const admission ='
    );


  if (
    admissionStart !== -1
  ) {
    const admissionEnd =
      frontend.indexOf(
        "'Admission fit';",
        admissionStart
      );


    if (
      admissionEnd !== -1 &&
      admissionEnd -
        admissionStart <
        1000
    ) {
      const end =
        admissionEnd +
        "'Admission fit';".length;


      frontend =
        frontend.slice(
          0,
          admissionStart
        ) +

`const admission =
    row?.bucket ||
    row?.admission?.bucket ||
    row?.admission?.label ||
    row?.historicalFit?.bucket ||
    row?.historicalFit?.label ||
    premium?.admissionBucket?.label ||
    premium?.admissionBucket ||
    'Admission fit';` +

        frontend.slice(
          end
        );
    }
  }


  /*
  |--------------------------------------------------------------------------
  | Grouping source
  |--------------------------------------------------------------------------
  */

  frontend =
    frontend.replace(
      /row\?\.premium\s*\?\.\s*admissionBucket\s*\?\.\s*key\s*\|\|\s*row\?\.bucket/g,
      'row?.bucket || row?.premium?.admissionBucket?.key'
    );


  write(
    frontendFile,
    frontend
  );


  console.log(
    'PASS 3: frontend uses canonical backend bucket first'
  );
}


/*
|--------------------------------------------------------------------------
| FINAL VALIDATION
|--------------------------------------------------------------------------
*/

const finalData =
  read(dataFile);

const finalRoute =
  read(routeFile);


const checks = [
  [
    finalData.includes(
      'function buildHistoricalAdmissionFit({'
    ),
    'historical classifier exists',
  ],

  [
    finalData.includes(
      'position <= 0.60'
    ),
    'Safe boundary = 60%',
  ],

  [
    !finalData.includes(
      'co.closing_rank >= CEIL($1 * 0.85)'
    ),
    'old rank pre-filter removed',
  ],

  [
    finalRoute.includes(
      "admissionModel:\n                  'R1_OPENING_TO_LAST_ROUND_CLOSING'"
    ),
    'route marks canonical admission model',
  ],

  [
    finalRoute.includes(
      'bucket:\n                row?.bucket'
    ),
    'route returns canonical row.bucket',
  ],
];


for (
  const [
    passed,
    label,
  ]
  of checks
) {
  if (!passed) {
    throw new Error(
      `FINAL CHECK FAILED: ${label}`
    );
  }

  console.log(
    `PASS: ${label}`
  );
}


console.log('');
console.log('===========================================');
console.log('CANONICAL ADMISSION IMPLEMENTATION COMPLETE');
console.log('===========================================');
