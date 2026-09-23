import fs from "node:fs";

const jsxFile =
  "./frontend/src/components/RecommendationSlide.jsx";

const cssFile =
  "./frontend/src/styles/global.css";

const jsxBackup =
  "./frontend/src/components/RecommendationSlide.before-bucket-order-v2.jsx";

const cssBackup =
  "./frontend/src/styles/global.before-bucket-order-v2.css";


if (!fs.existsSync(jsxFile)) {
  throw new Error(
    `Missing file: ${jsxFile}`
  );
}

if (!fs.existsSync(cssFile)) {
  throw new Error(
    `Missing file: ${cssFile}`
  );
}


let jsx =
  fs.readFileSync(
    jsxFile,
    "utf8"
  );

let css =
  fs.readFileSync(
    cssFile,
    "utf8"
  );


/*
|--------------------------------------------------------------------------
| HELPER: REPLACE A NORMAL FUNCTION SAFELY
|--------------------------------------------------------------------------
*/

function replaceFunction(
  source,
  functionName,
  replacement
) {
  const marker =
    `function ${functionName}(`;

  const start =
    source.indexOf(
      marker
    );

  if (start < 0) {
    throw new Error(
      `${functionName} not found`
    );
  }

  const openBrace =
    source.indexOf(
      "{",
      start
    );

  if (openBrace < 0) {
    throw new Error(
      `${functionName} opening brace not found`
    );
  }

  let depth = 0;
  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;
  let end = -1;

  for (
    let i = openBrace;
    i < source.length;
    i++
  ) {
    const ch =
      source[i];

    const next =
      source[i + 1];

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

    if (ch === "{") {
      depth++;
      continue;
    }

    if (ch === "}") {
      depth--;

      if (depth === 0) {
        end =
          i + 1;

        break;
      }
    }
  }

  if (end < 0) {
    throw new Error(
      `${functionName} end not found`
    );
  }

  return (
    source.slice(
      0,
      start
    ) +
    replacement +
    source.slice(
      end
    )
  );
}


/*
|--------------------------------------------------------------------------
| HELPER: FIND END OF useMemo(...)
|--------------------------------------------------------------------------
*/

function findCallEnd(
  source,
  openParen
) {
  let depth = 0;
  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;

  for (
    let i = openParen;
    i < source.length;
    i++
  ) {
    const ch =
      source[i];

    const next =
      source[i + 1];

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
        return i;
      }
    }
  }

  return -1;
}


/*
|--------------------------------------------------------------------------
| 1. SORT WITHIN EACH BUCKET
|--------------------------------------------------------------------------
|
| LOW closing cutoff rank -> TOP
|--------------------------------------------------------------------------
*/

const newSorter =
`function sortWithinBucket(
  a,
  b
) {
  const asNumber = (
    value
  ) => {
    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {
      return null;
    }

    const n =
      Number(value);

    return Number.isFinite(n)
      ? n
      : null;
  };


  const getClosingRank = (
    row
  ) => {
    const candidates = [
      row?.closingRank,
      row?.closing_rank,

      row?.effectiveClosingRank,
      row?.effective_closing_rank,

      row?.cutoff?.closingRank,
      row?.cutoff?.closing_rank,

      row?.admission?.closingRank,
      row?.admission?.closing_rank,

      row?.historicalFit?.closingRank,
      row?.historicalFit?.closing_rank,

      row?.premium?.historicalFit
        ?.closingRank,

      row?.premium?.historicalFit
        ?.closing_rank,
    ];

    for (
      const value of
      candidates
    ) {
      const n =
        asNumber(
          value
        );

      if (
        n !== null &&
        n > 0
      ) {
        return n;
      }
    }

    return null;
  };


  const cutoffA =
    getClosingRank(
      a
    );

  const cutoffB =
    getClosingRank(
      b
    );


  /*
  |------------------------------------------------------
  | PRIMARY:
  | lower closing cutoff -> higher position
  |------------------------------------------------------
  */

  if (
    cutoffA !== null &&
    cutoffB !== null &&
    cutoffA !== cutoffB
  ) {
    return (
      cutoffA -
      cutoffB
    );
  }


  /*
  | Known cutoff before missing cutoff
  */

  if (
    cutoffA !== null &&
    cutoffB === null
  ) {
    return -1;
  }

  if (
    cutoffA === null &&
    cutoffB !== null
  ) {
    return 1;
  }


  /*
  |------------------------------------------------------
  | TIE:
  | Overall + Review average high -> top
  |------------------------------------------------------
  */

  const serialA =
    recommendationSerialScore(
      a
    );

  const serialB =
    recommendationSerialScore(
      b
    );

  if (
    serialA !== null &&
    serialB !== null &&
    serialA !== serialB
  ) {
    return (
      serialB -
      serialA
    );
  }


  /*
  | Stable fallback
  */

  const collegeA =
    String(
      a?.collegeName ??
      a?.college_name ??
      a?.college?.name ??
      ''
    );

  const collegeB =
    String(
      b?.collegeName ??
      b?.college_name ??
      b?.college?.name ??
      ''
    );

  return collegeA.localeCompare(
    collegeB
  );
}`;

