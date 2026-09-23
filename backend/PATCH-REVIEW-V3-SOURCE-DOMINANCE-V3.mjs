import fs from "node:fs";


const path =
  "./src/services/reviewScoringServiceV3.js";


const backup =
  "./src/services/reviewScoringServiceV3.before-source-dominance-v3.js";


const original =
  fs.readFileSync(
    path,
    "utf8"
  );


/*
|--------------------------------------------------------------------------
| Safety
|--------------------------------------------------------------------------
*/

if (
  original.includes(
    "sourceDistributionWithShare"
  ) ||
  original.includes(
    "sourceDominancePass"
  )
) {
  throw new Error(
    "Source-dominance patch appears to already exist. Stopping."
  );
}


const functionStart =
  original.indexOf(
    "function constructAspectScore("
  );


if (
  functionStart === -1
) {
  throw new Error(
    "constructAspectScore() not found."
  );
}


/*
|--------------------------------------------------------------------------
| Find exact function end using brace matching
|--------------------------------------------------------------------------
*/

const openingBrace =
  original.indexOf(
    "{",
    functionStart
  );


if (
  openingBrace === -1
) {
  throw new Error(
    "constructAspectScore opening brace not found."
  );
}


let depth = 0;
let functionEnd = -1;


for (
  let index =
    openingBrace;
  index <
    original.length;
  index++
) {
  const char =
    original[
      index
    ];


  if (
    char === "{"
  ) {
    depth++;
  }


  if (
    char === "}"
  ) {
    depth--;


    if (
      depth === 0
    ) {
      functionEnd =
        index + 1;

      break;
    }
  }
}


if (
  functionEnd === -1
) {
  throw new Error(
    "constructAspectScore function end not found."
  );
}


const before =
  original.slice(
    0,
    functionStart
  );


let fn =
  original.slice(
    functionStart,
    functionEnd
  );


const after =
  original.slice(
    functionEnd
  );


/*
|--------------------------------------------------------------------------
| PATCH 1
|
| Add source -> distinct review IDs structures
|--------------------------------------------------------------------------
*/

const reviewSetRegex =
  /const\s+reviewIds\s*=\s*new\s+Set\s*\(\s*\)\s*;/;


if (
  !reviewSetRegex.test(
    fn
  )
) {
  throw new Error(
    "reviewIds Set not found inside constructAspectScore()."
  );
}


fn =
  fn.replace(
    reviewSetRegex,
`const reviewIds =
    new Set();


  /*
  |--------------------------------------------------------------------------
  | STRICT MULTI-SOURCE REVIEW EVIDENCE
  |--------------------------------------------------------------------------
  |
  | Counts are based only on:
  |
  | - cleaned review evidence
  | - preferred scope
  | - distinct review_item_id
  | - attributable review source
  |
  | Platform aggregate ratings are NOT treated as individual reviews.
  |
  |--------------------------------------------------------------------------
  */

  const sourceReviewIds =
    new Map();


  const sourceAttributedReviewIds =
    new Set();`
  );


/*
|--------------------------------------------------------------------------
| PATCH 2
|
| Replace first reviewIds.add(...) inside preferredRows loop
|--------------------------------------------------------------------------
*/

const reviewAddRegex =
  /reviewIds\.add\s*\(\s*String\s*\(\s*row\.review_item_id\s*\)\s*\)\s*;/;


const reviewAddMatch =
  fn.match(
    reviewAddRegex
  );


if (
  !reviewAddMatch
) {
  throw new Error(
    "reviewIds.add(row.review_item_id) not found inside constructAspectScore()."
  );
}


fn =
  fn.replace(
    reviewAddRegex,
`const reviewId =
      String(
        row.review_item_id
      );


    reviewIds.add(
      reviewId
    );


    /*
    |--------------------------------------------------------------------------
    | Only identifiable sources count toward source diversity.
    |--------------------------------------------------------------------------
    */

    const sourceKey =
      row.source_id
        ? \`id:\${row.source_id}\`
        : row.source_name
          ? \`name:\${normalizeText(
              row.source_name
            )}\`
          : null;


    if (
      sourceKey
    ) {
      const sourceName =
        row.source_name ??
        String(
          row.source_id
        );


      if (
        !sourceReviewIds.has(
          sourceKey
        )
      ) {
        sourceReviewIds.set(
          sourceKey,
          {
            sourceKey,

            source:
              sourceName,

            reviewIds:
              new Set(),
          }
        );
      }


      sourceReviewIds
        .get(
          sourceKey
        )
        .reviewIds
        .add(
          reviewId
        );


      sourceAttributedReviewIds
        .add(
          reviewId
        );
    }`
  );


