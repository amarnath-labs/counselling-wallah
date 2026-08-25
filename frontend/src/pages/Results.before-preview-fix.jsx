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
          ` · Category: ` +
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
                          options ·{' '}

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
                      options ·{' '}

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
  const college =
    row?.college || {};

  const branch =
    row?.branch || {};

  const premium =
    row?.premium || {};

  const category =
    premium?.category ||
    null;

  const strongReasons =
    Array.isArray(
      premium
        ?.reasons
        ?.strong
    )
      ? premium
          .reasons
          .strong
      : [];

  const weakReasons =
    Array.isArray(
      premium
        ?.reasons
        ?.weak
    )
      ? premium
          .reasons
          .weak
      : [];

  return (
    <section className="premium-preview-section">

      <div className="premium-preview-kicker">
        PREMIUM RECOMMENDATION PREVIEW
      </div>

      <div className="premium-preview-card">

        {/* TOP */}

        <div className="premium-preview-top">

          <div>

            <div className="premium-preview-label">
              PREMIUM RECOMMENDATION
            </div>

            <h3>
              {college.name}
            </h3>

            <p>
              {branch.name}
            </p>

          </div>

          <div className="premium-preview-score-lock">

            <span>
              EXACT SCORE
            </span>

            <strong>
              LOCKED
            </strong>

          </div>

        </div>

        {/* CATEGORY */}

        {category?.label && (
          <div className="premium-preview-match">
            {category.label}
          </div>
        )}

        {/* WHY + SCORE FACTORS */}

        <div className="premium-preview-content">

          <div className="premium-preview-reason">

            <h4>
              Why we recommend this
            </h4>

            {strongReasons.length >
              0 ? (

              strongReasons
                .slice(
                  0,
                  2
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
                      className="premium-positive"
                    >
                      ✓ {reason}
                    </p>
                  )
                )

            ) : (

              <p className="premium-muted">
                Personalized
                recommendation
                reasons are
                available in
                Premium.
              </p>

            )}

          </div>

          <div className="premium-preview-reason">

            <h4>
              What affects the score
            </h4>

            {weakReasons.length >
              0 ? (

              weakReasons
                .slice(
                  0,
                  2
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
                      className="premium-warning"
                    >
                      - {reason}
                    </p>
                  )
                )

            ) : (
              <>

                <p className="premium-warning">
                  - College quality
                  data may require
                  verified data.
                </p>

                <p className="premium-warning">
                  - Review data may
                  require verified
                  data.
                </p>

              </>
            )}

          </div>

        </div>

        {/* ===============================================
            PREMIUM SCORE BREAKDOWN
        =============================================== */}

        <div className="premium-preview-breakdown">

          <h4>
            Premium Score
          </h4>

          <PremiumLockedRow
            label="Admission Fit"
            weight="50%"
          />

          <PremiumLockedRow
            label="Branch Preference"
            weight="15%"
          />

          <PremiumLockedRow
            label="College Quality"
            weight="15%"
          />

          <PremiumLockedRow
            label="Student Reviews"
            weight="10%"
          />

          <PremiumLockedRow
            label="Budget"
            weight="7%"
          />

          <PremiumLockedRow
            label="Location"
            weight="3%"
          />

        </div>

        {/* ===============================================
            INNER PREMIUM LOCK
        =============================================== */}

        <div className="premium-preview-inner-lock">

          <div className="premium-preview-lock-icon">
            🔒
          </div>

          <strong>
            Full Premium Analysis
          </strong>

          <span>

            Unlock exact scores,
            personalized reasoning,
            branch alternatives,
            college quality,
            review analysis,
            budget analysis and
            location fit.

          </span>

          <button
            type="button"
            className="btn btn-primary"
            onClick={
              onUnlock
            }
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
            {' '}· {weight}
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
        🔒
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
          icon="🏆"
          title="Top 10 Personalized Colleges"
          text="See your strongest options ranked specifically for your profile."
        />

        <PremiumFeature
          icon="💎"
          title="Exact Match Score"
          text="Unlock the complete 0–100 personalized match score."
        />

        <PremiumFeature
          icon="🎯"
          title="Full Score Breakdown"
          text="Admission, branch, quality, reviews, budget and location."
        />

        <PremiumFeature
          icon="🧠"
          title="Why Recommended"
          text="Understand exactly why each college is strong or weak for you."
        />

        <PremiumFeature
          icon="🎓"
          title="Branch Alternatives"
          text="Discover other suitable branches in your best colleges."
        />

        <PremiumFeature
          icon="⚖️"
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
        🔓 Unlock Premium
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