import fs from 'node:fs';

const file =
  './frontend/src/services/cwRecRecommendationService.js';

const backup =
  './frontend/src/services/cwRecRecommendationService.js.before-limit-1000';

let source =
  fs.readFileSync(file, 'utf8');

fs.copyFileSync(
  file,
  backup
);

const oldText =
`    limit = 100,
    locationMode = 'NONE',`;

const newText =
`    limit = 1000,
    locationMode = 'NONE',`;

if (!source.includes(oldText)) {
  console.error(
    '❌ Exact CW-REC default limit block not found'
  );
  process.exit(1);
}

source =
  source.replace(
    oldText,
    newText
  );

fs.writeFileSync(
  file,
  source,
  'utf8'
);

console.log(
  '✅ CW-REC default limit changed 100 → 1000'
);
console.log(
  '✅ Scoring logic untouched'
);
console.log(
  '✅ Backup created'
);
