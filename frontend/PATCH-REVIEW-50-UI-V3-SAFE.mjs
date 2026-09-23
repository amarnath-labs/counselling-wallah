import fs from "node:fs";

const path =
  "./src/components/RecommendationSlide.jsx";

const backup =
  "./src/components/RecommendationSlide.before-review-50-ui-v3.jsx";

const original =
  fs.readFileSync(path, "utf8");

if (
  original.includes(
    "TRUMARG REVIEW 50 UI V3"
  )
) {
  throw new Error(
    "Review 50 UI V3 already applied."
  );
}


/*
|--------------------------------------------------------------------------
| 1. ISOLATE ReviewIntelligencePanel FUNCTION ONLY
|--------------------------------------------------------------------------
*/

const startMarker =
  "function ReviewIntelligencePanel({";

const endMarker =
  "function CoverageChip({";

const start =
  original.indexOf(
    startMarker
  );

const end =
  original.indexOf(
    endMarker
  );

if (
  start === -1 ||
  end === -1 ||
  end <= start
) {
  throw new Error(
    "ReviewIntelligencePanel boundaries not found."
  );
}

const before =
  original.slice(
    0,
    start
  );

let panel =
  original.slice(
    start,
    end
  );

const after =
  original.slice(
    end
  );


/*
|--------------------------------------------------------------------------
| 2. ADD REVIEW STANDARD DATA AFTER coverage
|--------------------------------------------------------------------------
*/

const coverageRegex =
  /const\s+coverage\s*=\s*reviewV3\?\.evidence\s*\|\|\s*\{\s*\}\s*;/m;

if (
  !coverageRegex.test(
    panel
  )
) {
  throw new Error(
    "coverage declaration not found inside ReviewIntelligencePanel."
  );
}

panel =
  panel.replace(
    coverageRegex,
`const coverage =
    reviewV3?.evidence ||
    {};

  /*
  |--------------------------------------------------------------------------
  | TRUMARG REVIEW 50 UI V3
  |--------------------------------------------------------------------------
  */

  const reviewAspectLabels = {
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
      reviewAspectLabels
    ).map(
      ([key, label]) => {
        const data =
          reviewV3
            ?.aspects
            ?.[key] ||
          {};


        const reviewCount =
          Number.isFinite(
            Number(
              data
                ?.effectiveReviewCount
            )
          )
            ? Number(
                data
                  .effectiveReviewCount
              )
            : 0;


        const sourceCount =
          Number.isFinite(
            Number(
              data
                ?.effectiveSourceCount
            )
          )
            ? Number(
                data
                  .effectiveSourceCount
              )
            : 0;


        const maxSourceShare =
          Number.isFinite(
            Number(
              data
                ?.maxSourceShare
            )
          )
            ? Number(
                data
                  .maxSourceShare
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


        const ready =
          reviewCount >= 50 &&
          sourceCount >= 3 &&
          maxSourceShare !==
            null &&
          maxSourceShare <=
            0.60 &&
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
          ready,
          missingReviews:
            Math.max(
              0,
              50 -
                reviewCount
            ),
          missingSources:
            Math.max(
              0,
              3 -
                sourceCount
            ),
        };
      }
    );


  const readyReviewAspects =
    reviewAspectRows.filter(
      item =>
        item.ready
    ).length;`
  );


/*
|--------------------------------------------------------------------------
| 3. INSERT UI DIRECTLY BEFORE EXISTING COVERAGE CHIPS
|--------------------------------------------------------------------------
*/

const coverageChipAnchor =
`      <div
        style={{
          display:
            'flex',

          flexWrap:
            'wrap',

          gap:
            7,

          marginBottom:
            evidence.length
              ? 15
              : 0,
        }}
      >
        <CoverageChip
          label="Reviews"`;

if (
  !panel.includes(
    coverageChipAnchor
  )
) {
  throw new Error(
    "Existing coverage chips anchor not found inside ReviewIntelligencePanel."
  );
}


const reviewUi =
`      <div
        style={{
          marginTop:
            18,
          marginBottom:
            18,
          padding:
            14,
          border:
            '1px solid #E2E8F0',
          borderRadius:
            14,
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
            gap:
              12,
            marginBottom:
              12,
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
              }}
            >
              50 effective reviews, 3+ independent sources,
              max 60% from one source.
            </span>
          </div>

          <span
            style={{
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
                800,
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
              'repeat(auto-fit,minmax(220px,1fr))',
            gap:
              8,
          }}
        >
          {reviewAspectRows.map(
            item => (
              <div
                key={
                  item.key
                }
                style={{
                  padding:
                    10,
                  border:
                    '1px solid #E5E7EB',
                  borderRadius:
                    10,
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
                    marginTop:
                      8,
                    display:
                      'grid',
                    gridTemplateColumns:
                      '1fr 1fr',
                    gap:
                      6,
                  }}
                >
                  <div>
                    <small>
                      Reviews
                    </small>

                    <div>
                      <strong>
                        {item.reviewCount}/50
                      </strong>
                    </div>
                  </div>

                  <div>
                    <small>
                      Sources
                    </small>

                    <div>
                      <strong>
                        {item.sourceCount}/3+
                      </strong>
                    </div>
                  </div>

                  <div>
                    <small>
                      Max source
                    </small>

                    <div>
                      <strong>
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
                  </div>

                  <div>
                    <small>
                      Score
                    </small>

                    <div>
                      <strong>
                        {item.aspectScore ===
                        null
                          ? 'N/A'
                          : item.aspectScore.toFixed(
                              1
                            ) + '/100'}
                      </strong>
                    </div>
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
                        8.5,
                    }}
                  >
                    {item.missingReviews >
                      0 && (
                      <span>
                        Need {item.missingReviews} more reviews.{' '}
                      </span>
                    )}

                    {item.missingSources >
                      0 && (
                      <span>
                        Need {item.missingSources} more source
                        {item.missingSources ===
                        1
                          ? ''
                          : 's'}.{' '}
                      </span>
                    )}

                    {item.maxSourceShare !==
                      null &&
                      item.maxSourceShare >
                        0.60 && (
                        <span>
                          Source concentration above 60%.
                        </span>
                      )}
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </div>


`;


panel =
  panel.replace(
    coverageChipAnchor,
    reviewUi +
      coverageChipAnchor
  );


/*
|--------------------------------------------------------------------------
| 4. FINAL VALIDATION
|--------------------------------------------------------------------------
*/

for (
  const token
  of [
    "TRUMARG REVIEW 50 UI V3",
    "reviewAspectRows",
    "readyReviewAspects",
    "50+ Review Evidence Standard",
  ]
) {
  if (
    !panel.includes(
      token
    )
  ) {
    throw new Error(
      "Validation failed: " +
      token
    );
  }
}


const updated =
  before +
  panel +
  after;


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
  "SUCCESS: safe Review 50 UI V3 applied."
);

console.log(
  "Backup:",
  backup
);
