import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const BASE =
  path.resolve(
    './data/neet/mcc/2025'
  );

const PARSED =
  path.join(
    BASE,
    'parsed'
  );

const sha256 = file =>
  crypto
    .createHash('sha256')
    .update(
      fs.readFileSync(file)
    )
    .digest('hex');

const readJson = file =>
  JSON.parse(
    fs.readFileSync(
      file,
      'utf8'
    )
  );

const normalizeRows = payload =>
  Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.rows)
      ? payload.rows
      : Array.isArray(payload?.data)
        ? payload.data
        : [];


const requiredFiles = [
  'round-1-rows.json',
  'round-2-rows.json',
  'round-3-rows.json',

  'round-1-orcr.json',
  'round-2-orcr.json',
  'round-3-orcr.json',

  'stray-orcr.json',
  'special-stray-orcr.json',
];


for (const name of requiredFiles) {

  const file =
    path.join(
      PARSED,
      name
    );

  if (!fs.existsSync(file)) {
    throw new Error(
      `Required freeze file missing: ${name}`
    );
  }
}


const expected = {
  rows: {
    'round-1-rows.json':
      26608,

    'round-2-rows.json':
      35551,

    'round-3-rows.json':
      39479,
  },

  orcr: {
    'round-1-orcr.json':
      3113,

    'round-2-orcr.json':
      2838,

    'round-3-orcr.json':
      2439,

    'stray-orcr.json':
      617,

    'special-stray-orcr.json':
      173,
  },
};


const checks = [];


/*
|--------------------------------------------------------------------------
| ROW COUNTS
|--------------------------------------------------------------------------
*/

for (
  const [
    name,
    expectedCount
  ] of
  Object.entries(
    expected.rows
  )
) {

  const file =
    path.join(
      PARSED,
      name
    );

  const rows =
    normalizeRows(
      readJson(file)
    );

  checks.push({
    check:
      `${name} count`,

    expected:
      expectedCount,

    actual:
      rows.length,

    passed:
      rows.length ===
      expectedCount,
  });
}


/*
|--------------------------------------------------------------------------
| ORCR COUNTS
|--------------------------------------------------------------------------
*/

for (
  const [
    name,
    expectedCount
  ] of
  Object.entries(
    expected.orcr
  )
) {

  const file =
    path.join(
      PARSED,
      name
    );

  const rows =
    normalizeRows(
      readJson(file)
    );

  checks.push({
    check:
      `${name} count`,

    expected:
      expectedCount,

    actual:
      rows.length,

    passed:
      rows.length ===
      expectedCount,
  });
}


/*
|--------------------------------------------------------------------------
| R1 / R2 SNo CONTINUITY
|--------------------------------------------------------------------------
*/

function continuity(
  fileName,
  expectedLast
) {

  const rows =
    normalizeRows(
      readJson(
        path.join(
          PARSED,
          fileName
        )
      )
    );

  const snos =
    rows
      .map(
        row =>
          Number(
            row?.sno ??
            row?.sNo ??
            row?.serialNumber
          )
      )
      .filter(
        Number.isInteger
      );

  const set =
    new Set(snos);

  const missing = [];

  for (
    let sno = 1;
    sno <= expectedLast;
    sno += 1
  ) {

    if (!set.has(sno)) {
      missing.push(sno);
    }
  }

  return {
    rows:
      rows.length,

    unique:
      set.size,

    expectedLast,

    missing,

    complete:
      rows.length ===
        expectedLast &&
      set.size ===
        expectedLast &&
      missing.length ===
        0,
  };
}


const r1 =
  continuity(
    'round-1-rows.json',
    26608
  );

const r2 =
  continuity(
    'round-2-rows.json',
    35551
  );


checks.push({
  check:
    'Round 1 continuity',

  expected:
    true,

  actual:
    r1.complete,

  passed:
    r1.complete,
});


checks.push({
  check:
    'Round 2 continuity',

  expected:
    true,

  actual:
    r2.complete,

  passed:
    r2.complete,
});


/*
|--------------------------------------------------------------------------
| REJECT FILES, IF PRESENT, MUST BE ZERO
|--------------------------------------------------------------------------
*/

const rejectFiles =
  fs.readdirSync(PARSED)
    .filter(
      name =>
        /reject/i.test(name) &&
        name.endsWith('.json')
    );


const rejectSummary = [];


for (const name of rejectFiles) {

  const rows =
    normalizeRows(
      readJson(
        path.join(
          PARSED,
          name
        )
      )
    );

  rejectSummary.push({
    file:
      name,

    count:
      rows.length,
  });

  checks.push({
    check:
      `${name} zero`,

    expected:
      0,

    actual:
      rows.length,

    passed:
      rows.length === 0,
  });
}


/*
|--------------------------------------------------------------------------
| HASH ALL 2025 PARSED JSON FILES
|--------------------------------------------------------------------------
*/

const files =
  fs.readdirSync(PARSED)
    .filter(
      name =>
        name.endsWith('.json')
    )
    .sort()
    .map(
      name => {

        const file =
          path.join(
            PARSED,
            name
          );

        return {
          name,

          bytes:
            fs.statSync(file).size,

          sha256:
            sha256(file),
        };
      }
    );


const validationPassed =
  checks.every(
    item =>
      item.passed
  );


const manifest = {
  exam:
    'NEET UG',

  counselling:
    'MCC',

  year:
    2025,

  status:
    validationPassed
      ? 'complete-frozen'
      : 'validation-failed',

  frozenAt:
    new Date().toISOString(),

  validationPassed,

  continuity: {
    round1:
      r1,

    round2:
      r2,
  },

  expectedCounts:
    expected,

  rejectFiles:
    rejectSummary,

  checks,

  files,
};


const output =
  path.join(
    BASE,
    'neet-mcc-2025-freeze-manifest.json'
  );


fs.writeFileSync(
  output,
  JSON.stringify(
    manifest,
    null,
    2
  ),
  'utf8'
);


console.log(
  '\n========================================'
);

console.log(
  'NEET MCC 2025 FREEZE MANIFEST'
);

console.log(
  '========================================\n'
);


console.table(checks);


console.log(
  '\nCONTINUITY'
);

console.log(
  JSON.stringify(
    manifest.continuity,
    null,
    2
  )
);


console.log(
  '\nFILES HASHED:',
  files.length
);


console.log(
  'MANIFEST:',
  path.relative(
    process.cwd(),
    output
  )
);


if (!validationPassed) {

  console.log(
    '\n========================================'
  );

  console.log(
    '2025 FREEZE FAILED'
  );

  console.log(
    '========================================'
  );

  process.exitCode = 1;

} else {

  console.log(
    '\n========================================'
  );

  console.log(
    'NEET MCC 2025 FULL YEAR FROZEN'
  );

  console.log(
    '========================================'
  );
}
