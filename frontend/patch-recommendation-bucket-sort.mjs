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
| 1. ADD SORT HELPER
|--------------------------------------------------------------------------
*/

const helperMarker =
  "function sortWithinBucket(";

if (
  !source.includes(
    helperMarker
  )
) {
  const componentMarker =
    "export default function RecommendationSlide({";

  const componentIndex =
    source.indexOf(
      componentMarker
    );

  if (
    componentIndex === -1
  ) {
    throw new Error(
      "RecommendationSlide component not found."
    );
  }

  const helperCode =
`
/*
|--------------------------------------------------------------------------
| SORT INSIDE ADMISSION BUCKET
|--------------------------------------------------------------------------
|
| Priority:
|
| 1. NIRF rank low -> high
| 2. Closing rank low -> high
| 3. Match score high -> low
|
*/

function sortWithinBucket(
  a,
  b
) {
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


  /*
  |--------------------------------------------------------------------------
  | NIRF RANK
  |--------------------------------------------------------------------------
  */

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
      a?.branch?.closingRank ??
      a?.closingRank
    );

  const cutoffB =
    Number(
      b?.branch?.closingRank ??
      b?.closingRank
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
      a?.premium?.score ??
      a?.matchScore ??
      a?.overall ??
      0
    );

  const scoreB =
    Number(
      b?.premium?.score ??
      b?.matchScore ??
      b?.overall ??
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
      componentIndex
    ) +
    helperCode +
    source.slice(
      componentIndex
    );

  console.log(
    "Added sortWithinBucket helper."
  );
}
else {
  console.log(
    "sortWithinBucket helper already present."
  );
}


/*
|--------------------------------------------------------------------------
| 2. REPLACE rankedRows useMemo
|--------------------------------------------------------------------------
*/

const rankedStart =
  source.indexOf(
    "const rankedRows =",
    source.indexOf(
      "export default function RecommendationSlide"
    )
  );

if (
  rankedStart === -1
) {
  if (
    source.includes(
      "const groupedRows ="
    )
  ) {
    console.log(
      "groupedRows already installed."
    );
  }
  else {
    throw new Error(
      "rankedRows block not found."
    );
  }
}
else {
  const paywallMarker =
    "/*\n  |--------------------------------------------------------------------------\n  | PAYWALL";

  const rankedEnd =
    source.indexOf(
      paywallMarker,
      rankedStart
    );

  if (
    rankedEnd === -1
  ) {
    throw new Error(
      "Could not find end of rankedRows block."
    );
  }

  const groupedCode =
`const groupedRows =
    useMemo(
      () => {
        const bucketOrder = [
          'dream',
          'target',
          'safe',
          'backup',
        ];


        return bucketOrder
          .map(
            (bucket) => {
              const bucketRows =
                [...rows]
                  .filter(
                    (row) =>
                      row &&
                      String(
                        row?.bucket ||
                        row?.premium
                          ?.admissionBucket
                          ?.key ||
                        ''
                      )
                        .trim()
                        .toLowerCase() ===
                      bucket
                  )
                  .sort(
                    sortWithinBucket
                  );


              return {
                bucket,
                rows:
                  bucketRows,
              };
            }
          )
          .filter(
            (group) =>
              group.rows.length >
              0
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
    groupedCode +
    source.slice(
      rankedEnd
    );

  console.log(
    "Replaced rankedRows with groupedRows."
  );
}


/*
|--------------------------------------------------------------------------
| 3. REPLACE EMPTY CHECK
|--------------------------------------------------------------------------
*/

source =
  source.replace(
    /!\s*rankedRows\.length/g,
    "!groupedRows.length"
  );


/*
|--------------------------------------------------------------------------
| 4. REPLACE OLD SINGLE rec-list OUTPUT
|--------------------------------------------------------------------------
*/

const oldListRegex =
  /<div className="rec-list">\s*\{rankedRows\.map\([\s\S]*?<\/div>\s*\)\}/m;

if (
  oldListRegex.test(
    source
  )
) {
  const newList =
`<div className="recommendation-buckets">
          {groupedRows.map(
            (
              group
            ) => {
              const labels = {
                dream:
                  'Dream',
                target:
                  'Target',
                safe:
                  'Safe',
                backup:
                  'Backup',
              };


              const descriptions = {
                dream:
                  'Competitive options based on your admission profile.',
                target:
                  'Strong realistic options for your profile.',
                safe:
                  'Higher-probability admission options.',
                backup:
                  'Additional safer options to keep in hand.',
              };


              return (
                <section
                  key={
                    group.bucket
                  }
                  className="recommendation-bucket"
                >
                  <div className="recommendation-bucket__header">
                    <div>
                      <h3>
                        {
                          labels[
                            group.bucket
                          ]
                        }
                      </h3>

                      <p>
                        {
                          descriptions[
                            group.bucket
                          ]
                        }
                      </p>
                    </div>

                    <strong>
                      {
                        group.rows
                          .length
                      } options
                    </strong>
                  </div>


                  <div className="rec-list">
                    {group.rows.map(
                      (
                        row,
                        index
                      ) => {
                        const collegeId =
                          row?.collegeId ||
                          row?.college
                            ?.id ||
                          row?.college_id ||
                          'college';

                        const branchName =
                          row?.branch
                            ?.name ||
                          row?.branch_name ||
                          'branch';


                        return (
                          <RecommendationCard
                            key={
                              \`\${group.bucket}-\${collegeId}-\${branchName}-\${index}\`
                            }
                            row={
                              row
                            }
                            index={
                              index
                            }
                          />
                        );
                      }
                    )}
                  </div>
                </section>
              );
            }
          )}
        </div>
      )}`;

  source =
    source.replace(
      oldListRegex,
      newList
    );

  console.log(
    "Replaced single recommendation list with bucket groups."
  );
}
else if (
  source.includes(
    "recommendation-buckets"
  )
) {
  console.log(
    "Bucket UI already present."
  );
}
else {
  throw new Error(
    "Old rankedRows UI block not found."
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
  "Recommendation bucket + NIRF/cutoff sorting patch complete."
);
