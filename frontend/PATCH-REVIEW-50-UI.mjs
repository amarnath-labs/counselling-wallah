import fs from "node:fs";

const path =
  "./src/components/RecommendationSlide.jsx";

const backup =
  "./src/components/RecommendationSlide.before-review-50-ui.jsx";

const original =
  fs.readFileSync(
    path,
    "utf8"
  );

if (
  original.includes(
    "TRUMARG 50+ REVIEW STANDARD"
  )
) {
  throw new Error(
    "50+ Review UI already applied."
  );
}


/*
|--------------------------------------------------------------------------
| 1. ADD ASPECT SUMMARY DATA BEFORE return()
|--------------------------------------------------------------------------
*/

const coverageBlock =
`  const coverage =
    reviewV3?.evidence ||
    {};`;

if (
  !original.includes(
    coverageBlock
  )
) {
  throw new Error(
    "Review coverage block not found."
  );
}

const replacementCoverage =
`  const coverage =
    reviewV3?.evidence ||
    {};

  /*
  |--------------------------------------------------------------------------
  | TRUMARG 50+ REVIEW STANDARD
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
      ([
        key,
        label,
      ]) => {
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
    coverageBlock,
    replacementCoverage
  );


/*
|--------------------------------------------------------------------------
| 2. INSERT 50+ REVIEW SECTION BEFORE EXISTING COVERAGE SECTION
|--------------------------------------------------------------------------
*/

const coverageCommentRegex =
  /\{\s*\/\*\s*=+\s*COVERAGE\s*=+\s*\*\/\s*\}/m;

const match =
  updated.match(
    coverageCommentRegex
  );

if (!match) {
  throw new Error(
    "COVERAGE JSX marker not found."
  );
}

const reviewUi =
`      {/*
==========================================
          TRUMARG 50+ REVIEW STANDARD
========================================== */}

      <div
        style={{
          marginTop: 18,
          marginBottom: 18,
          padding: 14,
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
            justifyContent:
              'space-between',
            alignItems:
              'flex-start',
            gap: 12,
            marginBottom: 12,
          }}
        >
          <div>
            <div
              style={{
                color:
                  '#0F2454',
                fontWeight:
                  850,
                fontSize:
                  12,
              }}
            >
              50+ REVIEW EVIDENCE STANDARD
            </div>

            <div
              style={{
                marginTop: 4,
                color:
                  '#64748B',
                fontSize:
                  10,
                lineHeight:
                  1.45,
              }}
            >
              Each aspect requires 50 effective reviews,
              3 independent sources and no single source above 60%.
            </div>
          </div>

          <div
            style={{
              flex:
                '0 0 auto',
              padding:
                '7px 10px',
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
                10,
              fontWeight:
                850,
            }}
          >
            {readyReviewAspects}/10 ready
          </div>
        </div>


        <div
          style={{
            display:
              'grid',
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
                    '10px 11px',
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
                    alignItems:
                      'center',
                    justifyContent:
                      'space-between',
                    gap:
                      10,
                  }}
                >
                  <strong
                    style={{
                      color:
                        '#0F2454',
                      fontSize:
                        11,
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
                        9.5,
                      fontWeight:
                        800,
                    }}
                  >
                    {item.ready
                      ? '✓ Evidence ready'
                      : 'Evidence building'}
                  </span>
                </div>


                <div
                  style={{
                    marginTop:
                      7,
                    display:
                      'grid',
                    gridTemplateColumns:
                      'repeat(auto-fit,minmax(105px,1fr))',
                    gap:
                      7,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize:
                          8.5,
                        color:
                          '#64748B',
                      }}
                    >
                      EFFECTIVE REVIEWS
                    </div>

                    <strong
                      style={{
                        fontSize:
                          11,
                        color:
                          item.countReady
                            ? '#15803D'
                            : '#0F2454',
                      }}
                    >
                      {item.reviewCount}/50
                    </strong>
                  </div>


                  <div>
                    <div
                      style={{
                        fontSize:
                          8.5,
                        color:
                          '#64748B',
                      }}
                    >
                      SOURCES
                    </div>

                    <strong
                      style={{
                        fontSize:
                          11,
                        color:
                          item.sourcesReady
                            ? '#15803D'
                            : '#0F2454',
                      }}
                    >
                      {item.sourceCount}/3+
                    </strong>
                  </div>


                  <div>
                    <div
                      style={{
                        fontSize:
                          8.5,
                        color:
                          '#64748B',
                      }}
                    >
                      MAX SOURCE SHARE
                    </div>

                    <strong
                      style={{
                        fontSize:
                          11,
                        color:
                          item.dominanceReady
                            ? '#15803D'
                            : '#B45309',
                      }}
                    >
                      {item.maxSourceShare ===
                      null
                        ? '—'
                        : \`\${(
                            item.maxSourceShare *
                            100
                          ).toFixed(
                            1
                          )}%\`}
                    </strong>
                  </div>


                  <div>
                    <div
                      style={{
                        fontSize:
                          8.5,
                        color:
                          '#64748B',
                      }}
                    >
                      SENTIMENT SCORE
                    </div>

                    <strong
                      style={{
                        fontSize:
                          11,
                        color:
                          '#0F2454',
                      }}
                    >
                      {item.aspectScore ===
                      null
                        ? 'N/A'
                        : \`\${item.aspectScore.toFixed(
                            1
                          )}/100\`}
                    </strong>
                  </div>
                </div>


                {!item.ready && (
                  <div
                    style={{
                      marginTop:
                        7,
                      color:
                        '#64748B',
                      fontSize:
                        9,
                      lineHeight:
                        1.4,
                    }}
                  >
                    {!item.countReady && (
                      <span>
                        Need {item.missingReviews} more effective reviews.
                        {' '}
                      </span>
                    )}

                    {!item.sourcesReady && (
                      <span>
                        Need at least {Math.max(
                          0,
                          3 -
                            item.sourceCount
                        )} more independent source{
                          Math.max(
                            0,
                            3 -
                              item.sourceCount
                          ) ===
                          1
                            ? ''
                            : 's'
                        }.
                        {' '}
                      </span>
                    )}

                    {item.maxSourceShare !==
                      null &&
                      !item.dominanceReady && (
                        <span>
                          Source concentration exceeds 60%.
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
                        marginTop:
                          8,
                        display:
                          'flex',
                        flexWrap:
                          'wrap',
                        gap:
                          5,
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
                                \`\${item.key}-source-\${sourceIndex}\`
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
                                  8.5,
                              }}
                            >
                              {
                                source?.source ||
                                source?.name ||
                                'Source'
                              }
                              {
                                Number.isFinite(
                                  Number(
                                    source?.effectiveCount
                                  )
                                )
                                  ? \` · \${source.effectiveCount}\`
                                  : ''
                              }
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
    match.index
  ) +
  reviewUi +
  updated.slice(
    match.index
  );


/*
|--------------------------------------------------------------------------
| VALIDATE
|--------------------------------------------------------------------------
*/

for (
  const token
  of [
    "TRUMARG 50+ REVIEW STANDARD",
    "reviewAspectRows",
    "readyReviewAspects",
    "EFFECTIVE REVIEWS",
    "MAX SOURCE SHARE",
    "50+ REVIEW EVIDENCE STANDARD",
  ]
) {
  if (
    !updated.includes(
      token
    )
  ) {
    throw new Error(
      `Validation failed: ${token}`
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
  "SUCCESS: 50+ Review Evidence UI added."
);

console.log(
  "Backup:",
  backup
);

