import fs from "node:fs";

const path =
  "./src/pages/Results.jsx";

const backup =
  "./src/pages/Results.before-v2-debug-log.jsx";

const original =
  fs.readFileSync(
    path,
    "utf8"
  );

if (
  original.includes(
    "[TRUMARG-V2-REAL]"
  )
) {
  throw new Error(
    "V2 debug log already installed."
  );
}

const marker =
`          setRecommendationRows(
            v2ShadowRows
          );`;

if (
  !original.includes(
    marker
  )
) {
  throw new Error(
    "V2 setRecommendationRows block not found."
  );
}

const replacement =
`          console.log(
            "[TRUMARG-V2-REAL]",
            {
              rawCount:
                rawRecommendationRows.length,

              v2Count:
                Array.isArray(
                  v2ShadowRows
                )
                  ? v2ShadowRows.length
                  : null,

              firstRow:
                v2ShadowRows?.[0] || null,

              firstPersonalizedV2:
                v2ShadowRows?.[0]
                  ?.personalizedV2 ||
                null,

              firstRawScore:
                v2ShadowRows?.[0]
                  ?.personalizedV2
                  ?.rawScore ??
                null,

              firstRankingScore:
                v2ShadowRows?.[0]
                  ?.personalizedV2
                  ?.rankingScore ??
                null,

              firstCoverage:
                v2ShadowRows?.[0]
                  ?.personalizedV2
                  ?.coverage ??
                null,

              firstPremiumScore:
                v2ShadowRows?.[0]
                  ?.premium
                  ?.score ??
                null,
            }
          );

          setRecommendationRows(
            v2ShadowRows
          );`;

const updated =
  original.replace(
    marker,
    replacement
  );

fs.writeFileSync(
  backup,
  original,
  "utf8"
);

fs.writeFileSync(
  path,
  updated,
  "utf8"
);

console.log(
  "SUCCESS: real V2 debug log installed."
);
