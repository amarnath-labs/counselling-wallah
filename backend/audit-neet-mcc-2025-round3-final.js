import fs from 'fs';


const ROWS_FILE =
  './data/neet/mcc/2025/parsed/round-3-rows.json';

const REJECTED_FILE =
  './data/neet/mcc/2025/parsed/round-3-rejected.json';

const ORCR_FILE =
  './data/neet/mcc/2025/parsed/round-3-orcr.json';


const rows =
  JSON.parse(
    fs.readFileSync(
      ROWS_FILE,
      'utf8'
    )
  );


const rejected =
  JSON.parse(
    fs.readFileSync(
      REJECTED_FILE,
      'utf8'
    )
  );


const orcr =
  JSON.parse(
    fs.readFileSync(
      ORCR_FILE,
      'utf8'
    )
  );


const VALID_COURSES =
  new Set([
    'MBBS',
    'BDS',
    'B.Sc. Nursing',
  ]);


const VALID_ALLOTTED =
  new Set([
    'Open',
    'OBC',
    'SC',
    'EWS',
    'ST',
    'Open PwD',
    'OBC PwD',
    'SC PwD',
    'EWS PwD',
    'ST PwD',
  ]);


/*
|--------------------------------------------------------------------------
| Valid Round-3 status forms
|--------------------------------------------------------------------------
*/

function validRound3Status(
  status
) {

  const value =
    String(
      status ?? ''
    ).trim();


  return (
    value ===
      'Did not opt for Upgradation' ||

    value ===
      'Did not fill up fresh choices.' ||

    value ===
      'No Upgradation' ||

    value ===
      'Not Allotted' ||

    value ===
      'Upgraded' ||

    value ===
      'Fresh Allotted in 3nd Round' ||

    /^Fresh Allotted in 3nd Round\(\s*NRI Priority\s*:\s*[12]\s*\)$/.test(
      value
    ) ||

    /^Upgraded\(\s*NRI Priority\s*:\s*[12]\s*\)$/.test(
      value
    ) ||

    /^Fresh Allotted in 3nd Round\(\s*CW Rank\s*:\s*\d+\s*\)$/.test(
      value
    )
  );
}


