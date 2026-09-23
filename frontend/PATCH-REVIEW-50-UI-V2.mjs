import fs from "node:fs";

const path =
  "./src/components/RecommendationSlide.jsx";

const backup =
  "./src/components/RecommendationSlide.before-review-50-ui-v2.jsx";

const original =
  fs.readFileSync(
    path,
    "utf8"
  );


if (
  original.includes(
    "TRUMARG 50 REVIEW STANDARD V2"
  )
) {
  throw new Error(
    "50+ Review UI V2 already applied."
  );
}


/*
|--------------------------------------------------------------------------
| FIND reviewV3 coverage declaration
|--------------------------------------------------------------------------
*/

const coverageRegex =
  /const\s+coverage\s*=\s*reviewV3\?\.evidence\s*\|\|\s*\{\s*\}\s*;/m;


const coverageMatch =
  original.match(
    coverageRegex
  );


if (!coverageMatch) {
  throw new Error(
    "reviewV3 evidence coverage declaration not found."
  );
}


const reviewDataBlock =
`${coverageMatch[0]}

  /*
  |--------------------------------------------------------------------------
  | TRUMARG 50 REVIEW STANDARD V2
  |--------------------------------------------------------------------------
  */

  const REVIEW_TARGET =
    50;

  const SOURCE_TARGET =
    3;

  const MAX_SOURCE_SHARE =
    0.60;


  const REVIEW_ASPECT_LABELS = {
    placements:
      'Placements',

    faculty:
      'Faculty / Teaching',

    hostel:
      'Hostel',

    infrastructure:
      'Infrastructure',

    academics:
      'Academics',

    campus_life:
      'Campus Life',

    administration:
      'Administration',

    internships:
      'Internships',

    value_for_money:
      'Value for Money',

    location:
      'Location',
  };


  const reviewAspectRows =
    Object.entries(
      REVIEW_ASPECT_LABELS
    ).map(
      ([key, label]) => {
        const data =
          reviewV3?.aspects?.[key] ||
          {};


        const reviewCount =
          Number.isFinite(
            Number(
              data?.effectiveReviewCount
            )
          )
            ? Number(
                data.effectiveReviewCount
              )
            : 0;


        const sourceCount =
          Number.isFinite(
            Number(
              data?.effectiveSourceCount
            )
          )
            ? Number(
                data.effectiveSourceCount
              )
            : 0;


        const maxSourceShare =
          Number.isFinite(
            Number(
              data?.maxSourceShare
            )
          )
            ? Number(
                data.maxSourceShare
              )
            : null;


        const aspectScore =
          Number.isFinite(
            Number(
              data?.score
            )
          )
            ? Number(
                data.score
              )
            : null;


        const countReady =
          reviewCount >=
          REVIEW_TARGET;


        const sourcesReady =
          sourceCount >=
          SOURCE_TARGET;


        const dominanceReady =
          maxSourceShare !==
            null &&
          maxSourceShare <=
            MAX_SOURCE_SHARE;


        const ready =
          countReady &&
          sourcesReady &&
          dominanceReady &&
          aspectScore !==
            null;


        return {
          key,
          label,
          data,
          reviewCount,
          sourceCount,
          maxSourceShare,
          aspectScore,
          countReady,
          sourcesReady,
          dominanceReady,
          ready,

          missingReviews:
            Math.max(
              0,
              REVIEW_TARGET -
                reviewCount
            ),

          missingSources:
            Math.max(
              0,
              SOURCE_TARGET -
                sourceCount
            ),
        };
      }
    );


  const readyReviewAspects =
    reviewAspectRows.filter(
      item =>
        item.ready
    ).length;`;


let updated =
  original.replace(
    coverageRegex,
    reviewDataBlock
  );


/*
|--------------------------------------------------------------------------
| FIND existing COVERAGE JSX comment
|--------------------------------------------------------------------------
*/

