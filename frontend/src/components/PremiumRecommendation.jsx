import React from 'react';

function formatScore(score) {
  if (
    score === null ||
    score === undefined ||
    !Number.isFinite(Number(score))
  ) {
    return null;
  }

  return Math.round(Number(score));
}

function getComponentScore(row, key) {
  const value =
    row?.premium?.components?.[key]?.score;

  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(Number(value))
  ) {
    return null;
  }

  return Math.round(Number(value));
}

function getComponentReason(row, key) {
  return (
    row?.premium?.components?.[key]?.reason ||
    ''
  );
}

function getCollegeName(row) {
  return (
    row?.premium?.collegeName ||
    row?.college?.name ||
    row?.collegeName ||
    row?.college_name ||
    row?.institute_name ||
    row?.instituteName ||
    'Recommended College'
  );
}

function getBranchName(row) {
  return (
    row?.premium?.branchName ||
    row?.branch?.name ||
    row?.branch?.branch_name ||
    row?.branchName ||
    row?.branch_name ||
    row?.program ||
    row?.course ||
    'Preferred Branch'
  );
}

function getCategory(row) {
  const category =
    row?.premium?.premiumCategory;

  if (category) {
    return category;
  }

  return {
    label: 'Premium Match',
    icon: '💎',
    key: 'premium',
  };
}

function ScoreRow({
  label,
  score,
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 0',
        borderBottom:
          '1px solid #EEF1F6',
      }}
    >
      <span
        style={{
          fontSize: 13,
          color: '#475467',
        }}
      >
        {label}
      </span>

      <strong
        style={{
          fontSize: 13,
          color:
            score === null
              ? '#98A2B3'
              : '#172B4D',
        }}
      >
        {score === null
          ? 'Data unavailable'
          : `${score}/100`}
      </strong>
    </div>
  );
}

