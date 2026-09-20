import fs from 'node:fs';

const file =
  './josaa-2026-all-rounds.json';

const data =
  JSON.parse(
    fs.readFileSync(
      file,
      'utf8'
    )
  );

const rows =
  Array.isArray(data.rows)
    ? data.rows
    : [];

const badOpening =
  rows.filter(
    row =>
      row.openingRankRaw &&
      row.openingRank === null
  );

const badClosing =
  rows.filter(
    row =>
      row.closingRankRaw &&
      row.closingRank === null
  );

function frequency(
  input,
  field
) {

  const map =
    new Map();

  for (
    const row
    of input
  ) {

    const value =
      String(
        row[field] ?? ''
      ).trim();

    map.set(
      value,
      (
        map.get(value) ||
        0
      ) + 1
    );
  }

  return [
    ...map.entries()
  ]
    .sort(
      (a, b) =>
        b[1] - a[1]
    )
    .map(
      ([value, count]) => ({
        value,
        count,
      })
    );
}

console.log(
  '\n========================================'
);

console.log(
  'NON-NUMERIC OPENING RANK VALUES'
);

console.log(
  '========================================'
);

console.table(
  frequency(
    badOpening,
    'openingRankRaw'
  )
);

console.log(
  '\n========================================'
);

console.log(
  'NON-NUMERIC CLOSING RANK VALUES'
);

console.log(
  '========================================'
);

console.table(
  frequency(
    badClosing,
    'closingRankRaw'
  )
);

console.log(
  '\nOPENING SAMPLE ROWS'
);

console.table(
  badOpening
    .slice(
      0,
      30
    )
    .map(
      row => ({
        round:
          row.round,

        institute:
          row.institute,

        program:
          row.academicProgram,

        quota:
          row.quota,

        seatType:
          row.seatType,

        gender:
          row.gender,

        openingRaw:
          row.openingRankRaw,

        closingRaw:
          row.closingRankRaw,
      })
    )
);

console.log(
  '\nCLOSING SAMPLE ROWS'
);

console.table(
  badClosing
    .slice(
      0,
      30
    )
    .map(
      row => ({
        round:
          row.round,

        institute:
          row.institute,

        program:
          row.academicProgram,

        quota:
          row.quota,

        seatType:
          row.seatType,

        gender:
          row.gender,

        openingRaw:
          row.openingRankRaw,

        closingRaw:
          row.closingRankRaw,
      })
    )
);

fs.writeFileSync(
  './josaa-2026-nonnumeric-audit.json',
  JSON.stringify(
    {
      openingCount:
        badOpening.length,

      closingCount:
        badClosing.length,

      openingValues:
        frequency(
          badOpening,
          'openingRankRaw'
        ),

      closingValues:
        frequency(
          badClosing,
          'closingRankRaw'
        ),

      openingSamples:
        badOpening.slice(
          0,
          100
        ),

      closingSamples:
        badClosing.slice(
          0,
          100
        ),
    },
    null,
    2
  ),
  'utf8'
);

console.log(
  '\nSaved: josaa-2026-nonnumeric-audit.json'
);
