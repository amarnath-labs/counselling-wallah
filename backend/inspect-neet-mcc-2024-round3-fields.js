import fs from 'fs';


const TEXT_FILE =
  './data/neet/mcc/2024/text/round-3.txt';

const SEG_FILE =
  './data/neet/mcc/2024/round3-terminal-segmentation.json';


const lines =
  fs.readFileSync(
    TEXT_FILE,
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


const segmentation =
  JSON.parse(
    fs.readFileSync(
      SEG_FILE,
      'utf8'
    )
  );


const rows =
  segmentation.rows;


/*
|--------------------------------------------------------------------------
| Normalized joined source row
|--------------------------------------------------------------------------
*/

function joinedRow(
  row
) {

  return lines
    .slice(
      row.lineIndex,
      row.endLineIndex + 1
    )
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}


function normalizedGrammar(
  value
) {

  return String(
    value || ''
  )

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

    .replace(
      /\bDeemed\/\s+Paid\b/gi,
      'Deemed/Paid'
    )

    .replace(
      /\bDeemed\/P\s+aid\b/gi,
      'Deemed/Paid'
    )

    .replace(
      /\bEmploye\s+es\b/gi,
      'Employees'
    )

    .replace(
      /\s+/g,
      ' '
    )

    .trim();
}


/*
|--------------------------------------------------------------------------
| Dash-prefix pattern
|--------------------------------------------------------------------------
*/

const dashPatternCounts = {};


for (
  const row of
  rows
) {

  const full =
    joinedRow(
      row
    );


  const withoutRank =
    full.replace(
      /^\d+(?:\.\d+)?\s+/,
      ''
    );


  const match =
    withoutRank.match(
      /^(?:(?:-\s+){1,12})/
    );


  const dashCount =
    match
      ? (
          match[0]
            .match(
              /-/g
            ) || []
        ).length
      : 0;


  dashPatternCounts[
    dashCount
  ] =
    (
      dashPatternCounts[
        dashCount
      ] ||
      0
    ) +
    1;
}


/*
|--------------------------------------------------------------------------
| Course/category/option tail probe on current-seat rows
|--------------------------------------------------------------------------
*/

const currentSeatStatuses =
  new Set([
    'Upgraded',
    'Fresh Allotted in 3nd Round',
  ]);


const candidateTailRegex =
  /\b(MBBS|BDS|B\.Sc\.?\s*Nursing)\s+(Open(?:\s+PwD)?|OBC(?:\s+PwD)?|EWS(?:\s+PwD)?|SC(?:\s+PwD)?|ST(?:\s+PwD)?)\s+([A-Za-z]+(?:\s+PwD)?|GNYes)\s+(\d+)\s+(?:Upgraded|Fresh Allotted in 3nd Round)/g;


const currentSeatTailMatches = [];

const currentSeatTailFailures = [];


for (
  const row of
  rows
) {

  if (
    !currentSeatStatuses.has(
      row.terminalStatus
    )
  ) {
    continue;
  }


  const full =
    normalizedGrammar(
      joinedRow(
        row
      )
    );


  let match =
    null;

  let lastMatch =
    null;


  while (
    (
      match =
        candidateTailRegex.exec(
          full
        )
    ) !==
    null
  ) {

    lastMatch =
      match;
  }


  candidateTailRegex.lastIndex =
    0;


  if (
    lastMatch
  ) {

    currentSeatTailMatches.push({
      rankRaw:
        row.rankRaw,

      status:
        row.terminalStatus,

      course:
        lastMatch[1],

      allottedCategory:
        lastMatch[2],

      candidateCategory:
        lastMatch[3],

      optionNo:
        Number(
          lastMatch[4]
        ),
    });

  } else {

    currentSeatTailFailures.push({
      rankRaw:
        row.rankRaw,

      status:
        row.terminalStatus,

      text:
        full,
    });
  }
}


/*
|--------------------------------------------------------------------------
| Counts
|--------------------------------------------------------------------------
*/

function countBy(
  values
) {

  const out = {};


  for (
    const value of
    values
  ) {

    const key =
      String(
        value
      );


    out[key] =
      (
        out[key] ||
        0
      ) +
      1;
  }


  return out;
}


const courseCounts =
  countBy(
    currentSeatTailMatches.map(
      item =>
        item.course
    )
  );


const allottedCategoryCounts =
  countBy(
    currentSeatTailMatches.map(
      item =>
        item.allottedCategory
    )
  );


const candidateCategoryCounts =
  countBy(
    currentSeatTailMatches.map(
      item =>
        item.candidateCategory
    )
  );


/*
|--------------------------------------------------------------------------
| Special markers
|--------------------------------------------------------------------------
*/

const cwRows = [];

const nriRows = [];

const statusSamples = {};


for (
  const row of
  rows
) {

  const full =
    normalizedGrammar(
      joinedRow(
        row
      )
    );


  if (
    /CW\s+Rank/i.test(
      full
    )
  ) {

    cwRows.push({
      rankRaw:
        row.rankRaw,

      status:
        row.terminalStatus,

      text:
        full,
    });
  }


  if (
    /NRI\s+Priority|Non-Resident Indian/i.test(
      full
    )
  ) {

    nriRows.push({
      rankRaw:
        row.rankRaw,

      status:
        row.terminalStatus,

      text:
        full,
    });
  }


  if (
    !statusSamples[
      row.terminalStatus
    ]
  ) {

    statusSamples[
      row.terminalStatus
    ] =
      [];
  }


  if (
    statusSamples[
      row.terminalStatus
    ].length <
      4
  ) {

    statusSamples[
      row.terminalStatus
    ].push({
      rankRaw:
        row.rankRaw,

      text:
        full,
    });
  }
}


/*
|--------------------------------------------------------------------------
| Report
|--------------------------------------------------------------------------
*/

console.log(
  '\n========================================'
);

console.log(
  'NEET 2024 ROUND-3 FIELD GRAMMAR AUDIT'
);

console.log(
  '========================================\n'
);


console.log({
  totalRows:
    rows.length,

  currentSeatExpected:
    rows.filter(
      row =>
        currentSeatStatuses.has(
          row.terminalStatus
        )
    ).length,

  currentSeatTailParsed:
    currentSeatTailMatches.length,

  currentSeatTailFailures:
    currentSeatTailFailures.length,

  cwRows:
    cwRows.length,

  nriRelatedRows:
    nriRows.length,
});


console.log(
  '\nDASH PREFIX COUNTS'
);


console.log(
  JSON.stringify(
    dashPatternCounts,
    null,
    2
  )
);


console.log(
  '\nCURRENT ROUND-3 COURSE COUNTS'
);


console.log(
  JSON.stringify(
    courseCounts,
    null,
    2
  )
);


console.log(
  '\nCURRENT ROUND-3 ALLOTTED CATEGORY COUNTS'
);


console.log(
  JSON.stringify(
    allottedCategoryCounts,
    null,
    2
  )
);


console.log(
  '\nCURRENT ROUND-3 CANDIDATE CATEGORY COUNTS'
);


console.log(
  JSON.stringify(
    candidateCategoryCounts,
    null,
    2
  )
);


console.log(
  '\n===== CURRENT-SEAT TAIL FAILURES ====='
);


console.log({
  count:
    currentSeatTailFailures.length,
});


for (
  const item of
  currentSeatTailFailures.slice(
    0,
    30
  )
) {

  console.log(
    `\nRANK ${item.rankRaw} | ${item.status}`
  );

  console.log(
    item.text
  );
}


console.log(
  '\n===== CW ROWS ====='
);


for (
  const item of
  cwRows.slice(
    0,
    20
  )
) {

  console.log(
    `\nRANK ${item.rankRaw} | ${item.status}`
  );

  console.log(
    item.text
  );
}


console.log(
  '\n===== NRI-RELATED ROWS SAMPLE ====='
);


for (
  const item of
  nriRows.slice(
    0,
    20
  )
) {

  console.log(
    `\nRANK ${item.rankRaw} | ${item.status}`
  );

  console.log(
    item.text
  );
}


console.log(
  '\n===== STATUS SAMPLES ====='
);


for (
  const [
    status,
    samples
  ] of
  Object.entries(
    statusSamples
  )
) {

  console.log(
    `\n----------------------------------------`
  );

  console.log(
    status
  );

  console.log(
    '----------------------------------------'
  );


  for (
    const sample of
    samples
  ) {

    console.log(
      `\nRank ${sample.rankRaw}`
    );

    console.log(
      sample.text
    );
  }
}


/*
|--------------------------------------------------------------------------
| Save audit
|--------------------------------------------------------------------------
*/

fs.writeFileSync(
  './data/neet/mcc/2024/round3-field-grammar-audit.json',
  JSON.stringify(
    {
      totalRows:
        rows.length,

      dashPatternCounts,

      currentSeatTailParsed:
        currentSeatTailMatches.length,

      currentSeatTailFailures,

      courseCounts,

      allottedCategoryCounts,

      candidateCategoryCounts,

      cwRows,

      nriRows,
    },
    null,
    2
  ),
  'utf8'
);
