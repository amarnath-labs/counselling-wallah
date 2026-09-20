import fs from 'node:fs';

const file =
  './frontend/src/components/CollegeCard.jsx';

const backup =
  './frontend/src/components/CollegeCard.jsx.before-eligibility-chips';

let source =
  fs.readFileSync(
    file,
    'utf8'
  );

fs.copyFileSync(
  file,
  backup
);

const needle = `          {branch.name && (
            <span className="meta-chip">
              {branch.name}
            </span>
          )}

`;

const replacement = `          {branch.name && (
            <span className="meta-chip">
              {branch.name}
            </span>
          )}

          {branch?.quota && (
            <span className="meta-chip">
              {branch.quota === 'HS'
                ? 'Home State'
                : branch.quota === 'OS'
                  ? 'Other State'
                  : branch.quota === 'AI'
                    ? 'All India'
                    : branch.quota}
            </span>
          )}

          {branch?.gender && (
            <span className="meta-chip">
              {String(branch.gender)
                .toLowerCase()
                .includes('female')
                ? 'Female Seat'
                : 'Gender Neutral'}
            </span>
          )}

`;

if (!source.includes(needle)) {
  console.error(
    '❌ CollegeCard meta block not found'
  );

  process.exit(1);
}

source =
  source.replace(
    needle,
    replacement
  );

fs.writeFileSync(
  file,
  source,
  'utf8'
);

console.log(
  '✅ Quota chip added'
);
console.log(
  '✅ Gender eligibility chip added'
);
console.log(
  '✅ Female/HS backend logic unchanged'
);
console.log(
  '✅ Scoring logic untouched'
);