const coverageJsxRegex =
  /\{\s*\/\*[\s\S]*?COVERAGE[\s\S]*?\*\/\s*\}/m;


const coverageJsxMatch =
  updated.match(
    coverageJsxRegex
  );


if (!coverageJsxMatch) {
  throw new Error(
    "COVERAGE JSX section marker not found."
  );
}


const reviewUi =
`      {/*
==========================================
       50+ REVIEW EVIDENCE STANDARD
========================================== */}

      <div
        style={{
          marginTop: 18,
          marginBottom: 18,
          padding: 16,
          border:
            '1px solid #E2E8F0',
          borderRadius: 14,
          background:
            '#FFFFFF',
        }}
      >
        <div
          style={{
            display:
              'flex',
            alignItems:
              'flex-start',
            justifyContent:
              'space-between',
            gap: 12,
            marginBottom: 14,
          }}
        >
          <div>
            <strong
              style={{
                display:
                  'block',
                color:
                  '#0F2454',
                fontSize:
                  12,
              }}
            >
              50+ Review Evidence Standard
            </strong>

            <span
              style={{
                display:
                  'block',
                marginTop:
                  4,
                color:
                  '#64748B',
                fontSize:
                  9.5,
                lineHeight:
                  1.45,
              }}
            >
              Every aspect needs 50 effective reviews,
              3 independent sources and no source above 60%.
            </span>
          </div>


          <span
            style={{
              flex:
                '0 0 auto',
              padding:
                '6px 9px',
              borderRadius:
                999,
              background:
                readyReviewAspects ===
                10
                  ? '#DCFCE7'
                  : '#FFF7ED',
              color:
                readyReviewAspects ===
                10
                  ? '#166534'
                  : '#9A3412',
              fontSize:
                9.5,
              fontWeight:
                850,
            }}
          >
            {readyReviewAspects}/10 ready
          </span>
        </div>


        <div
          style={{
            display:
              'grid',
            gridTemplateColumns:
              'repeat(auto-fit,minmax(230px,1fr))',
            gap:
              9,
          }}
        >
          {reviewAspectRows.map(
            (item) => (
              <div
                key={
                  item.key
                }
                style={{
                  padding:
                    11,
                  border:
                    '1px solid #E5E7EB',
                  borderRadius:
                    11,
                  background:
                    item.ready
                      ? '#F0FDF4'
                      : '#FAFAFA',
                }}
              >
                <div
                  style={{
                    display:
                      'flex',
                    justifyContent:
                      'space-between',
                    gap:
                      8,
                    alignItems:
                      'center',
                  }}
                >
                  <strong
                    style={{
                      color:
                        '#0F2454',
                      fontSize:
                        10.5,
                    }}
                  >
                    {item.label}
                  </strong>

                  <span
                    style={{
                      color:
                        item.ready
                          ? '#15803D'
                          : '#B45309',
                      fontSize:
                        8.5,
                      fontWeight:
                        800,
                    }}
                  >
                    {item.ready
                      ? 'READY'
                      : 'BUILDING'}
                  </span>
                </div>


                <div
                  style={{
                    display:
                      'grid',
                    gridTemplateColumns:
                      '1fr 1fr',
                    gap:
                      7,
                    marginTop:
                      9,
                  }}
                >
                  <div>
                    <span
                      style={{
                        display:
                          'block',
                        color:
                          '#64748B',
                        fontSize:
                          8,
                      }}
                    >
                      REVIEWS
                    </span>

                    <strong
                      style={{
                        color:
                          item.countReady
                            ? '#15803D'
                            : '#0F2454',
                        fontSize:
                          11,
                      }}
                    >
                      {item.reviewCount}/50
                    </strong>
                  </div>


                  <div>
                    <span
                      style={{
                        display:
                          'block',
                        color:
                          '#64748B',
                        fontSize:
                          8,
                      }}
                    >
                      SOURCES
                    </span>

                    <strong
                      style={{
                        color:
                          item.sourcesReady
                            ? '#15803D'
                            : '#0F2454',
                        fontSize:
                          11,
                      }}
                    >
                      {item.sourceCount}/3+
                    </strong>
                  </div>


                  <div>
                    <span
                      style={{
                        display:
                          'block',
                        color:
                          '#64748B',
                        fontSize:
                          8,
                      }}
                    >
                      MAX SOURCE
                    </span>

                    <strong
                      style={{
                        color:
                          item.dominanceReady
                            ? '#15803D'
                            : '#B45309',
                        fontSize:
                          11,
                      }}
                    >
                      {item.maxSourceShare ===
                      null
                        ? 'N/A'
                        : (
                            item.maxSourceShare *
                            100
                          ).toFixed(
                            1
                          ) + '%'}
                    </strong>
                  </div>


                  <div>
                    <span
                      style={{
                        display:
                          'block',
                        color:
                          '#64748B',
                        fontSize:
                          8,
                      }}
                    >
                      SCORE
                    </span>

                    <strong
                      style={{
                        color:
                          '#0F2454',
                        fontSize:
                          11,
                      }}
                    >
                      {item.aspectScore ===
                      null
                        ? 'N/A'
                        : item.aspectScore.toFixed(
                            1
                          ) + '/100'}
                    </strong>
                  </div>
                </div>


                {!item.ready && (
                  <div
                    style={{
                      marginTop:
                        8,
                      color:
                        '#64748B',
                      fontSize:
                        8.5,
                      lineHeight:
                        1.45,
                    }}
                  >
                    {!item.countReady && (
                      <span>
                        Need {item.missingReviews} more reviews.
                        {' '}
                      </span>
                    )}

                    {!item.sourcesReady && (
                      <span>
                        Need {item.missingSources} more source
                        {item.missingSources ===
                        1
                          ? ''
                          : 's'}.
                        {' '}
                      </span>
                    )}

                    {item.maxSourceShare !==
                      null &&
                      !item.dominanceReady && (
                        <span>
                          One source exceeds 60%.
                        </span>
                      )}
                  </div>
                )}


                {Array.isArray(
                  item.data
                    ?.sourceDistribution
                ) &&
                  item.data
                    .sourceDistribution
                    .length >
                    0 && (
                    <div
                      style={{
                        display:
                          'flex',
                        flexWrap:
                          'wrap',
                        gap:
                          4,
                        marginTop:
                          8,
                      }}
                    >
                      {item.data
                        .sourceDistribution
                        .slice(
                          0,
                          6
                        )
                        .map(
                          (
                            source,
                            sourceIndex
                          ) => (
                            <span
                              key={
                                item.key +
                                '-src-' +
                                sourceIndex
                              }
                              style={{
                                padding:
                                  '3px 6px',
                                borderRadius:
                                  999,
                                background:
                                  '#F1F5F9',
                                color:
                                  '#475569',
                                fontSize:
                                  8,
                              }}
                            >
                              {source?.source ||
                                source?.name ||
                                'Source'}
                            </span>
                          )
                        )}
                    </div>
                  )}
              </div>
            )
          )}
        </div>
      </div>


`;


updated =
  updated.slice(
    0,
    coverageJsxMatch.index
  ) +
  reviewUi +
  updated.slice(
    coverageJsxMatch.index
  );


/*
|--------------------------------------------------------------------------
| VALIDATE
|--------------------------------------------------------------------------
*/

const requiredTokens = [
  "TRUMARG 50 REVIEW STANDARD V2",
  "reviewAspectRows",
  "readyReviewAspects",
  "50+ Review Evidence Standard",
  "item.reviewCount",
  "item.sourceCount",
];


for (
  const token
  of requiredTokens
) {
  if (
    !updated.includes(
      token
    )
  ) {
    throw new Error(
      "Validation failed: " +
      token
    );
  }
}


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
  "SUCCESS: 50+ Review Evidence UI V2 applied."
);

console.log(
  "Backup:",
  backup
);
