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

        {/* SUMMARY */}

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

        {/* FILTERS */}

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

        {/* EMPTY */}

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

        {/* RESULT GROUPS */}

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

                  <div className="group-label">

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

                    <span className="count">
                      {group.length}{' '}
                      options ·{' '}
                      {
                        descriptions[
                          bucket
                        ]
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