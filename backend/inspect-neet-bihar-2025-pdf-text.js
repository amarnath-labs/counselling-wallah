import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';

const INPUT =
  path.resolve(
    './data/neet/state/bihar/2025/raw/round-1-2-combined-opening-closing-rank.pdf'
  );

const OUTPUT =
  path.resolve(
    './data/neet/state/bihar/2025/text/round-1-2-combined.txt'
  );

const buffer =
  fs.readFileSync(INPUT);

const result =
  await pdf(buffer);

fs.writeFileSync(
  OUTPUT,
  result.text,
  'utf8'
);

const lines =
  result.text
    .split(/\r?\n/)
    .map(
      line =>
        line.trim()
    )
    .filter(Boolean);

console.log(
  '\nTOTAL TEXT CHARS:',
  result.text.length
);

console.log(
  'TOTAL LINES:',
  lines.length
);

console.log(
  '\n===== FIRST 120 LINES ====='
);

lines
  .slice(
    0,
    120
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
  '\n===== COURSE / MEDICAL MATCHES ====='
);

const matches =
  lines.filter(
    line =>
      /MBBS|M\.?B\.?B\.?S|BDS|B\.?D\.?S|MEDICAL|DENTAL/i.test(
        line
      )
  );

console.log(
  'Matches:',
  matches.length
);

matches
  .slice(
    0,
    100
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
  '\nTEXT SAVED TO:'
);

console.log(
  OUTPUT
);
