import fs from 'fs';


const BASE =
  './data/neet/mcc/2024/parsed';


const rows =
  JSON.parse(
    fs.readFileSync(
      `${BASE}/round-3-rows.json`,
      'utf8'
    )
  );


const rejected =
  JSON.parse(
    fs.readFileSync(
      `${BASE}/round-3-rejected.json`,
      'utf8'
    )
  );


const orcr =
  JSON.parse(
    fs.readFileSync(
      `${BASE}/round-3-orcr.json`,
      'utf8'
    )
  );


const EXPECTED_TOTAL =
  36761;


const EXPECTED_STATUSES = {
  'Did not opt for Upgradation':
    12682,

  'Did not fill up fresh choices.':
    11027,

  'No Upgradation':
    4199,

  'Not Allotted':
    2271,

  'Upgraded':
    2536,

  'Fresh Allotted in 3nd Round':
    4046,
};


const EXPECTED_COURSES = {
  MBBS:
    5749,

  BDS:
    636,

  'B.Sc. Nursing':
    197,
};


/*
|--------------------------------------------------------------------------
| Rank integrity
|--------------------------------------------------------------------------
*/

const rankDrops = [];

const duplicateAdjacentRanks = [];


for (
  let i = 1;
  i < rows.length;
  i += 1
) {

  const previous =
    rows[i - 1];

  const current =
    rows[i];


  if (
    current.rank <
      previous.rank
  ) {

    rankDrops.push({
      previous:
        previous.rankRaw,

      current:
        current.rankRaw,
    });
  }


  if (
    current.rankRaw ===
      previous.rankRaw
  ) {

    duplicateAdjacentRanks.push({
      rankRaw:
        current.rankRaw,

      index:
        i,
    });
  }
}


/*
|--------------------------------------------------------------------------
| Decimal source ranks
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


const expected9743Point5Only =
  Boolean(
    anomaly9743
  );


/*
|--------------------------------------------------------------------------
| Status audit
|--------------------------------------------------------------------------
*/

function countBy(
  values
) {

  const out = {};


  for (
    const value of
    values
  ) {

    const key =
      String(
        value ?? 'NULL'
      );


    out[key] =
      (
        out[key] ||
        0
      ) +
      1;
  }


  return out;
}


const statusCounts =
  countBy(
    rows.map(
      row =>
        row.round3
          ?.status
    )
  );


const statusCountsExact =
  Object.entries(
    EXPECTED_STATUSES
  )
    .every(
      (
        [
          status,
          count
        ]
      ) =>
        statusCounts[
          status
        ] ===
        count
    );


const invalidStatuses =
  Object.keys(
    statusCounts
  )
    .filter(
      status =>
        !Object.prototype
          .hasOwnProperty.call(
            EXPECTED_STATUSES,
            status
          )
    );


/*
|--------------------------------------------------------------------------
| Seat consistency
|--------------------------------------------------------------------------
*/

const seatStatuses =
  new Set([
    'Upgraded',
    'Fresh Allotted in 3nd Round',
  ]);


const seatConsistencyErrors = [];

const invalidSeatFields = [];

const invalidNoSeatFields = [];


