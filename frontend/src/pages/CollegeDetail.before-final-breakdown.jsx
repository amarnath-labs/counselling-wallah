import {
  Link,
  useParams,
} from 'react-router-dom';

import {
  useEffect,
} from 'react';

import PageHero from '../components/PageHero';
import Button from '../components/Button';
import Disclaimer from '../components/Disclaimer';

import {
  useAppState,
} from '../hooks/useAppState';

import {
  CATEGORY_RELAXATION,
  BRANCH_ALTERNATIVES,
} from '../data/demoData';

import {
  getExamName,
} from '../services/examService';


/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function toNumber(value) {
  const num =
    Number(value);

  return Number.isFinite(num)
    ? num
    : 0;
}


function formatMoney(value) {
  return toNumber(
    value
  ).toLocaleString(
    'en-IN',
    {
      maximumFractionDigits: 0,
    }
  );
}


function getOfficialWebsite(
  college
) {
  const raw =
    college?.officialWebsite ??
    college?.official_website ??
    college?.websiteUrl ??
    college?.website_url ??
    college?.website ??
    null;

  if (
    typeof raw !== 'string'
  ) {
    return null;
  }

  const url =
    raw.trim();

  if (
    !/^https?:\/\//i.test(
      url
    )
  ) {
    return null;
  }

  return url;
}


/*
|--------------------------------------------------------------------------
| GET FEE DATA
|--------------------------------------------------------------------------
*/

function normalizeBranchName(value) {
  return String(
    value || ''
  )
    .trim()
    .toLowerCase();
}


function positiveNumber(value) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return 0;
  }

  const num =
    Number(value);

  return Number.isFinite(num) &&
    num > 0
    ? num
    : 0;
}


function mergeBranchFeeData(
  primaryBranch,
  fallbackBranch
) {
  const primary =
    primaryBranch || {};

  const fallback =
    fallbackBranch || {};

  const merged = {
    ...fallback,
    ...primary,
  };


  const numericFeeKeys = [
    'fees',
    'annualFee',
    'estimatedAnnualFee',

    'tuitionFeePerSemester',
    'tuitionFee',

    'academicFeePerSemester',
    'firstSemesterFee',

    'hostelFeePerSemester',
    'hostelFee',

    'messFeePerSemester',
    'messFee',

    'otherFee',

    'annualAcademicFee',
    'annualTotalFee',

    'totalCourseFee',
    'displayFee',

    'estimatedAnnualBudgetFee',

    'feeConfidence',
  ];


  numericFeeKeys.forEach(
    (key) => {
      const primaryValue =
        positiveNumber(
          primary?.[key]
        );

      const fallbackValue =
        positiveNumber(
          fallback?.[key]
        );

      if (
        primaryValue <= 0 &&
        fallbackValue > 0
      ) {
        merged[key] =
          fallback[key];
      }
    }
  );


  const metadataKeys = [
    'feeYear',
    'displayFeePeriod',
    'feeCoverage',
    'feeVerificationStatus',
    'feeSourceUrl',
    'feeSourceLabel',
  ];


  metadataKeys.forEach(
    (key) => {
      const value =
        primary?.[key];

      if (
        value === null ||
        value === undefined ||
        value === ''
      ) {
        if (
          fallback?.[key] !== null &&
          fallback?.[key] !== undefined &&
          fallback?.[key] !== ''
        ) {
          merged[key] =
            fallback[key];
        }
      }
    }
  );


  merged.hasFeeData =
    primary?.hasFeeData === true ||
    fallback?.hasFeeData === true ||
    positiveNumber(
      merged.displayFee
    ) > 0 ||
    positiveNumber(
      merged.totalCourseFee
    ) > 0 ||
    positiveNumber(
      merged.annualTotalFee
    ) > 0 ||
    positiveNumber(
      merged.annualAcademicFee
    ) > 0 ||
    positiveNumber(
      merged.estimatedAnnualFee
    ) > 0 ||
    positiveNumber(
      merged.fees
    ) > 0;


  return merged;
}


