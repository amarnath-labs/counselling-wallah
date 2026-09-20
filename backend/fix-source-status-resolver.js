import fs from 'node:fs';

const file = './resolve-fee-profiles.js';

let code = fs.readFileSync(file, 'utf8');

const oldBlock = `  } else if (
    hasOfficial &&
    confidence >= 85
  ) {
    verificationStatus =
      'high_confidence';`;

const newBlock = `  } else if (
    hasOfficial &&
    confidence >= 85 &&
    rows.some(
      row =>
        row.verification_status ===
          'high_confidence' ||
        row.verification_status ===
          'verified'
    )
  ) {
    verificationStatus =
      'high_confidence';`;

if (!code.includes(oldBlock)) {
  console.error(
    'Official confidence block not found.'
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
  'Resolver now respects source verification status.'
);
