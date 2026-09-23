import fs from 'fs';

const file =
  './data/neet/mcc/2025/text/round-3.txt';

const lines =
  fs.readFileSync(
    file,
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


const targets = [
  '13767.5',
  '13767',
  '137675',
];


for (
  const target of
  targets
) {

  console.log(
    '\n========================================'
  );

  console.log(
    `TARGET: ${target}`
  );

  console.log(
    '========================================'
  );


  let found =
    0;


  for (
    let i = 0;
    i <
      lines.length;
    i += 1
  ) {

    if (
      lines[i] !==
      target
    ) {
      continue;
    }


    found +=
      1;


    const start =
      Math.max(
        0,
        i - 30
      );


    const end =
      Math.min(
        lines.length,
        i + 70
      );


    console.log(
      `\nFOUND AT INDEX ${i}\n`
    );


    for (
      let j =
        start;
      j <
        end;
      j += 1
    ) {

      const marker =
        j === i
          ? '>>>'
          : '   ';


      console.log(
        `${marker} ${String(j).padStart(7, ' ')}: ${lines[j]}`
      );
    }
  }


  console.log(
    `\nOccurrences: ${found}`
  );
}
