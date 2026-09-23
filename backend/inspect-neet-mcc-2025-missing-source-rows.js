import fs from 'fs';


const BASE =
  './data/neet/mcc/2025/text';


const targets = {
  1: [
    7265,
  ],

  2: [
    8277,
    31034,
    34795,
  ],
};


function loadLines(
  file
) {

  return fs
    .readFileSync(
      file,
      'utf8'
    )
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n');
}


function inspect(
  round,
  targetSNo
) {

  const file =
    `${BASE}/round-${round}.txt`;


  const lines =
    loadLines(
      file
    );


  const matches = [];


  /*
   * Search several exact textual forms because PDF extraction
   * may put SNo alone, with rank, or with surrounding spaces.
   */

  const patterns = [
    new RegExp(
      `^\\s*${targetSNo}\\s*$`
    ),

    new RegExp(
      `^\\s*${targetSNo}\\s+\\d`
    ),

    new RegExp(
      `\\b${targetSNo}\\b`
    ),
  ];


  for (
    let i = 0;
    i < lines.length;
    i += 1
  ) {

    const line =
      lines[i];


    if (
      patterns.some(
        regex =>
          regex.test(
            line
          )
      )
    ) {

      matches.push(
        i
      );
    }
  }


  console.log(
    '\n========================================'
  );

  console.log(
    `ROUND ${round} | TARGET SNo ${targetSNo}`
  );

  console.log(
    '========================================'
  );


  console.log(
    'Match count:',
    matches.length
  );


  for (
    const index of
    matches.slice(
      0,
      10
    )
  ) {

    const from =
      Math.max(
        0,
        index - 15
      );


    const to =
      Math.min(
        lines.length,
        index + 40
      );


    console.log(
      `\n--- SOURCE LINES ${from + 1} to ${to} ---`
    );


    for (
      let j = from;
      j < to;
      j += 1
    ) {

      const marker =
        j === index
          ? '>>>'
          : '   ';


      console.log(
        `${marker} [${j + 1}] ${lines[j]}`
      );
    }
  }
}


for (
  const [
    roundRaw,
    snos
  ] of
  Object.entries(
    targets
  )
) {

  const round =
    Number(
      roundRaw
    );


  for (
    const sno of
    snos
  ) {

    inspect(
      round,
      sno
    );
  }
}
