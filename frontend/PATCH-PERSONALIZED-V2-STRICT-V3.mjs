import fs from "node:fs";

const path =
  "./src/services/personalizedRecommendationV2.js";

let text =
  fs.readFileSync(
    path,
    "utf8"
  );

const backup =
  "./src/services/personalizedRecommendationV2.before-strict-review-confidence.js";

fs.writeFileSync(
  backup,
  text,
  "utf8"
);


/*
|--------------------------------------------------------------------------
| 1. ADD FIXED REVIEW ASPECT SET
|--------------------------------------------------------------------------
|
| Matches current backend Review V3 canonical model.
|
*/

const reviewConstantsMarker = `const REVIEW_MIN_SOURCES =
  3;`;

const reviewConstantsReplacement = `const REVIEW_MIN_SOURCES =
  3;


/*
|--------------------------------------------------------------------------
| REQUIRED REVIEW ASPECTS
|--------------------------------------------------------------------------
|
| Missing aspect is evidence missing.
| It must NEVER disappear from the denominator.
|
|--------------------------------------------------------------------------
*/

const REQUIRED_REVIEW_ASPECTS = [
  'placements',
  'faculty',
  'hostel',
  'infrastructure',
  'academics',
  'campus_life',
  'administration',
  'internships',
  'value_for_money',
  'location',
];`;


if (
  !text.includes(
    reviewConstantsMarker
  )
) {
  throw new Error(
    "REVIEW_MIN_SOURCES marker not found. No changes made."
  );
}


text =
  text.replace(
    reviewConstantsMarker,
    reviewConstantsReplacement
  );


/*
|--------------------------------------------------------------------------
| 2. REPLACE DYNAMIC ASPECT ITERATION
|--------------------------------------------------------------------------
*/

const oldEntriesBlock = `const entries =
    Object.entries(
      v3.aspects
    );


  if (
    !entries.length
  ) {
    return {
      available:
        false,

      score:
        null,

      reason:
        'NO_REVIEW_ASPECTS',

      readyAspects:
        0,

      requiredAspects:
        0,

      aspectChecks:
        {},
    };
  }


  const aspectChecks = {};


  let readyAspects =
    0;


  for (
    const [
      aspect,
      data,
    ]
    of entries
  ) {`;


const newEntriesBlock = `const aspectChecks = {};


  let readyAspects =
    0;


  for (
    const aspect
    of REQUIRED_REVIEW_ASPECTS
  ) {
    const data =
      v3.aspects?.[aspect] ??
      null;`;


if (
  !text.includes(
    oldEntriesBlock
  )
) {
  throw new Error(
    "Dynamic review-aspect block not found. No changes made."
  );
}


text =
  text.replace(
    oldEntriesBlock,
    newEntriesBlock
  );


/*
|--------------------------------------------------------------------------
| 3. FIX REQUIRED-ASPECT DENOMINATOR
|--------------------------------------------------------------------------
*/

text =
  text.replace(
    `const allReady =
    readyAspects ===
    entries.length;`,
    `const allReady =
    readyAspects ===
    REQUIRED_REVIEW_ASPECTS.length;`
  );


text =
  text.replace(
    `requiredAspects:
      entries.length,`,
    `requiredAspects:
      REQUIRED_REVIEW_ASPECTS.length,`
  );


/*
|--------------------------------------------------------------------------
| 4. ADD COVERAGE-CONFIDENCE ADJUSTED RANKING SCORE
|--------------------------------------------------------------------------
|
| Raw score:
|   preference/desirability among available evidence
|
| Ranking score:
|   penalizes incomplete evidence
|
| Formula:
|
| factor =
|   0.65 + 0.35 * coverage
|
| coverage 100% -> factor 1.00
| coverage 60%  -> factor 0.86
| coverage 30%  -> factor 0.755
|
|--------------------------------------------------------------------------
*/

const weightedReturnMarker = `return {
    score:
      Math.round(
        clamp(
          earned /
          availableWeight
        )
      ),

    availableWeight,

    coverage:
      Math.round(
        availableWeight
      ),
  };`;


const weightedReturnReplacement = `const rawScore =
    Math.round(
      clamp(
        earned /
        availableWeight
      )
    );


  const coverage =
    Math.round(
      availableWeight
    );


  const coverageRatio =
    clamp(
      coverage,
      0,
      100
    ) /
    100;


  const evidenceFactor =
    0.65 +
    (
      0.35 *
      coverageRatio
    );


  const rankingScore =
    Math.round(
      clamp(
        rawScore *
        evidenceFactor
      )
    );


  return {
    score:
      rawScore,

    rankingScore,

    evidenceFactor:
      Number(
        evidenceFactor.toFixed(
          4
        )
      ),

    availableWeight,

    coverage,
  };`;


if (
  !text.includes(
    weightedReturnMarker
  )
) {
  throw new Error(
    "weightedScore return block not found. No changes made."
  );
}


text =
  text.replace(
    weightedReturnMarker,
    weightedReturnReplacement
  );


/*
|--------------------------------------------------------------------------
| 5. EXPOSE RANKING SCORE
|--------------------------------------------------------------------------
*/

const shadowScoreMarker = `score:
        weighted.score,

      coverage:
        weighted.coverage,`;


const shadowScoreReplacement = `score:
        weighted.score,

      rankingScore:
        weighted.rankingScore,

      evidenceFactor:
        weighted.evidenceFactor,

      coverage:
        weighted.coverage,`;


if (
  !text.includes(
    shadowScoreMarker
  )
) {
  throw new Error(
    "personalizedV2 score block not found. No changes made."
  );
}


text =
  text.replace(
    shadowScoreMarker,
    shadowScoreReplacement
  );


fs.writeFileSync(
  path,
  text,
  "utf8"
);


console.log(
  "SUCCESS: strict canonical review gate + confidence-adjusted rankingScore added."
);