for (
  const row of
  rows
) {

  const r3 =
    row.round3;


  const expectedSeat =
    seatStatuses.has(
      r3.status
    );


  if (
    Boolean(
      r3.hasSeat
    ) !==
    expectedSeat
  ) {

    seatConsistencyErrors.push({
      rankRaw:
        row.rankRaw,

      status:
        r3.status,

      hasSeat:
        r3.hasSeat,
    });
  }


  if (
    r3.hasSeat
  ) {

    const problems = [];


    if (
      !r3.quota
    ) {
      problems.push(
        'quota'
      );
    }


    if (
      !r3.institute
    ) {
      problems.push(
        'institute'
      );
    }


    if (
      !r3.course
    ) {
      problems.push(
        'course'
      );
    }


    if (
      !r3.allottedCategory
    ) {
      problems.push(
        'allottedCategory'
      );
    }


    /*
     * candidateCategory may legitimately be null for
     * the special CW allocation row.
     */

    if (
      !Number.isInteger(
        r3.optionNo
      ) ||
      r3.optionNo <
        1
    ) {

      problems.push(
        'optionNo'
      );
    }


    if (
      problems.length
    ) {

      invalidSeatFields.push({
        rankRaw:
          row.rankRaw,

        problems,
      });
    }

  } else {

    const unexpected = [];


    for (
      const field of [
        'quota',
        'institute',
        'course',
        'allottedCategory',
        'candidateCategory',
        'optionNo',
        'cwRank',
      ]
    ) {

      if (
        r3[field] !==
          null
      ) {

        unexpected.push(
          field
        );
      }
    }


    if (
      unexpected.length
    ) {

      invalidNoSeatFields.push({
        rankRaw:
          row.rankRaw,

        unexpected,
      });
    }
  }
}


/*
|--------------------------------------------------------------------------
| Current seat counts
|--------------------------------------------------------------------------
*/

const currentSeats =
  rows.filter(
    row =>
      row.round3
        ?.hasSeat
  );


const rowsWithSeat =
  currentSeats.length;


const rowsWithoutSeat =
  rows.length -
  rowsWithSeat;


const courseCounts =
  countBy(
    currentSeats.map(
      row =>
        row.round3.course
    )
  );


const courseCountsExact =
  Object.entries(
    EXPECTED_COURSES
  )
    .every(
      (
        [
          course,
          count
        ]
      ) =>
        courseCounts[
          course
        ] ===
        count
    );


/*
|--------------------------------------------------------------------------
| Category integrity
|--------------------------------------------------------------------------
*/

const allowedAllottedCategories =
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


const allowedCandidateCategories =
  new Set([
    'General',
    'OBC',
    'EWS',
    'SC',
    'ST',
    'General PwD',
    'OBC PwD',
    'EWS PwD',
    'SC PwD',
    'ST PwD',
    null,
  ]);


const invalidAllottedCategories =
  currentSeats.filter(
    row =>
      !allowedAllottedCategories.has(
        row.round3
          .allottedCategory
      )
  );


const invalidCandidateCategories =
  currentSeats.filter(
    row =>
      !allowedCandidateCategories.has(
        row.round3
          .candidateCategory
      )
  );


/*
|--------------------------------------------------------------------------
| CW special row
|--------------------------------------------------------------------------
*/

const cwRows =
  currentSeats.filter(
    row =>
      Number.isInteger(
        row.round3
          .cwRank
      )
  );


const cwSpecialExact =
  cwRows.length ===
    1 &&

  cwRows[0]
    ?.rankRaw ===
    '73045' &&

  cwRows[0]
    ?.round3
    ?.cwRank ===
    18 &&

  cwRows[0]
    ?.round3
    ?.candidateCategory ===
    null &&

  cwRows[0]
    ?.round3
    ?.course ===
    'MBBS';


/*
|--------------------------------------------------------------------------
| Historical Round-1 / Round-2 consistency
|--------------------------------------------------------------------------
*/

const validHistoricalStatuses =
  new Set([
    'Reported',
    'Not Reported',
    'Seat Surrendered',
    'Seat Cancelled',
    null,
  ]);


const historicalErrors = [];


