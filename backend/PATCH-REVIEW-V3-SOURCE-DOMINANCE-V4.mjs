import fs from "node:fs";

const path =
  "./src/services/reviewScoringServiceV3.js";

const backup =
  "./src/services/reviewScoringServiceV3.before-source-dominance-v4.js";

const original =
  fs.readFileSync(
    path,
    "utf8"
  );


/*
|--------------------------------------------------------------------------
| ALREADY PATCHED SAFETY
|--------------------------------------------------------------------------
*/

if (
  original.includes(
    "sourceDistributionWithShare"
  ) ||
  original.includes(
    "sourceAttributedReviewIds"
  )
) {
  throw new Error(
    "Source-dominance patch already appears present. Stopping."
  );
}


/*
|--------------------------------------------------------------------------
| FIND REAL FUNCTION BODY
|--------------------------------------------------------------------------
|
| Important:
|
| function constructAspectScore({
|   ...
| }) {
|
| First { belongs to parameter destructuring.
| We must find the { AFTER `})`.
|
|--------------------------------------------------------------------------
*/

const signatureRegex =
  /function\s+constructAspectScore\s*\(\s*\{[\s\S]*?\}\s*\)\s*\{/m;

const signatureMatch =
  original.match(
    signatureRegex
  );


if (
  !signatureMatch ||
  signatureMatch.index ===
    undefined
) {
  throw new Error(
    "constructAspectScore() signature not found."
  );
}


const functionStart =
  signatureMatch.index;


const openingBrace =
  functionStart +
  signatureMatch[0]
    .lastIndexOf(
      "{"
    );


if (
  original[
    openingBrace
  ] !== "{"
) {
  throw new Error(
    "Real function opening brace resolution failed."
  );
}


/*
|--------------------------------------------------------------------------
| MATCH REAL FUNCTION CLOSING BRACE
|--------------------------------------------------------------------------
*/

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
  else if (
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
    "constructAspectScore() closing brace not found."
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


console.log(
  "constructAspectScore extracted chars:",
  fn.length
);


if (
  !fn.includes(
    "const reviewIds"
  )
) {
  throw new Error(
    "Safety check failed: extracted function still does not contain reviewIds."
  );
}


if (
  !fn.includes(
    "let scopeUsed"
  )
) {
  throw new Error(
    "Safety check failed: extracted function does not contain scopeUsed."
  );
}


/*
|--------------------------------------------------------------------------
| PATCH 1
| ADD PER-SOURCE DISTINCT REVIEW STORAGE
|--------------------------------------------------------------------------
*/

const reviewIdsRegex =
  /const\s+reviewIds\s*=\s*new\s+Set\s*\(\s*\)\s*;/m;


if (
  !reviewIdsRegex.test(
    fn
  )
) {
  throw new Error(
    "reviewIds declaration not found."
  );
}


fn =
  fn.replace(
    reviewIdsRegex,
`const reviewIds =
    new Set();


  /*
  |--------------------------------------------------------------------------
  | STRICT SOURCE-DIVERSITY EVIDENCE
  |--------------------------------------------------------------------------
  |
  | Uses distinct review_item_id after:
  |
  | - duplicate cleaning
  | - scope resolution
  | - preferred-scope selection
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
| RECORD EACH DISTINCT REVIEW AGAINST ITS SOURCE
|--------------------------------------------------------------------------
*/

const reviewAddRegex =
  /reviewIds\.add\s*\(\s*String\s*\(\s*row\.review_item_id\s*\)\s*\)\s*;/m;


if (
  !reviewAddRegex.test(
    fn
  )
) {
  throw new Error(
    "reviewIds.add(...) block not found."
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


    const strictSourceKey =
      row.source_id
        ? \`id:\${row.source_id}\`
        : row.source_name
          ? \`name:\${normalizeText(
              row.source_name
            )}\`
          : null;


    if (
      strictSourceKey
    ) {
      const strictSourceName =
        row.source_name ??
        String(
          row.source_id
        );


      if (
        !sourceReviewIds.has(
          strictSourceKey
        )
      ) {
        sourceReviewIds.set(
          strictSourceKey,
          {
            sourceKey:
              strictSourceKey,

            source:
              strictSourceName,

            reviewIds:
              new Set(),
          }
        );
      }


      sourceReviewIds
        .get(
          strictSourceKey
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
| BUILD SOURCE DISTRIBUTION BEFORE scopeUsed
|--------------------------------------------------------------------------
*/

const scopeRegex =
  /let\s+scopeUsed\s*=\s*null\s*;/m;


if (
  !scopeRegex.test(
    fn
  )
) {
  throw new Error(
    "scopeUsed marker not found."
  );
}


fn =
  fn.replace(
    scopeRegex,
`/*
  |--------------------------------------------------------------------------
  | STRICT SOURCE DISTRIBUTION
  |--------------------------------------------------------------------------
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
            entry.reviewIds.size,
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
    sourceDistribution.length;


  const sourceDistributionWithShare =
    sourceDistribution.map(
      entry => ({
        ...entry,

        share:
          effectiveReviewCount >
          0
            ? Number(
                (
                  entry.effectiveCount /
                  effectiveReviewCount
                ).toFixed(
                  4
                )
              )
            : 0,
      })
    );


  const maxSourceShare =
    sourceDistributionWithShare.length
      ? Math.max(
          ...sourceDistributionWithShare.map(
            entry =>
              entry.share
          )
        )
      : null;


  /*
  |--------------------------------------------------------------------------
  | FINAL STRICT GATE
  |--------------------------------------------------------------------------
  |
  | >= 50 effective source-attributed reviews
  | >= 3 independent sources
  | largest source <= 60%
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
| EXPOSE METADATA IN ASPECT RESULT
|--------------------------------------------------------------------------
*/

const returnRegex =
  /evidenceCount\s*:\s*preferredRows\.length\s*\+\s*platformAspectRows\.length\s*,/m;


if (
  !returnRegex.test(
    fn
  )
) {
  throw new Error(
    "evidenceCount return marker not found."
  );
}


fn =
  fn.replace(
    returnRegex,
`effectiveReviewCount,

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
| FINAL VALIDATION
|--------------------------------------------------------------------------
*/

const requiredTokens = [
  "sourceReviewIds",
  "sourceAttributedReviewIds",
  "effectiveReviewCount",
  "effectiveSourceCount",
  "sourceDistributionWithShare",
  "maxSourceShare",
  "sourceDominancePass",
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
      `Validation failed: ${token}`
    );
  }
}


/*
|--------------------------------------------------------------------------
| WRITE ONLY AFTER ALL CHECKS PASS
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
  "SUCCESS: Review V3 strict source-dominance metadata added."
);


console.log(
  "Backup:",
  backup
);
