import fs from "node:fs";

const file =
  "./frontend/src/components/RecommendationSlide.jsx";

const backup =
  "./frontend/src/components/RecommendationSlide.before-global-average-serial-v2.jsx";

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

/*
|--------------------------------------------------------------------------
| VERIFY REQUIRED HELPERS
|--------------------------------------------------------------------------
*/

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


/*
|--------------------------------------------------------------------------
| FIND groupedRows DECLARATION
|--------------------------------------------------------------------------
*/

const groupedRegex =
  /const\s+groupedRows\s*=\s*useMemo\s*\(/m;

const groupedMatch =
  s.match(
    groupedRegex
  );

if (!groupedMatch) {
  throw new Error(
    "groupedRows useMemo declaration not found. No changes written."
  );
}

const groupedIndex =
  groupedMatch.index;


/*
|--------------------------------------------------------------------------
| BACKUP
|--------------------------------------------------------------------------
*/

fs.copyFileSync(
  file,
  backup
);


/*
|--------------------------------------------------------------------------
| INSERT GLOBAL AVERAGE SERIAL MAP
|--------------------------------------------------------------------------
*/

if (
  !s.includes(
    "const globalAverageRankMap ="
  )
) {
  const addition =
`
  /*
  |--------------------------------------------------------------------------
  | GLOBAL SERIAL RANKING
  |--------------------------------------------------------------------------
  |
  | Serial number:
  |
  |   (Overall Match + Review Score) / 2
  |
  | Review missing -> Overall Match fallback.
  |
  | Admission bucket remains unchanged.
  |--------------------------------------------------------------------------
  */

  const globalAverageRankMap =
    useMemo(
      () => {
        const uniqueRows =
          dedupeRecommendationRows(
            rows
          );

        const sortedRows =
          [...uniqueRows].sort(
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

        const rankMap =
          new Map();

        sortedRows.forEach(
          (row, index) => {
            rankMap.set(
              recommendationUniqueKey(
                row
              ),
              index
            );
          }
        );

        return rankMap;
      },
      [rows]
    );


`;

  s =
    s.slice(
      0,
      groupedIndex
    ) +
    addition +
    s.slice(
      groupedIndex
    );
}


/*
|--------------------------------------------------------------------------
| REPLACE CARD SERIAL INDEX
|--------------------------------------------------------------------------
*/

const oldIndexRegex =
  /index=\{\s*serialOffset\s*\+\s*index\s*\}/m;

if (
  !oldIndexRegex.test(s)
) {
  throw new Error(
    "RecommendationCard old serialOffset + index not found. No changes written."
  );
}

s =
  s.replace(
    oldIndexRegex,
`index={
                              globalAverageRankMap.get(
                                recommendationUniqueKey(
                                  row
                                )
                              ) ?? index
                            }`
  );


/*
|--------------------------------------------------------------------------
| SAFETY CHECKS
|--------------------------------------------------------------------------
*/

if (
  !s.includes(
    "const globalAverageRankMap ="
  )
) {
  throw new Error(
    "globalAverageRankMap insertion failed."
  );
}

if (
  /index=\{\s*serialOffset\s*\+\s*index\s*\}/m.test(
    s
  )
) {
  throw new Error(
    "Old serialOffset index still exists."
  );
}


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
  "GLOBAL AVERAGE SERIAL V2 APPLIED"
);
console.log(
  "=============================================="
);
console.log(
  "Formula: (Overall Match + Review Score) / 2"
);
console.log(
  "Review missing: Overall fallback"
);
console.log(
  "Admission bucket: UNCHANGED"
);
console.log(
  "Choice filling: UNCHANGED"
);
console.log(
  "Backup:",
  backup
);
