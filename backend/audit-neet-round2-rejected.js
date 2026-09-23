import fs from 'fs';
import path from 'path';

const FILE =
  path.resolve(
    './data/neet/mcc/2026/parsed/round-2-rejected.json'
  );

const OUT =
  path.resolve(
    './data/neet/mcc/2026/parsed/round-2-rejected-audit.json'
  );


const rows =
  JSON.parse(
    fs.readFileSync(
      FILE,
      'utf8'
    )
  );


function normalize(
  value
) {
  return String(
    value ?? ''
  )
    .replace(
      /\s+/g,
      ' '
    )
    .trim();
}


function countBy(
  values,
  getter
) {
  const map =
    new Map();


  for (
    const value of values
  ) {
    const key =
      normalize(
        getter(
          value
        ) ||
        'UNKNOWN'
      );


    map.set(
      key,
      (
        map.get(
          key
        ) ||
        0
      ) +
      1
    );
  }


  return [
    ...map.entries(),
  ]
    .map(
      ([name, count]) => ({
        name,
        count,
      })
    )
    .sort(
      (
        a,
        b
      ) =>
        b.count -
        a.count
    );
}


const reasonCounts =
  countBy(
    rows,
    row =>
      row.reason
  );


const firstTokenCounts =
  countBy(
    rows,
    row =>
      row.block?.[0]
  );


const currentFirstTokenCounts =
  countBy(
    rows.filter(
      row =>
        Array.isArray(
          row.currentTokens
        )
    ),
    row =>
      row.currentTokens?.[0]
  );


const samplesByReason = {};


for (
  const row of rows
) {
  const reason =
    normalize(
      row.reason ||
      'UNKNOWN'
    );


  if (
    !samplesByReason[
      reason
    ]
  ) {
    samplesByReason[
      reason
    ] = [];
  }


  if (
    samplesByReason[
      reason
    ].length <
    20
  ) {
    samplesByReason[
      reason
    ].push({
      rank:
        row.rank,

      previous:
        row.previous ||
        null,

      block:
        row.block ||
        null,

      currentTokens:
        row.currentTokens ||
        null,
    });
  }
}


const suspiciousTokens = [
  'Converted',
  'Changed',
  'Cancelled',
  'Resigned',
  'Joined',
  'Not Joined',
  'Not reported',
  'Not Reported',
  'Seat Surrendered',
  'Fresh',
  'Allotted',
  'Retained',
  'Upgraded',
  'PwD',
  'NRI',
];


const tokenHits = {};


for (
  const token of suspiciousTokens
) {
  const matches =
    rows.filter(
      row =>
        normalize(
          JSON.stringify(
            row
          )
        )
          .toLowerCase()
          .includes(
            token.toLowerCase()
          )
    );


  tokenHits[
    token
  ] = {
    count:
      matches.length,

    sampleRanks:
      matches
        .slice(
          0,
          20
        )
        .map(
          row =>
            row.rank
        ),
  };
}


const report = {
  rejectedRows:
    rows.length,

  reasonCounts,

  firstTokenCounts:
    firstTokenCounts.slice(
      0,
      30
    ),

  currentFirstTokenCounts:
    currentFirstTokenCounts.slice(
      0,
      30
    ),

  tokenHits,

  samplesByReason,
};


fs.writeFileSync(
  OUT,
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
  'ROUND 2 REJECTED AUDIT'
);

console.log(
  '========================================'
);


console.log(
  `Rejected rows: ${rows.length}`
);


console.log(
  '\nREASONS'
);

console.table(
  reasonCounts
);


console.log(
  '\nFIRST TOKENS'
);

console.table(
  firstTokenCounts.slice(
    0,
    20
  )
);


console.log(
  '\nCURRENT-SIDE FIRST TOKENS'
);

console.table(
  currentFirstTokenCounts.slice(
    0,
    20
  )
);


console.log(
  '\nTOKEN HITS'
);

console.table(
  Object.entries(
    tokenHits
  )
    .map(
      (
        [
          name,
          data
        ]
      ) => ({
        token:
          name,

        count:
          data.count,

        sampleRanks:
          data.sampleRanks
            .slice(
              0,
              8
            )
            .join(
              ', '
            ),
      })
    )
);


console.log(
  `\nReport: ${OUT}`
);