function getFeeData(branch) {
  const fee =
    branch?.fee || {};


  /*
  |--------------------------------------------------------------------------
  | EXACT / SOURCE FIELDS
  |--------------------------------------------------------------------------
  */

  const totalCourseFee =
    positiveNumber(
      fee?.totalCourseFee ??
      branch?.totalCourseFee
    );


  const annualTotalFee =
    positiveNumber(
      fee?.annualTotalFee ??
      fee?.totalAnnualFee ??
      branch?.annualTotalFee ??
      branch?.totalAnnualFee
    );


  const annualAcademicFee =
    positiveNumber(
      fee?.annualAcademicFee ??
      branch?.annualAcademicFee
    );


  const tuitionFeePerSemester =
    positiveNumber(
      fee?.tuitionFeePerSemester ??
      branch?.tuitionFeePerSemester ??
      branch?.tuitionFee
    );


  const academicFeePerSemester =
    positiveNumber(
      fee?.academicFeePerSemester ??
      branch?.academicFeePerSemester
    );


  const firstSemesterFee =
    positiveNumber(
      fee?.firstSemesterFee ??
      branch?.firstSemesterFee
    );


  const hostelFeePerSemester =
    positiveNumber(
      fee?.hostelFeePerSemester ??
      fee?.hostelFee ??
      branch?.hostelFeePerSemester ??
      branch?.hostelFee
    );


  const messFeePerSemester =
    positiveNumber(
      fee?.messFeePerSemester ??
      fee?.messFee ??
      branch?.messFeePerSemester ??
      branch?.messFee
    );


  const otherFee =
    positiveNumber(
      fee?.otherFee ??
      branch?.otherFee
    );


  /*
  |--------------------------------------------------------------------------
  | ANNUAL BUDGET VALUE
  |--------------------------------------------------------------------------
  |
  | totalCourseFee is NOT labelled annual.
  |
  | Backend already provides estimatedAnnualFee when only
  | the total course fee is available.
  |--------------------------------------------------------------------------
  */

  const estimatedAnnualBudgetFee =
    positiveNumber(
      fee?.estimatedAnnualBudgetFee ??
      fee?.estimatedAnnualFee ??
      branch?.estimatedAnnualBudgetFee ??
      branch?.estimatedAnnualFee ??
      branch?.annualFee ??
      branch?.fees
    );


  /*
  |--------------------------------------------------------------------------
  | DISPLAY VALUE
  |--------------------------------------------------------------------------
  */

  const displayFee =
    positiveNumber(
      fee?.displayFee ??
      branch?.displayFee ??
      annualTotalFee ??
      annualAcademicFee ??
      totalCourseFee ??
      firstSemesterFee ??
      academicFeePerSemester ??
      tuitionFeePerSemester ??
      estimatedAnnualBudgetFee
    );


  /*
  |--------------------------------------------------------------------------
  | DISPLAY PERIOD
  |--------------------------------------------------------------------------
  */

  let displayFeePeriod =
    fee?.displayFeePeriod ??
    branch?.displayFeePeriod ??
    null;


  if (
    !displayFeePeriod
  ) {
    if (
      annualTotalFee > 0 ||
      annualAcademicFee > 0
    ) {
      displayFeePeriod =
        'annual';
    } else if (
      totalCourseFee > 0
    ) {
      displayFeePeriod =
        'course_total';
    } else if (
      firstSemesterFee > 0
    ) {
      displayFeePeriod =
        'first_semester';
    } else if (
      academicFeePerSemester > 0 ||
      tuitionFeePerSemester > 0
    ) {
      displayFeePeriod =
        'semester';
    } else if (
      estimatedAnnualBudgetFee > 0
    ) {
      displayFeePeriod =
        'annual';
    }
  }


  /*
  |--------------------------------------------------------------------------
  | META
  |--------------------------------------------------------------------------
  */

  const feeYear =
    fee?.feeYear ??
    branch?.feeYear ??
    null;


  const feeCoverage =
    fee?.feeCoverage ??
    branch?.feeCoverage ??
    null;


  const feeConfidence =
    fee?.feeConfidence ??
    branch?.feeConfidence ??
    null;


  const feeVerificationStatus =
    fee?.feeVerificationStatus ??
    branch?.feeVerificationStatus ??
    null;


  const feeSourceUrl =
    fee?.feeSourceUrl ??
    branch?.feeSourceUrl ??
    null;


  const feeSourceLabel =
    fee?.feeSourceLabel ??
    branch?.feeSourceLabel ??
    null;


  /*
  |--------------------------------------------------------------------------
  | HAS FEE DATA
  |--------------------------------------------------------------------------
  */

  const hasFeeData =
    branch?.hasFeeData === true ||

    displayFee > 0 ||

    totalCourseFee > 0 ||

    annualTotalFee > 0 ||

    annualAcademicFee > 0 ||

    estimatedAnnualBudgetFee > 0 ||

    tuitionFeePerSemester > 0 ||

    academicFeePerSemester > 0 ||

    firstSemesterFee > 0 ||

    hostelFeePerSemester > 0 ||

    messFeePerSemester > 0 ||

    otherFee > 0;


  /*
  |--------------------------------------------------------------------------
  | BUDGET COMPARISON
  |--------------------------------------------------------------------------
  */

  const budgetComparableFee =
    estimatedAnnualBudgetFee > 0
      ? estimatedAnnualBudgetFee

      : annualTotalFee > 0
      ? annualTotalFee

      : annualAcademicFee > 0
      ? annualAcademicFee

      : totalCourseFee > 0
      ? Math.round(
          totalCourseFee / 4
        )

      : academicFeePerSemester > 0
      ? academicFeePerSemester * 2

      : tuitionFeePerSemester > 0
      ? tuitionFeePerSemester * 2

      : firstSemesterFee > 0
      ? firstSemesterFee * 2

      : 0;


  return {
    displayFee,
    displayFeePeriod,

    totalCourseFee,

    annualTotalFee,
    annualAcademicFee,

    estimatedAnnualBudgetFee,

    tuitionFeePerSemester,
    academicFeePerSemester,
    firstSemesterFee,

    hostelFeePerSemester,
    messFeePerSemester,
    otherFee,

    feeYear,
    feeCoverage,
    feeConfidence,

    feeVerificationStatus,

    feeSourceUrl,
    feeSourceLabel,

    hasFeeData,

    budgetComparableFee,
  };
}

