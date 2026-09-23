import fs from 'fs';


const FILE =
  './data/neet/mcc/2024/text/round-1.txt';


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
| Row-start pattern
|--------------------------------------------------------------------------
|
| Expected:
|
|   SNo Rank ...
|
| Examples:
|
|   1 1.01 Open Seat Quota ...
|   18 18 All India ...
|
*/

const rowStartRegex =
  /^(\d+)\s+(\d+(?:\.\d+)?)\s+(.+)$/;


const starts = [];


for (
  let i = 0;
  i <
    lines.length;
  i += 1
) {

  const match =
    lines[i].match(
      rowStartRegex
    );


  if (
    !match
  ) {
    continue;
  }


  starts.push({
    lineIndex:
      i,

    sno:
      Number(
        match[1]
      ),

    rankRaw:
      match[2],

    rankNumeric:
      Number(
        match[2]
      ),

    rest:
      match[3],
  });
}


/*
|--------------------------------------------------------------------------
| SNo continuity
|--------------------------------------------------------------------------
*/

const duplicateSNo = [];

const missingSNo = [];

const seen =
  new Set();


for (
  const row of
  starts
) {

  if (
    seen.has(
      row.sno
    )
  ) {

    duplicateSNo.push(
      row.sno
    );

  } else {

    seen.add(
      row.sno
    );
  }
}


const minSNo =
  starts.length
    ? Math.min(
        ...starts.map(
          row =>
            row.sno
        )
      )
    : null;


const maxSNo =
  starts.length
    ? Math.max(
        ...starts.map(
          row =>
            row.sno
        )
      )
    : null;


if (
  minSNo !==
    null &&
  maxSNo !==
    null
) {

  for (
    let sno =
      minSNo;
    sno <=
      maxSNo;
    sno += 1
  ) {

    if (
      !seen.has(
        sno
      )
    ) {
      missingSNo.push(
        sno
      );
    }
  }
}


/*
|--------------------------------------------------------------------------
| Rank-format audit
|--------------------------------------------------------------------------
*/

const decimalRanks =
  starts.filter(
    row =>
      row.rankRaw.includes(
        '.'
      )
  );


const integerRanks =
  starts.filter(
    row =>
      !row.rankRaw.includes(
        '.'
      )
  );


const decimalPatterns = {};


for (
  const row of
  decimalRanks
) {

  const decimals =
    row.rankRaw
      .split('.')[1]
      ?.length ??
    0;


  const key =
    `${decimals}-decimal-place`;


  decimalPatterns[key] =
    (
      decimalPatterns[key] ||
      0
    ) +
    1;
}


/*
|--------------------------------------------------------------------------
| Show representative rows
|--------------------------------------------------------------------------
*/

function showRowContext(
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
      row.lineIndex - 2
    );


  const to =
    Math.min(
      lines.length,
      row.lineIndex + 8
    );


  for (
    let i =
      from;
    i <
      to;
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
| Remarks vocabulary probe
|--------------------------------------------------------------------------
*/

const remarkCounts = {};


const knownRemarks = [
  'Allotted',
  'Reported',
  'Not Reported',
  'Seat Surrendered',
  'Seat Cancelled',
];


for (
  const remark of
  knownRemarks
) {

  let count =
    0;


  for (
    const line of
    lines
  ) {

    if (
      line ===
        remark ||
      line.endsWith(
        ` ${remark}`
      )
    ) {
      count +=
        1;
    }
  }


  remarkCounts[
    remark
  ] =
    count;
}


console.log(
  '\n========================================'
);

console.log(
  'NEET 2024 ROUND-1 STRUCTURE AUDIT'
);

console.log(
  '========================================\n'
);


console.log(
  JSON.stringify(
    {
      totalLines:
        lines.length,

      detectedRowStarts:
        starts.length,

      minSNo,

      maxSNo,

      duplicateSNoCount:
        duplicateSNo.length,

      missingSNoCount:
        missingSNo.length,

      firstMissingSNo:
        missingSNo.slice(
          0,
          30
        ),

      firstRankRaw:
        starts[0]
          ?.rankRaw ??
        null,

      lastRankRaw:
        starts[
          starts.length -
          1
        ]
          ?.rankRaw ??
        null,

      decimalRankCount:
        decimalRanks.length,

      integerRankCount:
        integerRanks.length,

      decimalPatterns,

      remarkCounts,
    },
    null,
    2
  )
);


showRowContext(
  starts[0],
  'FIRST ROW'
);


showRowContext(
  starts[1],
  'SECOND ROW'
);


showRowContext(
  starts[
    Math.floor(
      starts.length /
      2
    )
  ],
  'MIDDLE ROW'
);


showRowContext(
  starts[
    starts.length -
    1
  ],
  'LAST ROW'
);


console.log(
  '\n===== FIRST 30 DECIMAL SOURCE RANKS ====='
);


console.table(
  decimalRanks
    .slice(
      0,
      30
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


console.log(
  '\n===== LAST 20 ROW STARTS ====='
);


console.table(
  starts
    .slice(
      -20
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