/*
|--------------------------------------------------------------------------
| PATCH 3
|
| Calculate source distribution immediately before scopeUsed
|--------------------------------------------------------------------------
*/

const scopeRegex =
  /let\s+scopeUsed\s*=\s*null\s*;/;


if (
  !scopeRegex.test(
    fn
  )
) {
  throw new Error(
    "scopeUsed marker not found inside constructAspectScore()."
  );
}


fn =
  fn.replace(
    scopeRegex,
`/*
  |--------------------------------------------------------------------------
  | SOURCE DISTRIBUTION
  |--------------------------------------------------------------------------
  */


  /*
  | Strict effective count intentionally excludes reviews
  | whose source cannot be identified.
  */

  const effectiveReviewCount =
    sourceAttributedReviewIds
      .size;


  const sourceDistribution =
    [...sourceReviewIds.values()]
      .map(
        entry => ({
          sourceKey:
            entry.sourceKey,

          source:
            entry.source,

          effectiveCount:
            entry.reviewIds
              .size,
        })
      )
      .filter(
        entry =>
          entry.effectiveCount >
          0
      )
      .sort(
        (
          left,
          right
        ) =>
          right.effectiveCount -
          left.effectiveCount
      );


  const effectiveSourceCount =
    sourceDistribution
      .length;


  const sourceDistributionWithShare =
    sourceDistribution
      .map(
        entry => ({
          ...entry,

          share:
            effectiveReviewCount >
            0
              ? Number(
                  (
                    entry
                      .effectiveCount /
                    effectiveReviewCount
                  ).toFixed(
                    4
                  )
                )
              : 0,
        })
      );


  const maxSourceShare =
    sourceDistributionWithShare
      .length >
    0
      ? Math.max(
          ...sourceDistributionWithShare
            .map(
              entry =>
                entry.share
            )
        )
      : null;


  /*
  |--------------------------------------------------------------------------
  | Strict source-diversity gate
  |--------------------------------------------------------------------------
  |
  | >= 50 source-attributed effective reviews
  | >= 3 independent sources
  | no single source > 60%
  |
  |--------------------------------------------------------------------------
  */

  const sourceDominancePass =
    effectiveReviewCount >=
      50 &&
    effectiveSourceCount >=
      3 &&
    maxSourceShare !==
      null &&
    maxSourceShare <=
      0.60;


  let scopeUsed = null;`
  );


/*
|--------------------------------------------------------------------------
| PATCH 4
|
| Add new metadata immediately before evidenceCount
|--------------------------------------------------------------------------
*/

const evidenceReturnRegex =
  /evidenceCount\s*:\s*preferredRows\.length\s*\+\s*platformAspectRows\.length\s*,/;


if (
  !evidenceReturnRegex.test(
    fn
  )
) {
  throw new Error(
    "evidenceCount return field not found inside constructAspectScore()."
  );
}


fn =
  fn.replace(
    evidenceReturnRegex,
`/*
    |--------------------------------------------------------------------------
    | STRICT REVIEW EVIDENCE METADATA
    |--------------------------------------------------------------------------
    */

    effectiveReviewCount,

    effectiveSourceCount,

    sourceDistribution:
      sourceDistributionWithShare,

    maxSourceShare,

    sourceDominancePass,

    evidenceCount:
      preferredRows.length +
      platformAspectRows.length,`
  );


/*
|--------------------------------------------------------------------------
| Final validation before writing
|--------------------------------------------------------------------------
*/

const requiredTokens = [
  "effectiveReviewCount",
  "effectiveSourceCount",
  "sourceDistributionWithShare",
  "maxSourceShare",
  "sourceDominancePass",
  "sourceAttributedReviewIds",
];


for (
  const token
  of requiredTokens
) {
  if (
    !fn.includes(
      token
    )
  ) {
    throw new Error(
      `Final validation failed: ${token}`
    );
  }
}


/*
|--------------------------------------------------------------------------
| Write only after EVERY validation passed
|--------------------------------------------------------------------------
*/

fs.writeFileSync(
  backup,
  original,
  "utf8"
);


fs.writeFileSync(
  path,
  before +
    fn +
    after,
  "utf8"
);


console.log(
  "SUCCESS: Review V3 source dominance metadata added."
);


console.log(
  "Backup:",
  backup
);