/*
|--------------------------------------------------------------------------
| COLLEGE DETAIL
|--------------------------------------------------------------------------
*/

export default function CollegeDetail() {
  const {
    id,
  } = useParams();


  const {
    currentCollege,
    currentBranchIdx,
    setCurrentBranchIdx,

    cdTab,
    setCdTab,

    openCollege,
    addCompare,
    addChoice,

    profile,
    selectedExamId,
    colleges,
  } = useAppState();


  /*
  |--------------------------------------------------------------------------
  | LOAD COLLEGE
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      if (
        !currentCollege ||
        String(
          currentCollege.id
        ) !== String(id)
      ) {
        openCollege(
          id
        );
      }
    },
    [
      id,
      currentCollege,
      openCollege,
    ]
  );


  /*
  |--------------------------------------------------------------------------
  | NOT FOUND
  |--------------------------------------------------------------------------
  */

  if (
    !currentCollege
  ) {
    return (
      <div className="container section">
        <div className="empty-state">
          <h3>
            College not found
          </h3>

          <Link
            className="btn btn-primary"
            to="/results"
          >
            Back to Results
          </Link>
        </div>
      </div>
    );
  }
  const rawCollege =
    currentCollege;


  /*
  |--------------------------------------------------------------------------
  | CATALOG COLLEGE
  |--------------------------------------------------------------------------
  |
  | Recommendation-result branches can contain cutoff data but may not
  | contain the complete fee profile.
  |
  | The /api/colleges catalog contains the resolved fee data.
  |--------------------------------------------------------------------------
  */

  const catalogCollege =
    Array.isArray(
      colleges
    )
      ? colleges.find(
          (college) =>
            String(
              college?.id
            ) ===
            String(id)
        ) || null
      : null;


  const resultBranches =
    Array.isArray(
      rawCollege?.branches
    )
      ? rawCollege.branches
      : [];


  const catalogBranches =
    Array.isArray(
      catalogCollege?.branches
    )
      ? catalogCollege.branches
      : [];


  const sourceBranches =
    resultBranches.length > 0
      ? resultBranches
      : catalogBranches;


  /*
  |--------------------------------------------------------------------------
  | MERGED BRANCHES
  |--------------------------------------------------------------------------
  |
  | Keep recommendation/cutoff values from the result branch.
  | Fill missing fee fields from the college catalog branch.
  |--------------------------------------------------------------------------
  */

  const branches =
    sourceBranches.map(
      (branch) => {

        const branchName =
          normalizeBranchName(
            branch?.name
          );


        const catalogBranch =
          catalogBranches.find(
            (candidate) => {

              if (
                branch?.id != null &&
                candidate?.id != null &&
                String(
                  branch.id
                ) ===
                String(
                  candidate.id
                )
              ) {
                return true;
              }


              return (
                normalizeBranchName(
                  candidate?.name
                ) ===
                branchName
              );
            }
          ) || null;


        return mergeBranchFeeData(
          branch,
          catalogBranch
        );
      }
    );


  const c = {
    ...(catalogCollege || {}),
    ...(rawCollege || {}),
    branches,
  };




  /*
  |--------------------------------------------------------------------------
  | NO BRANCH
  |--------------------------------------------------------------------------
  */

  if (
    branches.length === 0
  ) {
    return (
      <>
        <PageHero
          title={
            c?.name ||
            'College'
          }
          description={`${c?.city || ''}, ${c?.state || ''}`}
          crumb={
            <>
              <Link to="/">
                Home
              </Link>
              {' / '}
              <Link to="/results">
                Results
              </Link>
              {' / '}
              College Detail
            </>
          }
        />

        <div className="container section">
          <div className="empty-state">
            <h3>
              Branch information unavailable
            </h3>

            <p>
              No branch information is currently
              available for this college.
            </p>
          </div>
        </div>
      </>
    );
  }


  /*
  |--------------------------------------------------------------------------
  | SAFE BRANCH INDEX
  |--------------------------------------------------------------------------
  */

  const safeBranchIndex =
    Math.min(
      Math.max(
        Number(
          currentBranchIdx
        ) || 0,
        0
      ),
      branches.length - 1
    );


  const b =
    branches[
      safeBranchIndex
    ];


  /*
  |--------------------------------------------------------------------------
  | OFFICIAL WEBSITE
  |--------------------------------------------------------------------------
  */

  const officialWebsite =
    getOfficialWebsite(
      c
    );


  /*
  |--------------------------------------------------------------------------
  | RANK MATCH
  |--------------------------------------------------------------------------
  */

  const relax =
    CATEGORY_RELAXATION[
      profile.category
    ] ||
    1;


  const closingRank =
    toNumber(
      b?.closingRank
    );


  const eff =
    closingRank > 0
      ? Math.round(
          closingRank *
          relax
        )
      : 0;


  const studentRank =
    toNumber(
      profile?.rank
    );


  const ratio =
    eff > 0 &&
    studentRank > 0
      ? studentRank /
        eff
      : 0;


  const match =
    eff > 0 &&
    studentRank > 0
      ? Math.max(
          0,
          Math.min(
            100,
            Math.round(
              100 -
              Math.abs(
                ratio -
                0.6
              ) *
                70
            )
          )
        )
      : 0;


  const tabs = [
    'overview',
    'cutoffs',
    'fees',
    'placements',
    'admission',
  ];


  return (
    <>
      <PageHero
        title={c.name}
        description={`${c.city || ''}, ${c.state || ''} · Est. ${
          c.established ||
          '—'
        } · ${
          c.type ||
          'College'
        }`}
        crumb={
          <>
            <Link to="/">
              Home
            </Link>
            {' / '}

            <Link to="/results">
              Results
            </Link>

            {' / '}
            College Detail
          </>
        }
      />


      <div className="container section">

        {/*
        |--------------------------------------------------------------------------
        | TOP ACTION BUTTONS
        |--------------------------------------------------------------------------
        */}

        <div
          style={{
            display:
              'flex',

            gap:
              10,

            justifyContent:
              'flex-end',

            flexWrap:
              'wrap',
          }}
        >

          {officialWebsite ? (
            <a
              href={
                officialWebsite
              }
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-sm"
              style={{
                textDecoration:
                  'none',
              }}
            >
              Visit Official Website ↗
            </a>
          ) : (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled
              title="Official college website is not available in our database yet."
              style={{
                opacity:
                  0.55,

                cursor:
                  'not-allowed',
              }}
            >
              Official Website Unavailable
            </button>
          )}


          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              addCompare(
                c.id,
                b.name
              )
            }
          >
            + Add to Compare
          </Button>


          <Button
            variant="orange"
            size="sm"
            onClick={() =>
              addChoice(
                c.id,
                b.name
              )
            }
          >
            Add to Preference List
          </Button>

        </div>


        {/*
        |--------------------------------------------------------------------------
        | TABS
        |--------------------------------------------------------------------------
        */}

        <div className="detail-tabs">
          {tabs.map(
            (tab) => (
              <button
                key={
                  tab
                }
                type="button"
                className={`dtab ${
                  cdTab ===
                  tab
                    ? 'on'
                    : ''
                }`}
                onClick={() =>
                  setCdTab(
                    tab
                  )
                }
              >
                {tab[0]
                  .toUpperCase() +
                  tab.slice(
                    1
                  )}
              </button>
            )
          )}
        </div>


        {/*
        |--------------------------------------------------------------------------
        | OVERVIEW
        |--------------------------------------------------------------------------
        */}

        {cdTab ===
          'overview' && (
          <Overview
            c={
              c
            }
            b={
              b
            }
            match={
              match
            }
            ratio={
              ratio
            }
            profile={
              profile
            }
            setBranch={
              setCurrentBranchIdx
            }
          />
        )}


        {/*
        |--------------------------------------------------------------------------
        | CUTOFFS
        |--------------------------------------------------------------------------
        */}

        {cdTab ===
          'cutoffs' && (
          <Cutoffs
            b={
              b
            }
            profile={
              profile
            }
            relax={
              relax
            }
          />
        )}


        {/*
        |--------------------------------------------------------------------------
        | FEES
        |--------------------------------------------------------------------------
        */}

        {cdTab ===
          'fees' && (
          <Fees
            b={
              b
            }
          />
        )}


        {/*
        |--------------------------------------------------------------------------
        | PLACEMENTS
        |--------------------------------------------------------------------------
        */}

        {cdTab ===
          'placements' && (
          <Placements
            b={
              b
            }
          />
        )}


        {/*
        |--------------------------------------------------------------------------
        | ADMISSION
        |--------------------------------------------------------------------------
        */}

        {cdTab ===
          'admission' && (
          <Admission
            c={
              c
            }
            exam={
              getExamName(
                selectedExamId
              )
            }
          />
        )}

      </div>
    </>
  );
}


