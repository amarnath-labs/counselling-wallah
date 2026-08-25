import {
  useMemo,
  useState,
} from 'react';

import {
  Link,
  useNavigate,
} from 'react-router-dom';

import PageHero from '../components/PageHero';
import CollegeCard from '../components/CollegeCard';

import {
  useAppState,
} from '../hooks/useAppState';

import {
  BRANCH_LIST,
  filterAndSortResults,
  summarizeBuckets,
} from '../services/recommendationService';

import {
  getExamName,
} from '../services/examService';

export default function Results() {
  const {
    results,
    resultsExamId,
    profile,
    selectedExamId,
    catalogLoading,
    resultsLoading,
    resultsError,
  } = useAppState();

  const [
    filters,
    setFilters,
  ] = useState({
    branch: '',
    state: '',
    type: '',
    sort: 'match',
  });

  const nav =
    useNavigate();

  /*
  |--------------------------------------------------------------------------
  | ACCESS CONTROL
  |--------------------------------------------------------------------------
  |
  | false = FREE USER
  | true  = PREMIUM USER
  |
  | Later connect this with actual payment/account entitlement.
  |--------------------------------------------------------------------------
  */

  const isPremium =
    false;

  /*
  |--------------------------------------------------------------------------
  | CURRENT EXAM SAFETY
  |--------------------------------------------------------------------------
  */

  const safeResults =
    resultsExamId ===
      selectedExamId &&
    Array.isArray(results)
      ? results
      : [];

  /*
  |--------------------------------------------------------------------------
  | FILTER + SORT
  |--------------------------------------------------------------------------
  */

  const rows =
    useMemo(
      () =>
        filterAndSortResults(
          safeResults,
          filters,
          profile
        ),
      [
        safeResults,
        filters,
        profile,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | COUNTS
  |--------------------------------------------------------------------------
  */

  const counts =
    summarizeBuckets(
      rows
    );

  /*
  |--------------------------------------------------------------------------
  | STATES
  |--------------------------------------------------------------------------
  */

  const states =
    useMemo(
      () => {
        return [
          ...new Set(
            safeResults
              .map(
                (row) =>
                  row?.college
                    ?.state
              )
              .filter(Boolean)
          ),
        ].sort();
      },
      [safeResults]
    );

  /*
  |--------------------------------------------------------------------------
  | EXAM
  |--------------------------------------------------------------------------
  */

  const examName =
    getExamName(
      selectedExamId
    );

  /*
  |--------------------------------------------------------------------------
  | FREE RESULT
  |--------------------------------------------------------------------------
  */

  const bestFreeResult =
    rows.length > 0
      ? rows[0]
      : null;

  /*
  |--------------------------------------------------------------------------
  | ALL OTHER RESULTS
  |--------------------------------------------------------------------------
  */

  const remainingRows =
    rows.length > 1
      ? rows.slice(1)
      : [];

  const lockedCount =
    remainingRows.length;

  /*
  |--------------------------------------------------------------------------
  | BUCKET UI
  |--------------------------------------------------------------------------
  */

  const bucketMeta = {
    dream: {
      color:
        'var(--red)',

      description:
        'High-value, competitive options.',
    },

    target: {
      color:
        'var(--amber)',

      description:
        'Realistic and strong options.',
    },

    safe: {
      color:
        'var(--green)',

      description:
        'Higher-probability options.',
    },

    backup: {
      color:
        'var(--blue)',

      description:
        'Extra options to keep in hand.',
    },
  };

  return (
    <>
      <PageHero
        title="Your College Options"
        description={
          `${examName} Rank: ` +
          `${Number(
            profile?.rank || 0
          ).toLocaleString(
            'en-IN'
          )}` +
          ` Â· Category: ` +
          `${profile?.category ||
            'General'}`
        }
        crumb={
          <>
            <Link to="/">
              Home
            </Link>

            {' / '}

            <Link to="/exams">
              Exams
            </Link>

            {' / '}

            Your Options
          </>
        }
      />

      <div className="container section">

        {/* =====================================================
            LOADING
        ===================================================== */}

        {catalogLoading && (
          <div className="source-note">
            Loading catalog...
          </div>
        )}

        {resultsLoading && (
          <div className="source-note">

            Finding colleges for{' '}

            <b>
              {examName}
            </b>

            ...

          </div>
        )}

        {/* =====================================================
            ERROR
        ===================================================== */}

        {resultsError &&
          !resultsLoading && (
            <div className="source-note">
              {resultsError}
            </div>
          )}

        {/* =====================================================
            SUMMARY
        ===================================================== */}

        <div className="results-summary">

          <Pill
            n={rows.length}
            label="Colleges Found"
          />

          <Pill
            n={counts.dream}
            label="Dream"
            c="var(--red)"
          />

          <Pill
            n={counts.target}
            label="Target"
            c="var(--amber)"
          />

          <Pill
            n={counts.safe}
            label="Safe"
            c="var(--green)"
          />

          <Pill
            n={counts.backup}
            label="Backup"
            c="var(--blue)"
          />

        </div>

        {/* =====================================================
            FILTERS
        ===================================================== */}

        <div className="filter-bar">

          {/* BRANCH */}

          <select
            value={
              filters.branch
            }
            onChange={(e) =>
              setFilters({
                ...filters,

                branch:
                  e.target
                    .value,
              })
            }
          >

            <option value="">
              All Branches
            </option>

            {BRANCH_LIST.map(
              (branch) => (
                <option
                  key={branch}
                  value={branch}
                >
                  {branch}
                </option>
              )
            )}

          </select>

          {/* STATE */}

          <select
            value={
              filters.state
            }
            onChange={(e) =>
              setFilters({
                ...filters,

                state:
                  e.target
                    .value,
              })
            }
          >

            <option value="">
              All States
            </option>

            {states.map(
              (state) => (
                <option
                  key={state}
                  value={state}
                >
                  {state}
                </option>
              )
            )}

          </select>

          {/* TYPE */}

          <select
            value={
              filters.type
            }
            onChange={(e) =>
              setFilters({
                ...filters,

                type:
                  e.target
                    .value,
              })
            }
          >

            <option value="">
              All College Types
            </option>

            <option value="Government">
              Government
            </option>

            <option value="Private">
              Private
            </option>

          </select>

          {/* SORT */}

          <select
            value={
              filters.sort
            }
            onChange={(e) =>
              setFilters({
                ...filters,

                sort:
                  e.target
                    .value,
              })
            }
          >

            <option value="match">
              Sort: Best Overall Match
            </option>

            <option value="fees">
              Sort: Lowest Fees
            </option>

            <option value="rank">
              Sort: Closest to Rank
            </option>

            <option value="placement">
              Sort: Best Placement
            </option>

          </select>

        </div>

        {/* =====================================================
            EMPTY
        ===================================================== */}

        {!resultsLoading &&
          !rows.length && (
            <div className="empty-state">

              <h3>
                No colleges found
              </h3>

              <p>
                No matching{' '}
                {examName}{' '}
                data is available
                for the selected
                profile.
              </p>

              <button
                type="button"
                className="btn btn-primary"
                onClick={() =>
                  nav(
                    '/profile'
                  )
                }
              >
                Adjust Preferences
              </button>

            </div>
          )}

        {/* =====================================================
            FREE USER
        ===================================================== */}

        {!resultsLoading &&
          !isPremium &&
          bestFreeResult && (
            <>

              {/* ===============================================
                  REGULAR SEARCH
              =============================================== */}

              <section className="free-result-section">

                <div className="free-result-heading">

                  <div>

                    <div className="free-result-kicker">
                      REGULAR SEARCH
                    </div>

                    <h2>
                      Your Best Free Match
                    </h2>

                    <p>

                      We found{' '}

                      <strong>
                        {rows.length}
                      </strong>{' '}

                      matching college
                      options.

                      {' '}

                      Your best option
                      is shown with
                      full basic details.

                    </p>

                  </div>

                  <span className="free-access-badge">
                    FREE
                  </span>

                </div>

                <div className="single-free-result">

                  {/*
                    IMPORTANT:

                    Use normal locked mode here.

                    This keeps the clean
                    percentage card without
                    another premium teaser
                    inside the card.

                    Premium Preview comes
                    separately below.
                  */}

                  <CollegeCard
                    row={
                      bestFreeResult
                    }
                    mode="locked"
                  />

                </div>

              </section>

              {/* ===============================================
                  NEW PREMIUM RECOMMENDATION PREVIEW
              =============================================== */}

              <PremiumRecommendationPreview
                row={
                  bestFreeResult
                }
                onUnlock={() =>
                  nav(
                    '/pricing'
                  )
                }
              />

              {/* ===============================================
                  EXISTING BLUE PREMIUM SECTION
                  KEEP THIS SECTION
              =============================================== */}

              {lockedCount > 0 && (
                <PremiumUnlock
                  count={
                    lockedCount
                  }
                  onUnlock={() =>
                    nav(
                      '/pricing'
                    )
                  }
                />
              )}

              {/* ===============================================
                  REMAINING FREE SEARCH RESULTS
              =============================================== */}

              {[
                'dream',
                'target',
                'safe',
                'backup',
              ].map(
                (bucket) => {

                  const group =
                    remainingRows
                      .filter(
                        (row) =>
                          row
                            ?.bucket ===
                          bucket
                      );

                  if (
                    !group.length
                  ) {
                    return null;
                  }

                  return (
                    <div
                      className="result-group"
                      key={
                        `free-${bucket}`
                      }
                    >

                      <div className="group-label">

                        <span
                          className="dot"
                          style={{
                            background:
                              bucketMeta[
                                bucket
                              ].color,
                          }}
                        />

                        <h3>

                          {bucket
                            .charAt(0)
                            .toUpperCase() +
                            bucket
                              .slice(1)}

                        </h3>

                        <span className="count">

                          {group.length}{' '}
                          options Â·{' '}

                          {
                            bucketMeta[
                              bucket
                            ]
                              .description
                          }

                        </span>

                      </div>

                      <div className="college-grid">

                        {group.map(
                          (
                            row,
                            index
                          ) => {

                            const collegeId =
                              row
                                ?.collegeId ||
                              row
                                ?.college
                                ?.id ||
                              row
                                ?.college_id ||
                              'college';

                            const branchName =
                              row
                                ?.branch
                                ?.name ||
                              row
                                ?.branch_name ||
                              'branch';

                            return (
                              <CollegeCard
                                key={
                                  `${selectedExamId}-${collegeId}-${branchName}-${index}`
                                }
                                row={
                                  row
                                }
                                mode="locked"
                              />
                            );
                          }
                        )}

                      </div>

                    </div>
                  );
                }
              )}

            </>
          )}

        {/* =====================================================
            PREMIUM USER
        ===================================================== */}

        {!resultsLoading &&
          isPremium &&
          [
            'dream',
            'target',
            'safe',
            'backup',
          ].map(
            (bucket) => {

              const group =
                rows.filter(
                  (row) =>
                    row?.bucket ===
                    bucket
                );

              if (
                !group.length
              ) {
                return null;
              }

              return (
                <div
                  className="result-group"
                  key={
                    `premium-${bucket}`
                  }
                >

                  <div className="group-label">

                    <span
                      className="dot"
                      style={{
                        background:
                          bucketMeta[
                            bucket
                          ].color,
                      }}
                    />

                    <h3>

                      {bucket
                        .charAt(0)
                        .toUpperCase() +
                        bucket
                          .slice(1)}

                    </h3>

                    <span className="count">

                      {group.length}{' '}
                      options Â·{' '}

                      {
                        bucketMeta[
                          bucket
                        ]
                          .description
                      }

                    </span>

                  </div>

                  <div className="college-grid">

                    {group.map(
                      (
                        row,
                        index
                      ) => {

                        const collegeId =
                          row
                            ?.collegeId ||
                          row
                            ?.college
                            ?.id ||
                          row
                            ?.college_id ||
                          'college';

                        const branchName =
                          row
                            ?.branch
                            ?.name ||
                          row
                            ?.branch_name ||
                          'branch';

                        return (
                          <CollegeCard
                            key={
                              `${selectedExamId}-${collegeId}-${branchName}-${index}`
                            }
                            row={
                              row
                            }
                            mode="premium"
                          />
                        );
                      }
                    )}

                  </div>

                </div>
              );
            }
          )}

      </div>
    </>
  );
}

/*
|--------------------------------------------------------------------------
| PREMIUM RECOMMENDATION PREVIEW
|--------------------------------------------------------------------------
*/

function PremiumRecommendationPreview({
  row,
  onUnlock,
}) {
  const college = row?.college || {};
  const branch = row?.branch || {};
  const premium = row?.premium || {};

  const category =
    premium?.category || null;

  const strongReasons =
    Array.isArray(
      premium?.reasons?.strong
    )
      ? premium.reasons.strong
      : [];

  const weakReasons =
    Array.isArray(
      premium?.reasons?.weak
    )
      ? premium.reasons.weak
      : [];

  const lockedRows = [
    ['Admission Fit', '50%'],
    ['Branch Preference', '15%'],
    ['College Quality', '15%'],
    ['Student Reviews', '10%'],
    ['Budget', '7%'],
    ['Location', '3%'],
  ];

  return (
    <section
      style={{
        marginTop: 24,
        marginBottom: 28,
      }}
    >
      <div
        style={{
          marginBottom: 8,
          color: '#3558d4',
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: '0.08em',
        }}
      >
        PREMIUM RECOMMENDATION PREVIEW
      </div>

      <div
        style={{
          overflow: 'hidden',
          background: '#ffffff',
          border: '1px solid #e0e6f2',
          borderRadius: 16,
          boxShadow:
            '0 12px 32px rgba(15,36,84,0.08)',
        }}
      >

        {/* HEADER */}

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 20,
            padding: 20,
            borderBottom:
              '1px solid #e8edf5',
            background:
              'linear-gradient(135deg,#ffffff,#f7f9ff)',
          }}
        >
          <div>
            <div
              style={{
                marginBottom: 5,
                color: '#d99b00',
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: '0.08em',
              }}
            >
              PREMIUM RECOMMENDATION
            </div>

            <h3
              style={{
                margin: '0 0 5px',
                color: '#102451',
                fontSize: 17,
              }}
            >
              {college.name}
            </h3>

            <div
              style={{
                color: '#7d879c',
                fontSize: 11,
              }}
            >
              {branch.name}
            </div>
          </div>

          <div
            style={{
              minWidth: 90,
              padding: '10px 12px',
              borderRadius: 10,
              background: '#edf2ff',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                color: '#8993a8',
                fontSize: 8,
                fontWeight: 800,
              }}
            >
              EXACT SCORE
            </div>

            <div
              style={{
                marginTop: 3,
                color: '#173273',
                fontSize: 11,
                fontWeight: 800,
              }}
            >
              LOCKED
            </div>
          </div>
        </div>

        {/* CATEGORY */}

        {category?.label && (
          <div
            style={{
              display: 'inline-flex',
              margin: '14px 20px 0',
              padding: '6px 10px',
              border: '1px solid #dfe6f5',
              borderRadius: 999,
              background: '#f7f9ff',
              color: '#173273',
              fontSize: 10.5,
              fontWeight: 800,
            }}
          >
            {category.label}
          </div>
        )}

        {/* REASONS */}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(2,minmax(0,1fr))',
            gap: 12,
            padding: 20,
          }}
        >
          <div
            style={{
              padding: 14,
              border: '1px solid #e3e8f2',
              borderRadius: 12,
              background: '#fafbfe',
            }}
          >
            <div
              style={{
                marginBottom: 8,
                color: '#142858',
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              Why we recommend this
            </div>

            {strongReasons.length > 0 ? (
              strongReasons
                .slice(0, 2)
                .map((reason, index) => (
                  <div
                    key={index}
                    style={{
                      margin: '6px 0',
                      color: '#167449',
                      fontSize: 10.5,
                      lineHeight: 1.45,
                    }}
                  >
                    ✓ {reason}
                  </div>
                ))
            ) : (
              <div
                style={{
                  color: '#7d879c',
                  fontSize: 10.5,
                  lineHeight: 1.45,
                }}
              >
                Personalized recommendation
                reasons are available in Premium.
              </div>
            )}
          </div>

          <div
            style={{
              padding: 14,
              border: '1px solid #e3e8f2',
              borderRadius: 12,
              background: '#fafbfe',
            }}
          >
            <div
              style={{
                marginBottom: 8,
                color: '#142858',
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              What affects the score
            </div>

            {weakReasons.length > 0 ? (
              weakReasons
                .slice(0, 2)
                .map((reason, index) => (
                  <div
                    key={index}
                    style={{
                      margin: '6px 0',
                      color: '#816829',
                      fontSize: 10.5,
                      lineHeight: 1.45,
                    }}
                  >
                    - {reason}
                  </div>
                ))
            ) : (
              <>
                <div
                  style={{
                    margin: '6px 0',
                    color: '#816829',
                    fontSize: 10.5,
                  }}
                >
                  - College quality data pending.
                </div>

                <div
                  style={{
                    margin: '6px 0',
                    color: '#816829',
                    fontSize: 10.5,
                  }}
                >
                  - Review data pending.
                </div>
              </>
            )}
          </div>
        </div>

        {/* SCORE */}

        <div
          style={{
            margin: '0 20px 18px',
            padding: 14,
            border: '1px solid #e3e8f2',
            borderRadius: 12,
            background: '#fafbfe',
          }}
        >
          <div
            style={{
              marginBottom: 7,
              color: '#142858',
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            Premium Score Breakdown
          </div>

          {lockedRows.map(
            ([label, weight], index) => (
              <div
                key={label}
                style={{
                  display: 'flex',
                  justifyContent:
                    'space-between',
                  alignItems: 'center',
                  gap: 12,
                  padding: '8px 2px',
                  borderBottom:
                    index ===
                    lockedRows.length - 1
                      ? 'none'
                      : '1px solid #e8edf5',
                }}
              >
                <div
                  style={{
                    color: '#56627a',
                    fontSize: 10.5,
                  }}
                >
                  {label}

                  <span
                    style={{
                      color: '#8a94a9',
                      fontSize: 9,
                    }}
                  >
                    {' '}· {weight}
                  </span>
                </div>

                <div
                  style={{
                    padding: '4px 8px',
                    borderRadius: 999,
                    background: '#edf2ff',
                    color: '#173273',
                    fontSize: 9,
                    fontWeight: 800,
                  }}
                >
                  LOCKED
                </div>
              </div>
            )
          )}
        </div>

        {/* FINAL LOCK */}

        <div
          style={{
            margin: '0 20px 20px',
            padding: 22,
            border: '1px solid #dfe6f5',
            borderRadius: 12,
            background:
              'linear-gradient(135deg,#fafcff,#f2f6ff)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              display: 'inline-block',
              marginBottom: 8,
              padding: '5px 9px',
              borderRadius: 999,
              background: '#eaf0ff',
              color: '#173273',
              fontSize: 9,
              fontWeight: 800,
            }}
          >
            LOCKED
          </div>

          <div
            style={{
              color: '#142858',
              fontSize: 13,
              fontWeight: 800,
            }}
          >
            Full Premium Analysis
          </div>

          <div
            style={{
              maxWidth: 520,
              margin: '6px auto 14px',
              color: '#7c879b',
              fontSize: 10.5,
              lineHeight: 1.5,
            }}
          >
            Unlock exact scores,
            personalized reasoning,
            branch alternatives,
            college quality,
            reviews, budget analysis
            and location fit.
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={onUnlock}
          >
            Unlock Full Analysis
          </button>
        </div>

      </div>
    </section>
  );
}

/*
|--------------------------------------------------------------------------
| PREMIUM LOCKED ROW
|--------------------------------------------------------------------------
*/

function PremiumLockedRow({
  label,
  weight,
}) {
  return (
    <div className="premium-preview-row">

      <span>

        {label}

        {weight && (
          <small>
            {' '}Â· {weight}
          </small>
        )}

      </span>

      <strong>
        LOCKED
      </strong>

    </div>
  );
}

/*
|--------------------------------------------------------------------------
| EXISTING BLUE PREMIUM SECTION
|--------------------------------------------------------------------------
|
| This is the large dark-blue block.
| Keep it intact.
|--------------------------------------------------------------------------
*/

function PremiumUnlock({
  count,
  onUnlock,
}) {
  return (
    <section className="premium-unlock">

      <div className="premium-unlock-icon">
        ðŸ”’
      </div>

      <div className="premium-unlock-label">
        PREMIUM
      </div>

      <h2>
        Unlock Full Personalized Analysis
      </h2>

      <p className="premium-unlock-lead">

        <strong>
          {count}
        </strong>{' '}

        more matching college
        options are visible below.

        {' '}

        Unlock Premium to see
        their exact scores and
        personalized reasoning.

      </p>

      <div className="premium-feature-grid">

        <PremiumFeature
          icon="ðŸ†"
          title="Top 10 Personalized Colleges"
          text="See your strongest options ranked specifically for your profile."
        />

        <PremiumFeature
          icon="ðŸ’Ž"
          title="Exact Match Score"
          text="Unlock the complete 0â€“100 personalized match score."
        />

        <PremiumFeature
          icon="ðŸŽ¯"
          title="Full Score Breakdown"
          text="Admission, branch, quality, reviews, budget and location."
        />

        <PremiumFeature
          icon="ðŸ§ "
          title="Why Recommended"
          text="Understand exactly why each college is strong or weak for you."
        />

        <PremiumFeature
          icon="ðŸŽ“"
          title="Branch Alternatives"
          text="Discover other suitable branches in your best colleges."
        />

        <PremiumFeature
          icon="âš–ï¸"
          title="College Comparison"
          text="Compare your strongest college choices side by side."
        />

      </div>

      <button
        type="button"
        className="btn btn-orange premium-unlock-button"
        onClick={
          onUnlock
        }
      >
        ðŸ”“ Unlock Premium
      </button>

    </section>
  );
}

/*
|--------------------------------------------------------------------------
| PREMIUM FEATURE
|--------------------------------------------------------------------------
*/

function PremiumFeature({
  icon,
  title,
  text,
}) {
  return (
    <div>

      <div>
        {icon}
      </div>

      <strong>
        {title}
      </strong>

      <span>
        {text}
      </span>

    </div>
  );
}

/*
|--------------------------------------------------------------------------
| SUMMARY PILL
|--------------------------------------------------------------------------
*/

function Pill({
  n,
  label,
  c,
}) {
  return (
    <div className="sum-pill">

      <b
        style={{
          color: c,
        }}
      >
        {n}
      </b>

      <span>
        {label}
      </span>

    </div>
  );
}
