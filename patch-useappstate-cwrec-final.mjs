import fs from 'node:fs';

const file =
  './frontend/src/hooks/useAppState.jsx';

const backup =
  './frontend/src/hooks/useAppState.jsx.before-cwrec-final-wire';

let source =
  fs.readFileSync(file, 'utf8');

fs.copyFileSync(
  file,
  backup
);


/*
|--------------------------------------------------------------------------
| 1. ADD CW-REC IMPORT
|--------------------------------------------------------------------------
*/

if (
  !source.includes(
    "cwRecRecommendationService"
  )
) {
  const importAnchor =
    source.indexOf('\n\n');

  if (importAnchor === -1) {
    console.error(
      '❌ Import insertion point not found'
    );
    process.exit(1);
  }

  source =
    source.slice(
      0,
      importAnchor + 2
    ) +
    `import {
  fetchCWRecommendations,
} from '../services/cwRecRecommendationService';

` +
    source.slice(
      importAnchor + 2
    );
}


/*
|--------------------------------------------------------------------------
| 2. REPLACE OLD JOSAA FETCH
|--------------------------------------------------------------------------
*/

const oldPattern =
  /rows\s*=\s*await\s+fetchJosaaResults\s*\(\s*exactProfile\s*\)\s*;/;

if (
  !oldPattern.test(source)
) {
  console.error(
    '❌ Active fetchJosaaResults(exactProfile) block not found'
  );
  process.exit(1);
}

source =
  source.replace(
    oldPattern,
`const cwRecResponse =
            await fetchCWRecommendations(
              {
                ...exactProfile,

                examId:
                  requestExamId,

                rank:
                  Number(
                    exactProfile.rank
                  ),

                year:
                  Number(
                    exactProfile.year ||
                    2026
                  ),

                round:
                  Number(
                    exactProfile.round ||
                    1
                  ),

                category:
                  exactProfile.category,

                gender:
                  exactProfile.gender,

                homeState:
                  exactProfile.homeState,
              },
              {
                limit: 1000,
              }
            );

          rows =
            Array.isArray(
              cwRecResponse?.data
            )
              ? cwRecResponse.data
              : [];`
  );


fs.writeFileSync(
  file,
  source,
  'utf8'
);

console.log(
  '✅ JEE/JoSAA Results wired to CW-REC'
);

console.log(
  '✅ Gender passed'
);

console.log(
  '✅ Home State passed'
);

console.log(
  '✅ Limit 1000'
);

console.log(
  '✅ Scoring formulas untouched'
);

console.log(
  '✅ Backup created: ' +
  backup
);
