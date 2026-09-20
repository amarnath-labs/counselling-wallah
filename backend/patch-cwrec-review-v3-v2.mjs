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

if (
  !s.includes(
    "from './reviewScoringService.js'"
  )
) {
  const importRegex =
    /import\s*\{\s*getCollegeIdSqlCase,\s*\}\s*from\s*['"]\.\/collegeIdentityResolver\.js['"];/;

  if (
    !importRegex.test(s)
  ) {
    throw new Error(
      "IDENTITY IMPORT REGEX NOT FOUND"
    );
  }

  s =
    s.replace(
      importRegex,
      match =>
`${match}

import {
  getCollegeReviewScore,
} from './reviewScoringService.js';`
    );
}


/*
|--------------------------------------------------------------------------
| 2. ADD CANONICAL REVIEW COLLEGE ID TO SELECT
|--------------------------------------------------------------------------
*/

if (
  !s.includes(
    'AS "reviewCollegeId"'
  )
) {
  const collegeRegex =
    /(\s+c\.type,\s*\r?\n)(\s*\r?\n\s*\/\*\s*\r?\n\s*\|[-\s]*\r?\n\s*\|\s*BRANCH)/;

  const match =
    s.match(
      collegeRegex
    );

  if (
    !match
  ) {
    throw new Error(
      "COLLEGE SELECT LOCATION NOT FOUND"
    );
  }

  const canonicalSql =
    '      ${getCollegeIdSqlCase("c.id::text")}\n' +
    '        AS "reviewCollegeId",\n\n';

  s =
    s.replace(
      collegeRegex,
      match[1] +
      "\n" +
      canonicalSql +
      match[2]
    );
}


/*
|--------------------------------------------------------------------------
| 3. V3 REVIEW ENRICHMENT BEFORE RESPONSE
|--------------------------------------------------------------------------
*/

if (
  !s.includes(
    "V3 REVIEW INTELLIGENCE ENRICHMENT"
  )
) {
  const responseRegex =
    /(\s*\/\*\s*=+\s*\r?\n\s*RESPONSE\s*\r?\n\s*=+\s*\*\/\s*\r?\n\s*return\s*\{\s*\r?\n\s*rows:\s*\r?\n\s*unique,)/;

  const responseMatch =
    s.match(
      responseRegex
    );

  if (
    !responseMatch
  ) {
    throw new Error(
      "RESPONSE BLOCK NOT FOUND"
    );
  }

  const enrichment =
`
  /* =======================================================
     V3 REVIEW INTELLIGENCE ENRICHMENT
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
      reviewV3?.reviewScore !== null &&
      reviewV3?.reviewScore !== undefined
    ) {
      row.reviewScore =
        reviewV3.reviewScore;

      row.reviewConfidence =
        reviewV3.confidence ?? 0;

      row.reviewCount =
        Number(
          reviewV3.evidence
            ?.sentimentEvidence || 0
        ) +
        Number(
          reviewV3.evidence
            ?.aggregateEvidence || 0
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
      responseRegex,
      enrichment
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
