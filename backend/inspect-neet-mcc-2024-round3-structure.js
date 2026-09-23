import fs from 'fs';


const FILE =
  './data/neet/mcc/2024/text/round-3.txt';


const lines =
  fs.readFileSync(
    FILE,
    'utf8'
  )
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
| Candidate row starts
|--------------------------------------------------------------------------
|
| Round-3 has no SNo.
|
| Candidate row starts therefore begin with:
|
|   Rank ...
|
*/

const candidates = [];


for (
  let i = 0;
  i < lines.length;
  i += 1
) {

  const match =
    lines[i].match(
      /^(\d+(?:\.\d+)?)\s+(.+)$/
    );


  if (
    !match
  ) {
    continue;
  }


  candidates.push({
    lineIndex:
      i,

    rankRaw:
      match[1],

    rankNumeric:
      Number(
        match[1]
      ),

    rest:
      match[2],
  });
}


/*
|--------------------------------------------------------------------------
| Plausible MCC row-start filters
|--------------------------------------------------------------------------
|
| A genuine row generally starts with:
|
| rank + quota
|
| OR:
|
| rank + "- - - -"
|
*/

const quotaFragments = [
  'Open Seat',
  'All India',
  'Delhi University',
  'Deemed/Pa',
  'Deemed/Paid',
  'IP University',
  'Foreign Country',
  'Aligarh Muslim',
  'Internal -Puducherry',
  'Employees',
  'Delhi NCR',
  'Non-Resident',
  'Muslim',
  'B.Sc',
  'Jamia',
  'Jain',
  '- - - -',
];


function looksLikeRowStart(
  rest
) {

  return quotaFragments.some(
    prefix =>
      rest.startsWith(
        prefix
      )
  );
}


const plausible =
  candidates.filter(
    row =>
      looksLikeRowStart(
        row.rest
      )
  );


/*
|--------------------------------------------------------------------------
| Rank ordering diagnostics
|--------------------------------------------------------------------------
*/

const rankDrops = [];

const sameRanks = [];


for (
  let i = 1;
  i < plausible.length;
  i += 1
) {

  const previous =
    plausible[
      i - 1
    ];

  const current =
    plausible[i];


  if (
    current.rankNumeric <
      previous.rankNumeric
  ) {

    rankDrops.push({
      index:
        i,

      previous,

      current,
    });
  }


  if (
    current.rankRaw ===
      previous.rankRaw
  ) {

    sameRanks.push({
      previous,
      current,
    });
  }
}


/*
|--------------------------------------------------------------------------
| Decimal source ranks
|--------------------------------------------------------------------------
*/

const decimalRanks =
  plausible.filter(
    row =>
      row.rankRaw.includes(
        '.'
      )
  );


/*
|--------------------------------------------------------------------------
| Status vocabulary probe
|--------------------------------------------------------------------------
*/

const joined =
  lines.join(
    ' '
  );


const statusPatterns = [
  'Did not opt for Upgradation',
  'Did not fill up fresh choices',
  'Fresh Allotted in 3rd Round',
  'Fresh Allotted in 3nd Round',
  'Upgraded',
  'No Upgradation',
  'Not Allotted',
  'Fresh NRI Priority1',
  'Fresh NRI Priority2',
  'Upgraded NRI Priority1',
  'Upgraded NRI Priority2',
];


const statusCounts = {};


for (
  const status of
  statusPatterns
) {

  const escaped =
    status.replace(
      /[.*+?^${}()|[\]\\]/g,
      '\\$&'
    );


  const regex =
    new RegExp(
      escaped,
      'g'
    );


  statusCounts[
    status
  ] =
    (
      joined.match(
        regex
      ) ||
      []
    ).length;
}


/*
|--------------------------------------------------------------------------
| Context helper
|--------------------------------------------------------------------------
*/

function showContext(
  row,
  label
) {

  if (
    !row
  ) {
    return;
  }


  console.log(
    `\n===== ${label} =====`
  );


  console.log(
    JSON.stringify(
      row,
      null,
      2
    )
  );


  const from =
    Math.max(
      0,
      row.lineIndex - 5
    );


  const to =
    Math.min(
      lines.length,
      row.lineIndex + 30
    );


  for (
    let i = from;
    i < to;
    i += 1
  ) {

    const marker =
      i ===
        row.lineIndex
        ? '>>>'
        : '   ';


    console.log(
      `${marker} ${String(i).padStart(7, ' ')}: ${lines[i]}`
    );
  }
}


/*
|--------------------------------------------------------------------------
| Main report
|--------------------------------------------------------------------------
*/

console.log(
  '\n========================================'
);

console.log(
  'NEET 2024 ROUND-3 STRUCTURE AUDIT'
);

console.log(
  '========================================\n'
);


console.log(
  JSON.stringify(
    {
      totalLines:
        lines.length,

      numericCandidates:
        candidates.length,

      plausibleRowStarts:
        plausible.length,

      firstRankRaw:
        plausible[0]
          ?.rankRaw ??
        null,

      lastRankRaw:
        plausible.at(
          -1
        )
          ?.rankRaw ??
        null,

      decimalRankCount:
        decimalRanks.length,

      rankDropCount:
        rankDrops.length,

      adjacentSameRankCount:
        sameRanks.length,

      statusCounts,
    },
    null,
    2
  )
);


showContext(
  plausible[0],
  'FIRST PLAUSIBLE ROW'
);


showContext(
  plausible[
    Math.floor(
      plausible.length /
      2
    )
  ],
  'MIDDLE PLAUSIBLE ROW'
);


showContext(
  plausible.at(
    -1
  ),
  'LAST PLAUSIBLE ROW'
);


console.log(
  '\n===== DECIMAL SOURCE RANKS ====='
);


console.table(
  decimalRanks
    .slice(
      0,
      50
    )
    .map(
      row => ({
        lineIndex:
          row.lineIndex,

        rankRaw:
          row.rankRaw,

        rest:
          row.rest.slice(
            0,
            120
          ),
      })
    )
);


console.log(
  '\n===== FIRST 20 RANK DROPS ====='
);


console.table(
  rankDrops
    .slice(
      0,
      20
    )
    .map(
      item => ({
        previousRank:
          item.previous.rankRaw,

        previousLine:
          item.previous.lineIndex,

        currentRank:
          item.current.rankRaw,

        currentLine:
          item.current.lineIndex,

        currentRest:
          item.current.rest.slice(
            0,
            100
          ),
      })
    )
);


console.log(
  '\n===== LAST 20 PLAUSIBLE STARTS ====='
);


console.table(
  plausible
    .slice(
      -20
    )
    .map(
      row => ({
        lineIndex:
          row.lineIndex,

        rankRaw:
          row.rankRaw,

        rest:
          row.rest.slice(
            0,
            110
          ),
      })
    )
);