/*
|--------------------------------------------------------------------------
| OVERVIEW
|--------------------------------------------------------------------------
*/

function Overview({
  c,
  b,
  match,
  ratio,
  profile,
  setBranch,
}) {
  const alts =
    BRANCH_ALTERNATIVES[
      b.name
    ];


  const feeData =
    getFeeData(
      b
    );


  const userBudget =
    toNumber(
      profile?.budget
    );


  const hasBudgetFee =
    feeData
      .budgetComparableFee >
    0;


  const fitsBudget =
    hasBudgetFee &&
    userBudget > 0
      ? feeData
          .budgetComparableFee <=
        userBudget
      : null;


  return (
    <>
      <div className="grid-2">

        <div className="card">
          <h4
            style={{
              fontSize:
                15,
            }}
          >
            Why this college matches you —{' '}

            <span className="mono">
              {match}%
            </span>{' '}

            match
          </h4>


          <p
            style={{
              fontSize:
                13,
            }}
          >
            Rank compatibility:{' '}
            {match}% · Branch preference:{' '}

            {profile
              ?.branches
              ?.includes(
                b.name
              )
              ? 95
              : 62}
            % · Budget:{' '}

            {fitsBudget ===
            null
              ? 'N/A'
              : fitsBudget
              ? '92%'
              : '60%'}
          </p>


          <ul
            style={{
              fontSize:
                13,

              color:
                'var(--ink-2)',

              paddingLeft:
                18,
            }}
          >

            <li>
              Your rank (
              {toNumber(
                profile?.rank
              ).toLocaleString(
                'en-IN'
              )}
              ) is{' '}

              {ratio > 0 &&
              ratio <= 1
                ? 'within'
                : 'close to'}{' '}

              the recent closing
              rank trend for{' '}
              {b.name}.
            </li>


            <li>
              {profile
                ?.branches
                ?.includes(
                  b.name
                )
                ? 'Your preferred branch is available here.'
                : 'This branch is a possible alternative to your top choice.'}
            </li>


            <li>
              {fitsBudget ===
              null
                ? 'Fee information is not available yet for an accurate budget comparison.'
                : fitsBudget
                ? 'Fees fit your selected budget.'
                : 'Fees are above your selected budget — worth reviewing scholarships.'}
            </li>


            <li>
              Admission estimates
              are based on
              historical data —
              not a guarantee of
              admission.
            </li>

          </ul>
        </div>


        <div className="card">
          <h4
            style={{
              fontSize:
                15,
            }}
          >
            Branches at this college
          </h4>


          <div className="chip-select">
            {c.branches.map(
              (
                branch,
                index
              ) => (
                <button
                  type="button"
                  className={`chip ${
                    index ===
                    c.branches.indexOf(
                      b
                    )
                      ? 'on'
                      : ''
                  }`}
                  onClick={() =>
                    setBranch(
                      index
                    )
                  }
                  key={
                    branch.id ||
                    branch.name
                  }
                >
                  {branch.name}
                </button>
              )
            )}
          </div>


          <p
            style={{
              fontSize:
                12.5,

              marginTop:
                12,
            }}
          >
            Select a branch above
            to view its available
            cutoff, fee and
            counselling details.
          </p>
        </div>

      </div>


      <div className="source-note">
        Match percentage uses the
        available historical
        closing-rank information.
        Fee information shown in
        the Fees tab uses available
        database/API data where
        provided. Always verify
        final fees and admission
        requirements from official
        sources.
      </div>


      {alts && (
        <div
          className="card"
          style={{
            marginTop:
              14,
          }}
        >
          <h4
            style={{
              fontSize:
                14,
            }}
          >
            What if I don't get{' '}
            {b.name}?
          </h4>


          <p
            style={{
              fontSize:
                12.5,
            }}
          >
            These are commonly
            considered alternatives
            — not equivalents.
            Actual availability,
            cutoffs and curriculum
            differ by college.
          </p>


          <ul
            style={{
              paddingLeft:
                18,
            }}
          >
            {alts.map(
              (alternative) => (
                <li
                  key={
                    alternative.name
                  }
                  style={{
                    fontSize:
                      13,

                    color:
                      'var(--ink-2)',

                    marginBottom:
                      6,
                  }}
                >
                  <b>
                    {
                      alternative.name
                    }
                  </b>{' '}
                  —{' '}
                  {
                    alternative.note
                  }
                </li>
              )
            )}
          </ul>


          <div className="source-note">
            General guidance based
            on typical curriculum
            overlap and historical
            patterns — verify
            actual programmes and
            availability from the
            institute.
          </div>

        </div>
      )}
    </>
  );
}


