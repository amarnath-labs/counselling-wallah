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
| 1. INSERT HELPERS BEFORE RecommendationSlide EXPORT
|--------------------------------------------------------------------------
*/

if (
  !source.includes(
    "function dedupeRecommendationRows("
  )
) {
  const exportMarker =
    "export default function RecommendationSlide";

  const exportIndex =
    source.indexOf(
      exportMarker
    );

  if (
    exportIndex === -1
  ) {
    throw new Error(
      "RecommendationSlide export function not found"
    );
  }

  const helperCode =
`
/*
|--------------------------------------------------------------------------
| RECOMMENDATION SERIAL + EXACT DUPLICATE HANDLING
|--------------------------------------------------------------------------
|
| Same college + same branch = one visible option.
| Different branches of the same college remain separate.
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
  const id =
    row?.collegeId ??
    row?.college?.id ??
    row?.college_id ??
    null;

  if (
    id !== null &&
    id !== undefined &&
    String(id).trim()
  ) {
    return (
      'id:' +
      normalizeRecommendationKeyPart(
        id
      )
    );
  }

  const name =
    row?.college?.name ??
    row?.collegeName ??
    row?.college_name ??
    row?.name ??
    '';

  return (
    'name:' +
    normalizeRecommendationKeyPart(
      name
    )
  );
}


function getRecommendationBranchIdentity(
  row
) {
  const id =
    row?.branch?.id ??
    row?.branchId ??
    row?.branch_id ??
    null;

  if (
    id !== null &&
    id !== undefined &&
    String(id).trim()
  ) {
    return (
      'id:' +
      normalizeRecommendationKeyPart(
        id
      )
    );
  }

  const name =
    row?.branch?.name ??
    row?.branchName ??
    row?.branch_name ??
    '';

  return (
    'name:' +
    normalizeRecommendationKeyPart(
      name
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
      exportIndex
    ) +
    helperCode +
    source.slice(
      exportIndex
    );
}


/*
|--------------------------------------------------------------------------
| 2. FORCE VISIBLE CARD NUMBER TO FINAL LIST INDEX + 1
|--------------------------------------------------------------------------
*/

const globalRankPattern =
  /#\{\s*row\?\.ranking\?\.globalRank\s*\?\?\s*row\?\.premium\?\.ranking\?\.globalRank\s*\?\?\s*index\s*\+\s*1\s*\}/m;

if (
  globalRankPattern.test(
    source
  )
) {
  source =
    source.replace(
      globalRankPattern,
      '#{index + 1}'
    );
}
else {
  console.log(
    "Rank badge pattern already changed or current file differs."
  );
}


/*
|--------------------------------------------------------------------------
| 3. REPLACE rankedRows useMemo SAFELY
|--------------------------------------------------------------------------
*/

const rankedStart =
  source.indexOf(
    "const rankedRows ="
  );

if (
  rankedStart === -1
) {
  throw new Error(
    "const rankedRows not found"
  );
}

const afterRanked =
  source.indexOf(
    "if (",
    rankedStart
  );

if (
  afterRanked === -1
) {
  throw new Error(
    "Could not locate code after rankedRows"
  );
}

const rankedBlock =
  source.slice(
    rankedStart,
    afterRanked
  );

if (
  !rankedBlock.includes(
    "comparePremiumRows"
  )
) {
  throw new Error(
    "rankedRows block does not contain comparePremiumRows"
  );
}

const newRankedBlock =
`const rankedRows =
    useMemo(
      () => {
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
    rankedStart
  ) +
  newRankedBlock +
  source.slice(
    afterRanked
  );


/*
|--------------------------------------------------------------------------
| 4. REMOVE INDEX FROM RecommendationCard KEY
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
  "SERIAL + DEDUPE V2 PATCH APPLIED"
);
console.log(
  "========================================"
);
console.log(
  file
);
