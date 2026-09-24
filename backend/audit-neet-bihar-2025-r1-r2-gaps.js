import fs from 'fs';
import path from 'path';

const parsedFile =
  './data/neet/state/bihar/2025/parsed/round-1-2-combined-orcr.json';

const rejectedFile =
  './data/neet/state/bihar/2025/parsed/round-1-2-combined-rejected.json';

const textFile =
  './data/neet/state/bihar/2025/text/round-1-2-combined.txt';


const parsed =
  JSON.parse(
    fs.readFileSync(
      parsedFile,
      'utf8'
    )
  );

const rejected =
  JSON.parse(
    fs.readFileSync(
      rejectedFile,
      'utf8'
    )
  );

const lines =
  fs.readFileSync(
    textFile,
    'utf8'
  )
    .split(/\r?\n/)
    .map(
      line =>
        line.trim()
    )
    .filter(Boolean);


const medicalLines =
  lines.filter(
    line =>
      /M\.?B\.?B\.?S\.?|B\.?D\.?S\.?/i.test(
        line
      ) &&
      !/INSTITUTE|OPENING AND CLOSING RANK/i.test(
        line
      )
  );


console.log(
  '\n========================================'
);

console.log(
  'BIHAR 2025 R1+R2 GAP AUDIT'
);

console.log(
  '========================================'
);

console.log(
  'Raw MBBS/BDS-looking lines:',
  medicalLines.length
);

console.log(
  'Parsed:',
  parsed.length
);

console.log(
  'Rejected:',
  rejected.length
);


console.log(
  '\n===== REJECTED ROWS ====='
);

console.log(
  JSON.stringify(
    rejected,
    null,
    2
  )
);


/*
|--------------------------------------------------------------------------
| SOURCE INSTITUTE + COURSE SIGNATURES
|--------------------------------------------------------------------------
*/

function normalize(
  value
) {
  return String(
    value || ''
  )
    .toUpperCase()
    .replace(
      /\s+/g,
      ''
    )
    .replace(
      /[^A-Z0-9]/g,
      ''
    );
}


const parsedSignatures =
  parsed.map(
    row => ({
      institute:
        row.institute,

      course:
        row.course,

      signature:
        normalize(
          row.institute
        ) +
        '|' +
        row.course
    })
  );


console.log(
  '\n===== PARSED COUNTS BY INSTITUTE ====='
);

const byInstitute = {};

for (
  const row of parsed
) {
  const key =
    `${row.institute} | ${row.course}`;

  byInstitute[key] =
    (
      byInstitute[key] ||
      0
    ) + 1;
}

console.table(
  Object.entries(
    byInstitute
  )
    .sort(
      (
        a,
        b
      ) =>
        a[0].localeCompare(
          b[0]
        )
    )
    .map(
      (
        [
          key,
          count
        ]
      ) => ({
        instituteCourse:
          key,

        rows:
          count
      })
    )
);


/*
|--------------------------------------------------------------------------
| SHOW SUSPICIOUS SOURCE LINES
|--------------------------------------------------------------------------
|
| Short / unusual rows are most likely to be missed.
|
*/

console.log(
  '\n===== SUSPICIOUS RAW MBBS/BDS LINES ====='
);

medicalLines
  .filter(
    line =>
      /NRI|MM|B\.D\.S\.|M\.B\.B\.S\.\s+(General|Female)\s+[A-Z]+\d{1,6}$/i.test(
        line
      ) ||
      line.length < 55
  )
  .forEach(
    (
      line,
      index
    ) => {
      console.log(
        `${index + 1}: ${line}`
      );
    }
  );


console.log(
  '\n========================================'
);

console.log(
  'DO NOT FREEZE YET'
);

console.log(
  '========================================'
);
