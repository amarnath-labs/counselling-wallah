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
| 1. IMPORT V3 REVIEW ENGINE
|--------------------------------------------------------------------------
*/

const importAnchor =
`import {
  getCollegeIdSqlCase,
} from './collegeIdentityResolver.js';`;

if (
  !s.includes(
    "getCollegeReviewScore"
  )
) {
  if (
    !s.includes(importAnchor)
  ) {
    throw new Error(
      "IDENTITY IMPORT ANCHOR NOT FOUND"
    );
  }

  s =
    s.replace(
      importAnchor,
`${importAnchor}

import {
  getCollegeReviewScore,
} from './reviewScoringService.js';`
    );
}


/*
|--------------------------------------------------------------------------
| 2. EXPOSE CANONICAL REVIEW COLLEGE ID
|--------------------------------------------------------------------------
|
| V3 review JSON uses canonical college ids.
| Some catalogue ids may be aliases such as nit-warangal.
|
*/

const collegeSelectAnchor =
`      c.type,


      /*
      |--------------------------------------------------------------------------
      | BRANCH`;

if (
  !s.includes(
    'AS "reviewCollegeId"'
  )
) {
  if (
    !s.includes(
      collegeSelectAnchor
    )
  ) {
    throw new Error(
      "COLLEGE SELECT ANCHOR NOT FOUND"
    );
  }

  s =
    s.replace(
      collegeSelectAnchor,
`      c.type,

      ${'${getCollegeIdSqlCase("c.id::text")}'} 
        AS "reviewCollegeId",


      /*
      |--------------------------------------------------------------------------
      | BRANCH`
    );
}


/*
|--------------------------------------------------------------------------
| 3. V3 REVIEW ENRICHMENT
|--------------------------------------------------------------------------
|
| Run AFTER dedupe.
|
| Existing legacy review_data stays as fallback.
| V3 score overrides only when actual V3 evidence exists.
|
*/

const responseAnchor =
`  /* =======================================================
     RESPONSE
  ======================================================= */

  return {
    rows:
      unique,`;

if (
  !s.includes(
    "V3 REVIEW INTELLIGENCE ENRICHMENT"
  )
) {
  if (
    !s.includes(
      responseAnchor
    )
  ) {
    throw new Error(
      "RESPONSE ANCHOR NOT FOUND"
    );
  }

  const replacement =
`  /* =======================================================
     V3 REVIEW INTELLIGENCE ENRICHMENT
  =======================================================

     Authoritative source:

       college_review_items
             +
       review_aspect_sentiments
             +
       review_aggregate_snapshots
             ↓
       getCollegeReviewScore()

     Legacy college_reviews values remain only as fallback.

     Cache prevents duplicate DB scoring for identical
     college + branch combinations.
  ======================================================= */

  const reviewCache =
    new Map();

  for (
    const row of unique
  ) {
    const reviewCollegeId =
      row.reviewCollegeId ||
      row.college_id;

    const requestedBranch =
      row.branch_name ||
      null;

    const cacheKey =
      [
        reviewCollegeId,
        requestedBranch ?? '',
      ].join('|');

    let reviewV3 =
      reviewCache.get(
        cacheKey
      );

    if (
      reviewV3 === undefined
    ) {
      try {
        reviewV3 =
          await getCollegeReviewScore(
            pool,
            {
              collegeId:
                reviewCollegeId,

              branch:
                requestedBranch,
            }
          );
      } catch (error) {
        console.error(
          '[CW-REC REVIEW V3]',
          reviewCollegeId,
          requestedBranch,
          error.message
        );

        reviewV3 =
          null;
      }

      reviewCache.set(
        cacheKey,
        reviewV3
      );
    }

    if (
      reviewV3 &&
      reviewV3.reviewScore !== null &&
      reviewV3.reviewScore !== undefined
    ) {
      row.reviewScore =
        reviewV3.reviewScore;

      row.reviewConfidence =
        reviewV3.confidence ?? 0;

      row.reviewCount =
        (
          Number(
            reviewV3.evidence
              ?.sentimentEvidence || 0
          ) +
          Number(
            reviewV3.evidence
              ?.aggregateEvidence || 0
          )
        );

      row.reviewAverageSentiment =
        reviewV3.sentimentScore ??
        null;

      row.reviewIntelligenceV3 = {
        version:
          '3',

        score:
          reviewV3.reviewScore,

        component:
          Math.round(
            (
              Number(
                reviewV3.reviewScore
              ) /
              100
            ) *
            10 *
            100
          ) /
          100,

        confidence:
          reviewV3.confidence ?? 0,

        sentimentScore:
          reviewV3.sentimentScore ??
          null,

        aggregateScore:
          reviewV3.aggregateScore ??
          null,

        requestedBranch:
          reviewV3.requestedBranch ??
          requestedBranch,

        evidence:
          reviewV3.evidence ??
          null,
      };
    }
  }


  /* =======================================================
     RESPONSE
  ======================================================= */

  return {
    rows:
      unique,`;

  s =
    s.replace(
      responseAnchor,
      replacement
    );
}


fs.writeFileSync(
  path,
  s,
  "utf8"
);

console.log(
  "SUCCESS: CW-REC wired to Review Intelligence V3"
);
