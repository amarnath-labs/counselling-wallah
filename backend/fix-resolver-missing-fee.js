import fs from 'node:fs';

const file = './resolve-fee-profiles.js';

let code =
  fs.readFileSync(
    file,
    'utf8'
  );

const oldBlock = `  } else if (
    hasOfficial &&
    confidence >= 85
  ) {
    verificationStatus =
      'high_confidence';
  } else if (
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
    annualAcademic === null &&
    tuition === null &&
    academicPerSemester === null
  ) {

    verificationStatus =
      'review_recommended';

    confidence =
      Math.min(
        confidence,
        70
      );

  } else if (
    hasOfficial &&
    confidence >= 85
  ) {
    verificationStatus =
      'high_confidence';
  } else if (
    rows.length >= 2 &&
    confidence >= 65
  ) {
    verificationStatus =
      'high_confidence';
  } else {
    verificationStatus =
      'review_recommended';
  }`;

if (!code.includes(oldBlock)) {
  console.error(
    'Resolver confidence block not found.'
  );

  process.exit(1);
}

code =
  code.replace(
    oldBlock,
    newBlock
  );

fs.writeFileSync(
  file,
  code,
  'utf8'
);

console.log(
  'Resolver missing-fee confidence fix applied.'
);
