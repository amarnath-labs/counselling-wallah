import fs from "node:fs";

const file =
  "./src/components/RecommendationSlide.jsx";

let s =
  fs.readFileSync(
    file,
    "utf8"
  );


/*
|--------------------------------------------------------------------------
| 1. REMOVE BROKEN uniqueGroupRows REFERENCE
|--------------------------------------------------------------------------
*/

s =
  s.replace(
    /uniqueGroupRows\.map\s*\(/g,
    "group.rows.map("
  );


/*
|--------------------------------------------------------------------------
| 2. GLOBAL DEDUPE BEFORE BUCKET GROUPING
|--------------------------------------------------------------------------
|
| Existing sort/bucket logic remains unchanged.
| Exact college + branch duplicates are removed before buckets are built.
|--------------------------------------------------------------------------
*/

const bucketRowsPattern =
  /const bucketRows\s*=\s*\[\.\.\.rows\]\s*\.filter\(/m;

if (
  bucketRowsPattern.test(
    s
  )
) {
  s =
    s.replace(
      bucketRowsPattern,
`const bucketRows =
                [...dedupeRecommendationRows(rows)]
                  .filter(`
    );

  console.log(
    "Global college+branch dedupe added before bucket grouping"
  );
}
else if (
  !s.includes(
    "[...dedupeRecommendationRows(rows)]"
  )
) {
  throw new Error(
    "Could not find bucketRows = [...rows] block"
  );
}


/*
|--------------------------------------------------------------------------
| 3. ENSURE groupedRows.map HAS groupIndex
|--------------------------------------------------------------------------
*/

const oldGroupMap =
  /\{groupedRows\.map\(\s*\(\s*group\s*\)\s*=>\s*\{/m;

if (
  oldGroupMap.test(
    s
  )
) {
  s =
    s.replace(
      oldGroupMap,
`{groupedRows.map(
            (
              group,
              groupIndex
            ) => {`
    );

  console.log(
    "groupIndex added"
  );
}


/*
|--------------------------------------------------------------------------
| 4. INSERT SERIAL OFFSET INSIDE EACH BUCKET CALLBACK
|--------------------------------------------------------------------------
*/

if (
  !s.includes(
    "const serialOffset ="
  )
) {
  const callbackPattern =
    /(\{groupedRows\.map\([\s\S]*?\(\s*group\s*,\s*groupIndex\s*\)\s*=>\s*\{)(\s*const labels\s*=)/m;

  if (
    !callbackPattern.test(
      s
    )
  ) {
    throw new Error(
      "Could not locate groupedRows callback before const labels"
    );
  }

  s =
    s.replace(
      callbackPattern,
`$1

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
                      previousGroup.rows.length,
                    0
                  );

$2`
    );

  console.log(
    "Continuous serialOffset added"
  );
}


/*
|--------------------------------------------------------------------------
| 5. REMOVE ANY STALE uniqueGroupRows DECLARATION
|--------------------------------------------------------------------------
*/

s =
  s.replace(
    /const uniqueGroupRows\s*=\s*dedupeRecommendationRows\(\s*group\.rows\s*\)\s*;\s*/gm,
    ""
  );


/*
|--------------------------------------------------------------------------
| 6. RESTORE DecisionIntelligencePanel TO CARD'S index PROP
|--------------------------------------------------------------------------
|
| RecommendationCard receives the final global index.
| Inside that card, DecisionIntelligencePanel should just receive index.
|--------------------------------------------------------------------------
*/

s =
  s.replace(
    /(<DecisionIntelligencePanel[\s\S]*?row=\{\s*row\s*\}[\s\S]*?)index=\{\s*serialOffset\s*\+\s*index\s*\}/m,
    `$1index={index}`
  );


/*
|--------------------------------------------------------------------------
| 7. RecommendationCard GETS GLOBAL CONTINUOUS INDEX
|--------------------------------------------------------------------------
*/

const cardIndexPattern =
  /(<RecommendationCard[\s\S]*?row=\{\s*row\s*\}[\s\S]*?)index=\{\s*index\s*\}([\s\S]*?allRows=\{\s*rows\s*\})/m;

if (
  !cardIndexPattern.test(
    s
  )
) {
  throw new Error(
    "RecommendationCard row/index/allRows block not found"
  );
}

s =
  s.replace(
    cardIndexPattern,
`$1index={
                              serialOffset +
                              index
                            }$2`
  );

console.log(
  "RecommendationCard now receives continuous global index"
);


/*
|--------------------------------------------------------------------------
| 8. KEEP STABLE KEY
|--------------------------------------------------------------------------
*/

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


/*
|--------------------------------------------------------------------------
| 9. SAFETY ASSERTIONS
|--------------------------------------------------------------------------
*/

if (
  s.includes(
    "group.dedupeRecommendationRows"
  )
) {
  throw new Error(
    "Broken group.dedupeRecommendationRows still exists"
  );
}

if (
  s.includes(
    "uniqueGroupRows.map"
  )
) {
  throw new Error(
    "Broken uniqueGroupRows.map still exists"
  );
}

if (
  !s.includes(
    "dedupeRecommendationRows(rows)"
  )
) {
  throw new Error(
    "Global dedupe not present"
  );
}

if (
  !s.includes(
    "const serialOffset ="
  )
) {
  throw new Error(
    "serialOffset not present"
  );
}


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
  "GLOBAL DEDUPE + SERIAL FINAL PATCH APPLIED"
);
console.log(
  "========================================"
);
