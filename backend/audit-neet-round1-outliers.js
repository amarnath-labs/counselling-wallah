import fs from 'fs';
import path from 'path';

const FILE =
  path.resolve(
    './data/neet/mcc/2026/text/round-1.txt'
  );

const TARGET_RANKS = [
  5866,
  54144,
  263229,
  20015,
  49241,
];

const text =
  fs.readFileSync(
    FILE,
    'utf8'
  );

const lines =
  text
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


function isNoise(value) {
  return (
    /^Page No\./i.test(value) ||
    /^\d{2}-\d{2}-\d{4}/.test(value) ||
    /^NEET-UG\s+Counselling/i.test(value)
  );
}


for (
  const rank of TARGET_RANKS
) {

  console.log(
    '\n\n========================================'
  );

  console.log(
    `RANK ${rank}`
  );

  console.log(
    '========================================'
  );


  const matches = [];


  for (
    let i = 0;
    i < lines.length;
    i += 1
  ) {
    if (
      lines[i] ===
      String(rank)
    ) {
      matches.push(i);
    }
  }


  if (
    matches.length === 0
  ) {
    console.log(
      'NOT FOUND'
    );

    continue;
  }


  for (
    const [
      matchNumber,
      index
    ] of matches.entries()
  ) {

    console.log(
      `\n----- MATCH ${matchNumber + 1} -----`
    );


    const from =
      Math.max(
        0,
        index - 15
      );

    const to =
      Math.min(
        lines.length,
        index + 30
      );


    for (
      let i = from;
      i < to;
      i += 1
    ) {

      if (
        isNoise(
          lines[i]
        )
      ) {
        continue;
      }


      console.log(
        `${
          i === index
            ? '>>>'
            : '   '
        } ${
          String(
            i + 1
          ).padStart(
            7,
            ' '
          )
        }: ${lines[i]}`
      );
    }
  }
}
