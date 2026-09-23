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
| Source-text normalization ONLY for grammar detection
|--------------------------------------------------------------------------
|
| rankRaw and source text remain untouched.
|
*/

function grammarText(
  value
) {

  return String(
    value || ''
  )
    .replace(/\s+/g, ' ')

    /*
     * PDF word splits seen in 2024 source.
     */

    .replace(
      /\bUpgradati\s+on\b/gi,
      'Upgradation'
    )

    .replace(
      /\bUniversit\s+y\b/gi,
      'University'
    )

    .replace(
      /\bWi\s+dows\b/gi,
      'Widows'
    )

    .replace(
      /\bWid\s+ows\b/gi,
      'Widows'
    )

    .trim();
}


/*
|--------------------------------------------------------------------------
| Terminal Round-3 status detector
|--------------------------------------------------------------------------
*/

const TERMINALS = [
  {
    name:
      'Did not opt for Upgradation',

    regex:
      /Did not opt for Upgradation\.?$/,
  },

  {
    name:
      'Did not fill up fresh choices',

    regex:
      /Did not fill up fresh choices\.?$/,
  },

  {
    name:
      'Fresh Allotted in 3nd Round',

    regex:
      /Fresh Allotted in 3nd Round(?:\s*\(\s*CW\s+Rank\s*:\s*\d+\s*\))?$/,
  },

  {
    name:
      'Fresh Allotted in 3rd Round',

    regex:
      /Fresh Allotted in 3rd Round(?:\s*\(\s*CW\s+Rank\s*:\s*\d+\s*\))?$/,
  },

  {
    name:
      'No Upgradation',

    regex:
      /No Upgradation\.?$/,
  },

  {
    name:
      'Not Allotted',

    regex:
      /Not Allotted\.?$/,
  },

  {
    name:
      'Fresh NRI Priority1',

    regex:
      /Fresh NRI Priority\s*1$/,
  },

  {
    name:
      'Fresh NRI Priority2',

    regex:
      /Fresh NRI Priority\s*2$/,
  },

  {
    name:
      'Upgraded NRI Priority1',

    regex:
      /Upgraded NRI Priority\s*1$/,
  },

  {
    name:
      'Upgraded NRI Priority2',

    regex:
      /Upgraded NRI Priority\s*2$/,
  },

  {
    name:
      'Fresh CW Rank',

    regex:
      /Fresh CW Rank\s*:?\s*\d+$/,
  },

  {
    name:
      'Upgraded',

    regex:
      /Upgraded$/,
  },
];


function terminalStatus(
  text
) {

  const normalized =
    grammarText(
      text
    );


  for (
    const item of
    TERMINALS
  ) {

    if (
      item.regex.test(
        normalized
      )
    ) {

      return item.name;
    }
  }


  return null;
}


/*
|--------------------------------------------------------------------------
| Find first true row
|--------------------------------------------------------------------------
|
| Source starts at rankRaw 1.01.
|
*/

const firstRowIndex =
  lines.findIndex(
    line =>
      /^1\.01\s+/.test(
        line
      )
  );


if (
  firstRowIndex < 0
) {
  throw new Error(
    'Could not find first rank 1.01.'
  );
}


/*
|--------------------------------------------------------------------------
| Terminal-to-next-numeric segmentation
|--------------------------------------------------------------------------
|
| We maintain one active row.
|
| A numeric line becomes the NEXT row only when everything before
| that line completes a recognized terminal Round-3 status.
|
| Therefore numeric addresses inside institutes do not split rows.
|
*/

const rows = [];

let currentStart =
  firstRowIndex;


for (
  let i =
    firstRowIndex + 1;
  i <
    lines.length;
  i += 1
) {

  /*
   * Only numeric lines can possibly be a new row.
   */

  if (
    !/^\d+(?:\.\d+)?\s+/.test(
      lines[i]
    )
  ) {
    continue;
  }


  const previousText =
    lines
      .slice(
        currentStart,
        i
      )
      .join(
        ' '
      );


  const status =
    terminalStatus(
      previousText
    );


  if (
    !status
  ) {
    continue;
  }


  const firstLine =
    lines[
      currentStart
    ];


  const match =
    firstLine.match(
      /^(\d+(?:\.\d+)?)\s+(.+)$/
    );


  if (
    !match
  ) {

    throw new Error(
      `Current row does not start numerically at line ${currentStart}`
    );
  }


  rows.push({
    lineIndex:
      currentStart,

    endLineIndex:
      i - 1,

    rankRaw:
      match[1],

    rankNumeric:
      Number(
        match[1]
      ),

    firstRest:
      match[2],

    terminalStatus:
      status,

    lineCount:
      i -
      currentStart,
  });


  currentStart =
    i;
}


/*
|--------------------------------------------------------------------------
| Final row
|--------------------------------------------------------------------------
*/

const finalText =
  lines
    .slice(
      currentStart
    )
    .join(
      ' '
    );


const finalStatus =
  terminalStatus(
    finalText
  );


let unclosedFinalRow =
  null;