jsx =
  replaceFunction(
    jsx,
    "sortWithinBucket",
    newSorter
  );


/*
|--------------------------------------------------------------------------
| 2. REPLACE groupedRows COMPLETELY
|--------------------------------------------------------------------------
|
| DREAM
| TARGET
| SAFE
| BACKUP
|--------------------------------------------------------------------------
*/

const groupedStart =
  jsx.indexOf(
    "const groupedRows ="
  );

if (groupedStart < 0) {
  throw new Error(
    "const groupedRows = not found"
  );
}

const useMemoStart =
  jsx.indexOf(
    "useMemo",
    groupedStart
  );

if (useMemoStart < 0) {
  throw new Error(
    "groupedRows useMemo not found"
  );
}

const openParen =
  jsx.indexOf(
    "(",
    useMemoStart
  );

if (openParen < 0) {
  throw new Error(
    "groupedRows opening parenthesis not found"
  );
}

const closeParen =
  findCallEnd(
    jsx,
    openParen
  );

if (closeParen < 0) {
  throw new Error(
    "groupedRows useMemo end not found"
  );
}

let groupedEnd =
  closeParen + 1;

while (
  groupedEnd < jsx.length &&
  /\s/.test(
    jsx[groupedEnd]
  )
) {
  groupedEnd++;
}

if (
  jsx[groupedEnd] === ";"
) {
  groupedEnd++;
}


const newGroupedRows =
`const groupedRows =
    useMemo(
      () => {
        const bucketOrder = [
          'dream',
          'target',
          'safe',
          'backup',
        ];

        const uniqueRows =
          dedupeRecommendationRows(
            rows
          );

        return bucketOrder
          .map(
            (bucket) => {
              const bucketRows =
                uniqueRows
                  .filter(
                    (row) =>
                      row &&
                      String(
                        row?.bucket ??
                        row?.premium
                          ?.admissionBucket
                          ?.key ??
                        ''
                      )
                        .trim()
                        .toLowerCase() ===
                      bucket
                  )
                  .sort(
                    sortWithinBucket
                  );

              return {
                bucket,
                rows:
                  bucketRows,
              };
            }
          )
          .filter(
            (group) =>
              group.rows.length > 0
          );
      },
      [rows]
    );`;


jsx =
  jsx.slice(
    0,
    groupedStart
  ) +
  newGroupedRows +
  jsx.slice(
    groupedEnd
  );


/*
|--------------------------------------------------------------------------
| 3. SERIAL MUST BE CONTINUOUS IN DISPLAY ORDER
|--------------------------------------------------------------------------
|
| Dream:  #1...
| Target: continues
| Safe:   continues
| Backup: continues
|--------------------------------------------------------------------------
*/

const globalIndexRegex =
  /index=\{\s*globalAverageRankMap\.get\(\s*recommendationUniqueKey\(\s*row\s*\)\s*\)\s*\?\?\s*index\s*\}/m;

if (
  globalIndexRegex.test(
    jsx
  )
) {
  jsx =
    jsx.replace(
      globalIndexRegex,
`index={
                              serialOffset +
                              index
                            }`
    );
}


const plainIndexRegex =
  /(<RecommendationCard[\s\S]*?row=\{\s*row\s*\}[\s\S]*?)index=\{\s*index\s*\}([\s\S]*?allRows=\{\s*rows\s*\})/m;

if (
  plainIndexRegex.test(
    jsx
  )
) {
  jsx =
    jsx.replace(
      plainIndexRegex,
`$1index={
                              serialOffset +
                              index
                            }$2`
    );
}