export default function PremiumRecommendation({
  row,
  locked = true,
}) {
  const score =
    formatScore(
      row?.premium?.finalScore
    );

  const category =
    getCategory(row);

  const collegeName =
    getCollegeName(row);

  const branchName =
    getBranchName(row);

  const highReasons =
    row?.premium?.reasons?.high ||
    [];

  const lowReasons =
    row?.premium?.reasons?.low ||
    [];

  const missingReasons =
    row?.premium?.reasons?.missing ||
    [];

  /*
   * If no score exists, don't pretend
   * this is a valid Premium Match.
   */
  const hasScore =
    score !== null;

  /*
   * Build useful high reasons.
   */
  const displayHighReasons =
    highReasons.length > 0
      ? highReasons.slice(0, 3)
      : [
          getComponentReason(
            row,
            'rank'
          ),
          getComponentReason(
            row,
            'branch'
          ),
          getComponentReason(
            row,
            'quality'
          ),
        ].filter(Boolean).slice(0, 3);

  /*
   * Build useful low reasons.
   */
  const displayLowReasons =
    lowReasons.length > 0
      ? lowReasons.slice(0, 2)
      : [
          getComponentReason(
            row,
            'rank'
          ),
          getComponentReason(
            row,
            'branch'
          ),
          getComponentReason(
            row,
            'quality'
          ),
          getComponentReason(
            row,
            'reviews'
          ),
          getComponentReason(
            row,
            'budget'
          ),
          getComponentReason(
            row,
            'location'
          ),
        ]
          .filter(Boolean)
          .slice(0, 2);

  const showLockedContent =
    locked === true;

  return (
    <article
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 18,
        border:
          '1px solid #D9E2FF',
        background: '#FFFFFF',
        boxShadow:
          '0 8px 30px rgba(20,40,90,.08)',
      }}
    >
      {/* HEADER */}

      <div
        style={{
          padding: '18px 20px',
          background:
            'linear-gradient(135deg,#F5F7FF,#FFFFFF)',
          borderBottom:
            '1px solid #E9EDFA',
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '.08em',
            color: '#667085',
            marginBottom: 6,
          }}
        >
          🔒 PREMIUM RECOMMENDATION
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent:
              'space-between',
            alignItems: 'flex-start',
            gap: 16,
          }}
        >
          <div
            style={{
              minWidth: 0,
              flex: 1,
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: 19,
                lineHeight: 1.3,
                color: '#172B4D',
              }}
            >
              {collegeName}
            </h3>

            <div
              style={{
                marginTop: 5,
                fontSize: 13,
                color: '#667085',
              }}
            >
              {branchName}
            </div>
          </div>

          {/* SCORE */}

          <div
            style={{
              flexShrink: 0,
              minWidth: 82,
              textAlign: 'center',
              padding: '9px 10px',
              borderRadius: 14,
              background:
                hasScore
                  ? '#EEF2FF'
                  : '#F2F4F7',
            }}
          >
            <div
              style={{
                fontSize: 22,
                fontWeight: 800,
                lineHeight: 1,
                color:
                  hasScore
                    ? '#3949AB'
                    : '#667085',
              }}
            >
              {hasScore
                ? score
                : '—'}
            </div>

            <div
              style={{
                marginTop: 4,
                fontSize: 10,
                fontWeight: 700,
                color: '#667085',
              }}
            >
              {hasScore
                ? '/100'
                : 'DATA'}
            </div>
          </div>
        </div>

        {/* CATEGORY */}

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 14,
            padding:
              '7px 11px',
            borderRadius: 999,
            background:
              '#FFFFFF',
            border:
              '1px solid #D9E2FF',
            fontSize: 12,
            fontWeight: 800,
            color: '#344054',
          }}
        >
          <span>
            {category.icon}
          </span>

          <span>
            {category.label}
          </span>
        </div>
      </div>

      {/* BASIC WHY SECTION */}

      <div
        style={{
          padding: 20,
        }}
      >
        {/* WHY HIGH */}

        <section>
          <h4
            style={{
              margin:
                '0 0 10px',
              fontSize: 14,
              color: '#172B4D',
            }}
          >
            Why we recommend this
          </h4>

          {displayHighReasons.length >
          0 ? (
            <div
              style={{
                display:
                  'grid',
                gap: 8,
              }}
            >
              {displayHighReasons.map(
                (
                  reason,
                  index
                ) => (
                  <div
                    key={`high-${index}`}
                    style={{
                      display:
                        'flex',
                      gap: 8,
                      alignItems:
                        'flex-start',
                      fontSize: 13,
                      lineHeight: 1.45,
                      color:
                        '#344054',
                    }}
                  >
                    <span
                      style={{
                        color:
                          '#16A34A',
                        fontWeight:
                          800,
                      }}
                    >
                      ✓
                    </span>

                    <span>
                      {reason}
                    </span>
                  </div>
                )
              )}
            </div>
          ) : (
            <div
              style={{
                fontSize: 13,
                color: '#667085',
              }}
            >
              The recommendation is
              based on your profile
              and available college data.
            </div>
          )}
        </section>

        {/* WHY LOWER */}

        {displayLowReasons.length >
          0 && (
          <section
            style={{
              marginTop: 18,
            }}
          >
            <h4
              style={{
                margin:
                  '0 0 10px',
                fontSize: 14,
                color: '#172B4D',
              }}
            >
              What is reducing the
              score
            </h4>

            <div
              style={{
                display:
                  'grid',
                gap: 8,
              }}
            >
              {displayLowReasons.map(
                (
                  reason,
                  index
                ) => (
                  <div
                    key={`low-${index}`}
                    style={{
                      display:
                        'flex',
                      gap: 8,
                      alignItems:
                        'flex-start',
                      fontSize: 13,
                      lineHeight: 1.45,
                      color:
                        '#475467',
                    }}
                  >
                    <span
                      style={{
                        color:
                          '#D97706',
                        fontWeight:
                          800,
                      }}
                    >
                      ⚠
                    </span>

                    <span>
                      {reason}
                    </span>
                  </div>
                )
              )}
            </div>
          </section>
        )}

        {/* SCORE BREAKDOWN */}

        <section
          style={{
            marginTop: 20,
          }}
        >
          <h4
            style={{
              margin:
                '0 0 8px',
              fontSize: 14,
              color: '#172B4D',
            }}
          >
            Premium score
          </h4>

          <ScoreRow
            label="Rank / Admission Fit · 50%"
            score={getComponentScore(
              row,
              'rank'
            )}
          />

          <ScoreRow
            label="Branch Preference · 15%"
            score={getComponentScore(
              row,
              'branch'
            )}
          />

          <ScoreRow
            label="College Quality · 15%"
            score={getComponentScore(
              row,
              'quality'
            )}
          />

          <ScoreRow
            label="Student Reviews · 10%"
            score={getComponentScore(
              row,
              'reviews'
            )}
          />

          <ScoreRow
            label="Budget · 7%"
            score={getComponentScore(
              row,
              'budget'
            )}
          />

          <ScoreRow
            label="Location · 3%"
            score={getComponentScore(
              row,
              'location'
            )}
          />
        </section>

        {/* DATA WARNING */}

        {missingReasons.length >
          0 && (
          <div
            style={{
              marginTop: 14,
              padding: 10,
              borderRadius: 10,
              background:
                '#F8FAFC',
              color: '#667085',
              fontSize: 11,
              lineHeight: 1.45,
            }}
          >
            Some Premium factors
            require additional
            verified data.
          </div>
        )}

        {/* LOCKED PREMIUM */}

        {showLockedContent && (
          <div
            style={{
              position:
                'relative',
              marginTop: 20,
              padding: 18,
              borderRadius: 14,
              overflow: 'hidden',
              border:
                '1px solid #E4E7EC',
              background:
                '#F9FAFB',
            }}
          >
            <div
              style={{
                filter:
                  'blur(2px)',
                opacity: 0.55,
                userSelect:
                  'none',
                pointerEvents:
                  'none',
              }}
            >
              <strong
                style={{
                  display:
                    'block',
                  marginBottom:
                    8,
                  fontSize: 14,
                }}
              >
                🔓 Full Premium Analysis
              </strong>

              <div
                style={{
                  display:
                    'grid',
                  gap: 6,
                  fontSize: 12,
                }}
              >
                <div>
                  Personalized ranking
                </div>

                <div>
                  Best branch alternatives
                </div>

                <div>
                  College quality analysis
                </div>

                <div>
                  Review analysis
                </div>

                <div>
                  Budget / ROI analysis
                </div>

                <div>
                  College comparison
                </div>
              </div>
            </div>

            {/* LOCK OVERLAY */}

            <div
              style={{
                position:
                  'absolute',
                inset: 0,
                display:
                  'flex',
                flexDirection:
                  'column',
                justifyContent:
                  'center',
                alignItems:
                  'center',
                padding: 16,
                textAlign:
                  'center',
                background:
                  'rgba(255,255,255,.72)',
                backdropFilter:
                  'blur(3px)',
              }}
            >
              <div
                style={{
                  fontSize: 22,
                  marginBottom: 5,
                }}
              >
                🔒
              </div>

              <strong
                style={{
                  fontSize: 14,
                  color: '#172B4D',
                }}
              >
                Full Premium Analysis
              </strong>

              <span
                style={{
                  marginTop: 4,
                  fontSize: 11,
                  color: '#667085',
                }}
              >
                Unlock detailed
                personalized analysis
              </span>

              <button
                type="button"
                onClick={() => {
                  console.log(
                    '[PREMIUM] Unlock clicked'
                  );
                }}
                style={{
                  marginTop: 11,
                  border: 0,
                  borderRadius: 9,
                  padding:
                    '9px 16px',
                  background:
                    '#3949AB',
                  color: '#FFFFFF',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                🔒 Unlock Full Analysis
              </button>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}