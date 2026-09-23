import fs from 'fs';
import path from 'path';


const ROOT =
  path.resolve(
    './data/neet/mcc/2025/text'
  );


const FILES = [
  'round-1',
  'round-2',
  'round-3',
  'stray',
  'special-stray',
];


function normalizeLines(
  text
) {
  return String(
    text || ''
  )
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map(
      line =>
        line
          .replace(/\s+/g, ' ')
          .trim()
    )
    .filter(
      Boolean
    );
}


function printRange(
  lines,
  start,
  count
) {

  const from =
    Math.max(
      0,
      start
    );


  const to =
    Math.min(
      lines.length,
      from +
      count
    );


  for (
    let i = from;
    i < to;
    i += 1
  ) {
    console.log(
      `${String(
        i + 1
      ).padStart(
        7,
        ' '
      )}: ${lines[i]}`
    );
  }
}


function findAny(
  lines,
  patterns
) {

  for (
    let i = 0;
    i <
      lines.length;
    i += 1
  ) {

    const lower =
      lines[i]
        .toLowerCase();


    for (
      const pattern of
      patterns
    ) {

      if (
        lower.includes(
          pattern.toLowerCase()
        )
      ) {
        return i;
      }
    }
  }


  return -1;
}


for (
  const key of FILES
) {

  const file =
    path.join(
      ROOT,
      `${key}.txt`
    );


  console.log(
    '\n\n============================================================'
  );

  console.log(
    key.toUpperCase()
  );

  console.log(
    '============================================================'
  );


  const text =
    fs.readFileSync(
      file,
      'utf8'
    );


  const lines =
    normalizeLines(
      text
    );


  console.log(
    `LINES: ${lines.length}`
  );


  console.log(
    '\n----- FIRST 140 NON-EMPTY LINES -----'
  );


  printRange(
    lines,
    0,
    140
  );


  const headerIndex =
    findAny(
      lines,
      [
        'SNo',
        'Allotted Quota',
        'Round 1',
        'Round 2',
        'Round 3',
        'Rank',
      ]
    );


  console.log(
    '\n----- HEADER AREA -----'
  );


  if (
    headerIndex >=
    0
  ) {
    printRange(
      lines,
      Math.max(
        0,
        headerIndex -
        20
      ),
      120
    );
  } else {
    console.log(
      'Header marker not found.'
    );
  }


  console.log(
    '\n----- LAST 100 NON-EMPTY LINES -----'
  );


  printRange(
    lines,
    Math.max(
      0,
      lines.length -
      100
    ),
    100
  );
}
