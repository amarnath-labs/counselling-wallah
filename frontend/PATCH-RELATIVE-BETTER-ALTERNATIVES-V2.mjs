import fs from "node:fs";

const path =
  "./src/components/DecisionIntelligencePanel.jsx";

const backup =
  "./src/components/DecisionIntelligencePanel.before-relative-alternatives.jsx";

const original =
  fs.readFileSync(
    path,
    "utf8"
  );

if (
  original.includes(
    "TRUMARG RELATIVE ALTERNATIVE V2"
  )
) {
  throw new Error(
    "Relative alternative patch already applied."
  );
}


/*
|--------------------------------------------------------------------------
| FIND findUniqueBetterAlternativeV1()
|--------------------------------------------------------------------------
*/

const startMatch =
  original.match(
    /function\s+findUniqueBetterAlternativeV1\s*\(\s*\{/m
  );

if (!startMatch) {
  throw new Error(
    "findUniqueBetterAlternativeV1() not found."
  );
}

const start =
  startMatch.index;

const tail =
  original.slice(start);

const bodyOpenRelative =
  tail.indexOf("{");

if (bodyOpenRelative === -1) {
  throw new Error(
    "Function opening brace not found."
  );
}

const bodyOpen =
  start +
  bodyOpenRelative;

let depth = 0;
let end = -1;

for (
  let i = bodyOpen;
  i < original.length;
  i++
) {
  const char =
    original[i];

  if (char === "{") {
    depth++;
  }
  else if (char === "}") {
    depth--;

    if (depth === 0) {
      end = i;
      break;
    }
  }
}

if (end === -1) {
  throw new Error(
    "Function closing brace not found."
  );
}

const before =
  original.slice(
    0,
    start
  );

const after =
  original.slice(
    end + 1
  );


/*
|--------------------------------------------------------------------------
| REPLACE FUNCTION
|--------------------------------------------------------------------------
*/

const replacement =
`function findUniqueBetterAlternativeV1({
  row,
  rows,
  factorKey,
  usedCollegeKeys,
}) {
  /*
  |--------------------------------------------------------------------------
  | TRUMARG RELATIVE ALTERNATIVE V2
  |--------------------------------------------------------------------------
  |
  | Choose a genuinely better option RELATIVE to the current row.
  |
  | Priority:
  | 1. factor must improve
  | 2. current college itself excluded
  | 3. colleges already used in another alternative slot excluded
  | 4. prefer the SMALLEST positive factor improvement
  | 5. then prefer closest overall score
  | 6. then prefer closest global rank
  |
  | This prevents the same globally strongest colleges from being shown
  | for every recommendation card.
  |
  */

  const currentFactor =
    getV1Factor(
      row,
      factorKey
    );

  if (
    !currentFactor?.available
  ) {
    return null;
  }


  const currentCollegeKey =
    alternativeCollegeKeyV1(
      row
    );


  const currentOverall =
    v1Number(
      row?.personalizedV2
        ?.rawScore ??
      row?.matchScore ??
      row?.premium?.score
    ) ??
    0;


  const currentRank =
    v1Number(
      row?.ranking
        ?.globalRank ??
      row?.premium
        ?.ranking
        ?.globalRank
    );


  const candidates =
    (Array.isArray(rows)
      ? rows
      : []
    )
      .filter(
        (candidate) => {
          if (
            !candidate ||
            candidate === row
          ) {
            return false;
          }


          const candidateCollegeKey =
            alternativeCollegeKeyV1(
              candidate
            );


          /*
          |--------------------------------------------------------------------------
          | Never recommend same college as current row
          |--------------------------------------------------------------------------
          */

          if (
            candidateCollegeKey &&
            currentCollegeKey &&
            candidateCollegeKey ===
              currentCollegeKey
          ) {
            return false;
          }


          /*
          |--------------------------------------------------------------------------
          | Keep different colleges across alternative slots
          |--------------------------------------------------------------------------
          */

          if (
            candidateCollegeKey &&
            usedCollegeKeys?.has(
              candidateCollegeKey
            )
          ) {
            return false;
          }


          const candidateFactor =
            getV1Factor(
              candidate,
              factorKey
            );


          return (
            candidateFactor
              ?.available &&
            Number.isFinite(
              Number(
                candidateFactor.score
              )
            ) &&
            Number(
              candidateFactor.score
            ) >
              Number(
                currentFactor.score
              )
          );
        }
      )
      .map(
        (candidate) => {
          const factor =
            getV1Factor(
              candidate,
              factorKey
            );


          const candidateOverall =
            v1Number(
              candidate
                ?.personalizedV2
                ?.rawScore ??
              candidate
                ?.matchScore ??
              candidate
                ?.premium
                ?.score
            ) ??
            0;


          const candidateRank =
            v1Number(
              candidate?.ranking
                ?.globalRank ??
              candidate?.premium
                ?.ranking
                ?.globalRank
            );


          const factorGain =
            Number(
              factor.score
            ) -
            Number(
              currentFactor.score
            );


          const overallGap =
            Math.abs(
              candidateOverall -
              currentOverall
            );


          const rankGap =
            (
              currentRank !==
                null &&
              candidateRank !==
                null
            )
              ? Math.abs(
                  candidateRank -
                  currentRank
                )
              : Number.POSITIVE_INFINITY;


          return {
            candidate,
            factorGain,
            overallGap,
            rankGap,
          };
        }
      )
      .sort(
        (a, b) => {
          /*
          |--------------------------------------------------------------------------
          | 1. Nearest genuine improvement
          |--------------------------------------------------------------------------
          */

          if (
            a.factorGain !==
            b.factorGain
          ) {
            return (
              a.factorGain -
              b.factorGain
            );
          }


          /*
          |--------------------------------------------------------------------------
          | 2. Similar overall suitability
          |--------------------------------------------------------------------------
          */

          if (
            a.overallGap !==
            b.overallGap
          ) {
            return (
              a.overallGap -
              b.overallGap
            );
          }


          /*
          |--------------------------------------------------------------------------
          | 3. Similar current ranking neighborhood
          |--------------------------------------------------------------------------
          */

          return (
            a.rankGap -
            b.rankGap
          );
        }
      );


  const selected =
    candidates[0]
      ?.candidate ??
    null;


  if (selected) {
    const key =
      alternativeCollegeKeyV1(
        selected
      );

    if (key) {
      usedCollegeKeys.add(
        key
      );
    }
  }


  return selected;
}`;

const updated =
  before +
  replacement +
  after;


/*
|--------------------------------------------------------------------------
| VALIDATE
|--------------------------------------------------------------------------
*/

for (
  const token
  of [
    "TRUMARG RELATIVE ALTERNATIVE V2",
    "factorGain",
    "overallGap",
    "rankGap",
    "candidateCollegeKey ===",
  ]
) {
  if (
    !updated.includes(
      token
    )
  ) {
    throw new Error(
      `Validation failed: ${token}`
    );
  }
}


fs.writeFileSync(
  backup,
  original,
  "utf8"
);

fs.writeFileSync(
  path,
  updated,
  "utf8"
);

console.log(
  "SUCCESS: relative Better Alternatives patch applied."
);

console.log(
  "Backup:",
  backup
);
