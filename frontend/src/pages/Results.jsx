import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Link,
  useNavigate,
} from 'react-router-dom';

import PageHero from '../components/PageHero';
import CollegeCard from '../components/CollegeCard';
import RecommendationSlide from '../components/RecommendationSlide';
import '../styles/recommendationSlide.css';

import {
  useAppState,
} from '../hooks/useAppState';

import {
  useAuth,
} from '../hooks/AuthContext';

import {
  getMyPaymentAccess,
  normalizePaymentAccess,
} from '../services/paymentService';

import {
  BRANCH_LIST,
  filterAndSortResults,
  summarizeBuckets,
} from '../services/recommendationService';

import {
  fetchCWRecommendations,
} from '../services/cwRecRecommendationService';

import {
  getExamName,
} from '../services/examService';

const EMPTY_ACCESS = {
  planId: null,
  hasPaidPlan: false,
  collegePredictor: false,
  recommendation: false,
  callSupport: false,
};

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

  const {
    user,
    authLoading,
  } = useAuth();

  const nav =
    useNavigate();

  const [
    activeView,
    setActiveView,
  ] = useState('search');

  const [
    filters,
    setFilters,
  ] = useState({
    branch: '',
    state: '',
    type: '',
    sort: 'match',
  });

  const [
    paymentAccess,
    setPaymentAccess,
  ] = useState(
    EMPTY_ACCESS
  );

  const [
    accessLoading,
    setAccessLoading,
  ] = useState(true);

  /*
  |--------------------------------------------------------------------------
  | PAYMENT ENTITLEMENT
  |--------------------------------------------------------------------------
  |
  | Important:
  | This affects only the separate Recommendation slide.
  | Normal College Search remains unchanged.
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      let cancelled = false;

      async function loadAccess() {
        if (authLoading) {
          return;
        }

        if (!user) {
          if (!cancelled) {
            setPaymentAccess(
              EMPTY_ACCESS
            );
            setAccessLoading(false);
          }
          return;
        }

        try {
          setAccessLoading(true);

          const response =
            await getMyPaymentAccess();

          if (cancelled) {
            return;
          }

          setPaymentAccess(
            normalizePaymentAccess(
              response
            )
          );
        } catch (error) {
          console.error(
            '[RESULTS ACCESS ERROR]',
            error
          );

          if (!cancelled) {
            setPaymentAccess(
              EMPTY_ACCESS
            );
          }
        } finally {
          if (!cancelled) {
            setAccessLoading(false);
          }
        }
      }

      function handleAccessUpdated(
        event
      ) {
        if (event?.detail) {
          setPaymentAccess(
            event.detail
          );
          setAccessLoading(false);
          return;
        }

        loadAccess();
      }

      loadAccess();

      window.addEventListener(
        'cw-payment-access-updated',
        handleAccessUpdated
      );

      return () => {
        cancelled = true;

        window.removeEventListener(
          'cw-payment-access-updated',
          handleAccessUpdated
        );
      };
    },
    [
      authLoading,
      user,
    ]
  );

  const [
    recommendationRows,
    setRecommendationRows,
  ] = useState([]);

  const [
    recommendationLoading,
    setRecommendationLoading,
  ] = useState(false);

  const [
    recommendationError,
    setRecommendationError,
  ] = useState(null);

  const [
    recommendationMeta,
    setRecommendationMeta,
  ] = useState(null);

  const hasRecommendationAccess =
    Boolean(
      paymentAccess
        ?.recommendation
    );

  /*
  |--------------------------------------------------------------------------
  | EXISTING RESULT LOGIC - UNCHANGED
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      let cancelled = false;

      async function loadCWRecommendations() {
        if (
          activeView !== 'recommendation' ||
          accessLoading ||
          !hasRecommendationAccess ||
          !profile?.rank
        ) {
          return;
        }

        try {
          setRecommendationLoading(true);
          setRecommendationError(null);

          console.log(
            '[CW-REC FRONTEND LOAD]'
          );

          const response =
            await fetchCWRecommendations(
              {
                ...profile,

                examId:
                  selectedExamId ||
                  profile?.examId,
              },
              {
                limit: 100,
                locationMode: 'NONE',
              }
            );

          if (cancelled) {
            return;
          }

          setRecommendationRows(
            Array.isArray(
              response?.data
            )
              ? response.data
              : []
          );

          setRecommendationMeta(
            response?.meta || null
          );
        } catch (error) {
          console.error(
            '[CW-REC FRONTEND ERROR]',
            error
          );

          if (!cancelled) {
            setRecommendationRows([]);
            setRecommendationMeta(null);

            setRecommendationError(
              error?.message ||
              'Unable to load personalized recommendations.'
            );
          }
        } finally {
          if (!cancelled) {
            setRecommendationLoading(false);
          }
        }
      }

      loadCWRecommendations();

      return () => {
        cancelled = true;
      };
    },
    [
      activeView,
      accessLoading,
      hasRecommendationAccess,
      profile,
      selectedExamId,
    ]
  );

  const safeResults =
    resultsExamId ===
      selectedExamId &&
    Array.isArray(results)
      ? results
      : [];

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

  const counts =
    summarizeBuckets(
      rows
    );

  const states =
    useMemo(
      () => [
        ...new Set(
          safeResults
            .map(
              (row) =>
                row?.college
                  ?.state
            )
            .filter(Boolean)
        ),
      ].sort(),
      [safeResults]
    );

  const examName =
    getExamName(
      selectedExamId
    );

  const bestRecommendationPreview =
    rows.length > 0
      ? rows[0]
      : null;

  const bucketMeta = {
    dream: {
      color: 'var(--red)',
      description:
        'High-value, competitive options.',
    },
    target: {
      color: 'var(--amber)',
      description:
        'Realistic and strong options.',
    },
    safe: {
      color: 'var(--green)',
      description:
        'Higher-probability options.',
    },
    backup: {
      color: 'var(--blue)',
      description:
        'Extra options to keep in hand.',
    },
  };

  function openRecommendationPurchase() {
    if (!user) {
      nav(
        '/login?redirect=/results'
      );
      return;
    }

    nav('/pricing');
  }

  function renderNormalGroups() {
    return [
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

        if (!group.length) {
          return null;
        }

        return (
          <div
            className="result-group"
            key={`normal-${bucket}`}
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
                  bucket.slice(1)}
              </h3>

              <span className="count">
                {group.length}{' '}
                options ·{' '}
                {
                  bucketMeta[
                    bucket
                  ].description
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
                    row?.collegeId ||
                    row?.college?.id ||
                    row?.college_id ||
                    'college';

                  const branchName =
                    row?.branch?.name ||
                    row?.branch_name ||
                    'branch';

                  return (
                    <CollegeCard
                      key={`${selectedExamId}-${collegeId}-${branchName}-${index}`}
                      row={row}
                      mode="locked"
                    />
                  );
                }
              )}
            </div>
          </div>
        );
      }
    );
  }

  function renderRecommendationGroups() {
    return [
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

        if (!group.length) {
          return null;
        }

        return (
          <div
            className="result-group"
            key={`recommendation-${bucket}`}
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
                  bucket.slice(1)}
              </h3>

              <span className="count">
                {group.length}{' '}
                personalized options
              </span>
            </div>

            <div className="college-grid">
              {group.map(
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
                    <CollegeCard
                      key={`premium-${selectedExamId}-${collegeId}-${branchName}-${index}`}
                      row={row}
                      mode="premium"
                    />
                  );
                }
              )}
            </div>
          </div>
        );
      }
    );
  }

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
        {catalogLoading && (
          <div className="source-note">
            Loading catalog...
          </div>
        )}

        {resultsLoading && (
          <div className="source-note">
            Finding colleges for{' '}
            <b>{examName}</b>...
          </div>
        )}

        {resultsError &&
          !resultsLoading && (
            <div className="source-note">
              {resultsError}
            </div>
          )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              '220px minmax(0, 1fr)',
            gap: 22,
            alignItems: 'start',
          }}
        >
          {/* ==================================================
              LEFT VERTICAL TABS
          ================================================== */}

          <aside
            style={{
              position: 'sticky',
              top: 86,
              padding: 10,
              border:
                '1px solid #E5EAF4',
              borderRadius: 16,
              background: '#FFFFFF',
              boxShadow:
                '0 12px 32px -28px rgba(15,36,84,.45)',
            }}
          >
            <button
              type="button"
              onClick={() =>
                setActiveView(
                  'search'
                )
              }
              style={
                tabButtonStyle(
                  activeView ===
                    'search',
                  'blue'
                )
              }
            >
              <span
                style={tabIconStyle}
              >
                SEARCH
              </span>

              <span>
                <strong
                  style={{
                    display: 'block',
                    marginBottom: 4,
                  }}
                >
                  College Search
                </strong>

                <small>
                  Rank based results
                </small>
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                setActiveView(
                  'recommendation'
                )
              }
              style={
                tabButtonStyle(
                  activeView ===
                    'recommendation',
                  'purple'
                )
              }
            >
              <span
                style={tabIconStyle}
              >
                AI
              </span>

              <span>
                <strong
                  style={{
                    display: 'block',
                    marginBottom: 4,
                  }}
                >
                  Personalized Recommendation
                </strong>

                <small>
                  AI based recommendations
                </small>

                <span
                  style={{
                    display: 'inline-block',
                    marginTop: 7,
                    padding:
                      '2px 7px',
                    borderRadius: 999,
                    background:
                      '#F1E8FF',
                    color: '#6D28D9',
                    fontSize: 10,
                    fontWeight: 800,
                  }}
                >
                  PREMIUM
                </span>
              </span>
            </button>
          </aside>

          {/* ==================================================
              SLIDE CONTENT
          ================================================== */}

          <main
            style={{
              minWidth: 0,
              overflow: 'hidden',
            }}
          >
            <div
              key={activeView}
              style={{
                animation:
                  'cwResultSlideIn .24s ease both',
              }}
            >
              {activeView ===
                'search' && (
                <section>
                  <div
                    style={{
                      marginBottom: 18,
                    }}
                  >
                    <h2
                      style={{
                        marginBottom: 5,
                      }}
                    >
                      College Search Results
                    </h2>

                    <p
                      style={{
                        margin: 0,
                        opacity: 0.7,
                      }}
                    >
                      Rank-based college options using your existing search logic.
                    </p>
                  </div>

                  {/* EXISTING SUMMARY */}

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

                  {/* EXISTING FILTERS */}

                  <div className="filter-bar">
                    <select
                      value={
                        filters.branch
                      }
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          branch:
                            e.target.value,
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

                    <select
                      value={
                        filters.state
                      }
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          state:
                            e.target.value,
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

                    <select
                      value={
                        filters.type
                      }
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          type:
                            e.target.value,
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

                    <select
                      value={
                        filters.sort
                      }
                      onChange={(e) =>
                        setFilters({
                          ...filters,
                          sort:
                            e.target.value,
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

                  {!resultsLoading &&
                    !rows.length && (
                      <div className="empty-state">
                        <h3>
                          No colleges found
                        </h3>
                        <p>
                          No matching{' '}
                          {examName}{' '}
                          data is available for the selected profile.
                        </p>
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() =>
                            nav('/profile')
                          }
                        >
                          Adjust Preferences
                        </button>
                      </div>
                    )}

                  {!resultsLoading &&
                    rows.length > 0 &&
                    renderNormalGroups()}
                </section>
              )}

              {activeView ===
                'recommendation' && (
                <section>
                  {accessLoading ? (
                    <div className="source-note">
                      Checking recommendation access...
                    </div>
                  ) : (
                    <>
                      {recommendationLoading &&
                        hasRecommendationAccess && (
                        <div className="source-note">
                          Loading personalized recommendations...
                        </div>
                      )}

                      {recommendationError &&
                        hasRecommendationAccess && (
                        <div className="source-note">
                          {recommendationError}
                        </div>
                      )}

                      <RecommendationSlide
                      rows={recommendationRows}
                      hasRecommendationAccess={
                        hasRecommendationAccess
                      }
                      isLoggedIn={Boolean(user)}
                      onUnlock={() =>
                        nav('/pricing')
                      }
                      onLogin={() =>
                        nav(
                          '/login?redirect=/results'
                        )
                      }
                    />
                    </>
                  )}
                </section>
              )}
            </div>
          </main>
        </div>

        <style>{`
          @keyframes cwResultSlideIn {
            from {
              opacity: 0;
              transform: translateX(18px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          @media (max-width: 900px) {
            .container.section > div[style*="220px"] {
              grid-template-columns: 1fr !important;
            }

            .container.section aside {
              position: static !important;
              display: grid !important;
              grid-template-columns: 1fr 1fr !important;
              gap: 8px !important;
            }
          }
        `}</style>
      </div>
    </>
  );
}

