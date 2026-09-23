import fs from 'fs';


const parserFile =
  './backend/parse-neet-mcc-2025-round3.js';

const textFile =
  './data/neet/mcc/2025/text/round-3.txt';


const raw =
  fs.readFileSync(
    textFile,
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


function normalize(
  value
) {
  return String(
    value ?? ''
  )
    .replace(/\s+/g, ' ')
    .trim();
}


function quotaMatchKey(
  value
) {
  return normalize(
    value
  )
    .toLowerCase()

    .replace(
      /\bpa\s+id\b/g,
      'paid'
    )

    .replace(
      /\bwi\s+dows\b/g,
      'widows'
    )

    .replace(
      /\bwid\s+ows\b/g,
      'widows'
    )

    .replace(
      /\s*\/\s*/g,
      '/'
    )

    .replace(
      /\s*-\s*/g,
      '-'
    )

    .replace(
      /\(\s+/g,
      '('
    )

    .replace(
      /\s+\)/g,
      ')'
    )

    .replace(
      /\s+/g,
      ' '
    )

    .trim();
}


/*
|--------------------------------------------------------------------------
| Extract official quota glossary
|--------------------------------------------------------------------------
*/

const start =
  lines.findIndex(
    line =>
      /^Quota Abbrevation$/i.test(
        line
      )
  );


const end =
  lines.findIndex(
    (
      line,
      index
    ) =>
      index >
        start &&
      /^Allotted Category Abbrevations$/i.test(
        line
      )
  );


if (
  start < 0 ||
  end <= start
) {
  throw new Error(
    'Quota glossary not found.'
  );
}


const quotas = [];


let i =
  start + 3;


while (
  i + 1 <
  end
) {

  const code =
    normalize(
      lines[i]
    );


  const description =
    normalize(
      lines[
        i + 1
      ]
    );


  if (
    code &&
    description &&
    code.length <=
      12
  ) {

    quotas.push({
      code,
      description,
      key:
        quotaMatchKey(
          description
        ),
    });
  }


  i +=
    2;
}


console.log(
  '\n========================================'
);

console.log(
  'OFFICIAL QUOTA DICTIONARY'
);

console.log(
  '========================================\n'
);


console.table(
  quotas
);


/*
|--------------------------------------------------------------------------
| Show exact lines around known broken variants
|--------------------------------------------------------------------------
*/

const probes = [
  'Puducher',
  'Employee',
  'Non-',
  'AM U',
  'Ja mia',
  'Quot a',
];


for (
  const probe of
  probes
) {

  console.log(
    '\n\n========================================'
  );

  console.log(
    `PROBE: ${probe}`
  );

  console.log(
    '========================================'
  );


  let shown =
    0;


  for (
    let index =
      0;
    index <
      lines.length;
    index +=
      1
  ) {

    if (
      !lines[index]
        .toLowerCase()
        .includes(
          probe.toLowerCase()
        )
    ) {
      continue;
    }


    const from =
      Math.max(
        0,
        index - 3
      );


    const to =
      Math.min(
        lines.length,
        index + 8
      );


    console.log(
      '\n--- SAMPLE ---'
    );


    for (
      let j =
        from;
      j <
        to;
      j +=
        1
    ) {

      console.log(
        `${String(j).padStart(7, ' ')}: ${lines[j]}`
      );
    }


    shown +=
      1;


    if (
      shown >=
      3
    ) {
      break;
    }
  }


  console.log(
    `\nSamples shown: ${shown}`
  );
}
