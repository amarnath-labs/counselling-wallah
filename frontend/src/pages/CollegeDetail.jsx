import {
  Link,
  useParams,
} from 'react-router-dom';

import {
  useEffect,
  useState,
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

import {
  apiRequest,
} from '../services/apiClient';


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


function getFeeData(branch) {
  const fee =
    branch?.fee || {};


  const positiveNumber = (
    value
  ) => {
    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {
      return 0;
    }

    const number =
      Number(value);

    return Number.isFinite(
      number
    ) &&
      number > 0
      ? number
      : 0;
  };


  /*
  |--------------------------------------------------------------------------
  | SEMESTER FEES
  |--------------------------------------------------------------------------
  */

  const tuitionFeePerSemester =
    positiveNumber(
      fee?.tuitionFeePerSemester ??
      branch?.tuitionFeePerSemester ??
      branch?.tuitionFee
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


  /*
  |--------------------------------------------------------------------------
  | ANNUAL FEES
  |--------------------------------------------------------------------------
  */

  const annualAcademicFee =
    positiveNumber(
      fee?.annualAcademicFee ??
      branch?.annualAcademicFee
    );


  const calculatedAnnualHostelMess =
    (
      hostelFeePerSemester > 0 ||
      messFeePerSemester > 0
    )
      ? (
          hostelFeePerSemester +
          messFeePerSemester
        ) * 2
      : 0;


  const annualHostelMessFee =
    positiveNumber(
      fee?.annualHostelMessFee ??
      branch?.annualHostelMessFee ??
      calculatedAnnualHostelMess
    );


  const exactAnnualTotal =
    positiveNumber(
      fee?.annualTotalFee ??
      fee?.totalAnnualFee ??
      branch?.annualTotalFee ??
      branch?.totalAnnualFee
    );


  /*
  |--------------------------------------------------------------------------
  | COURSE TOTAL
  |--------------------------------------------------------------------------
  */

  const courseTotal =
    positiveNumber(
      fee?.totalCourseFee ??
      branch?.totalCourseFee
    );


  /*
  |--------------------------------------------------------------------------
  | ESTIMATED ANNUAL
  |--------------------------------------------------------------------------
  |
  | Backend provides estimatedAnnualFee when only a course-total
  | amount is known.
  |--------------------------------------------------------------------------
  */

  const estimatedAnnualFee =
    positiveNumber(
      fee?.estimatedAnnualFee ??
      fee?.estimatedAnnualBudgetFee ??
      branch?.estimatedAnnualFee ??
      branch?.estimatedAnnualBudgetFee ??
      branch?.annualFee ??
      branch?.fees
    );


  /*
  |--------------------------------------------------------------------------
  | ANNUAL TOTAL
  |--------------------------------------------------------------------------
  |
  | Priority:
  |
  | 1. Exact annual total from database
  | 2. Annual academic + annual hostel/mess
  | 3. Estimated annual value from backend
  |--------------------------------------------------------------------------
  */

  let annualTotal =
    exactAnnualTotal;


  if (
    annualTotal <= 0 &&
    (
      annualAcademicFee > 0 ||
      annualHostelMessFee > 0
    )
  ) {
    annualTotal =
      annualAcademicFee +
      annualHostelMessFee;
  }


  if (
    annualTotal <= 0 &&
    estimatedAnnualFee > 0
  ) {
    annualTotal =
      estimatedAnnualFee;
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
  | FLAGS
  |--------------------------------------------------------------------------
  */

  const annualTotalIsEstimated =
    exactAnnualTotal <= 0 &&
    annualTotal > 0;


  const hasFeeData =
    branch?.hasFeeData === true ||

    tuitionFeePerSemester > 0 ||

    firstSemesterFee > 0 ||

    hostelFeePerSemester > 0 ||

    messFeePerSemester > 0 ||

    annualAcademicFee > 0 ||

    annualHostelMessFee > 0 ||

    annualTotal > 0 ||

    courseTotal > 0;


  /*
  |--------------------------------------------------------------------------
  | BUDGET COMPARISON
  |--------------------------------------------------------------------------
  */

  const budgetComparableFee =
    annualTotal > 0
      ? annualTotal

      : courseTotal > 0
      ? Math.round(
          courseTotal / 4
        )

      : 0;


  return {
    tuitionFeePerSemester,
    firstSemesterFee,

    hostelFeePerSemester,
    messFeePerSemester,

    annualAcademicFee,
    annualHostelMessFee,
    annualTotal,

    courseTotal,

    annualTotalIsEstimated,

    feeYear,
    feeCoverage,
    feeConfidence,
    feeVerificationStatus,
    feeSourceUrl,
    feeSourceLabel,

    hasFeeData,
    budgetComparableFee,
  };
}/*
|--------------------------------------------------------------------------
| COLLEGE DETAIL
|--------------------------------------------------------------------------
*/

export default function CollegeDetail() {
  const {
    id,
  } = useParams();


  const {
    currentBranchIdx,
    setCurrentBranchIdx,

    currentBranchName,
    setCurrentBranchName,

    cdTab,
    setCdTab,

    addCompare,
    addChoice,

    profile,
    selectedExamId,
    results,
  } = useAppState();


  /*
  |--------------------------------------------------------------------------
  | UNIFIED COLLEGE DETAIL STATE
  |--------------------------------------------------------------------------
  */

  const [
    unifiedCollegeData,
    setUnifiedCollegeData,
  ] = useState(null);

  const [
    detailLoading,
    setDetailLoading,
  ] = useState(true);

  const [
    detailError,
    setDetailError,
  ] = useState('');


  /*
  |--------------------------------------------------------------------------
  | LOAD UNIFIED COLLEGE DETAIL
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      let cancelled =
        false;

      const loadUnifiedCollege =
        async () => {
          setDetailLoading(
            true
          );

          setDetailError(
            ''
          );

          setUnifiedCollegeData(
            null
          );

          try {
            const response =
              await apiRequest(
                `/colleges/${encodeURIComponent(
                  String(
                    id || ''
                  )
                )}`
              );

            const resolved =
              response?.data ??
              null;

            if (
              !cancelled
            ) {
              setUnifiedCollegeData(
                resolved
              );
            }
          } catch (error) {
            console.error(
              '[COLLEGE DETAIL] Unified API error:',
              error
            );

            if (
              !cancelled
            ) {
              setDetailError(
                error?.message ||
                'Unable to load college details.'
              );
            }
          } finally {
            if (
              !cancelled
            ) {
              setDetailLoading(
                false
              );
            }
          }
        };

      loadUnifiedCollege();

      return () => {
        cancelled =
          true;
      };
    },
    [
      id,
    ]
  );


  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (
    detailLoading
  ) {
    return (
      <div className="container section">
        <div className="empty-state">
          <h3>
            Loading college details...
          </h3>
        </div>
      </div>
    );
  }


  /*
  |--------------------------------------------------------------------------
  | UNIFIED DATA
  |--------------------------------------------------------------------------
  */

  const unifiedCollege =
    unifiedCollegeData?.college ??
    null;

  const unifiedBranches =
    Array.isArray(
      unifiedCollegeData?.branches
    )
      ? unifiedCollegeData.branches
      : [];

  const unifiedCutoffs =
    Array.isArray(
      unifiedCollegeData?.cutoffs
    )
      ? unifiedCollegeData.cutoffs
      : [];

  const unifiedFees =
    unifiedCollegeData?.fees ??
    null;


  /*
  |--------------------------------------------------------------------------
  | UNIFIED COLLEGE
  |--------------------------------------------------------------------------
  */

  const rawCollege =
    unifiedCollege ||
    null;


  /*
  |--------------------------------------------------------------------------
  | NOT FOUND
  |--------------------------------------------------------------------------
  */

  if (
    !rawCollege
  ) {
    return (
      <div className="container section">
        <div className="empty-state">
          <h3>
            College not found
          </h3>

          {detailError && (
            <p>
              {detailError}
            </p>
          )}

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


  /*
  |--------------------------------------------------------------------------
  | NORMALIZED COLLEGE-LEVEL FEE
  |--------------------------------------------------------------------------
  */

  const normalizedFee =
    unifiedFees
      ? {
          feeYear:
            unifiedFees.feeYear ??
            null,

          tuitionFeePerSemester:
            unifiedFees
              .tuitionFeePerSemester ??
            null,

          academicFeePerSemester:
            unifiedFees
              .academicFeePerSemester ??
            null,

          firstSemesterFee:
            unifiedFees
              .firstSemesterFee ??
            null,

          hostelFeePerSemester:
            unifiedFees
              .hostelFeePerSemester ??
            null,

          messFeePerSemester:
            unifiedFees
              .messFeePerSemester ??
            null,

          annualAcademicFee:
            unifiedFees
              .annualAcademicFee ??
            null,

          annualTotalFee:
            unifiedFees
              .annualTotalFee ??
            null,

          totalCourseFee:
            unifiedFees
              .totalCourseFee ??
            null,

          estimatedAnnualFee:
            unifiedFees
              .resolvedAnnualFee ??
            null,

          resolvedAnnualFee:
            unifiedFees
              .resolvedAnnualFee ??
            null,

          resolvedAnnualFeeFrom:
            unifiedFees
              .resolvedAnnualFeeFrom ??
            null,

          feeConfidence:
            unifiedFees
              .confidence ??
            null,

          feeVerificationStatus:
            unifiedFees
              .verificationStatus ??
            null,

          feeSourceUrl:
            unifiedFees
              .sourceUrl ??
            null,

          feeSourceLabel:
            unifiedFees
              .sourceKind ??
            null,

          hasFeeData:
            unifiedFees
              .hasFeeData === true,
        }
      : null;


  /*
  |--------------------------------------------------------------------------
  | UNIFIED BRANCH ADAPTER
  |--------------------------------------------------------------------------
  |
  | The backend returns raw branch rows plus a separate cutoff array.
  | The existing UI expects branch-level camelCase placement/cutoff fields.
  | This adapter changes only the data shape; the visual UI remains unchanged.
  |
  */

  const branches =
    unifiedBranches.length > 0
      ? unifiedBranches.map(
          (branch) => {
            const branchCutoffs =
              unifiedCutoffs.filter(
                (cutoff) => {
                  if (
                    branch?.id != null &&
                    cutoff?.branch_id != null &&
                    String(
                      branch.id
                    ) ===
                    String(
                      cutoff.branch_id
                    )
                  ) {
                    return true;
                  }

                  return (
                    normalizeBranchName(
                      branch?.name
                    ) ===
                    normalizeBranchName(
                      cutoff?.branch_name
                    )
                  );
                }
              );

            const cutoff2026 =
              branchCutoffs.find(
                (cutoff) =>
                  Number(
                    cutoff?.year
                  ) === 2026
              ) ||
              null;

            const historicalCutoff =
              branchCutoffs.find(
                (cutoff) =>
                  Number(
                    cutoff?.year
                  ) !== 2026
              ) ||
              cutoff2026 ||
              null;

            const primaryCutoff =
              historicalCutoff ||
              cutoff2026 ||
              null;

            return {
              ...branch,

              medianPackage:
                branch
                  ?.median_package ??
                branch
                  ?.medianPackage ??
                null,

              averagePackage:
                branch
                  ?.average_package ??
                branch
                  ?.averagePackage ??
                null,

              highestPackage:
                branch
                  ?.highest_package ??
                branch
                  ?.highestPackage ??
                null,

              placement:
                branch
                  ?.placement_rate ??
                branch
                  ?.placement ??
                null,

              fee:
                normalizedFee ||
                {},

              hasFeeData:
                normalizedFee
                  ?.hasFeeData ===
                true,

              feeYear:
                normalizedFee
                  ?.feeYear ??
                null,

              tuitionFeePerSemester:
                normalizedFee
                  ?.tuitionFeePerSemester ??
                null,

              academicFeePerSemester:
                normalizedFee
                  ?.academicFeePerSemester ??
                null,

              firstSemesterFee:
                normalizedFee
                  ?.firstSemesterFee ??
                null,

              hostelFeePerSemester:
                normalizedFee
                  ?.hostelFeePerSemester ??
                null,

              messFeePerSemester:
                normalizedFee
                  ?.messFeePerSemester ??
                null,

              annualAcademicFee:
                normalizedFee
                  ?.annualAcademicFee ??
                null,

              annualTotalFee:
                normalizedFee
                  ?.annualTotalFee ??
                null,

              totalCourseFee:
                normalizedFee
                  ?.totalCourseFee ??
                null,

              estimatedAnnualFee:
                normalizedFee
                  ?.estimatedAnnualFee ??
                null,

              feeConfidence:
                normalizedFee
                  ?.feeConfidence ??
                null,

              feeVerificationStatus:
                normalizedFee
                  ?.feeVerificationStatus ??
                null,

              feeSourceUrl:
                normalizedFee
                  ?.feeSourceUrl ??
                null,

              feeSourceLabel:
                normalizedFee
                  ?.feeSourceLabel ??
                null,

              closingRank:
                positiveNumber(
                  primaryCutoff
                    ?.closing_rank
                ),

              year:
                primaryCutoff
                  ?.year ??
                null,

              round:
                primaryCutoff
                  ?.round ??
                null,

              category:
                primaryCutoff
                  ?.category ??
                null,

              quota:
                primaryCutoff
                  ?.quota ??
                null,

              gender:
                primaryCutoff
                  ?.gender ??
                null,

              source:
                primaryCutoff
                  ?.source_label ??
                null,

              sourceUrl:
                primaryCutoff
                  ?.source_url ??
                null,

              verificationStatus:
                primaryCutoff
                  ?.verification_status ??
                (
                  primaryCutoff
                    ?.is_verified === true
                    ? 'VERIFIED'
                    : 'UNVERIFIED'
                ),

              closingRank2026:
                positiveNumber(
                  cutoff2026
                    ?.closing_rank
                ),

              openingRank2026:
                positiveNumber(
                  cutoff2026
                    ?.opening_rank
                ),

              round2026:
                cutoff2026
                  ?.round ??
                null,

              category2026:
                cutoff2026
                  ?.category ??
                null,

              quota2026:
                cutoff2026
                  ?.quota ??
                null,

              gender2026:
                cutoff2026
                  ?.gender ??
                null,

              source2026:
                cutoff2026
                  ?.source_label ??
                null,

              sourceUrl2026:
                cutoff2026
                  ?.source_url ??
                null,

              verified2026:
                cutoff2026
                  ?.is_verified ===
                true,

              verificationStatus2026:
                cutoff2026
                  ?.verification_status ??
                null,

              retrievedAt2026:
                cutoff2026
                  ?.retrieved_at ??
                null,

              cutoffRows:
                branchCutoffs,
            };
          }
        )
      : [];


  /*
  |--------------------------------------------------------------------------
  | FINAL COLLEGE VIEW MODEL
  |--------------------------------------------------------------------------
  */

  const c = {
    ...(unifiedCollege || {}),

    identity:
      unifiedCollegeData
        ?.identity ??
      null,

    fees:
      unifiedFees,

    quality:
      unifiedCollegeData
        ?.quality ??
      null,

    reviews:
      unifiedCollegeData
        ?.reviews ??
      null,

    cutoffs:
      unifiedCutoffs,

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

  /*
  |--------------------------------------------------------------------------
  | SAFE BRANCH SELECTION
  |--------------------------------------------------------------------------
  |
  | Prefer the exact branch name clicked on Results. Array positions are not
  | stable because the unified college API may return branches in a different
  | order from the recommendation results.
  |--------------------------------------------------------------------------
  */

  const selectedBranchIndex =
    currentBranchName
      ? branches.findIndex(
          (branch) =>
            normalizeBranchName(
              branch?.name
            ) ===
            normalizeBranchName(
              currentBranchName
            )
        )
      : -1;


  const safeBranchIndex =
    selectedBranchIndex >= 0
      ? selectedBranchIndex
      : Math.min(
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


  /*
  |--------------------------------------------------------------------------
  | MATCH SCORE - SINGLE SOURCE OF TRUTH
  |--------------------------------------------------------------------------
  |
  | Results cards already contain the recommendation percentage in
  | row.overall. College Detail must reuse that exact score instead of
  | calculating a second, different percentage.
  |
  | We first locate the same college + branch inside the existing results.
  | If the page was opened directly and no result row is available, we fall
  | back to the old rank-based calculation so the page still works.
  |--------------------------------------------------------------------------
  */

  const matchingResult =
    Array.isArray(results)
      ? results.find(
          (row) => {
            const rowCollegeId =
              row?.collegeId ??
              row?.college?.id ??
              row?.college_id ??
              null;

            const currentCollegeId =
              c?.id ??
              id ??
              null;

            const rowBranchName =
              row?.branch?.name ??
              row?.branch_name ??
              '';

            const currentBranchName =
              b?.name ??
              '';

            return (
              String(rowCollegeId ?? '') ===
                String(currentCollegeId ?? '') &&
              normalizeBranchName(
                rowBranchName
              ) ===
                normalizeBranchName(
                  currentBranchName
                )
            );
          }
        ) ||
        results.find(
          (row) => {
            const rowCollegeId =
              row?.collegeId ??
              row?.college?.id ??
              row?.college_id ??
              null;

            const currentCollegeId =
              c?.id ??
              id ??
              null;

            return (
              String(rowCollegeId ?? '') ===
              String(currentCollegeId ?? '')
            );
          }
        ) ||
        null
      : null;


  const resultOverall =
    positiveNumber(
      matchingResult?.overall ??
      matchingResult?.match ??
      matchingResult?.matchScore ??
      matchingResult?.overallMatch ??
      matchingResult?.score
    );


  const fallbackRankMatch =
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


  const match =
    resultOverall > 0
      ? Math.min(
          100,
          Math.round(
            resultOverall
          )
        )
      : fallbackRankMatch;


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
        description={`${c.city || ''}, ${c.state || ''}${
          c.established ? ` - Est. ${c.established}` : ''
        }${
          c.type ? ` | ${c.type}` : ''
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
              Visit Official Website
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
            setBranch={(index) => {
              const selected =
                branches[index];

              setCurrentBranchIdx(
                index
              );

              setCurrentBranchName(
                selected?.name || ''
              );
            }}
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
            Why this college matches you |{' '}

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
            {match}% | Branch preference:{' '}

            {profile
              ?.branches
              ?.includes(
                b.name
              )
              ? 95
              : 62}
            % | Budget:{' '}

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
                : 'Fees are above your selected budget - worth reviewing scholarships.'}
            </li>


            <li>
              Admission estimates
              are based on
              historical data -
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
        same recommendation score
        shown on the Results page
        when available.
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
            - not equivalents.
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
                  -{' '}
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
            patterns - verify
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
        'Verified Source',

      className:
        'verified',
    },

    UNVERIFIED: {
      label:
        'Unverified',

      className:
        'unverified',
    },

    STALE: {
      label:
        'Stale Data',

      className:
        'stale',
    },

    REJECTED: {
      label:
        'Rejected Source',

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
              Open source
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
    tuitionFeePerSemester,
    firstSemesterFee,

    hostelFeePerSemester,
    messFeePerSemester,

    annualAcademicFee,
    annualHostelMessFee,
    annualTotal,

    courseTotal,

    annualTotalIsEstimated,

    feeYear,
    feeCoverage,
    feeConfidence,
    feeVerificationStatus,
    feeSourceUrl,
    feeSourceLabel,

    hasFeeData,
  } = feeData;


  const showMoney = (
    value
  ) => {
    return value > 0
      ? `\u20B9${formatMoney(value)}`
      : 'N/A';
  };


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
      ? 'High Confidence'

      : normalizedStatus ===
        'review_recommended'
      ? 'Review Recommended'

      : normalizedStatus ===
        'needs_review'
      ? 'Needs Review'

      : normalizedStatus ===
        'pending_review'
      ? 'Pending Review'

      : feeVerificationStatus ||
        'Not Verified';


  const FeeRow = ({
    label,
    value,
    note,
  }) => (
    <div
      style={{
        display:
          'flex',

        justifyContent:
          'space-between',

        alignItems:
          'flex-start',

        gap:
          20,

        padding:
          '12px 0',

        borderBottom:
          '1px solid #eef0f3',
      }}
    >

      <div>
        <div
          style={{
            fontSize:
              14,

            fontWeight:
              500,

            color:
              'var(--ink-2)',
          }}
        >
          {label}
        </div>

        {note && (
          <div
            style={{
              fontSize:
                11.5,

              color:
                'var(--ink-3)',

              marginTop:
                3,
            }}
          >
            {note}
          </div>
        )}
      </div>


      <strong
        className="mono"
        style={{
          fontSize:
            15,

          whiteSpace:
            'nowrap',
        }}
      >
        {showMoney(
          value
        )}
      </strong>

    </div>
  );


  return (
    <div className="card">

      <h4>
        Fee Structure
      </h4>


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
            Official fee information
            will appear here once it
            is available in our
            database.

            {' '}

            Rs. 0 is not shown because
            missing fee data should
            not be treated as zero
            fee.
          </div>

        </>
      ) : (
        <>

          {/*
          |--------------------------------------------------------------------------
          | SEMESTER BREAKDOWN
          |--------------------------------------------------------------------------
          */}

          <div
            style={{
              marginTop:
                8,

              marginBottom:
                24,
            }}
          >

            <FeeRow
              label="Tuition / Semester"
              value={
                tuitionFeePerSemester
              }
            />


            <FeeRow
              label="First Semester"
              value={
                firstSemesterFee
              }
            />


            <FeeRow
              label="Hostel / Semester"
              value={
                hostelFeePerSemester
              }
            />


            <FeeRow
              label="Mess / Semester"
              value={
                messFeePerSemester
              }
            />

          </div>


          {/*
          |--------------------------------------------------------------------------
          | ANNUAL BREAKDOWN
          |--------------------------------------------------------------------------
          */}

          <div
            style={{
              paddingTop:
                4,

              marginBottom:
                24,
            }}
          >

            <FeeRow
              label="Annual Academic Fee"
              value={
                annualAcademicFee
              }
            />


            <FeeRow
              label="Annual Hostel + Mess"
              value={
                annualHostelMessFee
              }
              note={
                annualHostelMessFee > 0 &&
                (
                  hostelFeePerSemester > 0 ||
                  messFeePerSemester > 0
                )
                  ? 'Calculated from available semester hostel/mess fees.'
                  : null
              }
            />


            <FeeRow
              label={
                annualTotalIsEstimated
                  ? 'Annual Total (Estimated)'
                  : 'Annual Total'
              }
              value={
                annualTotal
              }
            />

          </div>


          {/*
          |--------------------------------------------------------------------------
          | COURSE TOTAL
          |--------------------------------------------------------------------------
          */}

          <div
            style={{
              padding:
                '16px 18px',

              border:
                '1px solid #e5e7eb',

              borderRadius:
                10,

              marginBottom:
                20,
            }}
          >

            <div
              style={{
                display:
                  'flex',

                justifyContent:
                  'space-between',

                alignItems:
                  'center',

                gap:
                  20,
              }}
            >

              <div>

                <div
                  style={{
                    fontSize:
                      14,

                    fontWeight:
                      600,
                  }}
                >
                  Course Total
                </div>


                <div
                  style={{
                    fontSize:
                      11.5,

                    color:
                      'var(--ink-3)',

                    marginTop:
                      3,
                  }}
                >
                  Full programme fee
                  where available.
                </div>

              </div>


              <strong
                className="mono"
                style={{
                  fontSize:
                    20,

                  whiteSpace:
                    'nowrap',
                }}
              >
                {
                  showMoney(
                    courseTotal
                  )
                }
              </strong>

            </div>

          </div>


          {/*
          |--------------------------------------------------------------------------
          | META
          |--------------------------------------------------------------------------
          */}

          <div
            className="source-note"
          >

            {feeYear && (

              <div
                style={{
                  marginBottom:
                    6,
                }}
              >
                Fee Year:{' '}

                <strong>
                  {feeYear}
                </strong>
              </div>

            )}


            {feeCoverage && (

              <div
                style={{
                  marginBottom:
                    6,
                }}
              >
                Coverage:{' '}

                <strong>
                  {feeCoverage}
                </strong>
              </div>

            )}


            <div
              style={{
                marginBottom:
                  6,
              }}
            >
              Verification:{' '}

              <strong>
                {
                  verificationLabel
                }
              </strong>
            </div>


            {feeConfidence != null &&
              Number(
                feeConfidence
              ) > 0 && (

              <div
                style={{
                  marginBottom:
                    6,
                }}
              >
                Confidence:{' '}

                <strong>
                  {
                    feeConfidence
                  }%
                </strong>
              </div>

            )}


            <div>
              Source:{' '}

              <strong>
                {
                  feeSourceLabel ||
                  (
                    feeSourceUrl
                      ? 'Recorded Fee Source'
                      : 'TruMarg'
                  )
                }
              </strong>
            </div>

          </div>


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
                View Fee Source
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
            income, semester,
            hostel option and
            academic year.

            {' '}

            Always verify the latest
            payable amount from the
            recorded source before
            payment.
          </div>

        </>
      )}

    </div>
  );
}/*
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
                {'\u20B9'}
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
                {'\u20B9'}
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
                {'\u20B9'}
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


