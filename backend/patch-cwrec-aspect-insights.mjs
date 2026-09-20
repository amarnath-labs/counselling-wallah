import fs from "node:fs";

const path =
  "./src/services/cwRecDataV1.js";

let s =
  fs.readFileSync(
    path,
    "utf8"
  );

/*
|--------------------------------------------------------------------------
| IMPORT DISPLAY-ONLY ASPECT INTELLIGENCE
|--------------------------------------------------------------------------
*/

if (
  !s.includes(
    "getReviewAspectInsights"
  )
) {
  const reviewImportRegex =
    /import\s*\{\s*getCollegeReviewScore,?\s*\}\s*from\s*['"]\.\/reviewScoringService\.js['"];/;

  if (
    !reviewImportRegex.test(s)
  ) {
    throw new Error(
      "getCollegeReviewScore import not found"
    );
  }

  s =
    s.replace(
      reviewImportRegex,
      (match) =>
`${match}

import {
  getReviewAspectInsights,
} from './reviewAspectInsightsService.js';`
    );
}


/*
|--------------------------------------------------------------------------
| ADD DISPLAY INTELLIGENCE AFTER V3 SCORE
|--------------------------------------------------------------------------
*/

if (
  s.includes(
    "reviewV3.aspectInsightsApplied"
  )
) {
  console.log(
    "Aspect insights already wired"
  );

  process.exit(0);
}

const anchor =
`      row.reviewIntelligenceV3 = {
        version:
          '3',`;

if (
  !s.includes(anchor)
) {
  throw new Error(
    "reviewIntelligenceV3 creation block not found"
  );
}

/*
|--------------------------------------------------------------------------
| We do NOT modify the score object itself here.
| Instead, after it has been created, append display-only intelligence.
|--------------------------------------------------------------------------
*/

const closingRegex =
  /(row\.reviewIntelligenceV3\s*=\s*\{[\s\S]*?\n\s*\};)/;

const match =
  s.match(
    closingRegex
  );

if (!match) {
  throw new Error(
    "reviewIntelligenceV3 block end not found"
  );
}

const replacement =
`${match[1]}

      /*
      |--------------------------------------------------------------------------
      | DISPLAY-ONLY REVIEW ASPECT INTELLIGENCE
      |--------------------------------------------------------------------------
      |
      | This DOES NOT alter:
      | - reviewScore
      | - CW-REC weighting
      | - overall match
      | - recommendation order
      |
      */

      try {
        const aspectInsights =
          await getReviewAspectInsights(
            pool,
            {
              collegeId:
                reviewCollegeId,

              branch:
                requestedBranch,
            }
          );

        if (
          aspectInsights
        ) {
          row.reviewIntelligenceV3 = {
            ...row.reviewIntelligenceV3,

            strengths:
              aspectInsights
                .strengths ??
              [],

            concerns:
              aspectInsights
                .concerns ??
              [],

            mixedAspects:
              aspectInsights
                .mixedAspects ??
              [],

            missingAspects:
              aspectInsights
                .missingAspects ??
              [],

            aspects:
              aspectInsights
                .aspects ??
              {},

            insightEvidence:
              aspectInsights
                .insightEvidence ??
              null,

            aspectInsightsApplied:
              true,
          };
        }
      } catch (aspectError) {
        console.error(
          '[CW-REC REVIEW ASPECT INSIGHTS]',
          reviewCollegeId,
          requestedBranch,
          aspectError.message
        );
      }`;

s =
  s.replace(
    closingRegex,
    replacement
  );

fs.writeFileSync(
  path,
  s,
  "utf8"
);

console.log(
  "SUCCESS: display-only review aspect intelligence wired"
);