/*
|--------------------------------------------------------------------------
| VERIFY serialOffset STILL EXISTS
|--------------------------------------------------------------------------
*/

if (
  !jsx.includes(
    "const serialOffset ="
  )
) {
  throw new Error(
    "serialOffset missing. No file written."
  );
}


/*
|--------------------------------------------------------------------------
| 4. ADD data-bucket TO SECTION
|--------------------------------------------------------------------------
*/

if (
  !jsx.includes(
    "data-bucket={"
  )
) {
  const sectionRegex =
    /(<section\s+key=\{\s*group\.bucket\s*\}\s+className="recommendation-bucket")(\s*>)/m;

  if (
    sectionRegex.test(
      jsx
    )
  ) {
    jsx =
      jsx.replace(
        sectionRegex,
`$1
                  data-bucket={
                    group.bucket
                  }$2`
      );
  }
}


/*
|--------------------------------------------------------------------------
| 5. REMOVE LEFTOVER "all" LABEL IF PREVIOUS PATCH ADDED IT
|--------------------------------------------------------------------------
*/

jsx =
  jsx.replace(
    /\s*all:\s*'Personalized Ranking',/g,
    ""
  );

jsx =
  jsx.replace(
    /\s*all:\s*'Ranked by Overall Match and Review Score average\.',/g,
    ""
  );


/*
|--------------------------------------------------------------------------
| BACKUP + WRITE JSX
|--------------------------------------------------------------------------
*/

fs.copyFileSync(
  jsxFile,
  jsxBackup
);

fs.writeFileSync(
  jsxFile,
  jsx,
  "utf8"
);


/*
|--------------------------------------------------------------------------
| 6. COLOR CODING
|--------------------------------------------------------------------------
*/

const marker =
  "TRUMARG ADMISSION BUCKET COLORS V2";

if (
  !css.includes(
    marker
  )
) {
  fs.copyFileSync(
    cssFile,
    cssBackup
  );

  css +=
`

/* =========================================================
   TRUMARG ADMISSION BUCKET COLORS V2
   ========================================================= */

.recommendation-bucket[data-bucket="dream"] {
  border-left: 4px solid #DC2626;
}

.recommendation-bucket[data-bucket="dream"]
.recommendation-bucket__header {
  background: #FFF1F2;
  border-color: #FECDD3;
}

.recommendation-bucket[data-bucket="dream"]
.recommendation-bucket__header h3 {
  color: #B91C1C;
}


.recommendation-bucket[data-bucket="target"] {
  border-left: 4px solid #D97706;
}

.recommendation-bucket[data-bucket="target"]
.recommendation-bucket__header {
  background: #FFFBEB;
  border-color: #FDE68A;
}

.recommendation-bucket[data-bucket="target"]
.recommendation-bucket__header h3 {
  color: #B45309;
}


.recommendation-bucket[data-bucket="safe"] {
  border-left: 4px solid #16A34A;
}

.recommendation-bucket[data-bucket="safe"]
.recommendation-bucket__header {
  background: #F0FDF4;
  border-color: #BBF7D0;
}

.recommendation-bucket[data-bucket="safe"]
.recommendation-bucket__header h3 {
  color: #15803D;
}


.recommendation-bucket[data-bucket="backup"] {
  border-left: 4px solid #2563EB;
}

.recommendation-bucket[data-bucket="backup"]
.recommendation-bucket__header {
  background: #EFF6FF;
  border-color: #BFDBFE;
}

.recommendation-bucket[data-bucket="backup"]
.recommendation-bucket__header h3 {
  color: #1D4ED8;
}
`;

  fs.writeFileSync(
    cssFile,
    css,
    "utf8"
  );
}


console.log("");
console.log(
  "=============================================="
);
console.log(
  "FINAL BUCKET ORDER V2 APPLIED"
);
console.log(
  "=============================================="
);

console.log(
  "Order: Dream -> Target -> Safe -> Backup"
);

console.log(
  "Inside each bucket: LOW closing cutoff first"
);

console.log(
  "Serial: continuous #1, #2, #3..."
);

console.log(
  "Tie: Overall + Review average"
);

console.log(
  "Colors: Dream red / Target amber / Safe green / Backup blue"
);

console.log(
  "Admission bucket calculation: UNCHANGED"
);

console.log(
  "Backup:",
  jsxBackup
);
