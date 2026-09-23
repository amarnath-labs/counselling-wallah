import fs from 'fs';

const file =
  './data/neet/mcc/2025/text/round-2.txt';

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


let found =
  -1;


for (
  let i = 0;
  i <
    lines.length - 1;
  i += 1
) {
  if (
    lines[i] ===
      '19749' &&
    lines[i + 1] ===
      '140708'
  ) {
    found =
      i;

    break;
  }
}


if (
  found <
    0
) {
  console.log(
    'Target row not found.'
  );

  process.exit(1);
}


console.log(
  '========================================'
);

console.log(
  'TARGET: SNo 19749 / Rank 140708'
);

console.log(
  '========================================'
);


const start =
  Math.max(
    0,
    found - 25
  );


const end =
  Math.min(
    lines.length,
    found + 70
  );


for (
  let i =
    start;
  i <
    end;
  i += 1
) {
  const marker =
    i === found
      ? '>>>'
      : '   ';

  console.log(
    `${marker} ${String(i).padStart(7, ' ')}: ${lines[i]}`
  );
}
