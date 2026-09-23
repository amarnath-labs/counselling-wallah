import fs from "node:fs";

const path =
  "./src/components/DecisionIntelligencePanel.jsx";

const backup =
  "./src/components/DecisionIntelligencePanel.before-relative-alternatives.jsx";

const safetyBackup =
  "./src/components/DecisionIntelligencePanel.before-relative-alternatives-v3-repair.jsx";


/*
|--------------------------------------------------------------------------
| RESTORE CLEAN PREVIOUS VERSION
|--------------------------------------------------------------------------
*/

if (!fs.existsSync(backup)) {
  throw new Error(
    "Required backup not found: " +
    backup
  );
}

const broken =
  fs.readFileSync(
    path,
    "utf8"
  );

fs.writeFileSync(
  safetyBackup,
  broken,
  "utf8"
);

const original =
  fs.readFileSync(
    backup,
    "utf8"
  );


/*
|--------------------------------------------------------------------------
| FIND EXACT FUNCTION
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


/*
|--------------------------------------------------------------------------
| IMPORTANT:
| Find actual FUNCTION BODY opening:
|
| }) {
|     ^
|--------------------------------------------------------------------------
*/

const bodySignatureMatch =
  tail.match(
    /\}\s*\)\s*\{/m
  );

if (!bodySignatureMatch) {
  throw new Error(
    "Function body signature }) { not found."
  );
}

const signatureText =
  bodySignatureMatch[0];

const bodyOpen =
  start +
  bodySignatureMatch.index +
  signatureText.lastIndexOf("{");


/*
|--------------------------------------------------------------------------
| MATCH FUNCTION CLOSING BRACE
|--------------------------------------------------------------------------
*/

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

console.log(
  "Function chars:",
  end - start + 1
);


/*
|--------------------------------------------------------------------------
| NEW RELATIVE ALTERNATIVE FUNCTION
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
  | TRUMARG RELATIVE ALTERNATIVE V3
  |--------------------------------------------------------------------------
  |
  | Alternative must genuinely improve the requested factor relative
  | to THIS current recommendation.
  |
  | We intentionally prefer the nearest genuine improvement instead
  | of repeatedly returning the globally strongest college.
  |
  */

  const currentFactor =
    getV1Factor(
      row,
      factorKey
    );

  if (
    !currentFactor?.available ||
    !Number.isFinite(
      Number(
        currentFactor.score
      )
    )
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
    (
      Array.isArray(rows)
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
          | Same college as current recommendation -> reject
          |--------------------------------------------------------------------------
          */

          if (
            currentCollegeKey &&
            candidateCollegeKey &&
            currentCollegeKey ===
              candidateCollegeKey
          ) {
            return false;
          }


          /*
          |--------------------------------------------------------------------------
          | Do not repeat a college inside this card's alternative slots
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


          if (
            !candidateFactor?.available ||
            !Number.isFinite(
              Number(
                candidateFactor.score
              )
            )
          ) {
            return false;
          }


          return (
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
              currentRank !== null &&
              candidateRank !== null
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
          | 1. Nearest genuine factor improvement
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
          | 2. Closest overall personalized suitability
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
          | 3. Closest ranking neighbourhood
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


/*
|--------------------------------------------------------------------------
| BUILD CLEAN FILE
|--------------------------------------------------------------------------
*/

const updated =
  original.slice(
    0,
    start
  ) +
  replacement +
  original.slice(
    end + 1
  );


/*
|--------------------------------------------------------------------------
| VALIDATION
|--------------------------------------------------------------------------
*/

if (
  !updated.includes(
    "TRUMARG RELATIVE ALTERNATIVE V3"
  )
) {
  throw new Error(
    "V3 marker missing."
  );
}


/*
| Broken sequence from previous bad patch must not remain.
*/

if (
  updated.includes(
    "return selected;\n}) {"
  ) ||
  updated.includes(
    "return selected;\r\n}) {"
  )
) {
  throw new Error(
    "Broken }) { sequence still exists."
  );
}


const functionCount =
  (
    updated.match(
      /function\s+findUniqueBetterAlternativeV1\s*\(/g
    ) ||
    []
  ).length;

if (
  functionCount !== 1
) {
  throw new Error(
    `Expected exactly 1 function, found ${functionCount}.`
  );
}


fs.writeFileSync(
  path,
  updated,
  "utf8"
);

console.log(
  "SUCCESS: broken patch repaired and Relative Alternatives V3 applied."
);

console.log(
  "Safety backup:",
  safetyBackup
);
