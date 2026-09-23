import fs from 'fs';


const BASE =
  './data/neet/mcc/2024/parsed';


const rows =
  JSON.parse(
    fs.readFileSync(
      `${BASE}/round-2-rows.json`,
      'utf8'
    )
  );


const rejected =
  JSON.parse(
    fs.readFileSync(
      `${BASE}/round-2-rejected.json`,
      'utf8'
    )
  );


const orcr =
  JSON.parse(
    fs.readFileSync(
      `${BASE}/round-2-orcr.json`,
      'utf8'
    )
  );


const EXPECTED_TOTAL =
  33890;


const EXPECTED_STATUSES = {
  'Did not opt for Upgradation':
    9117,

  'Did not fill up fresh choices.':
    3772,

  'Fresh Allotted in 2nd Round':
    11170,

  'Upgraded':
    1211,

  'No Upgradation':
    4800,

  'Not Allotted':
    3820,
};


/*
|--------------------------------------------------------------------------
| SNo continuity
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
    EXPECTED_TOTAL;
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

const decimalRows =
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
  '9743.5',
];


const actualDecimals =
  decimalRows.map(
    row =>
      row.rankRaw
  );


const decimalRanksExact =
  JSON.stringify(
    actualDecimals
  ) ===
  JSON.stringify(
    expectedDecimals
  );


const anomaly9743 =
  rows.find(
    row =>
      row.rankRaw ===
      '9743.5'
  );


const expected9743Anomaly =
  anomaly9743
    ?.sno ===
    6222;


/*
|--------------------------------------------------------------------------
| Round-2 status audit
|--------------------------------------------------------------------------
*/

const statusCounts = {};


for (
  const row of
  rows
) {

  const status =
    row.round2
      ?.status ??
    'NULL';


  statusCounts[
    status
  ] =
    (
      statusCounts[
        status
      ] ||
      0
    ) +
    1;
}


const invalidStatuses = [];


for (
  const [
    status,
    count
  ] of
  Object.entries(
    statusCounts
  )
) {

  if (
    !Object.prototype
      .hasOwnProperty.call(
        EXPECTED_STATUSES,
        status
      )
  ) {

    invalidStatuses.push({
      status,
      count,
    });
  }
}


const statusCountsExact =
  Object.entries(
    EXPECTED_STATUSES
  )
    .every(
      (
        [
          status,
          expected
        ]
      ) =>
        statusCounts[
          status
        ] ===
        expected
    );


/*
|--------------------------------------------------------------------------
| Seat/status consistency
|--------------------------------------------------------------------------
*/

const seatStatuses =
  new Set([
    'Fresh Allotted in 2nd Round',
    'Upgraded',
  ]);


const seatConsistencyErrors =
  [];


const invalidSeatFields =
  [];


for (
  const row of
  rows
) {

  const r2 =
    row.round2;


  const expectedSeat =
    seatStatuses.has(
      r2.status
    );


  if (
    Boolean(
      r2.hasSeat
    ) !==
    expectedSeat
  ) {

    seatConsistencyErrors.push({
      sno:
        row.sno,

      rankRaw:
        row.rankRaw,

      status:
        r2.status,

      hasSeat:
        r2.hasSeat,
    });
  }


  if (
    r2.hasSeat
  ) {

    const missing = [];


    if (
      !r2.quota
    ) {
      missing.push(
        'quota'
      );
    }


    if (
      !r2.institute
    ) {
      missing.push(
        'institute'
      );
    }


    if (
      !r2.course
    ) {
      missing.push(
        'course'
      );
    }


    if (
      !r2.allottedCategory
    ) {
      missing.push(
        'allottedCategory'
      );
    }


    if (
      !r2.candidateCategory
    ) {
      missing.push(
        'candidateCategory'
      );
    }


    if (
      !Number.isInteger(
        r2.optionNo
      ) ||
      r2.optionNo <
        1
    ) {
      missing.push(
        'optionNo'
      );
    }


    if (
      missing.length
    ) {

      invalidSeatFields.push({
        sno:
          row.sno,

        rankRaw:
          row.rankRaw,

        missing,
      });
    }
  }
}


/*
|--------------------------------------------------------------------------
| Seat counts
|--------------------------------------------------------------------------
*/

