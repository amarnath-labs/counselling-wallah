import fs from 'fs';
import path from 'path';

const FILE =
  path.resolve(
    './data/neet/mcc/2026/parsed/round-2-rejected.json'
  );

const OUT =
  path.resolve(
    './data/neet/mcc/2026/parsed/round-2-rejected-samples.txt'
  );

const rows =
  JSON.parse(
    fs.readFileSync(
      FILE,
      'utf8'
    )
  );


function clean(
  value
) {
  return String(
    value ?? ''
  )
    .replace(/\s+/g, ' ')
    .trim();
}


function printTokens(
  title,
  tokens
) {
  console.log(
    `\n${title}`
  );

  if (
    !Array.isArray(
      tokens
    )
  ) {
    console.log(
      '  <none>'
    );

    return;
  }

  tokens.forEach(
    (
      token,
      index
    ) => {
      console.log(
        `  ${String(
          index
        ).padStart(
          2,
          '0'
        )}: ${token}`
      );
    }
  );
}


const round1Fail =
  rows.filter(
    row =>
      row.reason ===
      'Could not parse Round 1 side.'
  );


const round2Fail =
  rows.filter(
    row =>
      row.reason ===
      'Could not parse Round 2 side.'
  );


const interestingRanks = new Set([
  8667,
  11196,
  16842,
  49241,
  51971,
  66813,
  110281,
  118549,
  130979,
  147152,
  198801,
  263119,
  365084,
  706841,
  806244,
  819022,
]);


const selected = [];


/*
 * First 15 Round-1 side failures
 */

selected.push(
  ...round1Fail.slice(
    0,
    15
  )
);


/*
 * First 20 Round-2 side failures
 */

selected.push(
  ...round2Fail.slice(
    0,
    20
  )
);


/*
 * Known special cases
 */

for (
  const row of rows
) {
  if (
    interestingRanks.has(
      row.rank
    ) &&
    !selected.includes(
      row
    )
  ) {
    selected.push(
      row
    );
  }
}


/*
 * Deduplicate by rank + reason
 */

const unique =
  [
    ...new Map(
      selected.map(
        row => [
          `${row.rank}::${row.reason}`,
          row,
        ]
      )
    ).values(),
  ];


const output = [];


const originalLog =
  console.log;


console.log = (
  ...args
) => {
  const line =
    args
      .map(
        value =>
          typeof value ===
          'string'
            ? value
            : JSON.stringify(
                value
              )
      )
      .join(
        ' '
      );

  output.push(
    line
  );

  originalLog(
    ...args
  );
};


console.log(
  '========================================'
);

console.log(
  'ROUND 2 REJECTED SAMPLE INSPECTION'
);

console.log(
  '========================================'
);

console.log(
  `Total rejected: ${rows.length}`
);

console.log(
  `Round-1 side failures: ${round1Fail.length}`
);

console.log(
  `Round-2 side failures: ${round2Fail.length}`
);


for (
  const row of unique
) {
  console.log(
    '\n\n========================================'
  );

  console.log(
    `RANK: ${row.rank}`
  );

  console.log(
    `REASON: ${row.reason}`
  );


  if (
    row.previous
  ) {
    console.log(
      `PREVIOUS PARSED: ${JSON.stringify(
        row.previous,
        null,
        2
      )}`
    );
  }


  printTokens(
    'FULL BLOCK:',
    row.block
  );


  printTokens(
    'CURRENT TOKENS:',
    row.currentTokens
  );
}


fs.writeFileSync(
  OUT,
  output.join(
    '\n'
  ),
  'utf8'
);


console.log(
  `\nSaved: ${OUT}`
);
