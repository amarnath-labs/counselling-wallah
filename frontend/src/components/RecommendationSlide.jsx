import {
  useMemo,
} from 'react';


/*
|--------------------------------------------------------------------------
| SCORE PARTS
|--------------------------------------------------------------------------
*/

const PARTS = [
  [
    'rank',
    'Admission Fit',
    50,
  ],
  [
    'branch',
    'Branch Match',
    15,
  ],
  [
    'quality',
    'College Quality',
    15,
  ],
  [
    'reviews',
    'Review Intelligence',
    10,
  ],
  [
    'budget',
    'Budget',
    7,
  ],
  [
    'location',
    'Location',
    3,
  ],
];


/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

const num = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null;
  }

  const number =
    Number(value);

  return Number.isFinite(
    number
  )
    ? number
    : null;
};


/*
|--------------------------------------------------------------------------
| FINAL PREMIUM RANKING ARCHITECTURE
|--------------------------------------------------------------------------
|
| Score and confidence are intentionally separate.
|
| Missing data remains null.
| We do not assign artificial fallback scores.
|--------------------------------------------------------------------------
*/

const PREMIUM_WEIGHTS = {
  rank: 50,
  branch: 15,
  quality: 15,
  reviews: 10,
  budget: 7,
  location: 3,
};


function getEffectiveReviewComponent(
  row
) {
  const v3Component =
    num(
      row
        ?.reviewIntelligenceV3
        ?.component
    );

  if (
    v3Component !== null
  ) {
    return v3Component;
  }

  return num(
    row
      ?.premium
      ?.breakdown
      ?.reviews
  );
}


function getPremiumRankingMeta(
  row
) {
  const premium =
    row?.premium || {};

  const breakdown =
    premium?.breakdown || {};

  const rank =
    num(
      breakdown.rank
    );

  const branch =
    num(
      breakdown.branch
    );

  const quality =
    num(
      breakdown.quality
    );

  const reviews =
    getEffectiveReviewComponent(
      row
    );

  const budget =
    num(
      breakdown.budget
    );

  const location =
    num(
      breakdown.location
    );

  const score =
    num(
      premium?.score
    ) ??
    num(
      premium?.finalScore
    ) ??
    -1;


  /*
  |--------------------------------------------------------------------------
  | DATA COVERAGE
  |--------------------------------------------------------------------------
  |
  | Coverage is the total intended model weight for which real data exists.
  |
  | Example:
  | rank + branch + location
  | = 50 + 15 + 3
  | = 68% coverage
  |--------------------------------------------------------------------------
  */

  let coverage = 0;

  if (
    rank !== null
  ) {
    coverage +=
      PREMIUM_WEIGHTS.rank;
  }

  if (
    branch !== null
  ) {
    coverage +=
      PREMIUM_WEIGHTS.branch;
  }

  if (
    quality !== null
  ) {
    coverage +=
      PREMIUM_WEIGHTS.quality;
  }

  if (
    reviews !== null
  ) {
    coverage +=
      PREMIUM_WEIGHTS.reviews;
  }

  if (
    budget !== null
  ) {
    coverage +=
      PREMIUM_WEIGHTS.budget;
  }

  if (
    location !== null
  ) {
    coverage +=
      PREMIUM_WEIGHTS.location;
  }


  /*
  |--------------------------------------------------------------------------
  | CORE DATA GATE
  |--------------------------------------------------------------------------
  |
  | High-confidence premium recommendation requires:
  |
  | 1. Admission Fit
  | 2. Branch Match
  | 3. College Quality
  |--------------------------------------------------------------------------
  */

  const missingCoreFactors = [];

  if (
    rank === null
  ) {
    missingCoreFactors.push(
      'Admission Fit'
    );
  }

  if (
    branch === null
  ) {
    missingCoreFactors.push(
      'Branch Match'
    );
  }

  if (
    quality === null
  ) {
    missingCoreFactors.push(
      'College Quality'
    );
  }

  const coreComplete =
    missingCoreFactors.length === 0;


  return {
    rank,
    branch,
    quality,
    reviews,
    budget,
    location,

    score,

    coverage,

    coreComplete,

    missingCoreFactors,

    branchPriority:
      branch ?? -1,
  };
}


/*
|--------------------------------------------------------------------------
| FINAL PREMIUM CATEGORY
|--------------------------------------------------------------------------
|
| A high normalized score alone is not enough for "Excellent Match".
|--------------------------------------------------------------------------
*/

