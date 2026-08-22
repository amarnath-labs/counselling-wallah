import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import PageHero from '../components/PageHero';
import Button from '../components/Button';

import {
  useAppState,
} from '../hooks/useAppState';

import {
  getExamName,
} from '../services/examService';

const STATES = [
  'Andhra Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Other',
];

const BRANCHES = [
  'CSE',
  'IT',
  'ECE',
  'Electrical',
  'Mechanical',
  'Civil',
];

export default function Profile() {
  const {
    profile,
    setProfile,
    generateResults,
    selectedExamId,
    resultsLoading,
    resultsError,
  } = useAppState();

  const navigate =
    useNavigate();

  const [
    error,
    setError,
  ] = useState('');

  const p =
    profile || {};

  /*
  |--------------------------------------------------------------------------
  | PROFILE UPDATE
  |--------------------------------------------------------------------------
  */

  const set = (
    key,
    value
  ) => {
    setProfile({
      ...p,
      [key]: value,
    });
  };

  /*
  |--------------------------------------------------------------------------
  | BRANCH TOGGLE
  |--------------------------------------------------------------------------
  */

  const toggleBranch = (
    branch
  ) => {
    const currentBranches =
      Array.isArray(
        p.branches
      )
        ? p.branches
        : [];

    set(
      'branches',
      currentBranches.includes(
        branch
      )
        ? currentBranches.filter(
            (item) =>
              item !== branch
          )
        : [
            ...currentBranches,
            branch,
          ]
    );
  };

  /*
  |--------------------------------------------------------------------------
  | GENERATE RESULTS
  |--------------------------------------------------------------------------
  |
  | IMPORTANT:
  | This is the ONLY place in the frontend
  | where generateResults() is called.
  |--------------------------------------------------------------------------
  */

  const handleGenerate =
    async () => {

      setError('');

      /*
      |--------------------------------------------------------------------------
      | Validate rank
      |--------------------------------------------------------------------------
      */

      if (
        !Number.isInteger(
          Number(p.rank)
        ) ||
        Number(p.rank) <= 0
      ) {
        setError(
          'Please enter a valid rank.'
        );

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | Validate selected exam
      |--------------------------------------------------------------------------
      */

      if (
        !selectedExamId
      ) {
        setError(
          'Please select an exam first.'
        );

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | FORCE EXACT SELECTED EXAM
      |--------------------------------------------------------------------------
      */

      const nextProfile = {
        ...p,
        examId:
          selectedExamId,
      };

      console.log(
        '[PROFILE] Selected exam:',
        selectedExamId
      );

      console.log(
        '[PROFILE] Sending profile:',
        nextProfile
      );

      try {

        /*
        |--------------------------------------------------------------------------
        | ONLY FRONTEND GENERATE CALL
        |--------------------------------------------------------------------------
        */

        const rows =
          await generateResults(
            nextProfile
          );

        const safeRows =
          Array.isArray(rows)
            ? rows
            : [];

        console.log(
          '[PROFILE] Results received:',
          safeRows.length
        );

        /*
        |--------------------------------------------------------------------------
        | NO RESULTS
        |--------------------------------------------------------------------------
        */

        if (
          safeRows.length === 0
        ) {

          setError(
            `No eligible colleges were found for ${getExamName(
              selectedExamId
            )} for the selected profile.`
          );

          return;
        }

        /*
        |--------------------------------------------------------------------------
        | GO TO RESULTS ONLY AFTER API SUCCESS
        |--------------------------------------------------------------------------
        */

        navigate(
          '/results'
        );

      } catch (err) {

        console.error(
          '[PROFILE] Failed to generate results:',
          err
        );

        setError(
          err?.message ||
          'Unable to generate counselling results.'
        );
      }
    };

  return (
    <>
      <PageHero
        title="Tell Us About Yourself"
        description={
          `Selected exam: ${getExamName(
            selectedExamId
          )}`
        }
        crumb={
          <>
            <a href="/">
              Home
            </a>

            {' / '}

            <a href="/exams">
              Exams
            </a>

            {' / Your Profile'}
          </>
        }
      />

      <div className="container section form-shell">

        {/* ==============================================================
            ACADEMIC
        ============================================================== */}

        <div className="form-section">

          <h3>
            Academic
          </h3>

          <div className="grid-3f">

            <Field label="Rank">

              <input
                type="number"
                min="1"
                value={
                  p.rank ?? ''
                }
                onChange={(e) =>
                  set(
                    'rank',
                    Number(
                      e.target.value
                    ) || 0
                  )
                }
                placeholder="Enter rank"
              />

            </Field>

            <Field label="Percentile (optional)">

              <input
                value={
                  p.pct ?? ''
                }
                onChange={(e) =>
                  set(
                    'pct',
                    e.target.value
                  )
                }
                placeholder="e.g. 98.7"
              />

            </Field>

            <Field label="Exam Year">

              <select
                value={
                  p.year ||
                  '2026'
                }
                onChange={(e) =>
                  set(
                    'year',
                    e.target.value
                  )
                }
              >

                <option value="2026">
                  2026
                </option>

                <option value="2025">
                  2025
                </option>

              </select>

            </Field>

          </div>
        </div>

        {/* ==============================================================
            PERSONAL
        ============================================================== */}

        <div className="form-section">

          <h3>
            Personal Admission Information
          </h3>

          <div className="grid-3f">

            <Field label="Category">

              <select
                value={
                  p.category ||
                  'General'
                }
                onChange={(e) =>
                  set(
                    'category',
                    e.target.value
                  )
                }
              >

                <option value="General">
                  General
                </option>

                <option value="EWS">
                  EWS
                </option>

                <option value="OBC-NCL">
                  OBC-NCL
                </option>

                <option value="SC">
                  SC
                </option>

                <option value="ST">
                  ST
                </option>

              </select>

            </Field>

            <Field label="Gender">

              <select
                value={
                  p.gender ||
                  'Male'
                }
                onChange={(e) =>
                  set(
                    'gender',
                    e.target.value
                  )
                }
              >

                <option value="Male">
                  Male
                </option>

                <option value="Female">
                  Female
                </option>

                <option value="Other">
                  Other
                </option>

              </select>

            </Field>

            <Field label="Home State">

              <select
                value={
                  p.homeState ||
                  'Maharashtra'
                }
                onChange={(e) =>
                  set(
                    'homeState',
                    e.target.value
                  )
                }
              >

                {STATES.map(
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

            </Field>

          </div>
        </div>

        {/* ==============================================================
            PREFERENCES
        ============================================================== */}

        <div className="form-section">

          <h3>
            Preferences
          </h3>

          <div className="field">

            <label>
              Preferred Branches
            </label>

            <div className="chip-select">

              {BRANCHES.map(
                (branch) => {

                  const selected =
                    Array.isArray(
                      p.branches
                    ) &&
                    p.branches.includes(
                      branch
                    );

                  return (
                    <button
                      key={branch}
                      type="button"
                      className={
                        `chip ${
                          selected
                            ? 'on'
                            : ''
                        }`
                      }
                      onClick={() =>
                        toggleBranch(
                          branch
                        )
                      }
                    >
                      {branch}
                    </button>
                  );
                }
              )}

            </div>

          </div>

          <div className="grid-2">

            <Field label="Maximum Budget (total)">

              <select
                value={
                  p.budget ??
                  1000000
                }
                onChange={(e) =>
                  set(
                    'budget',
                    Number(
                      e.target.value
                    )
                  )
                }
              >

                <option value="500000">
                  Under ₹5 Lakh
                </option>

                <option value="1000000">
                  Under ₹10 Lakh
                </option>

                <option value="2000000">
                  Under ₹20 Lakh
                </option>

                <option value="99999999">
                  No limit
                </option>

              </select>

            </Field>

            <Field label="College Type">

              <select
                value={
                  p.type ||
                  'Both'
                }
                onChange={(e) =>
                  set(
                    'type',
                    e.target.value
                  )
                }
              >

                <option value="Both">
                  Both
                </option>

                <option value="Government">
                  Government
                </option>

                <option value="Private">
                  Private
                </option>

              </select>

            </Field>

          </div>

          <div className="grid-2">

            <Field label="Hostel Required">

              <select
                value={
                  p.hostel ||
                  'Yes'
                }
                onChange={(e) =>
                  set(
                    'hostel',
                    e.target.value
                  )
                }
              >

                <option value="Yes">
                  Yes
                </option>

                <option value="No">
                  No
                </option>

              </select>

            </Field>

            <Field label="Preferred State">

              <select
                value={
                  p.prefState ||
                  ''
                }
                onChange={(e) =>
                  set(
                    'prefState',
                    e.target.value
                  )
                }
              >

                <option value="">
                  Any
                </option>

                {STATES.map(
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

            </Field>

          </div>

        </div>

        {/* ==============================================================
            ERROR
        ============================================================== */}

        {error && (
          <div className="empty-state">

            <h3>
              Unable to generate results
            </h3>

            <p>
              {error}
            </p>

          </div>
        )}

        {resultsError &&
          !error && (
            <div className="empty-state">

              <p>
                {resultsError}
              </p>

            </div>
          )}

        {/* ==============================================================
            GENERATE
        ============================================================== */}

        <Button
          variant="orange"
          block
          onClick={
            handleGenerate
          }
          disabled={
            resultsLoading
          }
        >
          {resultsLoading
            ? 'Checking JoSAA Cutoffs...'
            : 'Generate My College Options →'}
        </Button>

      </div>
    </>
  );
}

/*
|--------------------------------------------------------------------------
| FIELD
|--------------------------------------------------------------------------
*/

function Field({
  label,
  children,
}) {
  return (
    <div className="field">

      <label>
        {label}
      </label>

      {children}

    </div>
  );
}