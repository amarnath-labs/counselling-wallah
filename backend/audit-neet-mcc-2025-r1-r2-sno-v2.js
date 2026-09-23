import fs from 'fs';


const BASE =
  './data/neet/mcc/2025/parsed';


function load(file) {
  return JSON.parse(
    fs.readFileSync(
      file,
      'utf8'
    )
  );
}


function auditRound(
  round,
  expectedLastSNo
) {

  const file =
    `${BASE}/round-${round}-rows.json`;

  const rows =
    load(file);


  const snoValues =
    rows
      .map(
        row =>
          Number(row.sno)
      )
      .filter(
        Number.isInteger
      );


  const counts =
    new Map();


  for (const sno of snoValues) {
    counts.set(
      sno,
      (counts.get(sno) || 0) + 1
    );
  }


  const duplicates =
    [...counts.entries()]
      .filter(
        ([, count]) =>
          count > 1
      )
      .map(
        ([sno, count]) => ({
          sno,
          count,
        })
      );


  const missing = [];


  for (
    let sno = 1;
    sno <= expectedLastSNo;
    sno += 1
  ) {

    if (
      !counts.has(sno)
    ) {

      missing.push(sno);
    }
  }


  const outOfRange =
    snoValues
      .filter(
        sno =>
          sno < 1 ||
          sno > expectedLastSNo
      );


  const uniqueSNo =
    counts.size;


  const expectedRows =
    expectedLastSNo;


  const arithmeticCheck =
    (
      uniqueSNo +
      missing.length
    ) ===
    expectedLastSNo;


  const complete =
    missing.length === 0 &&
    duplicates.length === 0 &&
    outOfRange.length === 0 &&
    uniqueSNo === expectedLastSNo;


  const report = {
    round,

    parsedRows:
      rows.length,

    validSNoRows:
      snoValues.length,

    uniqueSNo,

    expectedFirstSNo:
      1,

    expectedLastSNo,

    actualMinSNo:
      snoValues.length
        ? Math.min(...snoValues)
        : null,

    actualMaxSNo:
      snoValues.length
        ? Math.max(...snoValues)
        : null,

    missingCount:
      missing.length,

    missingSNo:
      missing,

    duplicateCount:
      duplicates.length,

    duplicates,

    outOfRangeCount:
      outOfRange.length,

    outOfRange:
      outOfRange.slice(0, 20),

    arithmeticCheck,

    complete,
  };


  console.log(
    `\n========================================`
  );

  console.log(
    `NEET MCC 2025 ROUND ${round} SNo AUDIT`
  );

  console.log(
    `========================================`
  );

  console.log(
    JSON.stringify(
      report,
      null,
      2
    )
  );


  /*
  |--------------------------------------------------------------------------
  | Show parsed neighbours around each missing SNo
  |--------------------------------------------------------------------------
  */

  if (missing.length) {

    console.log(
      '\nMISSING SNo NEIGHBOURS'
    );


    for (const target of missing) {

      console.log(
        `\n--- Missing SNo ${target} ---`
      );


      const neighbours =
        rows
          .filter(
            row => {
              const sno =
                Number(row.sno);

              return (
                sno >= target - 2 &&
                sno <= target + 2
              );
            }
          )
          .map(
            row => ({
              sno:
                row.sno,

              rankRaw:
                row.rankRaw ??
                row.rank ??
                null,

              status:
                row.round2?.status ??
                row.round1?.status ??
                row.status ??
                null,
            })
          );


      console.table(
        neighbours
      );
    }
  }


  return report;
}


const report = {
  /*
   * These are the source-visible terminal SNo values
   * already established in our earlier probes.
   */

  round1:
    auditRound(
      1,
      26608
    ),

  round2:
    auditRound(
      2,
      35551
    ),
};


fs.writeFileSync(
  './data/neet/mcc/2025/neet-mcc-2025-r1-r2-sno-audit-v2.json',
  JSON.stringify(
    report,
    null,
    2
  ),
  'utf8'
);


console.log(
  '\n========================================'
);

console.log(
  'SUMMARY'
);

console.log(
  '========================================'
);


console.table([
  {
    round:
      1,

    parsedRows:
      report.round1.parsedRows,

    expected:
      report.round1.expectedLastSNo,

    missing:
      report.round1.missingCount,

    duplicates:
      report.round1.duplicateCount,

    complete:
      report.round1.complete,
  },

  {
    round:
      2,

    parsedRows:
      report.round2.parsedRows,

    expected:
      report.round2.expectedLastSNo,

    missing:
      report.round2.missingCount,

    duplicates:
      report.round2.duplicateCount,

    complete:
      report.round2.complete,
  },
]);
