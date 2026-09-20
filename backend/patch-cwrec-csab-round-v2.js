import fs from 'node:fs';

const file =
  './src/services/cwRecDataV1.js';

const backup =
  './src/services/cwRecDataV1.js.before-csab-round-fix';

let source =
  fs.readFileSync(
    file,
    'utf8'
  );

fs.copyFileSync(
  file,
  backup
);

const pattern =
  /if\s*\(\s*examId\s*===\s*['"]uptac['"]\s*\)\s*\{\s*return\s+raw\s*\.replace\(/m;

const matches =
  source.match(
    pattern
  );

if (
  !matches
) {
  console.error(
    '❌ UPTAC round-normalization block still not found'
  );

  process.exit(1);
}

source =
  source.replace(
    pattern,
    `if (
    [
      'uptac',
      'csab',
    ].includes(
      examId
    )
  ) {
    return raw
      .replace(`
  );

fs.writeFileSync(
  file,
  source,
  'utf8'
);

console.log(
  '✅ CSAB round normalization added'
);

console.log(
  '✅ Existing UPTAC normalization preserved'
);

console.log(
  '✅ Scoring untouched'
);
