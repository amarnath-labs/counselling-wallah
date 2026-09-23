import fs from 'fs';


const BASE =
  './data/neet/mcc/2024/parsed';


const rows =
  JSON.parse(
    fs.readFileSync(
      `${BASE}/round-1-rows.json`,
      'utf8'
    )
  );


const rejected =
  JSON.parse(
    fs.readFileSync(
      `${BASE}/round-1-rejected.json`,
      'utf8'
    )
  );


const orcr =
  JSON.parse(
    fs.readFileSync(
      `${BASE}/round-1-orcr.json`,
      'utf8'
    )
  );


const EXPECTED_ROWS =
  26109;


/*
|--------------------------------------------------------------------------
| SNo audit
|--------------------------------------------------------------------------
*/

const snoSet =
  new Set();


const duplicateSNo =
  [];


for (
  const row of
  rows
) {

  if (
    snoSet.has(
      row.sno
    )
  ) {

    duplicateSNo.push(
      row.sno
    );

  } else {

    snoSet.add(
      row.sno
    );
  }
}


const missingSNo =
  [];


for (
  let sno = 1;
  sno <=
    EXPECTED_ROWS;
  sno += 1
) {

  if (
    !snoSet.has(
      sno
    )
  ) {

    missingSNo.push(
      sno
    );
  }
}


/*
|--------------------------------------------------------------------------
| Decimal source-rank audit
|--------------------------------------------------------------------------
*/

const decimals =
  rows.filter(
    row =>
      String(
        row.rankRaw
      ).includes(
        '.'
      )
  );


const expectedDecimals = [
  '1.01',
  '1.02',
  '1.03',
  '1.04',
  '1.05',
  '1.06',
  '1.07',
  '1.08',
  '1.09',
  '1.1',
  '1.11',
  '1.12',
  '1.13',
  '1.14',
  '1.15',
  '1.16',
  '1.17',
];


const decimalRanksExact =
  decimals.length ===
    expectedDecimals.length &&
  decimals.every(
    (
      row,
      index
    ) =>
      row.rankRaw ===
        expectedDecimals[
          index
        ] &&
      row.sno ===
        index + 1
  );


/*
|--------------------------------------------------------------------------
| Field audit
|--------------------------------------------------------------------------
*/

const validCourses =
  new Set([
    'MBBS',
    'BDS',
    'B.Sc. Nursing',
  ]);


const validAllotted =
  new Set([
    'Open',
    'OBC',
    'EWS',
    'SC',
    'ST',

    'Open PwD',
    'OBC PwD',
    'EWS PwD',
    'SC PwD',
    'ST PwD',
  ]);


const invalidRows = [];


for (
  const row of
  rows
) {

  const problems = [];


  if (
    !row.quota
  ) {
    problems.push(
      'quota'
    );
  }


  if (
    !row.institute
  ) {
    problems.push(
      'institute'
    );
  }


  if (
    !validCourses.has(
      row.course
    )
  ) {
    problems.push(
      'course'
    );
  }


  if (
    !validAllotted.has(
      row.allottedCategory
    )
  ) {
    problems.push(
      'allottedCategory'
    );
  }


  if (
    !row.candidateCategory
  ) {
    problems.push(
      'candidateCategory'
    );
  }


  if (
    row.status !==
      'Allotted'
  ) {
    problems.push(
      'status'
    );
  }


  if (
    row.cwRank !==
      null &&
    (
      !Number.isInteger(
        row.cwRank
      ) ||
      row.cwRank <
        1
    )
  ) {
    problems.push(
      'cwRank'
    );
  }


  if (
    problems.length
  ) {

    invalidRows.push({
      sno:
        row.sno,

      rankRaw:
        row.rankRaw,

      problems,
    });
  }
}


/*
|--------------------------------------------------------------------------
| CW audit
|--------------------------------------------------------------------------
*/

const cwRows =
  rows.filter(
    row =>
      row.cwRank !==
      null
  );


const suspiciousCwRows =
  cwRows.filter(
    row =>
      !(
        row.quota.includes(
          'CW'
        ) ||
        row.quota.includes(
          'Children/Widows'
        )
      )
  );


/*
|--------------------------------------------------------------------------
| OR-CR audit
|--------------------------------------------------------------------------
*/