for (
  const row of
  rows
) {

  for (
    const roundName of
    [
      'round1',
      'round2',
    ]
  ) {

    const history =
      row[
        roundName
      ];


    if (
      !history
    ) {

      historicalErrors.push({
        rankRaw:
          row.rankRaw,

        round:
          roundName,

        problem:
          'missing-object',
      });

      continue;
    }


    if (
      !validHistoricalStatuses.has(
        history.status
      )
    ) {

      historicalErrors.push({
        rankRaw:
          row.rankRaw,

        round:
          roundName,

        problem:
          'invalid-status',

        status:
          history.status,
      });
    }


    if (
      history.hasSeat
    ) {

      const missing = [];


      if (
        !history.quota
      ) {
        missing.push(
          'quota'
        );
      }


      if (
        !history.institute
      ) {
        missing.push(
          'institute'
        );
      }


      if (
        !history.course
      ) {
        missing.push(
          'course'
        );
      }


      if (
        !history.status
      ) {
        missing.push(
          'status'
        );
      }


      if (
        missing.length
      ) {

        historicalErrors.push({
          rankRaw:
            row.rankRaw,

          round:
            roundName,

          problem:
            'missing-seat-fields',

          missing,
        });
      }

    } else {

      const unexpected =
        [
          'quota',
          'institute',
          'course',
          'status',
        ]
          .filter(
            field =>
              history[
                field
              ] !==
              null
          );


      if (
        unexpected.length
      ) {

        historicalErrors.push({
          rankRaw:
            row.rankRaw,

          round:
            roundName,

          problem:
            'unexpected-empty-round-fields',

          unexpected,
        });
      }
    }
  }
}


/*
|--------------------------------------------------------------------------
| OR-CR audit
|--------------------------------------------------------------------------
*/

let totalORCRAllotments =
  0;


const malformedORCR = [];


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

  rankDrops:
    rankDrops.length,

  duplicateAdjacentRanks:
    duplicateAdjacentRanks.length,

  decimalSourceRanks:
    decimalRows.length,

  decimalRanksExact,

  expected9743Point5Only,

  invalidStatuses:
    invalidStatuses.length,

  statusCountsExact,

  rowsWithSeat,

  rowsWithoutSeat,

  seatConsistencyErrors:
    seatConsistencyErrors.length,

  invalidSeatFields:
    invalidSeatFields.length,

  invalidNoSeatFields:
    invalidNoSeatFields.length,

  courseCountsExact,

  invalidAllottedCategories:
    invalidAllottedCategories.length,

  invalidCandidateCategories:
    invalidCandidateCategories.length,

  cwRankRows:
    cwRows.length,

  cwSpecialExact,

  historicalErrors:
    historicalErrors.length,

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
  'NEET 2024 ROUND-3 FINAL AUDIT'
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
  '\nROUND-3 STATUS COUNTS'
);


console.log(
  JSON.stringify(
    statusCounts,
    null,
    2
  )
);


console.log(
  '\nROUND-3 COURSE COUNTS'
);


console.log(
  JSON.stringify(
    courseCounts,
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
      rankRaw:
        row.rankRaw,

      status:
        row.round3
          ?.status,
    })
  )
);


console.log(
  '\nCW SPECIAL ROW'
);


console.dir(
  cwRows,
  {
    depth:
      null,
  }
);


const PASS =
  rows.length ===
    EXPECTED_TOTAL &&

  rejected.length ===
    0 &&

  rows[0]
    ?.rankRaw ===
    '1.01' &&

  rows.at(
    -1
  )
    ?.rankRaw ===
    '1395905' &&

  rankDrops.length ===
    0 &&

  duplicateAdjacentRanks.length ===
    0 &&

  decimalRows.length ===
    18 &&

  decimalRanksExact &&

  expected9743Point5Only &&

  invalidStatuses.length ===
    0 &&

  statusCountsExact &&

  rowsWithSeat ===
    6582 &&

  rowsWithoutSeat ===
    30179 &&

  seatConsistencyErrors.length ===
    0 &&

  invalidSeatFields.length ===
    0 &&

  invalidNoSeatFields.length ===
    0 &&

  courseCountsExact &&

  invalidAllottedCategories.length ===
    0 &&

  invalidCandidateCategories.length ===
    0 &&

  cwSpecialExact &&

  historicalErrors.length ===
    0 &&

  malformedORCR.length ===
    0 &&

  totalORCRAllotments ===
    6582;


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
    'NEET 2024 ROUND 3 CAN BE FROZEN'
  );

} else {

  console.log(
    'FINAL AUDIT FAILED'
  );

  console.log(
    'DO NOT FREEZE ROUND 3 YET'
  );
}


console.log(
  '========================================'
);
