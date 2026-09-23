import fs from "node:fs";

const file =
  "./frontend/src/components/RecommendationSlide.jsx";

const backup =
  "./frontend/src/components/RecommendationSlide.before-serialwise-global-order.jsx";

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
  ]
) {
  if (!s.includes(required)) {
    throw new Error(
      `Required helper missing: ${required}`
    );
  }
}

fs.copyFileSync(
  file,
  backup
);


/*
|--------------------------------------------------------------------------
| FIND groupedRows useMemo
|--------------------------------------------------------------------------
*/

const groupedStartRegex =
  /const\s+groupedRows\s*=\s*useMemo\s*\(/m;

const groupedStartMatch =
  s.match(
    groupedStartRegex
  );

if (!groupedStartMatch) {
  throw new Error(
    "groupedRows declaration not found."
  );
}

const groupedStart =
  groupedStartMatch.index;


/*
|--------------------------------------------------------------------------
| FIND END OF groupedRows useMemo
|--------------------------------------------------------------------------
*/

const searchFrom =
  groupedStart;

const dependencyIndex =
  s.indexOf(
    "[rows]",
    searchFrom
  );

if (dependencyIndex < 0) {
  throw new Error(
    "groupedRows dependency [rows] not found."
  );
}

const groupedEnd =
  s.indexOf(
    ");",
    dependencyIndex
  );

if (groupedEnd < 0) {
  throw new Error(
    "groupedRows useMemo end not found."
  );
}


/*
|--------------------------------------------------------------------------
| REPLACE GROUPED BUCKET SORT WITH GLOBAL SERIAL SORT
|--------------------------------------------------------------------------
*/

const newGroupedRows =
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
    );`;

s =
  s.slice(
    0,
    groupedStart
  ) +
  newGroupedRows +
  s.slice(
    groupedEnd + 2
  );


/*
|--------------------------------------------------------------------------
| FORCE SERIAL = VISUAL INDEX
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
| REMOVE SERIAL OFFSET EFFECT
|--------------------------------------------------------------------------
*/

s =
  s.replace(
    /const\s+serialOffset\s*=\s*groupedRows[\s\S]*?;\s*/m,
    ""
  );


/*
|--------------------------------------------------------------------------
| WRITE
|--------------------------------------------------------------------------
*/

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
  "SERIAL-WISE GLOBAL RANKING APPLIED"
);
console.log(
  "=============================================="
);
console.log(
  "#1, #2, #3... now follow visual order"
);
console.log(
  "Ranking formula: (Overall + Review) / 2"
);
console.log(
  "Admission bucket labels: UNCHANGED"
);
console.log(
  "Choice filling: UNCHANGED"
);
console.log(
  "Backup:",
  backup
);
