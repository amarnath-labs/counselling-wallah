import fs from 'node:fs';

const file = './resolve-fee-profiles.js';

let code = fs.readFileSync(file, 'utf8');

const oldBlock = `  } else if (
    rows.length >= 2 &&
    confidence >= 65
  ) {
    verificationStatus =
      'high_confidence';
  } else {
    verificationStatus =
      'review_recommended';
  }`;

const newBlock = `  } else if (
    rows.length >= 2 &&
    confidence >= 65
  ) {
    /*
     * Multiple sources alone are NOT enough for
     * high-confidence status.
     *
     * They may be secondary sources, use different
     * fee definitions, or disagree on course totals.
     */
    verificationStatus =
      'review_recommended';
  } else {
    verificationStatus =
      'review_recommended';
  }`;

if (!code.includes(oldBlock)) {
  console.error(
    'Multi-source confidence block not found.'
  );
  process.exit(1);
}

code = code.replace(
  oldBlock,
  newBlock
);

fs.writeFileSync(
  file,
  code,
  'utf8'
);

console.log(
  'Secondary multi-source confidence rule fixed.'
);
