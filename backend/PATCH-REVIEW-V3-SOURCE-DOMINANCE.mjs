import fs from "node:fs";

const path =
  "./src/services/reviewScoringServiceV3.js";

let text =
  fs.readFileSync(
    path,
    "utf8"
  );


const backup =
  "./src/services/reviewScoringServiceV3.before-source-dominance-v2.js";

fs.writeFileSync(
  backup,
  text,
  "utf8"
);


/*
|--------------------------------------------------------------------------
| 1. ADD SOURCE -> DISTINCT REVIEW IDS MAP
|--------------------------------------------------------------------------
*/

const mapMarker = `  const reviewIds =
    new Set();

  let branchEvidenceCount = 0;`;


const mapReplacement = `  const reviewIds =
    new Set();


  /*
  |--------------------------------------------------------------------------
  | STRICT SOURCE DIVERSITY
  |--------------------------------------------------------------------------
  |
  | This map counts DISTINCT usable review items per source
  | AFTER duplicate cleaning and scope selection.
  |
  | Platform aggregate ratings are intentionally NOT counted
  | as individual review evidences.
  |
  |--------------------------------------------------------------------------
  */

  const sourceReviewIds =
    new Map();


  let branchEvidenceCount = 0;`;


if (
  !text.includes(
    mapMarker
  )
) {
  throw new Error(
    "reviewIds marker not found. No changes made."
  );
}


text =
  text.replace(
    mapMarker,
    mapReplacement
  );


/*
|--------------------------------------------------------------------------
| 2. ADD DISTINCT REVIEW INTO ITS SOURCE BUCKET
|--------------------------------------------------------------------------
*/

const reviewIdMarker = `    reviewIds.add(
      String(
        row.review_item_id
      )
    );

    if (
      row.resolvedScope ===
      "branch"`;


const reviewIdReplacement = `    const reviewId =
      String(
        row.review_item_id
      );


    reviewIds.add(
      reviewId
    );


    const sourceKey =
      row.source_id
        ? \`id:\${row.source_id}\`
        : row.source_name
          ? \`name:\${normalizeText(
              row.source_name
            )}\`
          : "unknown";


    const sourceName =
      row.source_name ??
      (
        row.source_id
          ? String(
              row.source_id
            )
          : "Unknown source"
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


    if (
      row.resolvedScope ===
      "branch"`;


if (
  !text.includes(
    reviewIdMarker
  )
) {
  throw new Error(
    "reviewIds.add block not found. No changes made."
  );
}


text =
  text.replace(
    reviewIdMarker,
    reviewIdReplacement
  );


/*
|--------------------------------------------------------------------------
| 3. BUILD SOURCE DISTRIBUTION
|--------------------------------------------------------------------------
*/

const scopeMarker = `  /*
  |--------------------------------------------------------------------------
  | Scope used
  |--------------------------------------------------------------------------
  */

  let scopeUsed = null;`;


const distributionReplacement = `  /*
  |--------------------------------------------------------------------------
  | STRICT SOURCE DISTRIBUTION
  |--------------------------------------------------------------------------
  |
  | effectiveReviewCount:
  |   distinct usable textual reviews
  |
  | effectiveSourceCount:
  |   sources contributing >=1 usable textual review
  |
  | maxSourceShare:
  |   largest source's share of effective reviews
  |
  |--------------------------------------------------------------------------
  */


  const effectiveReviewCount =
    reviewIds.size;


  const sourceDistribution =
    [...sourceReviewIds.values()]
      .map(
        entry => ({
          sourceKey:
            entry.sourceKey,

          source:
            entry.sourceName,

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
    sourceDistributionWithShare
      .length >
    0
      ? Math.max(
          ...sourceDistributionWithShare.map(
            entry =>
              entry.share
          )
        )
      : null;


  const sourceDominancePass =
    effectiveReviewCount >
      0 &&
    effectiveSourceCount >=
      3 &&
    maxSourceShare !==
      null &&
    maxSourceShare <=
      0.60;


  /*
  |--------------------------------------------------------------------------
  | Scope used
  |--------------------------------------------------------------------------
  */

  let scopeUsed = null;`;


if (
  !text.includes(
    scopeMarker
  )
) {
  throw new Error(
    "Scope marker not found. No changes made."
  );
}


text =
  text.replace(
    scopeMarker,
    distributionReplacement
  );


/*
|--------------------------------------------------------------------------
| 4. EXPOSE NEW FIELDS WITHOUT CHANGING OLD V3 FIELDS
|--------------------------------------------------------------------------
*/

const returnMarker = `    reviewCount:
      reviewIds.size,

    evidenceCount:
      preferredRows.length +
      platformAspectRows.length,

    branchEvidenceCount,`;


const returnReplacement = `    reviewCount:
      reviewIds.size,


    /*
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
      platformAspectRows.length,

    branchEvidenceCount,`;


if (
  !text.includes(
    returnMarker
  )
) {
  throw new Error(
    "constructAspectScore return marker not found. No changes made."
  );
}


text =
  text.replace(
    returnMarker,
    returnReplacement
  );


fs.writeFileSync(
  path,
  text,
  "utf8"
);


console.log(
  "SUCCESS: Review V3 source distribution + dominance metadata added."
);
