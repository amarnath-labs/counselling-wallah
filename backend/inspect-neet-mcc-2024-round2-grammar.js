import fs from 'fs';


const FILE =
  './data/neet/mcc/2024/text/round-2.txt';


const raw =
  fs.readFileSync(
    FILE,
    'utf8'
  );


const lines =
  raw
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map(
      line =>
        String(line || '')
          .replace(/\s+/g, ' ')
          .trim()
    )
    .filter(Boolean);


/*
|--------------------------------------------------------------------------
| Continuity-aware row detection
|--------------------------------------------------------------------------
*/

const starts = [];

let expectedSNo =
  1;


for (
  let i = 0;
  i <
    lines.length;
  i += 1
) {

  const match =
    lines[i].match(
      /^(\d+)\s+(\d+(?:\.\d+)?)\s+(.+)$/
    );


  if (
    !match
  ) {
    continue;
  }


  const sno =
    Number(
      match[1]
    );


  if (
    sno !==
    expectedSNo
  ) {
    continue;
  }


  starts.push({
    lineIndex:
      i,

    sno,

    rankRaw:
      match[2],

    rest:
      match[3],
  });


  expectedSNo +=
    1;
}


console.log(
  '\n========================================'
);

console.log(
  'TRUE ROUND-2 ROW BOUNDARIES'
);

console.log(
  '========================================\n'
);


console.log({
  rows:
    starts.length,

  firstSNo:
    starts[0]
      ?.sno,

  lastSNo:
    starts.at(
      -1
    )
      ?.sno,

  firstRankRaw:
    starts[0]
      ?.rankRaw,

  lastRankRaw:
    starts.at(
      -1
    )
      ?.rankRaw,

  nextExpectedSNo:
    expectedSNo,
});


/*
|--------------------------------------------------------------------------
| Join each true source row
|--------------------------------------------------------------------------
*/

const joinedRows = [];


for (
  let index = 0;
  index <
    starts.length;
  index += 1
) {

  const start =
    starts[index];


  const end =
    index + 1 <
      starts.length
      ? starts[
          index + 1
        ].lineIndex
      : lines.length;


  const rowLines =
    lines.slice(
      start.lineIndex,
      end
    );


  joinedRows.push({
    sno:
      start.sno,

    rankRaw:
      start.rankRaw,

    text:
      rowLines.join(
        ' '
      ),

    rowLines,
  });
}


/*
|--------------------------------------------------------------------------
| Status grammar
|--------------------------------------------------------------------------
*/

const statusPatterns = [
  {
    name:
      'Did not opt for Upgradation',

    regex:
      /Did not opt\s+for\s+Upgradation\.?$/,
  },

  {
    name:
      'Did not fill up fresh choices',

    regex:
      /Did not fill up\s+fresh choices\.?$/,
  },

  {
    name:
      'Fresh Allotted in 2nd Round',

    regex:
      /Fresh Allotted\s+in 2nd Round(?:\s*\([^)]*\))?$/,
  },

  {
    name:
      'No Upgradation',

    regex:
      /No\s+Upgradation\.?$/,
  },

  {
    name:
      'Not Allotted',

    regex:
      /Not Allotted\.?$/,
  },

  {
    name:
      'Upgraded',

    regex:
      /Upgraded(?:\s*\([^)]*\))?$/,
  },

  {
    name:
      'Retained',

    regex:
      /Retained(?:\s*\([^)]*\))?$/,
  },
];


const statusCounts = {};

const unknownStatuses = [];


for (
  const row of
  joinedRows
) {

  let found =
    null;


  for (
    const item of
    statusPatterns
  ) {

    if (
      item.regex.test(
        row.text
      )
    ) {

      found =
        item.name;

      break;
    }
  }


  if (
    found
  ) {

    statusCounts[
      found
    ] =
      (
        statusCounts[
          found
        ] ||
        0
      ) +
      1;

  } else {

    unknownStatuses.push({
      sno:
        row.sno,

      rankRaw:
        row.rankRaw,

      tail:
        row.text
          .split(/\s+/)
          .slice(-35)
          .join(' '),
    });
  }
}


/*
|--------------------------------------------------------------------------
| Exact status suffix examples
|--------------------------------------------------------------------------
*/

const suffixCounts = {};


for (
  const row of
  joinedRows
) {

  const words =
    row.text.split(
      /\s+/
    );


  const suffix =
    words
      .slice(
        -18
      )
      .join(
        ' '
      );


  /*
   * only useful status-related tails
   */

  if (
    /Allotted|Upgradation|Upgraded|Retained|choices/i.test(
      suffix
    )
  ) {

    suffixCounts[
      suffix
    ] =
      (
        suffixCounts[
          suffix
        ] ||
        0
      ) +
      1;
  }
}


/*
|--------------------------------------------------------------------------
| Candidate-category token probe
|--------------------------------------------------------------------------
|
| Search around current Round-2 seat endings:
|
| course + allotted category +
| candidate category + option + status
|
*/

const candidateLikeCounts = {};


const candidateRegex =
  /\b(Open(?:\s+PwD)?|OBC(?:\s+PwD)?|EWS(?:\s+PwD)?|SC(?:\s+PwD)?|ST(?:\s+PwD)?)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)\s+(\d+)\s+(?:Fresh Allotted|Upgraded)/g;


for (
  const row of
  joinedRows
) {

  let match;


  while (
    (
      match =
        candidateRegex.exec(
          row.text
        )
    ) !==
    null
  ) {

    const token =
      match[2];


    candidateLikeCounts[
      token
    ] =
      (
        candidateLikeCounts[
          token
        ] ||
        0
      ) +
      1;
  }
}


/*
|--------------------------------------------------------------------------
| Decimal ranks
|--------------------------------------------------------------------------
*/

const decimalRanks =
  starts.filter(
    row =>
      row.rankRaw.includes(
        '.'
      )
  );


console.log(
  '\nSTATUS COUNTS'
);


console.log(
  JSON.stringify(
    statusCounts,
    null,
    2
  )
);


console.log(
  '\nUNKNOWN TERMINAL STATUS ROWS'
);


console.log({
  count:
    unknownStatuses.length,
});


console.table(
  unknownStatuses.slice(
    0,
    30
  )
);


console.log(
  '\nCANDIDATE-LIKE TOKENS'
);


console.log(
  JSON.stringify(
    candidateLikeCounts,
    null,
    2
  )
);


console.log(
  '\nDECIMAL SOURCE RANKS'
);


console.table(
  decimalRanks.map(
    row => ({
      sno:
        row.sno,

      rankRaw:
        row.rankRaw,

      rest:
        row.rest.slice(
          0,
          100
        ),
    })
  )
);


console.log(
  '\nLAST 15 TRUE ROWS'
);


console.table(
  starts
    .slice(
      -15
    )
    .map(
      row => ({
        sno:
          row.sno,

        rankRaw:
          row.rankRaw,

        rest:
          row.rest.slice(
            0,
            100
          ),
      })
    )
);


/*
|--------------------------------------------------------------------------
| Save diagnostic
|--------------------------------------------------------------------------
*/

fs.writeFileSync(
  './data/neet/mcc/2024/round2-grammar-audit.json',
  JSON.stringify(
    {
      rows:
        starts.length,

      statusCounts,

      unknownStatuses,

      candidateLikeCounts,

      decimalRanks,
    },
    null,
    2
  ),
  'utf8'
);
