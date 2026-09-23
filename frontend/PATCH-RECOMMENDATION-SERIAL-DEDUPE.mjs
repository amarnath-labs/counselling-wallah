import fs from "node:fs";

const file =
  "./src/components/RecommendationSlide.jsx";

let source =
  fs.readFileSync(
    file,
    "utf8"
  );

/*
|--------------------------------------------------------------------------
| 1. ADD NORMALIZATION + DEDUPE HELPERS
|--------------------------------------------------------------------------
*/

const mainMarker =
`/*
|--------------------------------------------------------------------------
| MAIN RECOMMENDATION SLIDE
|--------------------------------------------------------------------------
*/`;

if (
  !source.includes(
    "function dedupeRecommendationRows("
  )
) {
  const markerIndex =
    source.indexOf(
      mainMarker
    );

  if (
    markerIndex === -1
  ) {
    throw new Error(
      "MAIN RECOMMENDATION SLIDE marker not found"
    );
  }

  const helperCode =
`
/*
|--------------------------------------------------------------------------
| FINAL RECOMMENDATION DEDUPLICATION
|--------------------------------------------------------------------------
|
| IMPORTANT:
| - One college + branch combination appears only once.
| - Existing ranking / scoring / admission logic is NOT changed.
| - First row after production sorting wins.
|--------------------------------------------------------------------------
*/

function normalizeRecommendationKeyPart(
  value
) {
  return String(
    value ?? ''
  )
    .toLowerCase()
    .replace(
      /&/g,
      ' and '
    )
    .replace(
      /[^a-z0-9]+/g,
      ' '
    )
    .replace(
      /\\s+/g,
      ' '
    )
    .trim();
}


function getRecommendationCollegeIdentity(
  row
) {
  const collegeId =
    row?.collegeId ??
    row?.college?.id ??
    row?.college_id ??
    null;

  if (
    collegeId !== null &&
    collegeId !== undefined &&
    String(
      collegeId
    ).trim()
  ) {
    return (
      'id:' +
      normalizeRecommendationKeyPart(
        collegeId
      )
    );
  }

  const collegeName =
    row?.college?.name ??
    row?.collegeName ??
    row?.college_name ??
    row?.name ??
    '';

  return (
    'name:' +
    normalizeRecommendationKeyPart(
      collegeName
    )
  );
}


function getRecommendationBranchIdentity(
  row
) {
  const branchId =
    row?.branch?.id ??
    row?.branchId ??
    row?.branch_id ??
    null;

  if (
    branchId !== null &&
    branchId !== undefined &&
    String(
      branchId
    ).trim()
  ) {
    return (
      'id:' +
      normalizeRecommendationKeyPart(
        branchId
      )
    );
  }

  const branchName =
    row?.branch?.name ??
    row?.branchName ??
    row?.branch_name ??
    '';

  return (
    'name:' +
    normalizeRecommendationKeyPart(
      branchName
    )
  );
}


function getRecommendationUniqueKey(
  row
) {
  return [
    getRecommendationCollegeIdentity(
      row
    ),

    getRecommendationBranchIdentity(
      row
    ),
  ].join(
    '::'
  );
}


function dedupeRecommendationRows(
  rows
) {
  const seen =
    new Set();

  const unique =
    [];

  for (
    const row
    of rows
  ) {
    if (
      !row
    ) {
      continue;
    }

    const key =
      getRecommendationUniqueKey(
        row
      );

    if (
      seen.has(
        key
      )
    ) {
      continue;
    }

    seen.add(
      key
    );

    unique.push(
      row
    );
  }

  return unique;
}


`;

  source =
    source.slice(
      0,
      markerIndex
    ) +
    helperCode +
    source.slice(
      markerIndex
    );
}


/*
|--------------------------------------------------------------------------
| 2. REMOVE GLOBAL RANK FROM VISIBLE BADGE
|--------------------------------------------------------------------------
|
| Old:
| #64 etc. could come from backend globalRank.
|
| New:
| Display position is always index + 1.
|--------------------------------------------------------------------------
*/

const oldRankBlockRegex =
  /#\{\s*row\?\.ranking\?\.globalRank\s*\?\?\s*row\?\.premium\?\.ranking\?\.globalRank\s*\?\?\s*index\s*\+\s*1\s*\}/m;

if (
  oldRankBlockRegex.test(
    source
  )
) {
  source =
    source.replace(
      oldRankBlockRegex,
      '#{index + 1}'
    );
}
else if (
  !source.includes(
    '#{index + 1}'
  )
) {
  throw new Error(
    "Visible rank badge block not found"
  );
}


/*
|--------------------------------------------------------------------------
| 3. REPLACE rankedRows PIPELINE
|--------------------------------------------------------------------------
|
| Sort first using current comparator.
| Then dedupe.
|
| This means the strongest row according to existing production ranking
| wins whenever an exact college+branch duplicate exists.
|--------------------------------------------------------------------------
*/

const rankedRowsStart =
  source.indexOf(
    "const rankedRows ="
  );

if (
  rankedRowsStart === -1
) {
  throw new Error(
    "const rankedRows not found"
  );
}

const paywallMarker =
`/*
  |--------------------------------------------------------------------------
  | PAYWALL`;

const paywallIndex =
  source.indexOf(
    paywallMarker,
    rankedRowsStart
  );

if (
  paywallIndex === -1
) {
  throw new Error(
    "PAYWALL marker not found after rankedRows"
  );
}

const currentRankBlock =
  source.slice(
    rankedRowsStart,
    paywallIndex
  );

if (
  !currentRankBlock.includes(
    "comparePremiumRows"
  )
) {
  throw new Error(
    "Unexpected rankedRows block. Existing comparator not found."
  );
}

const newRankBlock =
`const rankedRows =
    useMemo(
      () => {
        /*
        |--------------------------------------------------------------------------
        | SERIAL + DEDUPE PIPELINE
        |--------------------------------------------------------------------------
        |
        | 1. remove null rows
        | 2. preserve existing recommendation ranking comparator
        | 3. remove exact college+branch duplicates
        |
        | Serial number shown in the card comes from this final array index.
        |--------------------------------------------------------------------------
        */

        const sortedRows =
          [...rows]
            .filter(
              Boolean
            )
            .sort(
              comparePremiumRows
            );

        return dedupeRecommendationRows(
          sortedRows
        );
      },
      [
        rows,
      ]
    );


  `;

source =
  source.slice(
    0,
    rankedRowsStart
  ) +
  newRankBlock +
  source.slice(
    paywallIndex
  );


/*
|--------------------------------------------------------------------------
| 4. MAKE REACT KEY STABLE
|--------------------------------------------------------------------------
|
| Do not use index in key.
|--------------------------------------------------------------------------
*/

source =
  source.replace(
    /key=\{\s*`\$\{collegeId\}-\$\{branchName\}-\$\{index\}`\s*\}/gm,
    `key={
                    getRecommendationUniqueKey(
                      row
                    )
                  }`
  );


fs.writeFileSync(
  file,
  source,
  "utf8"
);

console.log("");
console.log(
  "========================================"
);
console.log(
  "SERIAL + DEDUPE PATCH APPLIED"
);
console.log(
  "========================================"
);
console.log(
  "Updated:",
  file
);
