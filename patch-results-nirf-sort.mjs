import fs from 'node:fs';

const file =
  './frontend/src/services/recommendationService.js';

const backup =
  './frontend/src/services/recommendationService.js.before-nirf-sort';

let source =
  fs.readFileSync(file, 'utf8');

fs.copyFileSync(
  file,
  backup
);

const oldSort =
`  } else {
    rows.sort(
      (a, b) =>
        b.overall -
        a.overall
    );
  }`;

const newSort =
`  } else {
    rows.sort(
      (a, b) => {
        const aRank =
          Number(
            a?.college?.nirfRank
          );

        const bRank =
          Number(
            b?.college?.nirfRank
          );

        const aValid =
          Number.isFinite(
            aRank
          ) &&
          aRank > 0;

        const bValid =
          Number.isFinite(
            bRank
          ) &&
          bRank > 0;

        if (
          aValid &&
          bValid &&
          aRank !== bRank
        ) {
          return (
            aRank -
            bRank
          );
        }

        if (
          aValid &&
          !bValid
        ) {
          return -1;
        }

        if (
          !aValid &&
          bValid
        ) {
          return 1;
        }

        return (
          Number(
            b?.overall || 0
          ) -
          Number(
            a?.overall || 0
          )
        );
      }
    );
  }`;

if (!source.includes(oldSort)) {
  console.error(
    '❌ Default sort block not found'
  );
  process.exit(1);
}

source =
  source.replace(
    oldSort,
    newSort
  );

fs.writeFileSync(
  file,
  source,
  'utf8'
);

console.log(
  '✅ Default positioning changed to NIRF rank'
);

console.log(
  '✅ Lower NIRF rank appears first'
);

console.log(
  '✅ Missing NIRF goes last'
);

console.log(
  '✅ Overall score used only as fallback'
);

console.log(
  '✅ Bucket/scoring logic untouched'
);
