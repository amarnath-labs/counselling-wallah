import fs from "node:fs";

const file =
  "./frontend/src/components/RecommendationSlide.jsx";

const backup =
  "./frontend/src/components/RecommendationSlide.before-average-ranking.jsx";

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

const start =
  s.indexOf(
    "function sortWithinBucket("
  );

if (start < 0) {
  throw new Error(
    "sortWithinBucket() not found. No changes written."
  );
}

const nextMarker =
  s.indexOf(
    "\nexport default function RecommendationSlide",
    start
  );

if (nextMarker < 0) {
  throw new Error(
    "RecommendationSlide marker not found. No changes written."
  );
}

const oldSection =
  s.slice(
    start,
    nextMarker
  );

const newSection =
`function recommendationSerialScore(
  row
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
  | OVERALL MATCH
  |--------------------------------------------------------------------------
  */

  const overallScore =
    toNumber(
      row?.matchScore ??
      row?.premium?.score ??
      row?.premium?.finalScore ??
      row?.overall
    );


  /*
  |--------------------------------------------------------------------------
  | REVIEW INTELLIGENCE
  |--------------------------------------------------------------------------
  |
  | This is the standalone Review Intelligence score /100.
  |
  | We DO NOT convert missing review data to zero.
  |--------------------------------------------------------------------------
  */

  const reviewScore =
    toNumber(
      row
        ?.reviewIntelligenceV3
        ?.score
    );


  /*
  |--------------------------------------------------------------------------
  | SERIAL RANKING SCORE
  |--------------------------------------------------------------------------
  |
  | User requested:
  |
  | (Overall Score + Review Score) / 2
  |
  |--------------------------------------------------------------------------
  */

  if (
    overallScore !== null &&
    reviewScore !== null
  ) {
    return (
      overallScore +
      reviewScore
    ) / 2;
  }


  /*
  |--------------------------------------------------------------------------
  | MISSING REVIEW FALLBACK
  |--------------------------------------------------------------------------
  |
  | Missing evidence stays unknown.
  | Never use review = 0.
  |
  | Such rows retain their Overall Score.
  |--------------------------------------------------------------------------
  */

  return overallScore;
}


function sortWithinBucket(
  a,
  b
) {
  const serialA =
    recommendationSerialScore(
      a
    );

  const serialB =
    recommendationSerialScore(
      b
    );


  /*
  |--------------------------------------------------------------------------
  | PRIMARY: OVERALL + REVIEW AVERAGE
  |--------------------------------------------------------------------------
  */

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


  if (
    serialA !== null &&
    serialB === null
  ) {
    return -1;
  }


  if (
    serialA === null &&
    serialB !== null
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
  | FINAL STABLE TIE BREAKER
  |--------------------------------------------------------------------------
  */

  const collegeA =
    String(
      a?.collegeName ??
      a?.college?.name ??
      ''
    );

  const collegeB =
    String(
      b?.collegeName ??
      b?.college?.name ??
      ''
    );

  return collegeA.localeCompare(
    collegeB
  );
}


`;

s =
  s.slice(
    0,
    start
  ) +
  newSection +
  s.slice(
    nextMarker
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
  "SERIAL RANKING = OVERALL + REVIEW AVERAGE"
);
console.log(
  "=============================================="
);
console.log(
  "Formula: (Overall Score + Review Score) / 2"
);
console.log(
  "Missing review: Overall fallback, NOT zero"
);
console.log(
  "Admission bucket logic: UNCHANGED"
);
console.log(
  "File:",
  file
);
console.log(
  "Backup:",
  backup
);
