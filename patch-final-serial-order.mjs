import fs from "node:fs";

const file =
  "./frontend/src/components/RecommendationSlide.jsx";

const backup =
  "./frontend/src/components/RecommendationSlide.before-final-serial-order.jsx";

if (!fs.existsSync(file)) {
  throw new Error(
    `File not found: ${file}`
  );
}

let s =
  fs.readFileSync(
    file,
    "utf8"
  );

for (
  const required of [
    "function recommendationSerialScore(",
    "function recommendationUniqueKey(",
    "function dedupeRecommendationRows(",
    "const globalAverageRankMap =",
    "const groupedRows =",
  ]
) {
  if (!s.includes(required)) {
    throw new Error(
      `Required block missing: ${required}`
    );
  }
}

fs.copyFileSync(
  file,
  backup
);


/*
|--------------------------------------------------------------------------
| REPLACE groupedRows WITH ONE GLOBAL SERIAL-WISE GROUP
|--------------------------------------------------------------------------
*/

const startRegex =
  /const\s+groupedRows\s*=\s*useMemo\s*\(/m;

const match =
  s.match(
    startRegex
  );

if (!match) {
  throw new Error(
    "groupedRows start not found."
  );
}

const start =
  match.index;


/*
 * Find the JSX render condition after groupedRows.
 * This avoids depending on exact [rows] formatting.
 */
const renderMarker =
  "if (!hasRecommendationAccess)";

const end =
  s.indexOf(
    renderMarker,
    start
  );

if (end < 0) {
  throw new Error(
    "Recommendation render marker not found."
  );
}


const replacement =
`const groupedRows =
    useMemo(
      () => {
        const sortedRows =
          dedupeRecommendationRows(
            rows
          )
            .filter(Boolean)
            .sort(
              (a, b) => {
                const scoreA =
                  recommendationSerialScore(
                    a
                  );

                const scoreB =
                  recommendationSerialScore(
                    b
                  );

                if (
                  scoreA !== null &&
                  scoreB !== null &&
                  scoreA !== scoreB
                ) {
                  return (
                    scoreB -
                    scoreA
                  );
                }

                if (
                  scoreA !== null &&
                  scoreB === null
                ) {
                  return -1;
                }

                if (
                  scoreA === null &&
                  scoreB !== null
                ) {
                  return 1;
                }

                return 0;
              }
            );

        return [
          {
            bucket:
              'all',

            rows:
              sortedRows,
          },
        ];
      },
      [rows]
    );


`;

s =
  s.slice(
    0,
    start
  ) +
  replacement +
  s.slice(
    end
  );


/*
|--------------------------------------------------------------------------
| ADD "all" LABELS SO SINGLE GLOBAL GROUP RENDERS CLEANLY
|--------------------------------------------------------------------------
*/

s =
  s.replace(
`              const labels = {
                dream:
                  'Dream',
                target:
                  'Target',
                safe:
                  'Safe',
                backup:
                  'Backup',
              };`,
`              const labels = {
                all:
                  'Personalized Ranking',
                dream:
                  'Dream',
                target:
                  'Target',
                safe:
                  'Safe',
                backup:
                  'Backup',
              };`
  );

s =
  s.replace(
`              const descriptions = {
                dream:`,
`              const descriptions = {
                all:
                  'Ranked by the average of Overall Match and Review Score.',
                dream:`
  );


/*
|--------------------------------------------------------------------------
| SERIAL MUST FOLLOW VISUAL ORDER
|--------------------------------------------------------------------------
*/

s =
  s.replace(
    /index=\{\s*globalAverageRankMap\.get\([\s\S]*?\)\s*\?\?\s*index\s*\}/m,
`index={
                              index
                            }`
  );

s =
  s.replace(
    /index=\{\s*serialOffset\s*\+\s*index\s*\}/m,
`index={
                              index
                            }`
  );


/*
|--------------------------------------------------------------------------
| serialOffset IS NO LONGER NEEDED
|--------------------------------------------------------------------------
*/

s =
  s.replace(
    /const\s+serialOffset\s*=\s*groupedRows[\s\S]*?;\s*/m,
    ""
  );


fs.writeFileSync(
  file,
  s,
  "utf8"
);

console.log("");
console.log(
  "=============================================="
);
console.log(
  "FINAL SERIAL-WISE GLOBAL ORDER APPLIED"
);
console.log(
  "=============================================="
);
console.log(
  "Display: #1, #2, #3, #4..."
);
console.log(
  "Ranking: (Overall + Review) / 2"
);
console.log(
  "Bucket badges: preserved"
);
console.log(
  "Admission logic: unchanged"
);
console.log(
  "Backup:",
  backup
);
