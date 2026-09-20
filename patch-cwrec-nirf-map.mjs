import fs from 'node:fs';

const file =
  './frontend/src/services/cwRecRecommendationService.js';

const backup =
  './frontend/src/services/cwRecRecommendationService.js.before-nirf-rank-map';

let source =
  fs.readFileSync(file, 'utf8');

fs.copyFileSync(
  file,
  backup
);

const anchor =
`      type:
        row?.collegeType ||
        '',
    },`;

const replacement =
`      type:
        row?.collegeType ||
        '',

      nirfRank:
        row?.nirfRank ??
        null,

      nirfScore:
        row?.nirfScore ??
        null,
    },`;

if (!source.includes(anchor)) {
  console.error(
    '❌ College adapter anchor not found'
  );
  process.exit(1);
}

source =
  source.replace(
    anchor,
    replacement
  );

fs.writeFileSync(
  file,
  source,
  'utf8'
);

console.log(
  '✅ nirfRank mapped into row.college'
);

console.log(
  '✅ nirfScore mapped into row.college'
);

console.log(
  '✅ Existing scoring untouched'
);
