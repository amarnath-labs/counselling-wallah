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
| ADD BACKEND SORT HELPER
|--------------------------------------------------------------------------
*/

const helperMarker =
  "function compareBucketNirfCutoff(";

if (
  !source.includes(
    helperMarker
  )
) {
  const routeMarker =
    "router.get(\n  '/recommendations'";

  const routeIndex =
    source.indexOf(
      routeMarker
    );

  if (
    routeIndex === -1
  ) {
    throw new Error(
      "Recommendations route not found."
    );
  }

  const helper =
`
/*
|--------------------------------------------------------------------------
| FINAL RECOMMENDATION ORDER
|--------------------------------------------------------------------------
|
| Bucket priority:
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


  const bucketA =
    String(
      a?.admission?.bucket ??
      a?.bucket ??
      ''
    )
      .trim()
      .toLowerCase();

  const bucketB =
    String(
      b?.admission?.bucket ??
      b?.bucket ??
      ''
    )
      .trim()
      .toLowerCase();


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
  | NIRF
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
  | MATCH SCORE TIE BREAKER
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
    "Added backend bucket/NIRF/cutoff sorter."
  );
}
else {
  console.log(
    "Backend sorter already present."
  );
}


/*
|--------------------------------------------------------------------------
| REPLACE OLD SORT
|--------------------------------------------------------------------------
*/

const oldSortRegex =
  /(?:const\s+sorted\s*=\s*)?scored\.sort\(\s*compareRecommendations\s*\)\s*;?/m;

if (
  oldSortRegex.test(
    source
  )
) {
  source =
    source.replace(
      oldSortRegex,
`const sorted =
        [...scored].sort(
          compareBucketNirfCutoff
        );`
    );

  console.log(
    "Replaced compareRecommendations sort."
  );
}
else if (
  source.includes(
    "compareBucketNirfCutoff"
  ) &&
  source.includes(
    "[...scored].sort"
  )
) {
  console.log(
    "New backend sorting already installed."
  );
}
else {
  throw new Error(
    "Old recommendations sort block not found."
  );
}


/*
|--------------------------------------------------------------------------
| WRITE
|--------------------------------------------------------------------------
*/

fs.writeFileSync(
  file,
  source,
  "utf8"
);

console.log(
  "Backend recommendation ordering patch complete."
);
