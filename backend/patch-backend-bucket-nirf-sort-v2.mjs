import fs from "node:fs";

const file =
  "./src/routes/cwRecV1-dev.js";

let source =
  fs.readFileSync(
    file,
    "utf8"
  );


/*
|--------------------------------------------------------------------------
| LOCATE ACTIVE RECOMMENDATIONS ROUTE
|--------------------------------------------------------------------------
*/

const recommendationPathRegex =
  /['"]\/recommendations['"]/;

const pathMatch =
  source.match(
    recommendationPathRegex
  );

if (!pathMatch) {
  throw new Error(
    "/recommendations route string not found."
  );
}

const pathIndex =
  pathMatch.index;


/*
|--------------------------------------------------------------------------
| Find router.get before /recommendations
|--------------------------------------------------------------------------
*/

const beforePath =
  source.slice(
    0,
    pathIndex
  );

const routeIndex =
  beforePath.lastIndexOf(
    "router.get"
  );

if (
  routeIndex === -1
) {
  throw new Error(
    "router.get for recommendations not found."
  );
}

console.log(
  "Recommendations route found."
);


/*
|--------------------------------------------------------------------------
| ADD FINAL SORT HELPER
|--------------------------------------------------------------------------
*/

const helperName =
  "compareBucketNirfCutoff";

if (
  !source.includes(
    `function ${helperName}(`
  )
) {
  const helper =
`

/*
|--------------------------------------------------------------------------
| FINAL RECOMMENDATION ORDER
|--------------------------------------------------------------------------
|
| Bucket:
| Dream -> Target -> Safe -> Backup
|
| Inside same bucket:
| 1. NIRF rank low -> high
| 2. Closing rank low -> high
| 3. Match score high -> low
|
*/

function compareBucketNirfCutoff(
  a,
  b
) {
  const bucketPriority = {
    dream: 0,
    target: 1,
    safe: 2,
    backup: 3,
  };


  const normalizeBucketKey =
    (value) =>
      String(
        value || ''
      )
        .trim()
        .toLowerCase();


  const bucketA =
    normalizeBucketKey(
      a?.admission?.bucket ??
      a?.bucket
    );

  const bucketB =
    normalizeBucketKey(
      b?.admission?.bucket ??
      b?.bucket
    );


  const priorityA =
    bucketPriority[
      bucketA
    ] ?? 99;

  const priorityB =
    bucketPriority[
      bucketB
    ] ?? 99;


  if (
    priorityA !==
    priorityB
  ) {
    return (
      priorityA -
      priorityB
    );
  }


  /*
  |--------------------------------------------------------------------------
  | NIRF RANK
  |--------------------------------------------------------------------------
  */

  const nirfA =
    Number(
      a?.nirfRank ??
      a?.quality?.nirfRank ??
      a?.college?.nirfRank
    );

  const nirfB =
    Number(
      b?.nirfRank ??
      b?.quality?.nirfRank ??
      b?.college?.nirfRank
    );


  const hasNirfA =
    Number.isFinite(
      nirfA
    ) &&
    nirfA > 0;

  const hasNirfB =
    Number.isFinite(
      nirfB
    ) &&
    nirfB > 0;


  if (
    hasNirfA &&
    hasNirfB &&
    nirfA !== nirfB
  ) {
    return (
      nirfA -
      nirfB
    );
  }


  if (
    hasNirfA &&
    !hasNirfB
  ) {
    return -1;
  }


  if (
    !hasNirfA &&
    hasNirfB
  ) {
    return 1;
  }


  /*
  |--------------------------------------------------------------------------
  | CLOSING RANK
  |--------------------------------------------------------------------------
  */

  const cutoffA =
    Number(
      a?.closingRank ??
      a?.closing_rank ??
      a?.branch?.closingRank
    );

  const cutoffB =
    Number(
      b?.closingRank ??
      b?.closing_rank ??
      b?.branch?.closingRank
    );


  const hasCutoffA =
    Number.isFinite(
      cutoffA
    ) &&
    cutoffA > 0;

  const hasCutoffB =
    Number.isFinite(
      cutoffB
    ) &&
    cutoffB > 0;


  if (
    hasCutoffA &&
    hasCutoffB &&
    cutoffA !== cutoffB
  ) {
    return (
      cutoffA -
      cutoffB
    );
  }


  if (
    hasCutoffA &&
    !hasCutoffB
  ) {
    return -1;
  }


  if (
    !hasCutoffA &&
    hasCutoffB
  ) {
    return 1;
  }


  /*
  |--------------------------------------------------------------------------
  | MATCH SCORE FINAL TIE BREAKER
  |--------------------------------------------------------------------------
  */

  const scoreA =
    Number(
      a?.matchScore ??
      a?.premium?.score ??
      0
    );

  const scoreB =
    Number(
      b?.matchScore ??
      b?.premium?.score ??
      0
    );


  return (
    scoreB -
    scoreA
  );
}


`;

  source =
    source.slice(
      0,
      routeIndex
    ) +
    helper +
    source.slice(
      routeIndex
    );

  console.log(
    "Added compareBucketNirfCutoff helper."
  );
}
else {
  console.log(
    "Sorter helper already present."
  );
}


/*
|--------------------------------------------------------------------------
| FIND RECOMMENDATIONS ROUTE AGAIN AFTER INSERT
|--------------------------------------------------------------------------
*/

const newPathMatch =
  source.match(
    recommendationPathRegex
  );

if (!newPathMatch) {
  throw new Error(
    "Recommendations route lost after helper insert."
  );
}

const newPathIndex =
  newPathMatch.index;

const newBeforePath =
  source.slice(
    0,
    newPathIndex
  );

const newRouteIndex =
  newBeforePath.lastIndexOf(
    "router.get"
  );

let routeSource =
  source.slice(
    newRouteIndex
  );


/*
|--------------------------------------------------------------------------
| REPLACE CURRENT SORT
|--------------------------------------------------------------------------
|
| Handles:
|
| scored.sort(compareRecommendations);
|
| OR
|
| const sorted =
|   scored.sort(
|     compareRecommendations
|   );
|
|--------------------------------------------------------------------------
*/

if (
  routeSource.includes(
    "compareBucketNirfCutoff"
  ) &&
  /\[\s*\.\.\.scored\s*\]\s*\.sort\s*\(\s*compareBucketNirfCutoff\s*\)/m
    .test(
      routeSource
    )
) {
  console.log(
    "New recommendation sorting already installed."
  );
}
else {
  const constSortedRegex =
    /const\s+sorted\s*=\s*scored\.sort\s*\(\s*compareRecommendations\s*\)\s*;/m;

  const directSortRegex =
    /scored\.sort\s*\(\s*compareRecommendations\s*\)\s*;/m;


  if (
    constSortedRegex.test(
      routeSource
    )
  ) {
    routeSource =
      routeSource.replace(
        constSortedRegex,
`const sorted =
        [...scored].sort(
          compareBucketNirfCutoff
        );`
      );

    console.log(
      "Replaced const sorted recommendation sort."
    );
  }
  else if (
    directSortRegex.test(
      routeSource
    )
  ) {
    routeSource =
      routeSource.replace(
        directSortRegex,
`const sorted =
        [...scored].sort(
          compareBucketNirfCutoff
        );`
      );

    /*
     * If code later still references scored
     * instead of sorted, next safety check
     * will reveal it.
     */

    console.log(
      "Replaced direct scored.sort."
    );
  }
  else {
    throw new Error(
      "compareRecommendations sort not found inside recommendations route."
    );
  }
}


/*
|--------------------------------------------------------------------------
| REASSEMBLE FILE
|--------------------------------------------------------------------------
*/

source =
  source.slice(
    0,
    newRouteIndex
  ) +
  routeSource;


/*
|--------------------------------------------------------------------------
| SAFETY CHECK
|--------------------------------------------------------------------------
*/

if (
  !source.includes(
    "compareBucketNirfCutoff"
  )
) {
  throw new Error(
    "Sorter helper missing after patch."
  );
}

if (
  !source.includes(
    "[...scored].sort"
  )
) {
  throw new Error(
    "New scored sorting missing."
  );
}


fs.writeFileSync(
  file,
  source,
  "utf8"
);

console.log(
  "Backend bucket/NIRF/cutoff ordering installed successfully."
);
