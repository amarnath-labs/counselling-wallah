import fs from 'fs';


const FILE =
  './data/neet/mcc/2024/parsed/round-2-rejected.json';


const rejected =
  JSON.parse(
    fs.readFileSync(
      FILE,
      'utf8'
    )
  );


const reasonCounts = {};


for (
  const row of
  rejected
) {

  const reason =
    row.reason ??
    'UNKNOWN';


  reasonCounts[
    reason
  ] =
    (
      reasonCounts[
        reason
      ] ||
      0
    ) +
    1;
}


console.log(
  '\n========================================'
);

console.log(
  'NEET 2024 ROUND-2 REJECT DIAGNOSIS'
);

console.log(
  '========================================\n'
);


console.log({
  totalRejected:
    rejected.length,

  reasonCounts,
});


for (
  const [
    reason,
    count
  ] of
  Object.entries(
    reasonCounts
  )
) {

  console.log(
    `\n========================================`
  );

  console.log(
    `${reason}: ${count}`
  );

  console.log(
    `========================================`
  );


  const sample =
    rejected
      .filter(
        row =>
          row.reason ===
          reason
      )
      .slice(
        0,
        12
      );


  for (
    const row of
    sample
  ) {

    console.log(
      `\nSNo ${row.sno} | Rank ${row.rankRaw}`
    );


    console.log(
      'TEXT:',
      row.text ??
      row.joined ??
      ''
    );


    if (
      Array.isArray(
        row.rowLines
      )
    ) {

      console.log(
        'SOURCE LINES:'
      );


      row.rowLines
        .forEach(
          (
            line,
            index
          ) => {

            console.log(
              `${String(index).padStart(2, '0')}: ${line}`
            );
          }
        );
    }
  }
}


/*
|--------------------------------------------------------------------------
| Special inspection: current-seat parse failures
|--------------------------------------------------------------------------
*/

const seatFailures =
  rejected.filter(
    row =>
      row.reason ===
      'round2-seat-parse-failed'
  );


console.log(
  '\n========================================'
);

console.log(
  'ROUND-2 SEAT FAILURE TAILS'
);

console.log(
  '========================================\n'
);


console.log({
  count:
    seatFailures.length,
});


const tailCounts = {};


for (
  const row of
  seatFailures
) {

  const words =
    String(
      row.text ??
      ''
    )
      .split(/\s+/);


  const tail =
    words
      .slice(
        -30
      )
      .join(
        ' '
      );


  tailCounts[
    tail
  ] =
    (
      tailCounts[
        tail
      ] ||
      0
    ) +
    1;
}


console.log(
  JSON.stringify(
    Object.entries(
      tailCounts
    )
      .slice(
        0,
        40
      ),
    null,
    2
  )
);
