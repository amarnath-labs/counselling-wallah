import fs from "node:fs";

const file =
  "./src/services/reviewIntelligenceV4Service.js";

let source =
  fs.readFileSync(
    file,
    "utf8"
  );


function requireText(
  text,
  label
) {
  if (
    !source.includes(
      text
    )
  ) {
    throw new Error(
      `Required marker missing: ${label}`
    );
  }
}


/*
|--------------------------------------------------------------------------
| 1. SOURCE QUALITY
|--------------------------------------------------------------------------
|
| Do not call a source "strong" merely because we have full review text.
|
| Source quality and content access are different concepts.
|
*/

const sourceQualityStart =
  source.indexOf(
    "function classifySourceQuality("
  );

const sourceQualityEnd =
  source.indexOf(
    "function sentimentDistribution(",
    sourceQualityStart
  );

if (
  sourceQualityStart === -1 ||
  sourceQualityEnd === -1
) {
  throw new Error(
    "Could not locate classifySourceQuality function."
  );
}

const correctedSourceQuality =
`function classifySourceQuality(
  row
) {
  const type =
    normalize(
      row.source_type
    );

  const name =
    normalize(
      row.source_name
    );

  /*
  |--------------------------------------------------------------------------
  | Strong
  |--------------------------------------------------------------------------
  |
  | Reserve this for explicitly official / verified source classes.
  |
  | Full review access does NOT automatically make a source verified.
  |
  */

  if (
    type.includes(
      "official"
    ) ||
    type.includes(
      "verified"
    )
  ) {
    return "strong";
  }

  /*
  |--------------------------------------------------------------------------
  | Structured review platforms
  |--------------------------------------------------------------------------
  */

  if (
    type.includes(
      "review"
    ) ||
    type.includes(
      "rating"
    ) ||
    type.includes(
      "platform"
    ) ||
    type.includes(
      "structured"
    ) ||
    name.includes(
      "google"
    ) ||
    name.includes(
      "shiksha"
    ) ||
    name.includes(
      "collegedunia"
    ) ||
    name.includes(
      "careers360"
    )
  ) {
    return "structured";
  }

  /*
  |--------------------------------------------------------------------------
  | Community / discussion
  |--------------------------------------------------------------------------
  */

  if (
    type.includes(
      "community"
    ) ||
    type.includes(
      "forum"
    ) ||
    type.includes(
      "discussion"
    ) ||
    type.includes(
      "social"
    ) ||
    name.includes(
      "reddit"
    ) ||
    name.includes(
      "quora"
    )
  ) {
    return "community";
  }

  return "limited";
}


`;

source =
  source.slice(
    0,
    sourceQualityStart
  ) +
  correctedSourceQuality +
  source.slice(
    sourceQualityEnd
  );


/*
|--------------------------------------------------------------------------
| 2. REVIEW RECENCY
|--------------------------------------------------------------------------
|
| review_date = when the student review was written.
| observed_at = when our system observed/imported it.
|
| An old review imported today must NOT become a recent review.
|
*/

const fallbackRegex =
  /row\.review_date\s*\|\|\s*row\.observed_at/g;

const fallbackMatches =
  source.match(
    fallbackRegex
  ) || [];

if (
  fallbackMatches.length === 0
) {
  console.log(
    "No review_date/observed_at fallback remained."
  );
}
else {
  source =
    source.replace(
      fallbackRegex,
      "row.review_date"
    );

  console.log(
    `Removed ${fallbackMatches.length} observed_at recency fallback(s).`
  );
}


/*
|--------------------------------------------------------------------------
| 3. V4 COVERAGE
|--------------------------------------------------------------------------
|
| V3 scoring availability != V4 evidence availability.
|
| Example:
|
| Placements can have 30+ textual evidence items while V3 score is null.
| That aspect is evidence-supported, not "missing".
|
*/

const coverageStart =
  source.indexOf(
    "  const availableAspects ="
  );

const coverageEnd =
  source.indexOf(
    "  const coveragePercent =",
    coverageStart
  );

if (
  coverageStart === -1 ||
  coverageEnd === -1
) {
  throw new Error(
    "Could not locate availableAspects block."
  );
}

const correctedCoverageSource =
`  /*
  |--------------------------------------------------------------------------
  | V4 evidence coverage
  |--------------------------------------------------------------------------
  |
  | V3 scored aspects and V4 evidence-supported aspects are intentionally
  | separate.
  |
  */

  const scoredAspects =
    Object.entries(
      reviewV3
        ?.aspects ||
        {}
    )
      .filter(
        (
          [
            ,
            value,
          ]
        ) =>
          numberOrNull(
            value?.score
          ) !== null
      )
      .map(
        (
          [
            aspect,
          ]
        ) =>
          aspect
      );


  const textualAspectSet =
    new Set(
      usableRows.map(
        (row) =>
          row.aspect
      )
    );


  const availableAspects =
    ASPECTS.filter(
      (aspect) =>
        textualAspectSet.has(
          aspect
        ) ||
        scoredAspects.includes(
          aspect
        )
    );


  const unscoredEvidenceAspects =
    ASPECTS.filter(
      (aspect) =>
        textualAspectSet.has(
          aspect
        ) &&
        !scoredAspects.includes(
          aspect
        )
    );


`;

source =
  source.slice(
    0,
    coverageStart
  ) +
  correctedCoverageSource +
  source.slice(
    coverageEnd
  );


/*
|--------------------------------------------------------------------------
| 4. Return richer coverage contract
|--------------------------------------------------------------------------
*/

const returnCoverageStart =
  source.indexOf(
    "    coverage: {"
  );

const returnCoverageEnd =
  source.indexOf(
    "    recency: {",
    returnCoverageStart
  );

if (
  returnCoverageStart === -1 ||
  returnCoverageEnd === -1
) {
  throw new Error(
    "Could not locate returned coverage block."
  );
}

const correctedReturnCoverage =
`    coverage: {
      /*
      | Number of aspects with either:
      | - usable textual evidence, or
      | - a valid V3 aspect score.
      */
      availableAspects:
        availableAspects.length,

      totalAspects:
        ASPECTS.length,

      percent:
        coveragePercent,

      /*
      | V3 successfully calculated numeric aspect scores.
      */
      scoredAspects,

      scoredAspectCount:
        scoredAspects.length,

      /*
      | Evidence exists but V3 currently has no numeric aspect score.
      |
      | This is NOT missing evidence.
      */
      unscoredEvidenceAspects,

      unscoredEvidenceAspectCount:
        unscoredEvidenceAspects.length,

      missingAspects,

      usableEvidence:
        usableRows.length,

      independentSources:
        sourceKeys.size,
    },


`;

source =
  source.slice(
    0,
    returnCoverageStart
  ) +
  correctedReturnCoverage +
  source.slice(
    returnCoverageEnd
  );


/*
|--------------------------------------------------------------------------
| 5. Ensure scoring remains untouched
|--------------------------------------------------------------------------
*/

requireText(
  "affectsPremiumScore:",
  "affectsPremiumScore"
);

requireText(
  "affectsRecommendationOrder:",
  "affectsRecommendationOrder"
);

requireText(
  "existingReviewComponentPreserved:",
  "existingReviewComponentPreserved"
);


fs.writeFileSync(
  file,
  source,
  "utf8"
);

console.log(
  "Review Intelligence V4 semantic correction complete."
);
