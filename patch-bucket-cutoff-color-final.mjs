import fs from "node:fs";

const jsxFile =
  "./frontend/src/components/RecommendationSlide.jsx";

const cssFile =
  "./frontend/src/styles/global.css";

const jsxBackup =
  "./frontend/src/components/RecommendationSlide.before-bucket-cutoff-order.jsx";

const cssBackup =
  "./frontend/src/styles/global.before-bucket-colors.css";


if (!fs.existsSync(jsxFile)) {
  throw new Error(
    `Missing: ${jsxFile}`
  );
}

if (!fs.existsSync(cssFile)) {
  throw new Error(
    `Missing: ${cssFile}`
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
| SAFETY
|--------------------------------------------------------------------------
*/

for (
  const required of [
    "function sortWithinBucket(",
    "const groupedRows =",
    "recommendationUniqueKey",
    "RecommendationCard",
  ]
) {
  if (!jsx.includes(required)) {
    throw new Error(
      `Required code missing: ${required}`
    );
  }
}


/*
|--------------------------------------------------------------------------
| 1. BUCKET ORDER
|--------------------------------------------------------------------------
|
| DREAM -> TARGET -> SAFE -> BACKUP
|--------------------------------------------------------------------------
*/

const bucketOrderRegex =
  /const\s+bucketOrder\s*=\s*\[[\s\S]*?\];/m;

if (!bucketOrderRegex.test(jsx)) {
  throw new Error(
    "bucketOrder block not found."
  );
}

jsx =
  jsx.replace(
    bucketOrderRegex,
`const bucketOrder = [
          'dream',
          'target',
          'safe',
          'backup',
        ];`
  );


/*
|--------------------------------------------------------------------------
| 2. REPLACE sortWithinBucket SAFELY
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
    source.indexOf(marker);

  if (start < 0) {
    throw new Error(
      `${functionName} not found.`
    );
  }

  const braceStart =
    source.indexOf(
      "{",
      start
    );

  if (braceStart < 0) {
    throw new Error(
      `${functionName} opening brace not found.`
    );
  }

  let depth = 0;
  let quote = null;
  let escape = false;
  let lineComment = false;
  let blockComment = false;
  let end = -1;

  for (
    let i = braceStart;
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
      if (escape) {
        escape = false;
        continue;
      }

      if (ch === "\\") {
        escape = true;
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
        end = i + 1;
        break;
      }
    }
  }

  if (end < 0) {
    throw new Error(
      `${functionName} end not found.`
    );
  }

  return (
    source.slice(
      0,
      start
    ) +
    replacement +
    source.slice(end)
  );
}


const newSorter =
`function sortWithinBucket(
  a,
  b
) {
  const toNumber = (
    value
  ) => {
    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {
      return null;
    }

    const parsed =
      Number(value);

    return Number.isFinite(
      parsed
    )
      ? parsed
      : null;
  };


  /*
  |--------------------------------------------------------------------------
  | CLOSING CUTOFF
  |--------------------------------------------------------------------------
  |
  | Lower closing rank appears first inside the SAME bucket.
  |--------------------------------------------------------------------------
  */

  const cutoffA =
    toNumber(
      a?.closingRank ??
      a?.closing_rank ??
      a?.cutoff?.closingRank ??
      a?.cutoff?.closing_rank ??
      a?.branch?.closingRank ??
      a?.branch?.closing_rank ??
      a?.admission?.closingRank ??
      a?.admission?.closing_rank
    );

  const cutoffB =
    toNumber(
      b?.closingRank ??
      b?.closing_rank ??
      b?.cutoff?.closingRank ??
      b?.cutoff?.closing_rank ??
      b?.branch?.closingRank ??
      b?.branch?.closing_rank ??
      b?.admission?.closingRank ??
      b?.admission?.closing_rank
    );


  const validA =
    cutoffA !== null &&
    cutoffA > 0;

  const validB =
    cutoffB !== null &&
    cutoffB > 0;


  /*
  | LOW CUTOFF -> TOP
  */

  if (
    validA &&
    validB &&
    cutoffA !== cutoffB
  ) {
    return (
      cutoffA -
      cutoffB
    );
  }


  /*
  | Known cutoff before missing cutoff.
  */

  if (
    validA &&
    !validB
  ) {
    return -1;
  }

  if (
    !validA &&
    validB
  ) {
    return 1;
  }


  /*
  |--------------------------------------------------------------------------
  | TIE BREAKER
  |--------------------------------------------------------------------------
  |
  | If cutoff is same/missing:
  |
  | (Overall Match + Review Score) / 2
  | higher first.
  |--------------------------------------------------------------------------
  */

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


  /*
  | Stable alphabetical fallback.
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
| 3. SERIAL NUMBER MUST FOLLOW DISPLAY ORDER
|--------------------------------------------------------------------------
|
| Dream rows first.
| Then Target.
| Then Safe.
| Then Backup.
|
| Continuous:
| #1 #2 #3 ...
|--------------------------------------------------------------------------
*/

const globalRankIndexRegex =
  /index=\{\s*globalAverageRankMap\.get\(\s*recommendationUniqueKey\(\s*row\s*\)\s*\)\s*\?\?\s*index\s*\}/m;

if (
  globalRankIndexRegex.test(
    jsx
  )
) {
  jsx =
    jsx.replace(
      globalRankIndexRegex,
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
| 4. ADD BUCKET ATTRIBUTE FOR COLOR CODING
|--------------------------------------------------------------------------
*/

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


/*
|--------------------------------------------------------------------------
| 5. BACKUP + WRITE JSX
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
| 6. COLOR CODING CSS
|--------------------------------------------------------------------------
*/

const colorMarker =
  "TRUMARG PERSONALIZED BUCKET COLOR CODING";

if (
  !css.includes(
    colorMarker
  )
) {
  const addition =
`

/* =========================================================
   TRUMARG PERSONALIZED BUCKET COLOR CODING
   ========================================================= */

.recommendation-bucket[data-bucket="dream"] {
  border-left: 4px solid #DC2626;
}

.recommendation-bucket[data-bucket="dream"]
.recommendation-bucket__header {
  background: #FFF5F5;
  border-color: #FECACA;
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

  fs.copyFileSync(
    cssFile,
    cssBackup
  );

  css +=
    addition;

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
  "BUCKET + LOW CUTOFF ORDER APPLIED"
);
console.log(
  "=============================================="
);
console.log(
  "1. Dream"
);
console.log(
  "2. Target"
);
console.log(
  "3. Safe"
);
console.log(
  "4. Backup"
);
console.log(
  "Inside bucket: LOW closing cutoff first"
);
console.log(
  "Serial: continuous #1, #2, #3..."
);
console.log(
  "Tie breaker: Overall + Review average"
);
console.log(
  "Color: Dream red / Target amber / Safe green / Backup blue"
);
console.log(
  "Admission bucket calculation: UNCHANGED"
);