function seatStatus(
  status
) {

  const value =
    String(
      status ?? ''
    );


  return (
    /^Fresh Allotted in 3nd Round/.test(
      value
    ) ||

    /^Upgraded(?:$|\()/.test(
      value
    )
  );
}


/*
|--------------------------------------------------------------------------
| Audit collections
|--------------------------------------------------------------------------
*/

const invalidStatuses = [];

const seatConsistencyErrors = [];

const invalidSeatFields = [];

const rankAnomalies = [];

const duplicateRankRaw = [];

const suspiciousStatusRows = [];

const malformedORCR = [];


const seenRankRaw =
  new Map();


for (
  const row of rows
) {

  const status =
    row.round3
      ?.status ??
    null;


  if (
    !validRound3Status(
      status
    )
  ) {

    invalidStatuses.push({
      rank:
        row.rank,

      rankRaw:
        row.rankRaw,

      status,
    });
  }


  const shouldHaveSeat =
    seatStatus(
      status
    );


  const hasSeat =
    row.round3
      ?.hasSeat ===
      true;


  if (
    shouldHaveSeat !==
    hasSeat
  ) {

    seatConsistencyErrors.push({
      rank:
        row.rank,

      rankRaw:
        row.rankRaw,

      status,

      hasSeat,

      shouldHaveSeat,
    });
  }


  if (
    hasSeat
  ) {

    const seat =
      row.round3;


    const problems = [];


    if (
      !seat.quota
    ) {
      problems.push(
        'quota'
      );
    }


    if (
      !seat.institute
    ) {
      problems.push(
        'institute'
      );
    }


    if (
      !VALID_COURSES.has(
        seat.course
      )
    ) {
      problems.push(
        'course'
      );
    }


    if (
      !VALID_ALLOTTED.has(
        seat.allottedCategory
      )
    ) {
      problems.push(
        'allottedCategory'
      );
    }


    if (
      !seat.candidateCategory
    ) {
      problems.push(
        'candidateCategory'
      );
    }


    if (
      !Number.isInteger(
        seat.optionNo
      ) ||
      seat.optionNo <
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
        rank:
          row.rank,

        rankRaw:
          row.rankRaw,

        problems,

        seat,
      });
    }
  }


  if (
    row.rankSourceAnomaly
  ) {

    rankAnomalies.push({
      rank:
        row.rank,

      rankRaw:
        row.rankRaw,

      status,
    });
  }


  const rankKey =
    String(
      row.rankRaw ??
      row.rank
    );


  if (
    seenRankRaw.has(
      rankKey
    )
  ) {

    duplicateRankRaw.push({
      rankRaw:
        rankKey,

      firstIndex:
        seenRankRaw.get(
          rankKey
        ),

      duplicateIndex:
        rows.indexOf(
          row
        ),
    });

  } else {

    seenRankRaw.set(
      rankKey,
      rows.indexOf(
        row
      )
    );
  }


  /*
   * Catch any future row accidentally swallowed
   * into a status string.
   */

  if (
    /\b\d{3,7}(?:\.\d+)?\b/.test(
      String(
        status
      )
        .replace(
          /NRI Priority\s*:\s*\d+/gi,
          ''
        )
        .replace(
          /CW Rank\s*:\s*\d+/gi,
          ''
        )
    )
  ) {

    suspiciousStatusRows.push({
      rank:
        row.rank,

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

for (
  const group of
  orcr
) {

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


const rowsWithSeat =
  rows.filter(
    row =>
      row.round3
        ?.hasSeat
  ).length;


const totalORCRAllotments =
  orcr.reduce(
    (
      sum,
      group
    ) =>
      sum +
      Number(
        group.allotments ||
        0
      ),
    0
  );


const expectedSourceAnomaly =
  (
    rankAnomalies.length ===
      1 &&
    rankAnomalies[0]
      .rankRaw ===
      '13767.5'
  );


const checks = {
  totalRows:
    rows.length,

  rejectedRows:
    rejected.length,

  firstRank:
    Math.min(
      ...rows.map(
        row =>
          row.rank
      )
    ),

  lastRank:
    Math.max(
      ...rows.map(
        row =>
          row.rank
      )
    ),

  rowsWithSeat,

  orcrGroups:
    orcr.length,

  totalORCRAllotments,

  orcrAllotmentsMatchSeatRows:
    totalORCRAllotments ===
    rowsWithSeat,

  invalidStatuses:
    invalidStatuses.length,

  suspiciousStatusRows:
    suspiciousStatusRows.length,

  seatConsistencyErrors:
    seatConsistencyErrors.length,

  invalidSeatFields:
    invalidSeatFields.length,

  duplicateRankRaw:
    duplicateRankRaw.length,

  sourceRankAnomalies:
    rankAnomalies.length,

  expected13767Point5Only:
    expectedSourceAnomaly,

  malformedORCR:
    malformedORCR.length,
};


console.log(
  '\n========================================'
);

console.log(
  'NEET 2025 ROUND-3 FINAL AUDIT'
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


console.log(
  '\nSOURCE RANK ANOMALIES'
);

console.table(
  rankAnomalies
);


if (
  invalidStatuses.length
) {
  console.log(
    '\nINVALID STATUSES'
  );

  console.table(
    invalidStatuses.slice(
      0,
      20
    )
  );
}


if (
  suspiciousStatusRows.length
) {
  console.log(
    '\nSUSPICIOUS STATUS ROWS'
  );

  console.table(
    suspiciousStatusRows.slice(
      0,
      20
    )
  );
}


if (
  seatConsistencyErrors.length
) {
  console.log(
    '\nSEAT/STATUS ERRORS'
  );

  console.table(
    seatConsistencyErrors.slice(
      0,
      20
    )
  );
}


if (
  invalidSeatFields.length
) {
  console.log(
    '\nINVALID SEAT FIELDS'
  );

  console.dir(
    invalidSeatFields.slice(
      0,
      10
    ),
    {
      depth:
        null,
    }
  );
}


if (
  duplicateRankRaw.length
) {
  console.log(
    '\nDUPLICATE SOURCE RANKS'
  );

  console.table(
    duplicateRankRaw.slice(
      0,
      20
    )
  );
}


if (
  malformedORCR.length
) {
  console.log(
    '\nMALFORMED OR-CR GROUPS'
  );

  console.table(
    malformedORCR.slice(
      0,
      20
    )
  );
}


const PASS =
  rows.length ===
    39479 &&

  rejected.length ===
    0 &&

  invalidStatuses.length ===
    0 &&

  suspiciousStatusRows.length ===
    0 &&

  seatConsistencyErrors.length ===
    0 &&

  invalidSeatFields.length ===
    0 &&

  duplicateRankRaw.length ===
    0 &&

  expectedSourceAnomaly &&

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
    'NEET 2025 ROUND 3 CAN BE FROZEN'
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
