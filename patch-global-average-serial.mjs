import fs from "node:fs";

const file =
  "./frontend/src/components/RecommendationSlide.jsx";

const backup =
  "./frontend/src/components/RecommendationSlide.before-global-average-serial.jsx";

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

fs.copyFileSync(
  file,
  backup
);

/*
|--------------------------------------------------------------------------
| 1. ADD GLOBAL AVERAGE-RANK MAP
|--------------------------------------------------------------------------
*/

const useMemoMarker =
`  const groupedRows =
    useMemo(`;

const markerIndex =
  s.indexOf(
    useMemoMarker
  );

if (markerIndex < 0) {
  throw new Error(
    "groupedRows useMemo marker not found. No changes written."
  );
}

if (
  !s.includes(
    "const globalAverageRankMap ="
  )
) {
  const addition =
`  /*
  |--------------------------------------------------------------------------
  | GLOBAL SERIAL RANKING
  |--------------------------------------------------------------------------
  |
  | Serial number is decided ONLY by:
  |
  |   (Overall Match + Review Score) / 2
  |
  | Admission bucket stays unchanged.
  |--------------------------------------------------------------------------
  */

  const globalAverageRankMap =
    useMemo(
      () => {
        const uniqueRows =
          dedupeRecommendationRows(
            rows
          );

        const sorted =
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

        const map =
          new Map();

        sorted.forEach(
          (row, index) => {
            map.set(
              recommendationUniqueKey(
                row
              ),
              index
            );
          }
        );

        return map;
      },
      [rows]
    );


`;

  s =
    s.slice(
      0,
      markerIndex
    ) +
    addition +
    s.slice(
      markerIndex
    );
}

/*
|--------------------------------------------------------------------------
| 2. REPLACE OLD SERIAL OFFSET INDEX
|--------------------------------------------------------------------------
*/

const oldIndexRegex =
  /index=\{\s*serialOffset\s*\+\s*index\s*\}/m;

if (
  !oldIndexRegex.test(s)
) {
  throw new Error(
    "Old serialOffset + index block not found. No changes written."
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
| 3. WRITE
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
  "GLOBAL OVERALL + REVIEW SERIAL RANKING APPLIED"
);
console.log(
  "=============================================="
);
console.log(
  "Formula: (Overall Match + Review Score) / 2"
);
console.log(
  "Serial: GLOBAL average-based"
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