let totalORCRAllotments =
  0;


const malformedORCR =
  [];


for (
  const group of
  orcr
) {

  totalORCRAllotments +=
    Number(
      group.allotments ||
      0
    );


  const problems = [];


  if (
    !Number.isFinite(
      group.openingRank
    )
  ) {
    problems.push(
      'openingRank'
    );
  }


  if (
    !Number.isFinite(
      group.closingRank
    )
  ) {
    problems.push(
      'closingRank'
    );
  }


  if (
    group.openingRank >
      group.closingRank
  ) {
    problems.push(
      'opening>closing'
    );
  }


  if (
    !Number.isInteger(
      group.allotments
    ) ||
    group.allotments <
      1
  ) {
    problems.push(
      'allotments'
    );
  }


  if (
    problems.length
  ) {

    malformedORCR.push({
      institute:
        group.institute,

      course:
        group.course,

      quota:
        group.quota,

      category:
        group.category,

      problems,
    });
  }
}


/*
|--------------------------------------------------------------------------
| Final checks
|--------------------------------------------------------------------------
*/

const checks = {
  totalRows:
    rows.length,

  rejectedRows:
    rejected.length,

  firstSNo:
    rows[0]
      ?.sno ??
    null,

  lastSNo:
    rows[
      rows.length -
      1
    ]
      ?.sno ??
    null,

  firstRankRaw:
    rows[0]
      ?.rankRaw ??
    null,

  lastRankRaw:
    rows[
      rows.length -
      1
    ]
      ?.rankRaw ??
    null,

  duplicateSNo:
    duplicateSNo.length,

  missingSNo:
    missingSNo.length,

  decimalSourceRanks:
    decimals.length,

  decimalRanksExact,

  cwRankRows:
    cwRows.length,

  suspiciousCwRows:
    suspiciousCwRows.length,

  invalidRows:
    invalidRows.length,

  orcrGroups:
    orcr.length,

  totalORCRAllotments,

  orcrMatchesRows:
    totalORCRAllotments ===
      rows.length,

  malformedORCR:
    malformedORCR.length,
};


console.log(
  '\n========================================'
);

console.log(
  'NEET 2024 ROUND-1 FINAL AUDIT'
);

console.log(
  '========================================\n'
);


console.log(
  JSON.stringify(
    checks,
    null,
    2
  )
);


if (
  invalidRows.length
) {

  console.log(
    '\nINVALID ROWS'
  );

  console.table(
    invalidRows.slice(
      0,
      20
    )
  );
}


if (
  suspiciousCwRows.length
) {

  console.log(
    '\nSUSPICIOUS CW ROWS'
  );

  console.table(
    suspiciousCwRows.slice(
      0,
      20
    )
  );
}


if (
  malformedORCR.length
) {

  console.log(
    '\nMALFORMED OR-CR'
  );

  console.table(
    malformedORCR.slice(
      0,
      20
    )
  );
}


console.log(
  '\nFIRST 17 SOURCE RANKS'
);


console.table(
  rows
    .slice(
      0,
      17
    )
    .map(
      row => ({
        sno:
          row.sno,

        rankRaw:
          row.rankRaw,

        institute:
          row.institute,

        course:
          row.course,
      })
    )
);


const PASS =
  rows.length ===
    EXPECTED_ROWS &&

  rejected.length ===
    0 &&

  duplicateSNo.length ===
    0 &&

  missingSNo.length ===
    0 &&

  rows[0]
    ?.rankRaw ===
    '1.01' &&

  rows[
    rows.length -
    1
  ]
    ?.rankRaw ===
    '1394835' &&

  decimalRanksExact &&

  cwRows.length ===
    36 &&

  suspiciousCwRows.length ===
    0 &&

  invalidRows.length ===
    0 &&

  malformedORCR.length ===
    0 &&

  totalORCRAllotments ===
    rows.length;


console.log(
  '\n========================================'
);


if (
  PASS
) {

  console.log(
    'FINAL AUDIT PASSED'
  );

  console.log(
    'NEET 2024 ROUND 1 CAN BE FROZEN'
  );

} else {

  console.log(
    'FINAL AUDIT FAILED'
  );

  console.log(
    'DO NOT FREEZE ROUND 1 YET'
  );
}


console.log(
  '========================================'
);
