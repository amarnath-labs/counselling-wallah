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
| Every numeric line candidate
|--------------------------------------------------------------------------
*/

const candidates = [];


for (
  let i = 0;
  i < lines.length;
  i += 1
) {

  const m =
    lines[i].match(
      /^(\d+(?:\.\d+)?)\s+(.+)$/
    );


  if (
    !m
  ) {
    continue;
  }


  candidates.push({
    lineIndex:
      i,

    rankRaw:
      m[1],

    rankNumeric:
      Number(
        m[1]
      ),

    rest:
      m[2],
  });
}


/*
|--------------------------------------------------------------------------
| Global ordering diagnostics
|--------------------------------------------------------------------------
*/

const rankDrops = [];

const equalAdjacent = [];


for (
  let i = 1;
  i < candidates.length;
  i += 1
) {

  const previous =
    candidates[
      i - 1
    ];

  const current =
    candidates[i];


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

    equalAdjacent.push({
      previous,
      current,
    });
  }
}


/*
|--------------------------------------------------------------------------
| Candidate context classifier
|--------------------------------------------------------------------------
|
| Build first few source tokens after numeric line.
| This lets us recognize:
|
|   53 Open / Seat / Quota
|
| instead of requiring everything on one line.
|
*/

function lookAheadText(
  row,
  count = 8
) {

  return lines
    .slice(
      row.lineIndex,
      Math.min(
        lines.length,
        row.lineIndex + count
      )
    )
    .join(
      ' '
    )
    .replace(/\s+/g, ' ')
    .trim();
}


const likelyQuotaPatterns = [
  /^(\d+(?:\.\d+)?)\s+Open\s+Seat\s+Quota\b/i,
  /^(\d+(?:\.\d+)?)\s+All\s+India\b/i,
  /^(\d+(?:\.\d+)?)\s+Delhi\s+University\s+Quota\b/i,
  /^(\d+(?:\.\d+)?)\s+Deemed\/?P(?:aid)?\s+Seats\s+Quota\b/i,
  /^(\d+(?:\.\d+)?)\s+IP\s+University\s+Quota\b/i,
  /^(\d+(?:\.\d+)?)\s+Foreign\s+Country\s+Quota\b/i,
  /^(\d+(?:\.\d+)?)\s+Aligarh\s+Muslim\s+University\b/i,
  /^(\d+(?:\.\d+)?)\s+Internal\s+-?Puducherry\b/i,
  /^(\d+(?:\.\d+)?)\s+Employees\s+State\s+Insurance\b/i,
  /^(\d+(?:\.\d+)?)\s+Delhi\s+NCR\b/i,
  /^(\d+(?:\.\d+)?)\s+Non-?\s*Resident\s+Indian\b/i,
  /^(\d+(?:\.\d+)?)\s+B\.?Sc\b/i,
  /^(\d+(?:\.\d+)?)\s+Muslim\b/i,
  /^(\d+(?:\.\d+)?)\s+Jamia\b/i,
  /^(\d+(?:\.\d+)?)\s+Jain\b/i,

  /*
   * Empty historical round blocks.
   */
  /^(\d+(?:\.\d+)?)\s+-\s+-\s+-\s+-/,
];


const likelyRows = [];

const unknownNumeric = [];


for (
  const row of
  candidates
) {

  const text =
    lookAheadText(
      row,
      10
    );


  const likely =
    likelyQuotaPatterns.some(
      regex =>
        regex.test(
          text
        )
    );


  if (
    likely
  ) {

    likelyRows.push({
      ...row,
      lookAhead:
        text,
    });

  } else {

    unknownNumeric.push({
      ...row,
      lookAhead:
        text,
    });
  }
}


/*
|--------------------------------------------------------------------------
| Ordering among likely rows
|--------------------------------------------------------------------------
*/

const likelyDrops = [];


for (
  let i = 1;
  i < likelyRows.length;
  i += 1
) {

  if (
    likelyRows[i]
      .rankNumeric <
    likelyRows[
      i - 1
    ]
      .rankNumeric
  ) {

    likelyDrops.push({
      previous:
        likelyRows[
          i - 1
        ],

      current:
        likelyRows[i],
    });
  }
}


/*
|--------------------------------------------------------------------------
| Decimal candidates
|--------------------------------------------------------------------------
*/

const decimals =
  candidates.filter(
    row =>
      row.rankRaw.includes(
        '.'
      )
  );


/*
|--------------------------------------------------------------------------
| Report
|--------------------------------------------------------------------------
*/

console.log(
  '\n========================================'
);

console.log(
  'NEET 2024 ROUND-3 NUMERIC BOUNDARY AUDIT'
);

console.log(
  '========================================\n'
);


console.log({
  totalLines:
    lines.length,

  allNumericCandidates:
    candidates.length,

  likelyRows:
    likelyRows.length,

  unknownNumeric:
    unknownNumeric.length,

  firstNumeric:
    candidates[0]
      ?.rankRaw,

  lastNumeric:
    candidates.at(
      -1
    )
      ?.rankRaw,

  allCandidateRankDrops:
    rankDrops.length,

  likelyRowRankDrops:
    likelyDrops.length,

  equalAdjacentRanks:
    equalAdjacent.length,

  decimalCandidateCount:
    decimals.length,
});


console.log(
  '\n===== FIRST 40 NUMERIC CANDIDATES ====='
);


console.table(
  candidates
    .slice(
      0,
      40
    )
    .map(
      row => ({
        line:
          row.lineIndex,

        rank:
          row.rankRaw,

        rest:
          row.rest.slice(
            0,
            90
          ),
      })
    )
);


console.log(
  '\n===== DECIMAL NUMERIC CANDIDATES ====='
);


console.table(
  decimals.map(
    row => ({
      line:
        row.lineIndex,

      rank:
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
  '\n===== FIRST 30 GLOBAL RANK DROPS ====='
);


console.table(
  rankDrops
    .slice(
      0,
      30
    )
    .map(
      item => ({
        previousRank:
          item.previous.rankRaw,

        previousLine:
          item.previous.lineIndex,

        previousRest:
          item.previous.rest.slice(
            0,
            70
          ),

        currentRank:
          item.current.rankRaw,

        currentLine:
          item.current.lineIndex,

        currentRest:
          item.current.rest.slice(
            0,
            70
          ),
      })
    )
);


console.log(
  '\n===== FIRST 40 UNKNOWN NUMERIC LINES ====='
);


console.table(
  unknownNumeric
    .slice(
      0,
      40
    )
    .map(
      row => ({
        line:
          row.lineIndex,

        rank:
          row.rankRaw,

        rest:
          row.rest.slice(
            0,
            80
          ),

        lookAhead:
          row.lookAhead.slice(
            0,
            150
          ),
      })
    )
);


console.log(
  '\n===== LAST 20 LIKELY ROWS ====='
);


console.table(
  likelyRows
    .slice(
      -20
    )
    .map(
      row => ({
        line:
          row.lineIndex,

        rank:
          row.rankRaw,

        rest:
          row.rest.slice(
            0,
            90
          ),
      })
    )
);

