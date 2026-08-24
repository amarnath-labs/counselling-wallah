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
import PremiumRecommendation from '../components/PremiumRecommendation';

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

import {
  addPremiumScores,
  sortByPremiumScore,
} from '../services/premiumRecommendationService';


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
  | ONLY USE RESULTS BELONGING TO CURRENT EXAM
  |--------------------------------------------------------------------------
  */

  const safeResults =
    resultsExamId === selectedExamId &&
    Array.isArray(results)
      ? results
      : [];


  /*
  |--------------------------------------------------------------------------
  | EXISTING RECOMMENDATION LOGIC
  |--------------------------------------------------------------------------
  |
  | IMPORTANT:
  | This remains the source for:
  |
  | Dream / Target / Safe / Backup
  |
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
  | PREMIUM RECOMMENDATION LAYER
  |--------------------------------------------------------------------------
  |
  | IMPORTANT:
  |
  | `rows` is NOT replaced.
  |
  | Existing admission buckets continue
  | using `rows`.
  |
  | Premium creates a separate enriched
  | copy called `premiumRows`.
  |
  */

  const premiumRows =
    useMemo(() => {
      const enriched =
        addPremiumScores(
          rows,
          profile
        );

      return sortByPremiumScore(
        enriched
      );
    }, [
      rows,
      profile,
    ]);


  /*
  |--------------------------------------------------------------------------
  | PREMIUM DEBUG
  |--------------------------------------------------------------------------
  */

  console.log(
    '[PREMIUM] Rows:',
    premiumRows.length
  );

  console.log(
    '[PREMIUM] First row:',
    premiumRows[0]
  );


  /*
  |--------------------------------------------------------------------------
  | BUCKET COUNTS
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
    useMemo(() => {
      return [
        ...new Set(
          safeResults
            .map(
              (row) =>
                row?.college?.state
            )
            .filter(Boolean)
        ),
      ].sort();
    }, [
      safeResults,
    ]);


  /*
  |--------------------------------------------------------------------------
  | EXAM NAME
  |--------------------------------------------------------------------------
  */

  const examName =
    getExamName(
      selectedExamId
    );


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

        {/* ============================================================
            LOADING / ERROR
        ============================================================ */}

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


        {resultsError &&
          !resultsLoading && (
            <div className="source-note">
              {resultsError}
            </div>
          )}


        {/* ============================================================
            SUMMARY
        ============================================================ */}

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


        {/* ============================================================
            FILTERS
        ============================================================ */}

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


        {/* ============================================================
            EMPTY STATE
        ============================================================ */}

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
                  nav('/profile')
                }
              >
                Adjust Preferences
              </button>

            </div>
          )}


        {/* ============================================================
            PREMIUM RECOMMENDATION
            ============================================================

            ONLY ONE PREMIUM PREVIEW IS SHOWN.

            Existing Dream / Target / Safe / Backup
            results remain below this section.
        ============================================================ */}

        {!resultsLoading &&
          premiumRows.length > 0 && (
            <section
              style={{
                marginTop: 28,
                marginBottom: 32,
                padding: 20,
                borderRadius: 18,
                border:
                  '1px solid #D9E2FF',
                background:
                  'linear-gradient(135deg,#F7F9FF,#FFFFFF)',
                boxShadow:
                  '0 8px 25px rgba(30,50,100,0.06)',
              }}
            >

              {/* PREMIUM HEADER */}

              <div
                style={{
                  marginBottom: 18,
                }}
              >

                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing:
                      '.08em',
                    color:
                      '#68738A',
                  }}
                >
                  COUNSELLING WALLAH PRO
                </div>


                <h2
                  style={{
                    margin:
                      '5px 0',
                    color:
                      '#172554',
                  }}
                >
                  🔒 Your Personalized
                  Recommendation
                </h2>


                <p
                  style={{
                    margin: 0,
                    color:
                      '#68738A',
                    fontSize: 13,
                    lineHeight: 1.5,
                  }}
                >
                  One personalized college
                  recommendation based on
                  admission fit, branch,
                  college quality, student
                  reviews, budget and
                  location.
                </p>

              </div>


              {/* PREMIUM CARD */}

              <div
                style={{
                  display:
                    'grid',
                  gap: 16,
                }}
              >

                {premiumRows
                  .slice(0, 1)
                  .map(
                    (
                      row,
                      index
                    ) => {

                      const collegeId =
                        row?.collegeId ||
                        row?.college_id ||
                        row?.college?.id ||
                        row?.college?.name ||
                        'college';


                      const branchName =
                        row?.branch?.name ||
                        row?.branch_name ||
                        row?.branchName ||
                        row?.program ||
                        'branch';


                      return (
                        <PremiumRecommendation
                          key={
                            `premium-${selectedExamId}-${collegeId}-${branchName}-${index}`
                          }
                          row={row}
                          locked={true}
                        />
                      );
                    }
                  )}

              </div>


              {/* PREMIUM CTA */}

              <div
                style={{
                  marginTop: 20,
                  padding: 15,
                  borderRadius: 12,
                  background:
                    '#101A3A',
                  color:
                    '#FFFFFF',
                  textAlign:
                    'center',
                }}
              >

                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 800,
                  }}
                >
                  🔒 Unlock Full
                  Premium Analysis
                </div>


                <div
                  style={{
                    marginTop: 5,
                    fontSize: 12,
                    lineHeight: 1.5,
                    opacity: 0.85,
                  }}
                >
                  Get Top 10 personalized
                  suggestions, detailed
                  reasons, branch alternatives,
                  college quality analysis,
                  review analysis, budget/ROI
                  analysis and college
                  comparisons.
                </div>


                <button
                  type="button"
                  className="btn btn-primary"
                  style={{
                    marginTop: 12,
                  }}
                  onClick={() =>
                    nav('/pricing')
                  }
                >
                  View Premium Plans →
                </button>

              </div>

            </section>
          )}


        {/* ============================================================
            EXISTING RESULT GROUPS
            ============================================================

            DO NOT CHANGE THIS LOGIC.

            Dream / Target / Safe / Backup
            continue using the existing `rows`.
        ============================================================ */}

        {!resultsLoading &&
          rows.length > 0 &&
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


              const descriptions = {
                dream:
                  'High-value, competitive options.',

                target:
                  'Realistic and strong options.',

                safe:
                  'Higher-probability options.',

                backup:
                  'Extra options to keep in hand.',
              };


              const colors = {
                dream:
                  'var(--red)',

                target:
                  'var(--amber)',

                safe:
                  'var(--green)',

                backup:
                  'var(--blue)',
              };


              return (
                <div
                  className="result-group"
                  key={bucket}
                >

                  <div
                    className="group-label"
                  >

                    <span
                      className="dot"
                      style={{
                        background:
                          colors[
                            bucket
                          ],
                      }}
                    />


                    <h3>
                      {bucket
                        .charAt(0)
                        .toUpperCase() +
                        bucket.slice(
                          1
                        )}
                    </h3>


                    <span
                      className="count"
                    >
                      {group.length}{' '}
                      options ·{' '}
                      {
                        descriptions[
                          bucket
                        ]
                      }
                    </span>

                  </div>


                  <div
                    className="college-grid"
                  >

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
                            key={
                              `${selectedExamId}-${collegeId}-${branchName}-${index}`
                            }
                            row={row}
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