function tabButtonStyle(
  active,
  tone
) {
  const purple =
    tone === 'purple';

  return {
    width: '100%',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 8,
    padding: '14px 12px',
    border: active
      ? `1px solid ${
          purple
            ? '#8B5CF6'
            : '#3974FF'
        }`
      : '1px solid transparent',
    borderRadius: 12,
    background: active
      ? purple
        ? 'linear-gradient(135deg,#F7F1FF,#EFE4FF)'
        : 'linear-gradient(135deg,#F2F7FF,#EAF1FF)'
      : '#FFFFFF',
    color: active
      ? purple
        ? '#5B21B6'
        : '#163A8A'
      : '#28364F',
    textAlign: 'left',
    cursor: 'pointer',
  };
}

const tabIconStyle = {
  flex: '0 0 auto',
  minWidth: 46,
  height: 34,
  display: 'grid',
  placeItems: 'center',
  borderRadius: 9,
  background: '#EDF2FF',
  color: '#2853E0',
  fontSize: 9,
  fontWeight: 900,
  letterSpacing: '0.06em',
};

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
        marginBottom: 26,
      }}
    >
      <div
        style={{
          marginBottom: 8,
          color: '#2853E0',
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: '0.09em',
        }}
      >
        PREMIUM RECOMMENDATION PREVIEW
      </div>

      <div
        style={{
          overflow: 'hidden',
          background: '#FFFFFF',
          border: '1px solid #E4E9F5',
          borderRadius: 16,
          boxShadow:
            '0 16px 40px -32px rgba(15,36,84,0.45)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 20,
            padding: 18,
            borderBottom:
              '1px solid #E4E9F5',
            background:
              'linear-gradient(135deg,#FFFFFF,#F7F9FF)',
          }}
        >
          <div>
            <div
              style={{
                marginBottom: 5,
                color: '#E8A400',
                fontSize: 9.5,
                fontWeight: 800,
                letterSpacing: '0.08em',
              }}
            >
              PREMIUM RECOMMENDATION
            </div>

            <h3
              style={{
                margin: '0 0 4px',
                color: '#0F2454',
                fontSize: 16,
              }}
            >
              {college.name}
            </h3>

            <p
              style={{
                margin: 0,
                color: '#8A93A8',
                fontSize: 11,
              }}
            >
              {branch.name}
            </p>
          </div>

          <div
            style={{
              flex: '0 0 auto',
              minWidth: 90,
              padding: '10px 12px',
              borderRadius: 11,
              textAlign: 'center',
              background: '#EAF0FF',
            }}
          >
            <span
              style={{
                display: 'block',
                marginBottom: 3,
                color: '#8A93A8',
                fontSize: 8,
                fontWeight: 800,
              }}
            >
              EXACT SCORE
            </span>

            <strong
              style={{
                color: '#0F2454',
                fontSize: 11,
                fontWeight: 800,
              }}
            >
              LOCKED
            </strong>
          </div>
        </div>

        {category?.label && (
          <div
            style={{
              display: 'inline-flex',
              margin: '13px 18px 0',
              padding: '6px 10px',
              borderRadius: 999,
              border: '1px solid #DFE6F7',
              background: '#F8FAFF',
              color: '#0F2454',
              fontSize: 11,
              fontWeight: 800,
            }}
          >
            {category.label}
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(2,minmax(0,1fr))',
            gap: 16,
            padding: 18,
          }}
        >
          <div
            style={{
              padding: 13,
              borderRadius: 11,
              background: '#F6F8FE',
              border: '1px solid #E4E9F5',
            }}
          >
            <h4
              style={{
                margin: '0 0 8px',
                color: '#0F2454',
                fontSize: 12,
              }}
            >
              Why we recommend this
            </h4>

            {strongReasons.length > 0 ? (
              strongReasons
                .slice(0, 2)
                .map((reason, index) => (
                  <p
                    key={index}
                    style={{
                      margin: '5px 0',
                      color: '#137847',
                      fontSize: 10.5,
                      lineHeight: 1.45,
                    }}
                  >
                    âœ“ {reason}
                  </p>
                ))
            ) : (
              <p
                style={{
                  margin: 0,
                  color: '#8A93A8',
                  fontSize: 10.5,
                  lineHeight: 1.45,
                }}
              >
                Personalized recommendation
                reasons are available in Premium.
              </p>
            )}
          </div>

          <div
            style={{
              padding: 13,
              borderRadius: 11,
              background: '#F6F8FE',
              border: '1px solid #E4E9F5',
            }}
          >
            <h4
              style={{
                margin: '0 0 8px',
                color: '#0F2454',
                fontSize: 12,
              }}
            >
              What affects the score
            </h4>

            {weakReasons.length > 0 ? (
              weakReasons
                .slice(0, 2)
                .map((reason, index) => (
                  <p
                    key={index}
                    style={{
                      margin: '5px 0',
                      color: '#8B6500',
                      fontSize: 10.5,
                      lineHeight: 1.45,
                    }}
                  >
                    - {reason}
                  </p>
                ))
            ) : (
              <>
                <p
                  style={{
                    margin: '5px 0',
                    color: '#8B6500',
                    fontSize: 10.5,
                    lineHeight: 1.45,
                  }}
                >
                  - College quality data may
                  require verified data.
                </p>

                <p
                  style={{
                    margin: '5px 0',
                    color: '#8B6500',
                    fontSize: 10.5,
                    lineHeight: 1.45,
                  }}
                >
                  - Review data may require
                  verified data.
                </p>
              </>
            )}
          </div>
        </div>

        <div
          style={{
            margin: '0 18px 18px',
            padding: 14,
            borderRadius: 12,
            border: '1px solid #E4E9F5',
            background: '#FAFBFF',
          }}
        >
          <h4
            style={{
              margin: '0 0 7px',
              color: '#0F2454',
              fontSize: 12,
            }}
          >
            Premium Score Breakdown
          </h4>

          {lockedRows.map(
            ([label, weight], index) => (
              <div
                key={label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent:
                    'space-between',
                  gap: 15,
                  padding: '8px 2px',
                  borderBottom:
                    index ===
                    lockedRows.length - 1
                      ? 'none'
                      : '1px solid #E9EDF6',
                }}
              >
                <span
                  style={{
                    color: '#475069',
                    fontSize: 10.5,
                  }}
                >
                  {label}{' '}
                  <small
                    style={{
                      color: '#8A93A8',
                      fontSize: 9,
                    }}
                  >
                    · {weight}
                  </small>
                </span>

                <strong
                  style={{
                    flex: '0 0 auto',
                    padding: '4px 8px',
                    borderRadius: 999,
                    background: '#EEF3FF',
                    color: '#0F2454',
                    fontSize: 9,
                    fontWeight: 800,
                  }}
                >
                  LOCKED
                </strong>
              </div>
            )
          )}
        </div>

        <div
          style={{
            margin: '0 18px 18px',
            padding: 22,
            borderRadius: 13,
            border: '1px solid #E4E9F5',
            textAlign: 'center',
            background:
              'linear-gradient(135deg,#FBFCFF,#F4F7FF)',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 8,
              padding: '6px 10px',
              borderRadius: 999,
              background: '#EAF0FF',
              color: '#0F2454',
              fontSize: 9,
              fontWeight: 800,
            }}
          >
            LOCKED
          </div>

          <strong
            style={{
              display: 'block',
              marginBottom: 4,
              color: '#0F2454',
              fontSize: 12,
            }}
          >
            Full Premium Analysis
          </strong>

          <span
            style={{
              display: 'block',
              maxWidth: 520,
              margin: '0 auto 12px',
              color: '#8A93A8',
              fontSize: 10,
              lineHeight: 1.45,
            }}
          >
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

