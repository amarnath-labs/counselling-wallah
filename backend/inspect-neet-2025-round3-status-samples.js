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
        line
          .replace(/\s+/g, ' ')
          .trim()
    )
    .filter(Boolean);


const STATUS_PATTERNS = [
  {
    name:
      'Fresh Allotted',
    test:
      value =>
        /Fresh Allotted/i.test(value),
  },

  {
    name:
      'Upgraded',
    test:
      value =>
        /^Upgraded$/i.test(value),
  },

  {
    name:
      'No Upgradation',
    test:
      value =>
        /^No Upgradation$/i.test(value),
  },

  {
    name:
      'Did not opt',
    test:
      value =>
        /Did not opt for/i.test(value),
  },

  {
    name:
      'Did not fill',
    test:
      value =>
        /Did not fill up/i.test(value),
  },

  {
    name:
      'Not Allotted',
    test:
      value =>
        /Not Allotted/i.test(value),
  },
];


for (
  const status of
  STATUS_PATTERNS
) {

  console.log(
    '\n\n============================================================'
  );

  console.log(
    status.name
  );

  console.log(
    '============================================================'
  );


  const matches = [];


  for (
    let i = 0;
    i <
      lines.length;
    i += 1
  ) {

    if (
      status.test(
        lines[i]
      )
    ) {
      matches.push(
        i
      );
    }
  }


  console.log(
    `Occurrences: ${matches.length}`
  );


  for (
    const index of
    matches.slice(
      0,
      3
    )
  ) {

    console.log(
      '\n---------------- SAMPLE ----------------'
    );


    const start =
      Math.max(
        0,
        index - 35
      );


    const end =
      Math.min(
        lines.length,
        index + 15
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
}
