import fs from 'fs';

const file =
  './data/neet/mcc/2025/text/round-3.txt';

const text =
  fs.readFileSync(
    file,
    'utf8'
  );

const lines =
  text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map(
      line =>
        line
          .replace(/\s+/g, ' ')
          .trim()
    )
    .filter(Boolean);


const TARGET_RANKS = [
  1,
  148,
  207,
  378,
  1317215,
];


function findRank(
  rank
) {
  const wanted =
    String(rank);

  for (
    let i = 0;
    i <
      lines.length;
    i += 1
  ) {
    if (
      lines[i] ===
      wanted
    ) {
      return i;
    }
  }

  return -1;
}


for (
  const rank of
  TARGET_RANKS
) {

  const index =
    findRank(
      rank
    );


  console.log(
    '\n\n============================================================'
  );

  console.log(
    `RANK ${rank}`
  );

  console.log(
    '============================================================'
  );


  if (
    index <
      0
  ) {
    console.log(
      'NOT FOUND'
    );

    continue;
  }


  const start =
    Math.max(
      0,
      index - 15
    );


  const end =
    Math.min(
      lines.length,
      index + 75
    );


  for (
    let i =
      start;
    i <
      end;
    i += 1
  ) {

    const marker =
      i === index
        ? '>>>'
        : '   ';


    console.log(
      `${marker} ${String(i).padStart(7, ' ')}: ${lines[i]}`
    );
  }
}
