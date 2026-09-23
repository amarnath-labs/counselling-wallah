import fs from "node:fs";

const file =
  "./src/components/RecommendationSlide.jsx";

let s =
  fs.readFileSync(
    file,
    "utf8"
  );


/* =========================================================
   1. FIX BAD V3 REPLACEMENT
========================================================= */

if (
  s.includes(
    "group.dedupeRecommendationRows(rows).map("
  )
) {
  s =
    s.replace(
      "group.dedupeRecommendationRows(rows).map(",
      "dedupeRecommendationRows(group.rows).map("
    );

  console.log(
    "Fixed malformed group.dedupeRecommendationRows call"
  );
}


/* =========================================================
   2. OUTER groupedRows.map NEEDS groupIndex
========================================================= */

const outerMapPattern =
  /\{groupedRows\.map\(\s*\(\s*group\s*\)\s*=>\s*\{/m;

if (
  outerMapPattern.test(
    s
  )
) {
  s =
    s.replace(
      outerMapPattern,
`{groupedRows.map(
            (
              group,
              groupIndex
            ) => {`
    );

  console.log(
    "Added groupIndex to groupedRows.map"
  );
}
else if (
  !/groupIndex/.test(
    s
  )
) {
  throw new Error(
    "Could not patch groupedRows.map(group)"
  );
}


/* =========================================================
   3. ADD UNIQUE ROWS + CONTINUOUS SERIAL OFFSET
========================================================= */

const groupCallbackMarker =
`            ) => {
              const labels = {`;

if (
  s.includes(
    groupCallbackMarker
  ) &&
  !s.includes(
    "const uniqueGroupRows ="
  )
) {
  s =
    s.replace(
      groupCallbackMarker,
`            ) => {
              const uniqueGroupRows =
                dedupeRecommendationRows(
                  group.rows
                );

              const serialOffset =
                groupedRows
                  .slice(
                    0,
                    groupIndex
                  )
                  .reduce(
                    (
                      total,
                      previousGroup
                    ) =>
                      total +
                      dedupeRecommendationRows(
                        previousGroup.rows
                      ).length,
                    0
                  );

              const labels = {`
    );

  console.log(
    "Added continuous serial offset"
  );
}


/* =========================================================
   4. USE uniqueGroupRows INSTEAD OF RE-DEDUPE INLINE
========================================================= */

s =
  s.replace(
    /dedupeRecommendationRows\(group\.rows\)\.map\(/g,
    "uniqueGroupRows.map("
  );


/* =========================================================
   5. PASS GLOBAL DISPLAY INDEX TO CARD
========================================================= */

const indexPropPattern =
  /index=\{\s*index\s*\}/m;

if (
  indexPropPattern.test(
    s
  )
) {
  s =
    s.replace(
      indexPropPattern,
`index={
                              serialOffset +
                              index
                            }`
    );

  console.log(
    "Changed card index to global continuous serial"
  );
}


/* =========================================================
   6. USE STABLE DEDUPED KEY
========================================================= */

s =
  s.replace(
    /key=\{\s*`\$\{group\.bucket\}-\$\{collegeId\}-\$\{branchName\}-\$\{index\}`\s*\}/m,
`key={
                              group.bucket +
                              '::' +
                              recommendationUniqueKey(
                                row
                              )
                            }`
  );


fs.writeFileSync(
  file,
  s,
  "utf8"
);

console.log("");
console.log(
  "========================================"
);
console.log(
  "FINAL SERIAL + DEDUPE FIX APPLIED"
);
console.log(
  "========================================"
);