if (
  finalStatus
) {

  const firstLine =
    lines[
      currentStart
    ];


  const match =
    firstLine.match(
      /^(\d+(?:\.\d+)?)\s+(.+)$/
    );


  if (
    !match
  ) {
    throw new Error(
      'Final row does not start numerically.'
    );
  }


  rows.push({
    lineIndex:
      currentStart,

    endLineIndex:
      lines.length -
      1,

    rankRaw:
      match[1],

    rankNumeric:
      Number(
        match[1]
      ),

    firstRest:
      match[2],

    terminalStatus:
      finalStatus,

    lineCount:
      lines.length -
      currentStart,
  });

} else {

  unclosedFinalRow = {
    lineIndex:
      currentStart,

    firstLines:
      lines.slice(
        currentStart,
        Math.min(
          lines.length,
          currentStart + 30
        )
      ),

    tail:
      grammarText(
        finalText
      )
        .split(/\s+/)
        .slice(-60)
        .join(' '),
  };
}


/*
|--------------------------------------------------------------------------
| Rank ordering
|--------------------------------------------------------------------------
*/

const rankDrops = [];

const equalAdjacentRanks = [];


for (
  let i = 1;
  i <
    rows.length;
  i += 1
) {

  const previous =
    rows[
      i - 1
    ];

  const current =
    rows[i];


  if (
    current.rankNumeric <
      previous.rankNumeric
  ) {

    rankDrops.push({
      previous,
      current,
    });
  }


  if (
    current.rankRaw ===
      previous.rankRaw
  ) {

    equalAdjacentRanks.push({
      previous,
      current,
    });
  }
}


/*
|--------------------------------------------------------------------------
| Decimal ranks
|--------------------------------------------------------------------------
*/

const decimalRows =
  rows.filter(
    row =>
      row.rankRaw.includes(
        '.'
      )
  );


/*
|--------------------------------------------------------------------------
| Status counts
|--------------------------------------------------------------------------
*/

const statusCounts = {};


for (
  const row of
  rows
) {

  statusCounts[
    row.terminalStatus
  ] =
    (
      statusCounts[
        row.terminalStatus
      ] ||
      0
    ) +
    1;
}


/*
|--------------------------------------------------------------------------
| Suspicious row sizes
|--------------------------------------------------------------------------
*/

const veryShortRows =
  rows.filter(
    row =>
      row.lineCount <
      2
  );


const veryLongRows =
  rows.filter(
    row =>
      row.lineCount >
      100
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
  'NEET 2024 ROUND-3 TERMINAL SEGMENTATION'
);

console.log(
  '========================================\n'
);


console.log(
  JSON.stringify(
    {
      totalLines:
        lines.length,

      segmentedRows:
        rows.length,

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

      decimalRankCount:
        decimalRows.length,

      rankDropCount:
        rankDrops.length,

      equalAdjacentRankCount:
        equalAdjacentRanks.length,

      unclosedFinalRow:
        Boolean(
          unclosedFinalRow
        ),

      veryShortRows:
        veryShortRows.length,

      veryLongRows:
        veryLongRows.length,

      statusCounts,
    },
    null,
    2
  )
);


console.log(
  '\n===== DECIMAL SOURCE RANKS ====='
);


console.table(
  decimalRows.map(
    row => ({
      line:
        row.lineIndex,

      rankRaw:
        row.rankRaw,

      status:
        row.terminalStatus,

      firstRest:
        row.firstRest.slice(
          0,
          90
        ),
    })
  )
);


console.log(
  '\n===== FIRST 20 SEGMENTED ROWS ====='
);


console.table(
  rows
    .slice(
      0,
      20
    )
    .map(
      row => ({
        line:
          row.lineIndex,

        rank:
          row.rankRaw,

        lines:
          row.lineCount,

        status:
          row.terminalStatus,

        rest:
          row.firstRest.slice(
            0,
            70
          ),
      })
    )
);


console.log(
  '\n===== LAST 20 SEGMENTED ROWS ====='
);


console.table(
  rows
    .slice(
      -20
    )
    .map(
      row => ({
        line:
          row.lineIndex,

        rank:
          row.rankRaw,

        lines:
          row.lineCount,

        status:
          row.terminalStatus,

        rest:
          row.firstRest.slice(
            0,
            70
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
          item.current.firstRest.slice(
            0,
            80
          ),
      })
    )
);


if (
  unclosedFinalRow
) {

  console.log(
    '\n===== UNCLOSED FINAL ROW ====='
  );


  console.dir(
    unclosedFinalRow,
    {
      depth:
        null,
    }
  );
}


/*
|--------------------------------------------------------------------------
| Save diagnostic
|--------------------------------------------------------------------------
*/

fs.writeFileSync(
  './data/neet/mcc/2024/round3-terminal-segmentation.json',
  JSON.stringify(
    {
      rows,
      rankDrops,
      equalAdjacentRanks,
      decimalRows,
      statusCounts,
      unclosedFinalRow,
    },
    null,
    2
  ),
  'utf8'
);
