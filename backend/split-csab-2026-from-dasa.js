import fs from 'node:fs';

const INPUT =
  './csab-2026-all-rounds.json';

const EXPECTED_TOTAL =
  12237;

const EXPECTED_DASA =
  444;

const EXPECTED_CSAB =
  11793;

const EXPECTED_CSAB_ROUNDS = {
  '1': 7199,
  '2': 4594,
};


if (!fs.existsSync(INPUT)) {
  throw new Error(
    `Missing input file: ${INPUT}`
  );
}


const rows =
  JSON.parse(
    fs.readFileSync(
      INPUT,
      'utf8'
    )
  );


if (!Array.isArray(rows)) {
  throw new Error(
    'Input JSON must contain an array.'
  );
}


if (
  rows.length !==
  EXPECTED_TOTAL
) {
  throw new Error(
    `Expected ${EXPECTED_TOTAL} raw rows, got ${rows.length}`
  );
}


function normalize(value) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();
}


function isDasaRow(row) {

  const quota =
    normalize(
      row.quota
    );

  const program =
    normalize(
      row.academicProgram
    );


  const explicitQuota =
    /^DASA(?:-|[\s])?(?:CIWG|Non[\s-]?CIWG)$/i
      .test(quota);


  const programMarker =
    /\bfor\s+DASA(?:-|[\s])?(?:CIWG|Non[\s-]?CIWG)\b/i
      .test(program);


  return (
    explicitQuota ||
    programMarker
  );
}


function parseOfficialRank(value) {

  const raw =
    normalize(value);


  if (!raw) {
    return {
      raw,
      numeric: null,
      valid: false,
      scientific: false,
    };
  }


  const scientific =
    /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)[eE][+-]?\d+$/
      .test(raw);


  const number =
    Number(raw);


  if (!Number.isFinite(number)) {
    return {
      raw,
      numeric: null,
      valid: false,
      scientific,
    };
  }


  if (!Number.isInteger(number)) {
    return {
      raw,
      numeric: number,
      valid: false,
      scientific,
    };
  }


  return {
    raw,
    numeric: number,
    valid: true,
    scientific,
  };
}


const csabRows =
  [];

const dasaRows =
  [];


for (const row of rows) {

  if (isDasaRow(row)) {
    dasaRows.push(row);
  } else {
    csabRows.push(row);
  }
}


console.log(
  '\n========================================'
);

console.log(
  'CSAB 2026 / DASA SPLIT AUDIT'
);

console.log(
  '========================================'
);


console.log(
  'Raw rows:',
  rows.length
);

console.log(
  'CSAB-only rows:',
  csabRows.length
);

console.log(
  'DASA rows:',
  dasaRows.length
);


if (
  dasaRows.length !==
  EXPECTED_DASA
) {
  throw new Error(
    `Expected ${EXPECTED_DASA} DASA rows, got ${dasaRows.length}`
  );
}


if (
  csabRows.length !==
  EXPECTED_CSAB
) {
  throw new Error(
    `Expected ${EXPECTED_CSAB} CSAB rows, got ${csabRows.length}`
  );
}


if (
  csabRows.length +
  dasaRows.length !==
  rows.length
) {
  throw new Error(
    'Split integrity failed.'
  );
}


/*
|--------------------------------------------------------------------------
| ROUND COUNTS
|--------------------------------------------------------------------------
*/

const roundCounts =
  {};


for (const row of csabRows) {

  const key =
    String(row.round);

  roundCounts[key] =
    (
      roundCounts[key] ??
      0
    ) + 1;
}


console.log(
  '\nCSAB ROUND COUNTS'
);

console.table(
  Object.entries(
    roundCounts
  ).map(
    ([round, count]) => ({
      round,
      rows: count,
    })
  )
);


for (
  const [
    round,
    expected
  ]
  of Object.entries(
    EXPECTED_CSAB_ROUNDS
  )
) {

  if (
    roundCounts[round] !==
    expected
  ) {
    throw new Error(
      `Round ${round}: expected ${expected}, got ${roundCounts[round]}`
    );
  }
}


/*
|--------------------------------------------------------------------------
| VERIFY NO DASA MARKERS REMAIN
|--------------------------------------------------------------------------
*/

const remainingDasa =
  csabRows.filter(
    isDasaRow
  );


console.log(
  '\nDASA markers remaining in CSAB-only data:',
  remainingDasa.length
);


if (
  remainingDasa.length !==
  0
) {
  throw new Error(
    'DASA rows remain in CSAB-only dataset.'
  );
}


/*
|--------------------------------------------------------------------------
| QUOTA AUDIT
|--------------------------------------------------------------------------
*/

const quotaCounts =
  new Map();


