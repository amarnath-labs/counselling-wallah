import fs from "node:fs";

const file =
  "./frontend/src/components/RecommendationSlide.jsx";

const backup =
  "./frontend/src/components/RecommendationSlide.before-low-cutoff-sort.jsx";

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
| FIND CURRENT SORT FUNCTION
|--------------------------------------------------------------------------
*/

const start =
  s.indexOf(
    "function sortWithinBucket("
  );

if (start < 0) {
  throw new Error(
    "sortWithinBucket not found."
  );
}

const nextMarker =
  s.indexOf(
    "\n\nexport default function",
    start
  );

if (nextMarker < 0) {
  throw new Error(
    "End of sortWithinBucket section not found."
  );
}


/*
|--------------------------------------------------------------------------
| REPLACE SORT
|--------------------------------------------------------------------------
|
| PRIMARY:
|   Lower last-round closing cutoff rank first.
|
| FALLBACK:
|   Current/branch closing rank.
|
| TIE:
|   Higher overall/recommendation score first.
|
| IMPORTANT:
|   Bucket assignment is NOT changed.
|--------------------------------------------------------------------------
*/

const replacement =
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


  const cutoffA =
    toNumber(
      a?.lastRoundClosingRank ??
      a?.admission
        ?.lastRoundClosingRank ??
      a?.historicalFit
        ?.lastRoundClosingRank ??
      a?.branch
        ?.closingRank ??
      a?.closingRank
    );


  const cutoffB =
    toNumber(
      b?.lastRoundClosingRank ??
      b?.admission
        ?.lastRoundClosingRank ??
      b?.historicalFit
        ?.lastRoundClosingRank ??
      b?.branch
        ?.closingRank ??
      b?.closingRank
    );


  /*
  |--------------------------------------------------------------------------
  | PRIMARY: LOW CUTOFF RANK FIRST
  |--------------------------------------------------------------------------
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
  |--------------------------------------------------------------------------
  | TIE BREAKER: HIGHER OVERALL SCORE FIRST
  |--------------------------------------------------------------------------
  */

  const scoreA =
    toNumber(
      a?.matchScore ??
      a?.premium?.score ??
      a?.overall
    ) ?? -1;


  const scoreB =
    toNumber(
      b?.matchScore ??
      b?.premium?.score ??
      b?.overall
    ) ?? -1;


  if (
    scoreA !== scoreB
  ) {
    return (
      scoreB -
      scoreA
    );
  }


  /*
  |--------------------------------------------------------------------------
  | FINAL TIE: COLLEGE NAME
  |--------------------------------------------------------------------------
  */

  return String(
    a?.collegeName ??
    a?.college?.name ??
    ''
  ).localeCompare(
    String(
      b?.collegeName ??
      b?.college?.name ??
      ''
    )
  );
}`;


s =
  s.slice(
    0,
    start
  ) +
  replacement +
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
  "LOW CUTOFF SORT APPLIED"
);
console.log(
  "=============================================="
);
console.log(
  "Dream  -> low cutoff first"
);
console.log(
  "Target -> low cutoff first"
);
console.log(
  "Safe   -> low cutoff first"
);
console.log(
  "Backup -> low cutoff first"
);
console.log(
  "Bucket logic: UNCHANGED"
);
console.log(
  "Admission logic: UNCHANGED"
);
console.log(
  "Review logic: UNCHANGED"
);
console.log(
  "Backup:",
  backup
);