function getFinalPremiumCategory(
  row
) {
  const meta =
    getPremiumRankingMeta(
      row
    );

  const score =
    meta.score;

  if (
    score < 0
  ) {
    return {
      key:
        'pending',

      label:
        'Data Pending',
    };
  }

  if (
    !meta.coreComplete
  ) {
    return {
      key:
        'limited',

      label:
        'Limited Confidence',
    };
  }

  if (
    score >= 90 &&
    meta.coverage >= 80
  ) {
    return {
      key:
        'excellent',

      label:
        'Excellent Match',
    };
  }

  if (
    score >= 80
  ) {
    return {
      key:
        'great',

      label:
        'Great Match',
    };
  }

  if (
    score >= 70
  ) {
    return {
      key:
        'good',

      label:
        'Good Match',
    };
  }

  return {
    key:
      'consider',

    label:
      'Consider',
  };
}


/*
|--------------------------------------------------------------------------
| FINAL PRODUCTION RANKING COMPARATOR
|--------------------------------------------------------------------------
|
| Ranking order:
|
| 1. Branch preference
| 2. Core-data completeness
| 3. College Quality
| 4. Admission Fit
| 5. Personalized score
| 6. Review Intelligence
| 7. Evidence coverage
| 8. Budget
| 9. Location
|
| We intentionally do NOT sort only by premium score.
|--------------------------------------------------------------------------
*/

function comparePremiumRows(
  a,
  b
) {
  const A =
    getPremiumRankingMeta(
      a
    );

  const B =
    getPremiumRankingMeta(
      b
    );


  /*
  |--------------------------------------------------------------------------
  | 1. BRANCH PREFERENCE
  |--------------------------------------------------------------------------
  */

  if (
    B.branchPriority !==
    A.branchPriority
  ) {
    return (
      B.branchPriority -
      A.branchPriority
    );
  }


  /*
  |--------------------------------------------------------------------------
  | 2. CORE COMPLETENESS
  |--------------------------------------------------------------------------
  */

  if (
    B.coreComplete !==
    A.coreComplete
  ) {
    return (
      Number(
        B.coreComplete
      ) -
      Number(
        A.coreComplete
      )
    );
  }


  /*
  |--------------------------------------------------------------------------
  | 3. COLLEGE QUALITY
  |--------------------------------------------------------------------------
  */

  const qualityA =
    A.quality ?? -1;

  const qualityB =
    B.quality ?? -1;

  if (
    qualityB !==
    qualityA
  ) {
    return (
      qualityB -
      qualityA
    );
  }


  /*
  |--------------------------------------------------------------------------
  | 4. ADMISSION FIT
  |--------------------------------------------------------------------------
  */

  const rankA =
    A.rank ?? -1;

  const rankB =
    B.rank ?? -1;

  if (
    rankB !==
    rankA
  ) {
    return (
      rankB -
      rankA
    );
  }


  /*
  |--------------------------------------------------------------------------
  | 5. PERSONALIZED SCORE
  |--------------------------------------------------------------------------
  */

  if (
    B.score !==
    A.score
  ) {
    return (
      B.score -
      A.score
    );
  }


  /*
  |--------------------------------------------------------------------------
  | 6. REVIEW INTELLIGENCE
  |--------------------------------------------------------------------------
  */

  const reviewA =
    A.reviews ?? -1;

  const reviewB =
    B.reviews ?? -1;

  if (
    reviewB !==
    reviewA
  ) {
    return (
      reviewB -
      reviewA
    );
  }


  /*
  |--------------------------------------------------------------------------
  | 7. DATA COVERAGE
  |--------------------------------------------------------------------------
  */

  if (
    B.coverage !==
    A.coverage
  ) {
    return (
      B.coverage -
      A.coverage
    );
  }


  /*
  |--------------------------------------------------------------------------
  | 8. BUDGET
  |--------------------------------------------------------------------------
  */

  const budgetA =
    A.budget ?? -1;

  const budgetB =
    B.budget ?? -1;

  if (
    budgetB !==
    budgetA
  ) {
    return (
      budgetB -
      budgetA
    );
  }


  /*
  |--------------------------------------------------------------------------
  | 9. LOCATION
  |--------------------------------------------------------------------------
  */

  return (
    (B.location ?? -1) -
    (A.location ?? -1)
  );
}


function formatNumber(
  value,
  digits = 1
) {
  const number =
    num(value);

  if (number === null) {
    return null;
  }

  return Number(
    number.toFixed(
      digits
    )
  );
}