for (const row of csabRows) {

  const quota =
    normalize(
      row.quota
    );

  quotaCounts.set(
    quota,
    (
      quotaCounts.get(
        quota
      ) ??
      0
    ) + 1
  );
}


console.log(
  '\nCSAB-ONLY QUOTAS'
);

console.table(
  [...quotaCounts.entries()]
    .sort(
      (a, b) =>
        b[1] - a[1]
    )
    .map(
      ([quota, count]) => ({
        quota,
        rows: count,
      })
    )
);


/*
|--------------------------------------------------------------------------
| RANK AUDIT
|--------------------------------------------------------------------------
*/

let invalidOpening =
  0;

let invalidClosing =
  0;

let scientificOpening =
  0;

let scientificClosing =
  0;


const normalizedCsab =
  csabRows.map(
    row => {

      const opening =
        parseOfficialRank(
          row.openingRank
        );

      const closing =
        parseOfficialRank(
          row.closingRank
        );


      if (!opening.valid) {
        invalidOpening += 1;
      }

      if (!closing.valid) {
        invalidClosing += 1;
      }

      if (opening.scientific) {
        scientificOpening += 1;
      }

      if (closing.scientific) {
        scientificClosing += 1;
      }


      return {
        ...row,

        openingRankRaw:
          opening.raw,

        closingRankRaw:
          closing.raw,

        openingRankNumeric:
          opening.numeric,

        closingRankNumeric:
          closing.numeric,
      };
    }
  );


console.log(
  '\nRANK AUDIT'
);

console.table([
  {
    metric: 'Invalid opening',
    rows: invalidOpening,
  },
  {
    metric: 'Invalid closing',
    rows: invalidClosing,
  },
  {
    metric: 'Scientific opening',
    rows: scientificOpening,
  },
  {
    metric: 'Scientific closing',
    rows: scientificClosing,
  },
]);


if (
  invalidOpening !== 0 ||
  invalidClosing !== 0
) {
  throw new Error(
    'One or more CSAB ranks could not be normalized to integers.'
  );
}


/*
|--------------------------------------------------------------------------
| DUPLICATE AUDIT
|--------------------------------------------------------------------------
*/

const identity =
  row =>
    [
      row.year,
      row.round,
      row.institute,
      row.academicProgram,
      row.quota,
      row.seatType,
      row.gender,
      row.openingRankNumeric,
      row.closingRankNumeric,
    ].join('||');


const keys =
  normalizedCsab.map(
    identity
  );


const unique =
  new Set(
    keys
  );


const duplicateRows =
  keys.length -
  unique.size;


console.log(
  '\nDuplicate CSAB rows:',
  duplicateRows
);


if (
  duplicateRows !==
  0
) {
  throw new Error(
    'Duplicate CSAB rows detected.'
  );
}


/*
|--------------------------------------------------------------------------
| SAVE SEPARATE FILES
|--------------------------------------------------------------------------
*/

fs.writeFileSync(
  './csab-2026-standard-only.json',
  JSON.stringify(
    normalizedCsab,
    null,
    2
  ),
  'utf8'
);


fs.writeFileSync(
  './dasa-2026-separated-from-csab-portal.json',
  JSON.stringify(
    dasaRows,
    null,
    2
  ),
  'utf8'
);


const audit = {
  year: 2026,

  rawRows:
    rows.length,

  csabRows:
    normalizedCsab.length,

  dasaRows:
    dasaRows.length,

  csabRoundCounts:
    roundCounts,

  remainingDasaMarkers:
    remainingDasa.length,

  duplicateCsabRows:
    duplicateRows,

  invalidOpening,

  invalidClosing,

  scientificOpening,

  scientificClosing,

  rawInputPreserved:
    true,

  databaseModified:
    false,

  generatedAt:
    new Date()
      .toISOString(),
};


fs.writeFileSync(
  './csab-2026-split-audit.json',
  JSON.stringify(
    audit,
    null,
    2
  ),
  'utf8'
);


console.log(
  '\n========================================'
);

console.log(
  'CSAB 2026 SPLIT PASSED'
);

console.log(
  '========================================'
);

console.log(
  'CSAB-only rows:',
  normalizedCsab.length
);

console.log(
  'DASA rows separated:',
  dasaRows.length
);

console.log(
  '\nSaved:'
);

console.log(
  './csab-2026-standard-only.json'
);

console.log(
  './dasa-2026-separated-from-csab-portal.json'
);

console.log(
  './csab-2026-split-audit.json'
);

console.log(
  '\nRAW OFFICIAL FILE WAS NOT OVERWRITTEN.'
);

console.log(
  'DATABASE WAS NOT MODIFIED.'
);