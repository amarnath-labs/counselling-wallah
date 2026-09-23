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
| 2024 Round-2 row start
|--------------------------------------------------------------------------
|
| Expected:
|
| SNo Rank ...
|
| Example:
|
| 1 1.01 Open Seat
|
*/

const ROW_START =
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
      ROW_START
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

const seenSNo =
  new Set();

const duplicateSNo =
  [];

const missingSNo =
  [];


for (
  const row of
  starts
) {

  if (
    seenSNo.has(
      row.sno
    )
  ) {

    duplicateSNo.push(
      row.sno
    );

  } else {

    seenSNo.add(
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
  minSNo !== null &&
  maxSNo !== null
) {

  for (
    let sno =
      minSNo;
    sno <=
      maxSNo;
    sno += 1
  ) {

    if (
      !seenSNo.has(
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
| Rank format
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


/*
|--------------------------------------------------------------------------
| Status vocabulary probe
|--------------------------------------------------------------------------
*/

const possibleStatuses = [
  'Reported',
  'Not Reported',
  'Seat Surrendered',
  'Seat Cancelled',

  'Fresh Allotted in 2nd Round',
  'Upgraded',
  'Retained',

  'Did not opt for Upgradation',
  'Did not fill up fresh choices.',
  'Not Allotted',
  'No Upgradation',
];


const statusCounts = {};


for (
  const status of
  possibleStatuses
) {

  let count =
    0;


  for (
    const line of
    lines
  ) {

    if (
      line === status ||
      line.includes(
        status
      )
    ) {
      count +=
        1;
    }
  }


  statusCounts[
    status
  ] =
    count;
}


/*
|--------------------------------------------------------------------------
| Row context helper
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
      row.lineIndex - 3
    );


  const to =
    Math.min(
      lines.length,
      row.lineIndex + 24
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
| Summary
|--------------------------------------------------------------------------
*/

console.log(
  '\n========================================'
);

console.log(
  'NEET 2024 ROUND-2 STRUCTURE AUDIT'
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

      statusCounts,
    },
    null,
    2
  )
);


/*
|--------------------------------------------------------------------------
| Representative rows
|--------------------------------------------------------------------------
*/

showContext(
  starts[0],
  'FIRST ROW'
);


showContext(
  starts[1],
  'SECOND ROW'
);


showContext(
  starts[
    Math.floor(
      starts.length /
      2
    )
  ],
  'MIDDLE ROW'
);


showContext(
  starts[
    starts.length -
    1
  ],
  'LAST ROW'
);


/*
|--------------------------------------------------------------------------
| Decimal ranks
|--------------------------------------------------------------------------
*/

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


/*
|--------------------------------------------------------------------------
| Last 20 rows
|--------------------------------------------------------------------------
*/

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