function humanizeAspect(
  value
) {
  if (!value) {
    return '';
  }

  return String(value)
    .replace(
      /_/g,
      ' '
    )
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
}


function formatDate(
  value
) {
  if (!value) {
    return null;
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date.toLocaleDateString(
    'en-IN',
    {
      year: 'numeric',
      month: 'short',
    }
  );
}


function getReviewV3(
  row
) {
  return (
    row?.reviewIntelligenceV3 ??
    null
  );
}


/*
|--------------------------------------------------------------------------
| EVIDENCE COLLECTION
|--------------------------------------------------------------------------
|
| Actual source-backed sentences only.
|--------------------------------------------------------------------------
*/

function collectReviewEvidence(
  reviewV3
) {
  if (
    !reviewV3?.aspects ||
    typeof reviewV3.aspects !==
      'object'
  ) {
    return [];
  }

  const result = [];

  const sentimentFields = [
    [
      'representativePositiveSentences',
      'positive',
    ],
    [
      'representativeNegativeSentences',
      'negative',
    ],
    [
      'representativeMixedSentences',
      'mixed',
    ],
    [
      'representativeNeutralSentences',
      'neutral',
    ],
  ];

  Object.entries(
    reviewV3.aspects
  ).forEach(
    ([
      aspect,
      aspectData,
    ]) => {
      sentimentFields.forEach(
        ([
          field,
          fallbackSentiment,
        ]) => {
          const evidence =
            Array.isArray(
              aspectData?.[field]
            )
              ? aspectData[field]
              : [];

          evidence.forEach(
            (item) => {
              if (
                !item?.text
              ) {
                return;
              }

              result.push({
                ...item,

                aspect,

                sentiment:
                  item.sentiment ||
                  fallbackSentiment,
              });
            }
          );
        }
      );
    }
  );


  /*
  |--------------------------------------------------------------------------
  | Prevent same review sentence appearing repeatedly.
  |--------------------------------------------------------------------------
  */

  const seen =
    new Set();

  return result.filter(
    (item) => {
      const key =
        `${item.reviewItemId || ''}::` +
        `${String(
          item.text
        )
          .trim()
          .toLowerCase()}`;

      if (
        seen.has(key)
      ) {
        return false;
      }

      seen.add(key);

      return true;
    }
  );
}


/*
|--------------------------------------------------------------------------
| SCORE ROW
|--------------------------------------------------------------------------
*/

function ScoreRow({
  label,
  value,
  max,
}) {
  const number =
    num(value);

  const pct =
    number === null
      ? 0
      : Math.max(
          0,
          Math.min(
            100,
            (number / max) *
              100
          )
        );

  return (
    <div className="rec-score-row">
      <div className="rec-score-row__top">
        <span>
          {label}
        </span>

        <strong
          className={
            number === null
              ? 'is-pending'
              : ''
          }
        >
          {number === null
            ? 'Data pending'
            : `${formatNumber(
                number,
                1
              )}/${max}`}
        </strong>
      </div>

      <div className="rec-score-track">
        <div
          className="rec-score-fill"
          style={{
            width:
              `${pct}%`,
          }}
        />
      </div>
    </div>
  );
}


/*
|--------------------------------------------------------------------------
| LOCKED RECOMMENDATION
|--------------------------------------------------------------------------
*/

function LockedRecommendation({
  isLoggedIn,
  onUnlock,
  onLogin,
}) {
  return (
    <section className="rec-locked">
      <div className="rec-locked__badge">
        PERSONALIZED RECOMMENDATION
      </div>

      <div className="rec-locked__icon">
        🔒
      </div>

      <h2>
        Unlock Your Personalized
        Recommendation
      </h2>

      <p>
        Get ranked college
        suggestions using admission
        fit, branch preference,
        college quality, review
        intelligence, budget and
        location.
      </p>

      <div className="rec-locked__grid">
        <div>
          <strong>
            50%
          </strong>

          <span>
            Admission Fit
          </span>
        </div>

        <div>
          <strong>
            15%
          </strong>

          <span>
            Branch Match
          </span>
        </div>

        <div>
          <strong>
            15%
          </strong>

          <span>
            College Quality
          </span>
        </div>

        <div>
          <strong>
            10%
          </strong>

          <span>
            Review Intelligence
          </span>
        </div>

        <div>
          <strong>
            7%
          </strong>

          <span>
            Budget
          </span>
        </div>

        <div>
          <strong>
            3%
          </strong>

          <span>
            Location
          </span>
        </div>
      </div>

      <button
        type="button"
        className="rec-primary-btn"
        onClick={
          isLoggedIn
            ? onUnlock
            : onLogin
        }
      >
        {isLoggedIn
          ? 'Unlock Recommendation ₹99'
          : 'Login to Unlock'}
      </button>
    </section>
  );
}


/*
|--------------------------------------------------------------------------
| ASPECT TAG
|--------------------------------------------------------------------------
*/

function AspectTag({
  aspect,
  tone = 'normal',
}) {
  const palette = {
    positive: {
      background:
        '#ECFDF3',
      border:
        '#BBF7D0',
      color:
        '#166534',
    },

    negative: {
      background:
        '#FFF1F2',
      border:
        '#FECDD3',
      color:
        '#9F1239',
    },

    missing: {
      background:
        '#F8FAFC',
      border:
        '#E2E8F0',
      color:
        '#64748B',
    },

    normal: {
      background:
        '#F3F4F6',
      border:
        '#E5E7EB',
      color:
        '#374151',
    },
  };

  const style =
    palette[tone] ||
    palette.normal;

  return (
    <span
      style={{
        display:
          'inline-flex',

        alignItems:
          'center',

        padding:
          '5px 9px',

        borderRadius:
          999,

        border:
          `1px solid ${style.border}`,

        background:
          style.background,

        color:
          style.color,

        fontSize:
          11,

        fontWeight:
          700,
      }}
    >
      {humanizeAspect(
        aspect
      )}
    </span>
  );
}


/*
|--------------------------------------------------------------------------
| REVIEW EVIDENCE CARD
|--------------------------------------------------------------------------
*/

function ReviewEvidenceCard({
  evidence,
}) {
  const sentiment =
    String(
      evidence?.sentiment ||
      ''
    ).toLowerCase();

  const sentimentStyle =
    sentiment ===
    'positive'
      ? {
          background:
            '#ECFDF3',
          color:
            '#166534',
        }
      : sentiment ===
          'negative'
        ? {
            background:
              '#FFF1F2',
            color:
              '#9F1239',
          }
        : sentiment ===
            'mixed'
          ? {
              background:
                '#FFF7ED',
              color:
                '#9A3412',
            }
          : {
              background:
                '#F1F5F9',
              color:
                '#475569',
            };

  const date =
    formatDate(
      evidence?.reviewDate
    );

  return (
    <article
      style={{
        padding:
          14,

        border:
          '1px solid #E5EAF4',

        borderRadius:
          12,

        background:
          '#FFFFFF',
      }}
    >
      <div
        style={{
          display:
            'flex',

          flexWrap:
            'wrap',

          alignItems:
            'center',

          gap:
            7,

          marginBottom:
            9,
        }}
      >
        <strong
          style={{
            color:
              '#0F2454',

            fontSize:
              12,
          }}
        >
          {humanizeAspect(
            evidence?.aspect
          )}
        </strong>

        <span
          style={{
            padding:
              '3px 7px',

            borderRadius:
              999,

            background:
              sentimentStyle
                .background,

            color:
              sentimentStyle
                .color,

            fontSize:
              9,

            fontWeight:
              800,

            textTransform:
              'uppercase',
          }}
        >
          {sentiment ||
            'evidence'}
        </span>

        {evidence?.scope && (
          <span
            style={{
              padding:
                '3px 7px',

              borderRadius:
                999,

              background:
                '#EEF2FF',

              color:
                '#4338CA',

              fontSize:
                9,

              fontWeight:
                700,
            }}
          >
            {humanizeAspect(
              evidence.scope
            )}
          </span>
        )}
      </div>

      <p
        style={{
          margin:
            '0 0 10px',

          color:
            '#334155',

          fontSize:
            12,

          lineHeight:
            1.65,
        }}
      >
        “{evidence.text}”
      </p>

      <div
        style={{
          display:
            'flex',

          flexWrap:
            'wrap',

          alignItems:
            'center',

          gap:
            7,

          color:
            '#64748B',

          fontSize:
            10.5,
        }}
      >
        {evidence?.source && (
          <strong
            style={{
              color:
                '#334155',
            }}
          >
            {evidence.source}
          </strong>
        )}

        {evidence?.branch && (
          <>
            <span>·</span>

            <span>
              {evidence.branch}
            </span>
          </>
        )}

        {date && (
          <>
            <span>·</span>

            <span>
              {date}
            </span>
          </>
        )}

        {evidence
          ?.evidenceStrength && (
          <>
            <span>·</span>

            <span>
              {String(
                evidence
                  .evidenceStrength
              ).replace(
                /_/g,
                ' '
              )}
            </span>
          </>
        )}

        {evidence?.sourceUrl && (
          <>
            <span>·</span>

            <a
              href={
                evidence.sourceUrl
              }
              target="_blank"
              rel="noreferrer"
              style={{
                color:
                  '#2853E0',

                fontWeight:
                  700,

                textDecoration:
                  'none',
              }}
            >
              View source
            </a>
          </>
        )}
      </div>
    </article>
  );
}


/*
|--------------------------------------------------------------------------
| REVIEW INTELLIGENCE V3 PANEL
|--------------------------------------------------------------------------
*/

function ReviewIntelligencePanel({
  reviewV3,
}) {
  if (!reviewV3) {
    return (
      <section
        style={{
          marginTop:
            18,

          padding:
            16,

          border:
            '1px solid #E5EAF4',

          borderRadius:
            14,

          background:
            '#FAFBFF',
        }}
      >
        <strong
          style={{
            color:
              '#0F2454',
          }}
        >
          Review Intelligence
        </strong>

        <p
          style={{
            margin:
              '6px 0 0',

            color:
              '#64748B',

            fontSize:
              11.5,
          }}
        >
          Verified review
          intelligence is not
          available for this
          college yet.
        </p>
      </section>
    );
  }


  const score =
    num(
      reviewV3?.score
    );

  const component =
    num(
      reviewV3
        ?.component
    );


  const strengths =
    Array.isArray(
      reviewV3?.strengths
    )
      ? reviewV3.strengths
      : [];


  const concerns =
    Array.isArray(
      reviewV3?.concerns
    )
      ? reviewV3.concerns
      : [];


  const missing =
    Array.isArray(
      reviewV3
        ?.missingAspects
    )
      ? reviewV3
          .missingAspects
      : [];


  const evidence =
    collectReviewEvidence(
      reviewV3
    );


  const coverage =
    reviewV3?.evidence ||
    {};


  return (
    <section
      style={{
        marginTop:
          18,

        padding:
          18,

        border:
          '1px solid #DDE5F4',

        borderRadius:
          15,

        background:
          'linear-gradient(135deg,#FFFFFF,#F8FAFF)',
      }}
    >
      {/* ==========================================
          TITLE + SCORE
      ========================================== */}

      <div
        style={{
          display:
            'flex',

          alignItems:
            'flex-start',

          justifyContent:
            'space-between',

          gap:
            16,

          marginBottom:
            16,
        }}
      >
        <div>
          <span
            style={{
              display:
                'block',

              marginBottom:
                4,

              color:
                '#6D28D9',

              fontSize:
                9,

              fontWeight:
                900,

              letterSpacing:
                '.08em',
            }}
          >
            REVIEW INTELLIGENCE V3
          </span>

          <h4
            style={{
              margin:
                '0 0 5px',

              color:
                '#0F2454',

              fontSize:
                15,
            }}
          >
            What students are
            saying
          </h4>

          <p
            style={{
              margin:
                0,

              color:
                '#64748B',

              fontSize:
                11,
            }}
          >
            Source-backed review
            evidence with branch
            and programme scope.
          </p>
        </div>

        <div
          style={{
            flex:
              '0 0 auto',

            minWidth:
              96,

            padding:
              '10px 12px',

            borderRadius:
              12,

            background:
              '#EEF2FF',

            textAlign:
              'center',
          }}
        >
          <span
            style={{
              display:
                'block',

              color:
                '#64748B',

              fontSize:
                8,

              fontWeight:
                800,

              marginBottom:
                3,
            }}
          >
            REVIEW SCORE
          </span>

          <strong
            style={{
              color:
                '#3730A3',

              fontSize:
                19,
            }}
          >
            {score === null
              ? '—'
              : formatNumber(
                  score,
                  1
                )}

            {score !== null && (
              <small
                style={{
                  fontSize:
                    10,
                }}
              >
                /100
              </small>
            )}
          </strong>

          {component !==
            null && (
            <span
              style={{
                display:
                  'block',

                marginTop:
                  3,

                color:
                  '#64748B',

                fontSize:
                  9,
              }}
            >
              {formatNumber(
                component,
                2
              )}
              /10 contribution
            </span>
          )}
        </div>
      </div>


      {/* ==========================================
          STRENGTH / CONCERN / MISSING
      ========================================== */}

      <div
        style={{
          display:
            'grid',

          gridTemplateColumns:
            'repeat(auto-fit,minmax(180px,1fr))',

          gap:
            10,

          marginBottom:
            16,
        }}
      >
        <div
          style={{
            padding:
              12,

            border:
              '1px solid #DDF5E6',

            borderRadius:
              11,

            background:
              '#FBFFFC',
          }}
        >
          <strong
            style={{
              display:
                'block',

              marginBottom:
                8,

              color:
                '#166534',

              fontSize:
                11,
            }}
          >
            Strengths
          </strong>

          <div
            style={{
              display:
                'flex',

              flexWrap:
                'wrap',

              gap:
                6,
            }}
          >
            {strengths.length ? (
              strengths.map(
                (aspect) => (
                  <AspectTag
                    key={
                      aspect
                    }
                    aspect={
                      aspect
                    }
                    tone="positive"
                  />
                )
              )
            ) : (
              <span
                style={{
                  color:
                    '#64748B',

                  fontSize:
                    10.5,
                }}
              >
                No verified strength
                identified yet.
              </span>
            )}
          </div>
        </div>


        <div
          style={{
            padding:
              12,

            border:
              '1px solid #FEE2E2',

            borderRadius:
              11,

            background:
              '#FFFBFB',
          }}
        >
          <strong
            style={{
              display:
                'block',

              marginBottom:
                8,

              color:
                '#9F1239',

              fontSize:
                11,
            }}
          >
            Concerns
          </strong>

          <div
            style={{
              display:
                'flex',

              flexWrap:
                'wrap',

              gap:
                6,
            }}
          >
            {concerns.length ? (
              concerns.map(
                (aspect) => (
                  <AspectTag
                    key={
                      aspect
                    }
                    aspect={
                      aspect
                    }
                    tone="negative"
                  />
                )
              )
            ) : (
              <span
                style={{
                  color:
                    '#64748B',

                  fontSize:
                    10.5,
                }}
              >
                No major verified
                concern identified.
              </span>
            )}
          </div>
        </div>


        <div
          style={{
            padding:
              12,

            border:
              '1px solid #E2E8F0',

            borderRadius:
              11,

            background:
              '#FAFAFB',
          }}
        >
          <strong
            style={{
              display:
                'block',

              marginBottom:
                8,

              color:
                '#475569',

              fontSize:
                11,
            }}
          >
            Missing Evidence
          </strong>

          <div
            style={{
              display:
                'flex',

              flexWrap:
                'wrap',

              gap:
                6,
            }}
          >
            {missing.length ? (
              missing.map(
                (aspect) => (
                  <AspectTag
                    key={
                      aspect
                    }
                    aspect={
                      aspect
                    }
                    tone="missing"
                  />
                )
              )
            ) : (
              <span
                style={{
                  color:
                    '#166534',

                  fontSize:
                    10.5,
                }}
              >
                All review aspects
                have evidence.
              </span>
            )}
          </div>
        </div>
      </div>


      {/* ==========================================
          COVERAGE
      ========================================== */}

      <div
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
          label="Reviews"
          value={
            coverage
              ?.usableReviews
          }
        />

        <CoverageChip
          label="Sources"
          value={
            coverage
              ?.independentSources
          }
        />

        <CoverageChip
          label="Branch evidence"
          value={
            coverage
              ?.branchEvidence
          }
        />

        <CoverageChip
          label="Recent reviews"
          value={
            coverage
              ?.recentReviews
          }
        />
      </div>


      {/* ==========================================
          ACTUAL REVIEW EVIDENCE
      ========================================== */}

      {evidence.length >
        0 && (
        <div>
          <div
            style={{
              marginBottom:
                9,

              color:
                '#0F2454',

              fontSize:
                11,

              fontWeight:
                800,
            }}
          >
            SOURCE-BACKED REVIEW
            EVIDENCE
          </div>

          <div
            style={{
              display:
                'grid',

              gap:
                9,
            }}
          >
            {evidence
              .slice(
                0,
                4
              )
              .map(
                (
                  item,
                  index
                ) => (
                  <ReviewEvidenceCard
                    key={
                      `${item.reviewItemId}-${item.aspect}-${index}`
                    }
                    evidence={
                      item
                    }
                  />
                )
              )}
          </div>

          {evidence.length >
            4 && (
            <p
              style={{
                margin:
                  '9px 0 0',

                color:
                  '#64748B',

                fontSize:
                  10,
              }}
            >
              Showing 4 of{' '}
              {evidence.length}{' '}
              available representative
              evidence sentences.
            </p>
          )}
        </div>
      )}
    </section>
  );
}


/*
|--------------------------------------------------------------------------
| COVERAGE CHIP
|--------------------------------------------------------------------------
*/

function CoverageChip({
  label,
  value,
}) {
  const number =
    num(value);

  if (
    number === null
  ) {
    return null;
  }

  return (
    <span
      style={{
        display:
          'inline-flex',

        alignItems:
          'center',

        gap:
          4,

        padding:
          '5px 8px',

        borderRadius:
          999,

        background:
          '#F1F5F9',

        color:
          '#475569',

        fontSize:
          9.5,
      }}
    >
      <strong>
        {number}
      </strong>

      {label}
    </span>
  );
}


/*
|--------------------------------------------------------------------------
| RECOMMENDATION CARD
|--------------------------------------------------------------------------
*/

function RecommendationCard({
  row,
  index,
}) {
  const premium =
    row?.premium || {};

  const breakdown =
    premium?.breakdown ||
    {};

  const reviewV3 =
    getReviewV3(row);


  /*
  |--------------------------------------------------------------------------
  | V3 REVIEW COMPONENT
  |--------------------------------------------------------------------------
  |
  | reviewIntelligenceV3.component is already /10.
  |
  | Do not convert score 76.66 manually here.
  |--------------------------------------------------------------------------
  */

  const reviewComponent =
    num(
      reviewV3?.component
    );


  const effectiveBreakdown = {
    ...breakdown,

    reviews:
      reviewComponent !==
      null
        ? reviewComponent
        : breakdown?.reviews,
  };


  const strong =
    Array.isArray(
      premium?.reasons?.strong
    )
      ? premium.reasons.strong
      : [];


  const weak =
    Array.isArray(
      premium?.reasons?.weak
    )
      ? premium.reasons.weak
      : [];


  const college =
    row?.college?.name ||
    row?.college_name ||
    'College';


  const branch =
    row?.branch?.name ||
    row?.branch_name ||
    'Branch';


  const overall =
    num(
      premium?.score
    );


  const admission =
    premium
      ?.admissionBucket
      ?.label ||
    premium
      ?.admissionBucket ||
    row?.bucket ||
    'Admission fit';


  const finalCategory =
    getFinalPremiumCategory(
      row
    );

  const category =
    finalCategory.label;

  const rankingMeta =
    getPremiumRankingMeta(
      row
    );

  const dataCoverage =
    rankingMeta.coverage;


  return (
    <article className="rec-card">
      <div className="rec-card__rank">
        #{index + 1}
      </div>


      {/* ==========================================
          HEADER
      ========================================== */}

      <div className="rec-card__header">
        <div>
          <div className="rec-kicker">
            PERSONALIZED
            RECOMMENDATION
          </div>

          <h3>
            {college}
          </h3>

          <p>
            {branch}
          </p>

          <div className="rec-labels">
            <span className="rec-admission-label">
              {admission}
            </span>

            <span className="rec-premium-label">
              {category}
            </span>
          </div>
        </div>


        <div className="rec-overall">
          <span>
            Overall Match
          </span>

          <strong>
            {overall === null
              ? '—'
              : Math.round(
                  overall
                )}

            {overall !== null && (
              <small>
                /100
              </small>
            )}
          </strong>

          <span
            style={{
              display:
                'block',

              marginTop:
                5,

              fontSize:
                9,

              opacity:
                0.72,
            }}
          >
            Data Coverage:{' '}

            <b>
              {dataCoverage}%
            </b>
          </span>
        </div>
      </div>


      {/* ==========================================
          HISTORICAL FIT
      ========================================== */}

      {premium
        ?.historicalFit
        ?.label && (
        <div className="rec-historical-fit">
          Historical Fit:{' '}
          {
            premium
              .historicalFit
              .label
          }
        </div>
      )}


      {!rankingMeta
        .coreComplete && (
        <div
          style={{
            marginTop:
              10,

            padding:
              '9px 11px',

            border:
              '1px solid #FDE68A',

            borderRadius:
              9,

            background:
              '#FFFBEB',

            color:
              '#92400E',

            fontSize:
              10.5,

            lineHeight:
              1.45,
          }}
        >
          <strong>
            Limited confidence:
          </strong>{' '}

          this score is based on
          available verified factors.

          {' '}

          Missing core data:{' '}

          <strong>
            {rankingMeta
              .missingCoreFactors
              .join(', ')}
          </strong>.
        </div>
      )}


      {/* ==========================================
          MAIN SCORE + REASONS
      ========================================== */}

      <div className="rec-main-grid">
        <section className="rec-breakdown">
          <span className="rec-section-kicker">
            SCORE BREAKDOWN
          </span>

          <h4>
            How your match is
            calculated
          </h4>

          {PARTS.map(
            ([
              key,
              label,
              max,
            ]) => (
              <ScoreRow
                key={key}
                label={label}
                value={
                  effectiveBreakdown[
                    key
                  ]
                }
                max={max}
              />
            )
          )}
        </section>


        <section className="rec-explanation">
          <div className="rec-reason-box rec-reason-box--strong">
            <h4>
              Why this is strong
            </h4>

            {strong.length ? (
              strong
                .slice(
                  0,
                  4
                )
                .map(
                  (
                    reason,
                    index
                  ) => (
                    <p
                      key={
                        index
                      }
                    >
                      ✓ {reason}
                    </p>
                  )
                )
            ) : (
              <p className="rec-muted">
                Strong factors
                will appear when
                verified data is
                available.
              </p>
            )}
          </div>


          <div className="rec-reason-box rec-reason-box--weak">
            <h4>
              What reduces the score
            </h4>

            {weak.length ? (
              weak
                .slice(
                  0,
                  4
                )
                .map(
                  (
                    reason,
                    index
                  ) => (
                    <p
                      key={
                        index
                      }
                    >
                      – {reason}
                    </p>
                  )
                )
            ) : (
              <p className="rec-muted">
                No major reducing
                factor is currently
                available.
              </p>
            )}
          </div>
        </section>
      </div>


      {/* ==========================================
          REVIEW INTELLIGENCE V3
      ========================================== */}

      <ReviewIntelligencePanel
        reviewV3={
          reviewV3
        }
      />


      {/* ==========================================
          DATA POLICY
      ========================================== */}

      <div className="rec-data-note">
        Missing quality, review,
        fee or location data stays
        unknown — no artificial
        default score.
      </div>
    </article>
  );
}


/*
|--------------------------------------------------------------------------
| MAIN RECOMMENDATION SLIDE
|--------------------------------------------------------------------------
*/

export default function RecommendationSlide({
  rows = [],
  hasRecommendationAccess = false,
  isLoggedIn = false,
  onUnlock,
  onLogin,
}) {
  const rankedRows =
    useMemo(
      () =>
        [...rows]
          .filter(Boolean)
          .sort(
            comparePremiumRows
          )
          .slice(
            0,
            10
          ),
      [
        rows,
      ]
    );


  /*
  |--------------------------------------------------------------------------
  | PAYWALL
  |--------------------------------------------------------------------------
  */

  if (
    !hasRecommendationAccess
  ) {
    return (
      <LockedRecommendation
        isLoggedIn={
          isLoggedIn
        }
        onUnlock={
          onUnlock
        }
        onLogin={
          onLogin
        }
      />
    );
  }


  return (
    <section className="recommendation-slide">
      {/* ==========================================
          HERO
      ========================================== */}

      <header className="recommendation-slide__hero">
        <div>
          <span className="rec-kicker">
            YOUR PERSONALIZED
            RANKING
          </span>

          <h2>
            Top Recommendations
            For Your Profile
          </h2>

          <p>
            Ranked using admission
            fit, branch preference,
            college quality, review
            intelligence, budget and
            location.
          </p>
        </div>


        <div className="recommendation-slide__formula">
          {[
            50,
            15,
            15,
            10,
            7,
            3,
          ].map(
            (value) => (
              <span
                key={
                  value
                }
              >
                {value}
              </span>
            )
          )}
        </div>
      </header>


      {/* ==========================================
          EMPTY
      ========================================== */}

      {!rankedRows.length ? (
        <div className="rec-empty">
          <h3>
            No recommendation
            data available yet
          </h3>

          <p>
            Generate college
            options first.
            Personalized ranking
            will appear here.
          </p>
        </div>
      ) : (
        <div className="rec-list">
          {rankedRows.map(
            (
              row,
              index
            ) => {
              const collegeId =
                row?.collegeId ||
                row?.college?.id ||
                row?.college_id ||
                'college';

              const branchName =
                row?.branch?.name ||
                row?.branch_name ||
                'branch';

              return (
                <RecommendationCard
                  key={
                    `${collegeId}-${branchName}-${index}`
                  }
                  row={row}
                  index={
                    index
                  }
                />
              );
            }
          )}
        </div>
      )}
    </section>
  );
}