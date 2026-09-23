import fs from "node:fs";

const file =
  "./frontend/src/components/RecommendationSlide.jsx";

const backup =
  "./frontend/src/components/RecommendationSlide.before-average-inside-bucket.jsx";

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
        end = i + 1;
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


const newSorter =
`function sortWithinBucket(
  a,
  b
) {
  /*
  |--------------------------------------------------------------------------
  | PRIMARY SORT INSIDE EACH BUCKET
  |--------------------------------------------------------------------------
  |
  | Ranking score:
  |
  |   (Overall Match + Review Score) / 2
  |
  | Higher score -> higher position.
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
  |--------------------------------------------------------------------------
  | TIE BREAKER: OVERALL MATCH
  |--------------------------------------------------------------------------
  */

  const overallA =
    Number(
      a?.matchScore ??
      a?.premium?.score ??
      a?.premium?.finalScore ??
      a?.overall ??
      -1
    );

  const overallB =
    Number(
      b?.matchScore ??
      b?.premium?.score ??
      b?.premium?.finalScore ??
      b?.overall ??
      -1
    );


  if (
    overallA !== overallB
  ) {
    return (
      overallB -
      overallA
    );
  }


  /*
  |--------------------------------------------------------------------------
  | FINAL STABLE FALLBACK
  |--------------------------------------------------------------------------
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


s =
  replaceFunction(
    s,
    "sortWithinBucket",
    newSorter
  );


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
  "AVERAGE SORT INSIDE EACH BUCKET APPLIED"
);
console.log(
  "=============================================="
);
console.log(
  "Dream -> Target -> Safe -> Backup"
);
console.log(
  "Inside every bucket: highest (Overall + Review)/2 first"
);
console.log(
  "Serial: continuous #1, #2, #3..."
);
console.log(
  "Admission bucket logic: UNCHANGED"
);
console.log(
  "Colors: UNCHANGED"
);
console.log(
  "Backup:",
  backup
);
