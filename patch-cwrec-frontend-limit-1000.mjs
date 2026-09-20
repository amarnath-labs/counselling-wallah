import fs from 'node:fs';

const file =
  './frontend/src/hooks/useAppState.jsx';

const backup =
  './frontend/src/hooks/useAppState.jsx.before-cwrec-1000-limit';

let source =
  fs.readFileSync(file, 'utf8');

fs.copyFileSync(
  file,
  backup
);

const before = source;

source =
  source.replace(
    /(fetchCWRecommendations\s*\([\s\S]{0,800}?limit\s*:\s*)500\b/,
    '$11000'
  );

if (source === before) {
  console.error(
    '❌ CW-REC limit: 500 not found near fetchCWRecommendations'
  );
  process.exit(1);
}

fs.writeFileSync(
  file,
  source,
  'utf8'
);

console.log(
  '✅ CW-REC frontend result limit changed 500 → 1000'
);