/*
|--------------------------------------------------------------------------
| CUTOFFS
|--------------------------------------------------------------------------
*/

function Cutoffs({
  b,
  profile,
  relax,
}) {
  const closingRank =
    toNumber(
      b?.closingRank
    );


  const rows = [
    ...(closingRank > 0
      ? [
          {
            yr:
              b?.year ||
              2025,

            round:
              b?.round ||
              'Round 6 (final)',

            closing:
              closingRank,
          },
        ]
      : []),

    ...(toNumber(
      b?.closingRank2026
    ) > 0
      ? [
          {
            yr:
              2026,

            round:
              b?.round2026 ||
              'Round (see note)',

            closing:
              toNumber(
                b.closingRank2026
              ),
          },
        ]
      : []),
  ];


  const status =
    String(
      b?.verificationStatus ||
      'DEMO'
    ).toUpperCase();


  const statusConfig = {
    VERIFIED: {
      label:
        '✓ Verified Source',

      className:
        'verified',
    },

    UNVERIFIED: {
      label:
        '⚠ Unverified',

      className:
        'unverified',
    },

    STALE: {
      label:
        '⚠ Stale Data',

      className:
        'stale',
    },

    REJECTED: {
      label:
        '✕ Rejected Source',

      className:
        'rejected',
    },

    DEMO: {
      label:
        'Demo / Prototype Data',

      className:
        'demo',
    },
  };


  const statusInfo =
    statusConfig[
      status
    ] ||
    statusConfig.DEMO;


  return (
    <div className="card">

      {rows.length === 0 ? (
        <div>
          <h4>
            Cutoffs
          </h4>

          <p>
            Cutoff information is
            currently unavailable
            for this branch.
          </p>
        </div>
      ) : (
        <div
          style={{
            overflowX:
              'auto',
          }}
        >
          <table className="cutoff-table">
            <thead>
              <tr>
                <th>
                  Year
                </th>

                <th>
                  Round
                </th>

                <th>
                  Category
                </th>

                <th>
                  Quota
                </th>

                <th>
                  Branch
                </th>

                <th>
                  Closing
                  (Open baseline)
                </th>

                <th>
                  Closing (
                  {
                    profile.category
                  }
                  , est.)
                </th>
              </tr>
            </thead>


            <tbody>
              {rows.map(
                (
                  row,
                  index
                ) => (
                  <tr
                    key={`${row.yr}-${row.round}-${index}`}
                  >
                    <td>
                      {row.yr}
                    </td>

                    <td>
                      {
                        row.round
                      }
                    </td>

                    <td>
                      {b?.category ||
                        'Open'}
                    </td>

                    <td>
                      {b?.quota ||
                        'OS'}
                    </td>

                    <td>
                      {b.name}
                    </td>

                    <td className="mono">
                      {row.closing.toLocaleString(
                        'en-IN'
                      )}
                    </td>

                    <td className="mono">
                      {Math.round(
                        row.closing *
                          relax
                      ).toLocaleString(
                        'en-IN'
                      )}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}


      <div className="source-note">

        <div
          style={{
            marginBottom:
              8,
          }}
        >
          <span
            className={`verification-badge ${statusInfo.className}`}
          >
            {
              statusInfo.label
            }
          </span>
        </div>


        {status ===
          'DEMO' && (
          <p
            style={{
              margin:
                '6px 0',
            }}
          >
            This cutoff is
            prototype/demo data and
            should not be treated
            as an official closing
            rank.
          </p>
        )}


        {status ===
          'UNVERIFIED' && (
          <p
            style={{
              margin:
                '6px 0',
            }}
          >
            A source has been
            recorded for this
            cutoff, but the figure
            has not yet been
            independently verified.
          </p>
        )}


        {status ===
          'VERIFIED' && (
          <p
            style={{
              margin:
                '6px 0',
            }}
          >
            This cutoff has been
            verified against the
            recorded source.
          </p>
        )}


        {b?.source && (
          <div
            style={{
              marginTop:
                6,
            }}
          >
            <b>
              Source:
            </b>{' '}
            {b.source}
          </div>
        )}


        {b?.sourceUrl && (
          <div
            style={{
              marginTop:
                4,
            }}
          >
            <b>
              Source URL:
            </b>{' '}

            <a
              href={
                b.sourceUrl
              }
              target="_blank"
              rel="noopener noreferrer"
            >
              Open source ↗
            </a>
          </div>
        )}

      </div>
    </div>
  );
}


/*
|--------------------------------------------------------------------------
| FEES
|--------------------------------------------------------------------------
*/

function Fees({
  b,
}) {
  const feeData =
    getFeeData(
      b
    );


  const {
    displayFee,
    displayFeePeriod,

    totalCourseFee,

    annualTotalFee,
    annualAcademicFee,

    estimatedAnnualBudgetFee,

    tuitionFeePerSemester,
    academicFeePerSemester,
    firstSemesterFee,

    hostelFeePerSemester,
    messFeePerSemester,
    otherFee,

    feeYear,
    feeCoverage,
    feeConfidence,

    feeVerificationStatus,

    feeSourceUrl,
    feeSourceLabel,

    hasFeeData,
  } = feeData;


  /*
  |--------------------------------------------------------------------------
  | DISPLAY LABEL
  |--------------------------------------------------------------------------
  */

  const displayLabel =
    displayFeePeriod ===
    'course_total'
      ? 'Total Course Fee'

      : displayFeePeriod ===
        'semester'
      ? 'Per Semester Fee'

      : displayFeePeriod ===
        'first_semester'
      ? 'First Semester Fee'

      : displayFeePeriod ===
        'annual'
      ? 'Annual Fee'

      : 'Fee';


  /*
  |--------------------------------------------------------------------------
  | VERIFICATION LABEL
  |--------------------------------------------------------------------------
  */

  const normalizedStatus =
    String(
      feeVerificationStatus ||
      ''
    )
      .trim()
      .toLowerCase();


  const verificationLabel =
    normalizedStatus ===
    'verified'
      ? 'Verified'

      : normalizedStatus ===
        'high_confidence'
      ? 'High confidence'

      : normalizedStatus ===
        'review_recommended'
      ? 'Review recommended'

      : normalizedStatus ===
        'pending_review'
      ? 'Pending review'

      : feeVerificationStatus ||
        'Not verified';


  return (
    <div className="card">

      <h4>
        Fee Structure
      </h4>


      {/*
      |--------------------------------------------------------------------------
      | NO FEE DATA
      |--------------------------------------------------------------------------
      */}

      {!hasFeeData ? (
        <>

          <p
            style={{
              fontSize:
                14,

              color:
                'var(--ink-2)',
            }}
          >
            Fee information is
            currently unavailable
            for this college /
            branch.
          </p>


          <div className="source-note">

            Official fee
            information will
            appear here once it is
            available in our
            database.

            {' '}

            ₹0 is not shown because
            missing fee data should
            not be treated as zero
            fee.

          </div>

        </>
      ) : (
        <>

          {/*
          |--------------------------------------------------------------------------
          | PRIMARY DISPLAY FEE
          |--------------------------------------------------------------------------
          */}

          {displayFee > 0 && (

            <div
              style={{
                marginBottom:
                  20,
              }}
            >

              <div
                style={{
                  fontSize:
                    13,

                  color:
                    'var(--ink-2)',

                  marginBottom:
                    5,
                }}
              >
                {
                  displayLabel
                }
              </div>


              <div
                className="mono"
                style={{
                  fontSize:
                    28,

                  fontWeight:
                    800,

                  lineHeight:
                    1.15,
                }}
              >
                ₹
                {formatMoney(
                  displayFee
                )}
              </div>


              {feeYear && (

                <div
                  style={{
                    marginTop:
                      6,

                    fontSize:
                      12.5,

                    color:
                      'var(--ink-3)',
                  }}
                >
                  Fee year:{' '}

                  <strong>
                    {
                      feeYear
                    }
                  </strong>
                </div>

              )}

            </div>

          )}


          {/*
          |--------------------------------------------------------------------------
          | COURSE TOTAL NOTICE
          |--------------------------------------------------------------------------
          */}

          {displayFeePeriod ===
            'course_total' &&
            estimatedAnnualBudgetFee >
              0 && (

            <div
              className="source-note"
              style={{
                marginBottom:
                  18,
              }}
            >

              Estimated annual
              equivalent for budget
              comparison:{' '}

              <strong>
                ₹
                {formatMoney(
                  estimatedAnnualBudgetFee
                )}
              </strong>


              <div
                style={{
                  marginTop:
                    5,

                  fontSize:
                    12,
                }}
              >
                The course-total
                amount is preserved
                as the source value.
                The annual figure is
                shown only as an
                estimate for budget
                comparison.
              </div>

            </div>

          )}


          {/*
          |--------------------------------------------------------------------------
          | FEE BREAKDOWN
          |--------------------------------------------------------------------------
          */}

          <div
            style={{
              display:
                'grid',

              gap:
                8,
            }}
          >

            {totalCourseFee > 0 && (

              <div>
                Total course fee:{' '}

                <strong>
                  ₹
                  {formatMoney(
                    totalCourseFee
                  )}
                </strong>
              </div>

            )}


            {annualTotalFee > 0 && (

              <div>
                Annual total fee:{' '}

                <strong>
                  ₹
                  {formatMoney(
                    annualTotalFee
                  )}
                </strong>
              </div>

            )}


            {annualAcademicFee >
              0 && (

              <div>
                Annual academic
                fee:{' '}

                <strong>
                  ₹
                  {formatMoney(
                    annualAcademicFee
                  )}
                </strong>
              </div>

            )}


            {tuitionFeePerSemester >
              0 && (

              <div>
                Tuition fee /
                semester:{' '}

                <strong>
                  ₹
                  {formatMoney(
                    tuitionFeePerSemester
                  )}
                </strong>
              </div>

            )}


            {academicFeePerSemester >
              0 && (

              <div>
                Academic fee /
                semester:{' '}

                <strong>
                  ₹
                  {formatMoney(
                    academicFeePerSemester
                  )}
                </strong>
              </div>

            )}


            {firstSemesterFee >
              0 && (

              <div>
                First semester
                fee:{' '}

                <strong>
                  ₹
                  {formatMoney(
                    firstSemesterFee
                  )}
                </strong>
              </div>

            )}


            {hostelFeePerSemester >
              0 && (

              <div>
                Hostel fee /
                semester:{' '}

                <strong>
                  ₹
                  {formatMoney(
                    hostelFeePerSemester
                  )}
                </strong>
              </div>

            )}


            {messFeePerSemester >
              0 && (

              <div>
                Mess fee /
                semester:{' '}

                <strong>
                  ₹
                  {formatMoney(
                    messFeePerSemester
                  )}
                </strong>
              </div>

            )}


            {otherFee > 0 && (

              <div>
                Other fee:{' '}

                <strong>
                  ₹
                  {formatMoney(
                    otherFee
                  )}
                </strong>
              </div>

            )}

          </div>


          {/*
          |--------------------------------------------------------------------------
          | SOURCE / VERIFICATION
          |--------------------------------------------------------------------------
          */}

          <div
            className="source-note"
            style={{
              marginTop:
                20,
            }}
          >

            <div
              style={{
                marginBottom:
                  5,
              }}
            >
              Source:{' '}

              <strong>
                {
                  feeSourceLabel ||
                  (
                    feeSourceUrl
                      ? 'Recorded fee source'
                      : 'Counselling Wallah'
                  )
                }
              </strong>
            </div>


            <div
              style={{
                marginBottom:
                  5,
              }}
            >
              Verification:{' '}

              <strong>
                {
                  verificationLabel
                }
              </strong>
            </div>


            {feeCoverage && (

              <div
                style={{
                  marginBottom:
                    5,
                }}
              >
                Coverage:{' '}

                <strong>
                  {
                    feeCoverage
                  }
                </strong>
              </div>

            )}


            {feeConfidence != null &&
              Number(
                feeConfidence
              ) > 0 && (

              <div>
                Confidence:{' '}

                <strong>
                  {
                    feeConfidence
                  }%
                </strong>
              </div>

            )}

          </div>


          {/*
          |--------------------------------------------------------------------------
          | SOURCE LINK
          |--------------------------------------------------------------------------
          */}

          {feeSourceUrl && (

            <div
              style={{
                marginTop:
                  16,
              }}
            >

              <a
                href={
                  feeSourceUrl
                }
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost btn-sm"
                style={{
                  textDecoration:
                    'none',
                }}
              >
                View Fee Source ↗
              </a>

            </div>

          )}


          <div
            className="source-note"
            style={{
              marginTop:
                15,
            }}
          >
            Fees may vary by
            programme, category,
            semester, hostel option
            and academic year.

            {' '}

            Always verify the
            latest payable amount
            from the recorded
            source before payment.
          </div>

        </>
      )}

    </div>
  );
}

/*
|--------------------------------------------------------------------------
| PLACEMENTS
|--------------------------------------------------------------------------
*/

function Placements({
  b,
}) {
  const placement =
    toNumber(
      b?.placement
    );


  const medianPackage =
    toNumber(
      b?.medianPackage ??
      b?.median
    );


  const averagePackage =
    toNumber(
      b?.averagePackage ??
      b?.average
    );


  const highestPackage =
    toNumber(
      b?.highestPackage ??
      b?.highest
    );


  const hasPlacementData =
    placement > 0 ||
    medianPackage > 0 ||
    averagePackage > 0 ||
    highestPackage > 0;


  return (
    <div className="card">
      <h4>
        Placements
      </h4>


      {!hasPlacementData ? (
        <>
          <p>
            Placement information
            for{' '}

            <strong>
              {b.name}
            </strong>{' '}

            is currently
            unavailable.
          </p>

          <Disclaimer />
        </>
      ) : (
        <>
          {placement > 0 && (
            <p>
              Placement rate:{' '}

              <strong>
                {
                  placement
                }
                %
              </strong>
            </p>
          )}


          {medianPackage >
            0 && (
            <p>
              Median package:{' '}

              <strong>
                ₹
                {formatMoney(
                  medianPackage
                )}
              </strong>
            </p>
          )}


          {averagePackage >
            0 && (
            <p>
              Average package:{' '}

              <strong>
                ₹
                {formatMoney(
                  averagePackage
                )}
              </strong>
            </p>
          )}


          {highestPackage >
            0 && (
            <p>
              Highest package:{' '}

              <strong>
                ₹
                {formatMoney(
                  highestPackage
                )}
              </strong>
            </p>
          )}


          <Disclaimer />
        </>
      )}
    </div>
  );
}


/*
|--------------------------------------------------------------------------
| ADMISSION
|--------------------------------------------------------------------------
*/

function Admission({
  c,
  exam,
}) {
  return (
    <div className="card">
      <h4>
        Admission
      </h4>


      <p>
        Admission route:{' '}

        <strong>
          {exam}
        </strong>
      </p>


      <p>
        College:{' '}

        <strong>
          {c.name}
        </strong>
      </p>


      <div className="source-note">
        Confirm current admission
        rules, dates and
        eligibility from the
        official counselling
        authority.
      </div>
    </div>
  );
}
