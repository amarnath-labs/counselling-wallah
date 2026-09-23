import fs from "node:fs";

const file =
  "./frontend/src/components/RecommendationSlide.jsx";

const backup =
  "./frontend/src/components/RecommendationSlide.before-serialwise-final-v3.jsx";

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
    "const groupedRows =",
  ]
) {
  if (!s.includes(required)) {
    throw new Error(
      `Required block missing: ${required}`
    );
  }
}


/*
|--------------------------------------------------------------------------
| LOCATE groupedRows useMemo SAFELY
|--------------------------------------------------------------------------
*/

const groupedStart =
  s.indexOf(
    "const groupedRows ="
  );

if (groupedStart < 0) {
  throw new Error(
    "groupedRows start not found."
  );
}

const useMemoIndex =
  s.indexOf(
    "useMemo",
    groupedStart
  );

if (useMemoIndex < 0) {
  throw new Error(
    "groupedRows useMemo not found."
  );
}

const openParen =
  s.indexOf(
    "(",
    useMemoIndex
  );

if (openParen < 0) {
  throw new Error(
    "useMemo opening parenthesis not found."
  );
}


/*
|--------------------------------------------------------------------------
| BALANCED PARENTHESIS SCANNER
|--------------------------------------------------------------------------
*/

let depth = 0;
let endParen = -1;

let quote = null;
let escaped = false;
let lineComment = false;
let blockComment = false;

for (
  let i = openParen;
  i < s.length;
  i++
) {
  const ch =
    s[i];

  const next =
    s[i + 1];

  if (lineComment) {
    if (ch === "\n") {
      lineComment = false;
    }

    continue;
  }

  if (blockComment) {
    if (
      ch === "*" &&
      next === "/"
    ) {
      blockComment = false;
      i++;
    }

    continue;
  }

  if (quote) {
    if (escaped) {
      escaped = false;
      continue;
    }

    if (ch === "\\") {
      escaped = true;
      continue;
    }

    if (ch === quote) {
      quote = null;
    }

    continue;
  }

  if (
    ch === "/" &&
    next === "/"
  ) {
    lineComment = true;
    i++;
    continue;
  }

  if (
    ch === "/" &&
    next === "*"
  ) {
    blockComment = true;
    i++;
    continue;
  }

  if (
    ch === "'" ||
    ch === '"' ||
    ch === "`"
  ) {
    quote = ch;
    continue;
  }

  if (ch === "(") {
    depth++;
    continue;
  }

  if (ch === ")") {
    depth--;

    if (depth === 0) {
      endParen = i;
      break;
    }
  }
}

if (endParen < 0) {
  throw new Error(
    "Could not find end of groupedRows useMemo."
  );
}


/*
|--------------------------------------------------------------------------
| INCLUDE TRAILING SEMICOLON
|--------------------------------------------------------------------------
*/

let groupedEnd =
  endParen + 1;

while (
  groupedEnd < s.length &&
  /\s/.test(
    s[groupedEnd]
  )
) {
  groupedEnd++;
}

if (
  s[groupedEnd] === ";"
) {
  groupedEnd++;
}


/*
|--------------------------------------------------------------------------
| NEW GLOBAL SERIAL-WISE LIST
|--------------------------------------------------------------------------
*/

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

                /*
                 * Stable tie-breaker:
                 * Overall Match high -> low.
                 */

                const overallA =
                  Number(
                    a?.matchScore ??
                    a?.premium?.score ??
                    a?.overall ??
                    -1
                  );

                const overallB =
                  Number(
                    b?.matchScore ??
                    b?.premium?.score ??
                    b?.overall ??
                    -1
                  );

                return (
                  overallB -
                  overallA
                );
              }
            );

        if (
          sortedRows.length === 0
        ) {
          return [];
        }

        return [
          {
            bucket:
              "all",

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
  replacement +
  s.slice(
    groupedEnd
  );


/*
|--------------------------------------------------------------------------
| ADD LABEL FOR THE SINGLE GLOBAL GROUP
|--------------------------------------------------------------------------
*/

if (
  !s.includes(
    "all:\n                  'Personalized Ranking'"
  )
) {
  s =
    s.replace(
      /const\s+labels\s*=\s*\{/,
`const labels = {
                all:
                  'Personalized Ranking',`
    );
}


/*
|--------------------------------------------------------------------------
| ADD DESCRIPTION
|--------------------------------------------------------------------------
*/

if (
  !s.includes(
    "Ranked by Overall Match and Review Score average."
  )
) {
  s =
    s.replace(
      /const\s+descriptions\s*=\s*\{/,
`const descriptions = {
                all:
                  'Ranked by Overall Match and Review Score average.',`
    );
}


/*
|--------------------------------------------------------------------------
| SERIAL NUMBER MUST BE 1, 2, 3, 4... VISUALLY
|--------------------------------------------------------------------------
|
| RecommendationCard itself displays:
|
|   #{index + 1}
|
| So pass the row's visual index directly.
|--------------------------------------------------------------------------
*/

const rankIndexRegex =
  /index=\{\s*globalAverageRankMap\.get\(\s*recommendationUniqueKey\(\s*row\s*\)\s*\)\s*\?\?\s*index\s*\}/m;

if (
  rankIndexRegex.test(s)
) {
  s =
    s.replace(
      rankIndexRegex,
`index={
                              index
                            }`
    );
}

const offsetIndexRegex =
  /index=\{\s*serialOffset\s*\+\s*index\s*\}/m;

if (
  offsetIndexRegex.test(s)
) {
  s =
    s.replace(
      offsetIndexRegex,
`index={
                              index
                            }`
    );
}


/*
|--------------------------------------------------------------------------
| SAFETY CHECK
|--------------------------------------------------------------------------
*/

if (
  !s.includes(
    "bucket:\n              \"all\""
  )
) {
  throw new Error(
    "Global group was not installed."
  );
}

if (
  !s.includes(
    "Ranked by Overall Match and Review Score average."
  )
) {
  throw new Error(
    "Global ranking description was not installed."
  );
}


/*
|--------------------------------------------------------------------------
| WRITE
|--------------------------------------------------------------------------
*/

fs.copyFileSync(
  file,
  backup
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
  "SERIAL-WISE GLOBAL RANKING V3 APPLIED"
);
console.log(
  "=============================================="
);
console.log(
  "Order: highest average -> lowest average"
);
console.log(
  "Serial: #1, #2, #3, #4..."
);
console.log(
  "Formula: (Overall Match + Review Score) / 2"
);
console.log(
  "Admission bucket values: UNCHANGED"
);
console.log(
  "Choice filling: UNCHANGED"
);
console.log(
  "Backup:",
  backup
);