const rowsWithSeat =
  rows.filter(
    row =>
      row.round2
        ?.hasSeat
  ).length;


const rowsWithoutSeat =
  rows.length -
  rowsWithSeat;


/*
|--------------------------------------------------------------------------
| Historical Round-1 audit
|--------------------------------------------------------------------------
*/

const allowedR1Statuses =
  new Set([
    'Reported',
    'Not Reported',
    'Seat Surrendered',
    'Seat Cancelled',
    null,
  ]);


const invalidRound1Statuses =
  [];


for (
  const row of
  rows
) {

  const status =
    row.round1
      ?.status ??
    null;


  if (
    !allowedR1Statuses.has(
      status
    )
  ) {

    invalidRound1Statuses.push({
      sno:
        row.sno,

      rankRaw:
        row.rankRaw,

      status,
    });
  }
}


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
    !group.institute
  ) {
    problems.push(
      'institute'
    );
  }


  if (
    !group.course
  ) {
    problems.push(
      'course'
    );
  }


  if (
    !group.quota
  ) {
    problems.push(
      'quota'
    );
  }


  if (
    !group.category
  ) {
    problems.push(
      'category'
    );
  }


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
| Final report
|--------------------------------------------------------------------------
*/

const report = {
  totalRows:
    rows.length,

  rejectedRows:
    rejected.length,

  firstSNo:
    rows[0]
      ?.sno ??
    null,

  lastSNo:
    rows.at(
      -1
    )
      ?.sno ??
    null,

  firstRankRaw:
    rows[0]
      ?.rankRaw ??
    null,

  lastRankRaw:
    rows.at(
      -1
    )
      ?.rankRaw ??
    null,

  duplicateSNo:
    duplicateSNo.length,

  missingSNo:
    missingSNo.length,

  decimalSourceRanks:
    decimalRows.length,

  decimalRanksExact,

  expected9743Point5Only:
    expected9743Anomaly,

  invalidStatuses:
    invalidStatuses.length,

  statusCountsExact,

  rowsWithSeat,

  rowsWithoutSeat,

  seatConsistencyErrors:
    seatConsistencyErrors.length,

  invalidSeatFields:
    invalidSeatFields.length,

  invalidRound1Statuses:
    invalidRound1Statuses.length,

  orcrGroups:
    orcr.length,

  totalORCRAllotments,

  orcrAllotmentsMatchSeatRows:
    totalORCRAllotments ===
      rowsWithSeat,

  malformedORCR:
    malformedORCR.length,
};


console.log(
  '\n========================================'
);

console.log(
  'NEET 2024 ROUND-2 FINAL AUDIT'
);

console.log(
  '========================================\n'
);


console.log(
  JSON.stringify(
    report,
    null,
    2
  )
);


console.log(
  '\nROUND-2 STATUS COUNTS'
);


console.log(
  JSON.stringify(
    statusCounts,
    null,
    2
  )
);


console.log(
  '\nDECIMAL SOURCE RANKS'
);


console.table(
  decimalRows.map(
    row => ({
      sno:
        row.sno,

      rankRaw:
        row.rankRaw,

      status:
        row.round2
          ?.status,
    })
  )
);


const PASS =
  rows.length ===
    EXPECTED_TOTAL &&

  rejected.length ===
    0 &&

  duplicateSNo.length ===
    0 &&

  missingSNo.length ===
    0 &&

  rows[0]
    ?.rankRaw ===
    '1.01' &&

  rows.at(
    -1
  )
    ?.rankRaw ===
    '1395905' &&

  decimalRows.length ===
    18 &&

  decimalRanksExact &&

  expected9743Anomaly &&

  invalidStatuses.length ===
    0 &&

  statusCountsExact &&

  rowsWithSeat ===
    12381 &&

  rowsWithoutSeat ===
    21509 &&

  seatConsistencyErrors.length ===
    0 &&

  invalidSeatFields.length ===
    0 &&

  invalidRound1Statuses.length ===
    0 &&

  malformedORCR.length ===
    0 &&

  totalORCRAllotments ===
    rowsWithSeat;


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
    'NEET 2024 ROUND 2 CAN BE FROZEN'
  );

} else {

  console.log(
    'FINAL AUDIT FAILED'
  );

  console.log(
    'DO NOT FREEZE ROUND 2 YET'
  );
}


console.log(
  '========================================'
);
