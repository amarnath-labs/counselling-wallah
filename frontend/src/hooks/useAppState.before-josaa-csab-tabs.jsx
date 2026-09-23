import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  fetchCWRecommendations,
} from '../services/cwRecRecommendationService';

import {
  getApiCatalog,
} from '../services/apiClient';

import {
  fetchJosaaResults,
} from '../services/josaaRecommendationService';

import {
  fetchCounsellingResults,
} from '../services/counsellingService';

import {
  getCollegeById,
} from '../services/collegeService';

import {
  getCurrentUser,
  logout,
} from '../services/authService';


/*
|--------------------------------------------------------------------------
| INITIAL PROFILE
|--------------------------------------------------------------------------
*/

const initialProfile = {
  rank: 3000,
  pct: '',
  year: '2026',
  category: 'General',
  gender: 'Male',
  homeState: 'Maharashtra',
  branches: [
    'CSE',
    'IT',
  ],
  budget: 1000000,
  type: 'Both',
  hostel: 'Yes',
  prefState: '',
};


const AppContext =
  createContext(null);


/*
|--------------------------------------------------------------------------
| RESULT HELPERS
|--------------------------------------------------------------------------
*/

function getRowCollegeId(row) {
  return String(
    row?.collegeId ??
    row?.college?.id ??
    row?.college_id ??
    ''
  ).trim();
}


function getRowBranchName(row) {
  return String(
    row?.branch?.name ??
    row?.branch_name ??
    ''
  ).trim();
}


/*
|--------------------------------------------------------------------------
| WEBSITE HELPER
|--------------------------------------------------------------------------
*/

function getCollegeWebsite(
  ...sources
) {
  for (const source of sources) {
    if (!source) {
      continue;
    }

    const value =
      source?.officialWebsite ??
      source?.official_website ??
      source?.websiteUrl ??
      source?.website_url ??
      source?.website ??
      null;

    if (
      typeof value === 'string' &&
      value.trim()
    ) {
      return value.trim();
    }
  }

  return null;
}


/*
|--------------------------------------------------------------------------
| MERGE COLLEGE
|--------------------------------------------------------------------------
|
| Result data contains counselling/branch information.
| Catalog data contains master college information such as website.
| Legacy data is kept as fallback.
|
*/

function mergeCollegeData({
  resultCollege,
  catalogCollege,
  legacyCollege,
}) {
  if (
    !resultCollege &&
    !catalogCollege &&
    !legacyCollege
  ) {
    return null;
  }

  const website =
    getCollegeWebsite(
      resultCollege,
      catalogCollege,
      legacyCollege
    );

  return {
    ...(legacyCollege || {}),
    ...(catalogCollege || {}),
    ...(resultCollege || {}),

    /*
    |--------------------------------------------------------------------------
    | IMPORTANT:
    | Preserve the official website even when resultCollege does not contain it.
    |--------------------------------------------------------------------------
    */

    website,

    officialWebsite:
      website,

    websiteUrl:
      website,

    /*
    |--------------------------------------------------------------------------
    | Prefer result branches because they contain current counselling data.
    |--------------------------------------------------------------------------
    */

    branches:
      Array.isArray(
        resultCollege?.branches
      ) &&
      resultCollege.branches.length > 0
        ? resultCollege.branches

        : Array.isArray(
            catalogCollege?.branches
          ) &&
          catalogCollege.branches.length > 0
        ? catalogCollege.branches

        : Array.isArray(
            legacyCollege?.branches
          )
        ? legacyCollege.branches

        : [],
  };
}


function buildCollegeFromResults(
  collegeId,
  rows
) {
  if (!collegeId) {
    return null;
  }

  const matches =
    (
      Array.isArray(rows)
        ? rows
        : []
    ).filter(
      (row) =>
        getRowCollegeId(row) ===
        String(collegeId)
    );

  if (
    matches.length === 0
  ) {
    return null;
  }


  const first =
    matches[0];

  const firstCollege =
    first?.college || {};


  /*
  |--------------------------------------------------------------------------
  | BRANCHES
  |--------------------------------------------------------------------------
  */

  const branchMap =
    new Map();


  for (const row of matches) {
    const sourceBranch =
      row?.branch || {};

    const branchName =
      getRowBranchName(row);

    if (!branchName) {
      continue;
    }


    const key =
      branchName
        .toLowerCase();


    /*
    |--------------------------------------------------------------------------
    | Keep first occurrence of each branch.
    |--------------------------------------------------------------------------
    */

    if (
      !branchMap.has(key)
    ) {
      branchMap.set(
        key,
        {
          ...sourceBranch,

          id:
            sourceBranch?.id ??
            row?.branch_id ??
            `${collegeId}-${key}`,

          name:
            branchName,

          openingRank:
            sourceBranch?.openingRank ??
            row?.openingRank ??
            row?.opening_rank ??
            null,

          closingRank:
            sourceBranch?.closingRank ??
            row?.closingRank ??
            row?.closing_rank ??
            null,

          round:
            row?.counselling?.round ??
            row?.round ??
            sourceBranch?.round ??
            null,

          category:
            row?.counselling?.category ??
            row?.category ??
            null,

          quota:
            row?.counselling?.quota ??
            row?.quota ??
            null,

          gender:
            row?.counselling?.gender ??
            row?.gender ??
            null,

          source:
            row?.counselling?.source ??
            row?.source ??
            null,

          sourceUrl:
            row?.counselling?.sourceUrl ??
            row?.sourceUrl ??
            null,

          verificationStatus:
            row?.counselling
              ?.verificationStatus ??
            row?.verificationStatus ??
            null,


          /*
          |--------------------------------------------------------------------------
          | Legacy fields kept for existing CollegeDetail components.
          |--------------------------------------------------------------------------
          */

          fees:
            sourceBranch?.fees ??
            row?.annualAcademicFee ??
            row?.fee
              ?.annualAcademicFee ??
            0,

          placement:
            sourceBranch?.placement ??
            row?.placementRate ??
            row?.placement_rate ??
            0,

          medianPackage:
            sourceBranch?.medianPackage ??
            row?.medianPackage ??
            null,

          averagePackage:
            sourceBranch?.averagePackage ??
            row?.averagePackage ??
            null,

          highestPackage:
            sourceBranch?.highestPackage ??
            row?.highestPackage ??
            null,


          /*
          |--------------------------------------------------------------------------
          | Official fee data
          |--------------------------------------------------------------------------
          */

          fee:
            row?.fee ||
            null,

          feeYear:
            row?.fee?.feeYear ??
            row?.feeYear ??
            null,

          tuitionFeePerSemester:
            row?.fee
              ?.tuitionFeePerSemester ??
            row?.tuitionFeePerSemester ??
            null,

          academicFeePerSemester:
            row?.fee
              ?.academicFeePerSemester ??
            row?.academicFeePerSemester ??
            null,

          firstSemesterFee:
            row?.fee
              ?.firstSemesterFee ??
            row?.firstSemesterFee ??
            null,

          messFeePerSemester:
            row?.fee
              ?.messFeePerSemester ??
            row?.messFeePerSemester ??
            null,

          annualAcademicFee:
            row?.fee
              ?.annualAcademicFee ??
            row?.annualAcademicFee ??
            null,

          estimatedAnnualBudgetFee:
            row?.fee
              ?.estimatedAnnualBudgetFee ??
            row?.estimatedAnnualBudgetFee ??
            null,

          feeCoverage:
            row?.fee
              ?.feeCoverage ??
            row?.feeCoverage ??
            null,

          feeConfidence:
            row?.fee
              ?.feeConfidence ??
            row?.feeConfidence ??
            null,

          feeVerificationStatus:
            row?.fee
              ?.feeVerificationStatus ??
            row?.feeVerificationStatus ??
            null,

          feeSourceUrl:
            row?.fee
              ?.feeSourceUrl ??
            row?.feeSourceUrl ??
            null,

          /*
          |--------------------------------------------------------------------------
          | COMPLETE FEE BREAKDOWN
          |--------------------------------------------------------------------------
          */

          hostelFee:
            row?.fee?.hostelFee ??
            row?.hostelFee ??
            null,

          otherFee:
            row?.fee?.otherFee ??
            row?.otherFee ??
            null,

          totalAnnualFee:
            row?.fee?.totalAnnualFee ??
            row?.totalAnnualFee ??
            null,

          feeSourceLabel:
            row?.fee?.feeSourceLabel ??
            row?.feeSourceLabel ??
            null,
        }
      );
    }
  }


  const branches =
    Array.from(
      branchMap.values()
    );


  /*
  |--------------------------------------------------------------------------
  | Ensure CollegeDetail always has at least one branch.
  |--------------------------------------------------------------------------
  */

  if (
    branches.length === 0
  ) {
    branches.push({
      id:
        first?.branch?.id ??
        first?.branch_id ??
        `${collegeId}-branch`,

      name:
        getRowBranchName(first) ||
        'Branch',

      openingRank:
        first?.branch
          ?.openingRank ??
        first?.openingRank ??
        first?.opening_rank ??
        null,

      closingRank:
        first?.branch
          ?.closingRank ??
        first?.closingRank ??
        first?.closing_rank ??
        null,

      fees: 0,

      placement: 0,
    });
  }


  /*
  |--------------------------------------------------------------------------
  | COLLEGE
  |--------------------------------------------------------------------------
  */

  const website =
    getCollegeWebsite(
      firstCollege,
      first
    );


  return {
    ...firstCollege,

    id:
      String(
        collegeId
      ),

    name:
      firstCollege?.name ??
      first?.college_name ??
      'Unknown College',

    city:
      firstCollege?.city ??
      first?.city ??
      '',

    state:
      firstCollege?.state ??
      first?.state ??
      '',

    type:
      firstCollege?.type ??
      first?.type ??
      'Unknown',

    established:
      firstCollege?.established ??
      first?.established ??
      '',


    /*
    |--------------------------------------------------------------------------
    | Official website
    |--------------------------------------------------------------------------
    */

    website,

    officialWebsite:
      website,

    websiteUrl:
      website,


    branches,
  };
}


/*
|--------------------------------------------------------------------------
| APP STATE
|--------------------------------------------------------------------------
*/

export function AppStateProvider({
  children,
}) {
  const [
    selectedExamIdState,
    setSelectedExamIdState,
  ] = useState(
    () => {
      try {
        return (
          localStorage.getItem(
            'selectedExamId'
          ) ||
          'jee-main'
        );
      } catch {
        return 'jee-main';
      }
    }
  );


  const [
    profile,
    setProfile,
  ] = useState(
    initialProfile
  );


  const [
    results,
    setResults,
  ] = useState([]);


  const [
    resultsExamId,
    setResultsExamId,
  ] = useState(null);


  const [
    resultsLoading,
    setResultsLoading,
  ] = useState(false);


  const [
    resultsError,
    setResultsError,
  ] = useState('');


  const [
    exams,
    setExams,
  ] = useState([]);


  const [
    colleges,
    setColleges,
  ] = useState([]);


  const [
    counsellingEvents,
    setCounsellingEvents,
  ] = useState([]);


  const [
    catalogLoading,
    setCatalogLoading,
  ] = useState(true);


  const [
    catalogError,
    setCatalogError,
  ] = useState('');


  const [
    compareList,
    setCompareList,
  ] = useState([]);


  const [
    choiceList,
    setChoiceList,
  ] = useState([]);


  const [
    currentCollegeId,
    setCurrentCollegeId,
  ] = useState(null);


  const [
    currentBranchIdx,
    setCurrentBranchIdx,
  ] = useState(0);


  const [
    cdTab,
    setCdTab,
  ] = useState(
    'overview'
  );


  /*
  |--------------------------------------------------------------------------
  | AUTH STATE
  |--------------------------------------------------------------------------
  */

  const [
    user,
    setUser,
  ] = useState(null);


  const [
    authLoading,
    setAuthLoading,
  ] = useState(true);


  const [
    authError,
    setAuthError,
  ] = useState('');


  const refreshUser =
    async () => {
      try {
        setAuthLoading(true);
        setAuthError('');

        const response =
          await getCurrentUser();

        const currentUser =
          response?.data?.user ||
          response?.user ||
          null;

        setUser(
          currentUser
        );

        return currentUser;

      } catch (error) {
        if (
          error?.status === 401
        ) {
          setUser(null);
          return null;
        }

        setUser(null);

        setAuthError(
          error?.message ||
          'Unable to load account.'
        );

        return null;

      } finally {
        setAuthLoading(false);
      }
    };


  const logoutUser =
    async () => {
      try {
        await logout();
      } finally {
        setUser(null);
        setAuthError('');

        window.dispatchEvent(
          new Event(
            'cw-auth-changed'
          )
        );
      }
    };


  useEffect(
    () => {
      let cancelled = false;

      const loadUser =
        async () => {
          const currentUser =
            await refreshUser();

          if (cancelled) {
            return;
          }

          return currentUser;
        };

      loadUser();

      const handleAuthChange =
        () => {
          if (!cancelled) {
            refreshUser();
          }
        };

      window.addEventListener(
        'cw-auth-changed',
        handleAuthChange
      );

      return () => {
        cancelled = true;

        window.removeEventListener(
          'cw-auth-changed',
          handleAuthChange
        );
      };
    },
    []
  );


  /*
  |--------------------------------------------------------------------------
  | SELECTED EXAM
  |--------------------------------------------------------------------------
  */

  const selectedExamId =
    String(
      selectedExamIdState ||
      'jee-main'
    )
      .trim()
      .toLowerCase();


  const setSelectedExamId =
    (examId) => {
      const value =
        String(
          examId || ''
        )
          .trim()
          .toLowerCase();


      if (!value) {
        return;
      }


      try {
        localStorage.setItem(
          'selectedExamId',
          value
        );
      } catch {
        // Ignore storage error.
      }


      setSelectedExamIdState(
        value
      );

      setResults([]);

      setResultsExamId(
        null
      );

      setResultsError('');

      setResultsLoading(
        false
      );
    };


  /*
  |--------------------------------------------------------------------------
  | API CATALOG
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      let cancelled =
        false;


      const loadCatalog =
        async () => {
          setCatalogLoading(
            true
          );

          setCatalogError('');


          try {
            const catalog =
              await getApiCatalog();


            if (cancelled) {
              return;
            }


            setExams(
              Array.isArray(
                catalog?.exams
              )
                ? catalog.exams
                : []
            );


            setColleges(
              Array.isArray(
                catalog?.colleges
              )
                ? catalog.colleges
                : []
            );


            setCounsellingEvents(
              Array.isArray(
                catalog
                  ?.counsellingEvents
              )
                ? catalog
                    .counsellingEvents
                : []
            );

          } catch (error) {

            if (cancelled) {
              return;
            }


            setCatalogError(
              error?.message ||
              'Unable to load API catalog.'
            );

          } finally {

            if (!cancelled) {
              setCatalogLoading(
                false
              );
            }
          }
        };


      loadCatalog();


      return () => {
        cancelled =
          true;
      };
    },
    []
  );


  /*
  |--------------------------------------------------------------------------
  | CURRENT COLLEGE
  |--------------------------------------------------------------------------
  |
  | Merge:
  |
  | 1. Counselling result
  | 2. API catalog
  | 3. Legacy/static data
  |
  | This prevents fields like website from disappearing.
  |
  */

  const currentCollege =
    useMemo(
      () => {
        if (
          !currentCollegeId
        ) {
          return null;
        }


        /*
        |--------------------------------------------------------------------------
        | RESULT COLLEGE
        |--------------------------------------------------------------------------
        */

        const resultCollege =
          buildCollegeFromResults(
            currentCollegeId,
            results
          );


        /*
        |--------------------------------------------------------------------------
        | API CATALOG COLLEGE
        |--------------------------------------------------------------------------
        */

        const catalogCollege =
          colleges.find(
            (college) =>
              String(
                college?.id
              ) ===
              String(
                currentCollegeId
              )
          ) ||
          null;


        /*
        |--------------------------------------------------------------------------
        | LEGACY COLLEGE
        |--------------------------------------------------------------------------
        */

        const legacyCollege =
          getCollegeById(
            currentCollegeId
          ) ||
          null;


        /*
        |--------------------------------------------------------------------------
        | Merge all sources.
        |--------------------------------------------------------------------------
        */

        return mergeCollegeData({
          resultCollege,
          catalogCollege,
          legacyCollege,
        });
      },
      [
        currentCollegeId,
        results,
        colleges,
      ]
    );


  /*
  |--------------------------------------------------------------------------
  | GENERATE RESULTS
  |--------------------------------------------------------------------------
  */

  const generateResults =
    async (
      nextProfile
    ) => {
      const p = {
        ...(
          nextProfile ||
          profile
        ),

        examId:
          nextProfile
            ?.examId ||
          selectedExamId,
      };


      const requestExamId =
        String(
          p.examId || ''
        )
          .trim()
          .toLowerCase();


      if (
        !requestExamId
      ) {
        throw new Error(
          'Exam ID is missing from profile.'
        );
      }


      setResults([]);

      setResultsExamId(
        null
      );

      setResultsError('');

      setResultsLoading(
        true
      );


      const exactProfile = {
        ...p,

        examId:
          requestExamId,
      };


      setProfile(
        exactProfile
      );


      console.log(
        '[RESULTS] Exam:',
        requestExamId
      );


      console.log(
        '[RESULTS] Profile:',
        exactProfile
      );


      try {
        let rows;


        /*
        |--------------------------------------------------------------------------
        | UPTAC
        |--------------------------------------------------------------------------
        */

        if (
          requestExamId ===
          'uptac'
        ) {
          console.log(
            '[UPTAC] Calling PostgreSQL API...'
          );


          const uptacCategory =
            exactProfile.category ===
              'General' ||
            exactProfile.category ===
              'GEN' ||
            !exactProfile.category
              ? 'OPEN'
              : exactProfile.category;


          rows =
            await fetchCounsellingResults({
              examId:
                'uptac',

              rank:
                Number(
                  exactProfile.rank
                ),

              category:
                uptacCategory,

              year:
                2025,

              round:
                Number(
                  exactProfile.round ||
                  1
                ),

              profile:
                exactProfile,
            });


          console.log(
            '[UPTAC] Rows received:',
            Array.isArray(rows)
              ? rows.length
              : 0
          );

        } else {

          /*
          |--------------------------------------------------------------------------
          | JEE / OTHER SUPPORTED RESULTS
          |--------------------------------------------------------------------------
          */

          const cwRecResponse =
            await fetchCWRecommendations(
              {
                ...exactProfile,

                examId:
                  requestExamId,

                rank:
                  Number(
                    exactProfile.rank
                  ),

                year:
                  Number(
                    exactProfile.year ||
                    2026
                  ),

                round:
                  Number(
                    exactProfile.round ||
                    1
                  ),

                category:
                  exactProfile.category,

                gender:
                  exactProfile.gender,

                homeState:
                  exactProfile.homeState,
              },
              {
                limit: 1000,
              }
            );

          rows =
            Array.isArray(
              cwRecResponse?.data
            )
              ? cwRecResponse.data
              : [];
        }


        const safeRows =
          Array.isArray(rows)
            ? rows
            : [];


        setResults(
          safeRows
        );


        setResultsExamId(
          requestExamId
        );


        return safeRows;

      } catch (error) {

        console.error(
          '[RESULTS] API error:',
          error
        );


        setResults([]);

        setResultsExamId(
          null
        );


        setResultsError(
          error?.message ||
          'Unable to load counselling results.'
        );


        throw error;

      } finally {

        setResultsLoading(
          false
        );
      }
    };


  /*
  |--------------------------------------------------------------------------
  | OPEN COLLEGE
  |--------------------------------------------------------------------------
  */

  const openCollege =
    (
      id,
      branchName
    ) => {
      const safeId =
        String(
          id || ''
        ).trim();


      if (!safeId) {
        return;
      }


      /*
      |--------------------------------------------------------------------------
      | RESULT COLLEGE
      |--------------------------------------------------------------------------
      */

      const resultCollege =
        buildCollegeFromResults(
          safeId,
          results
        );


      /*
      |--------------------------------------------------------------------------
      | API CATALOG COLLEGE
      |--------------------------------------------------------------------------
      */

      const catalogCollege =
        colleges.find(
          (college) =>
            String(
              college?.id
            ) === safeId
        ) ||
        null;


      /*
      |--------------------------------------------------------------------------
      | LEGACY COLLEGE
      |--------------------------------------------------------------------------
      */

      const legacyCollege =
        getCollegeById(
          safeId
        ) ||
        null;


      /*
      |--------------------------------------------------------------------------
      | Merge all available data.
      |--------------------------------------------------------------------------
      */

      const college =
        mergeCollegeData({
          resultCollege,
          catalogCollege,
          legacyCollege,
        });


      setCurrentCollegeId(
        safeId
      );


      const wantedBranch =
        String(
          branchName || ''
        ).trim();


      const branchIndex =
        college
          ?.branches
          ?.findIndex(
            (branch) =>
              String(
                branch?.name ||
                ''
              ).trim() ===
              wantedBranch
          );


      setCurrentBranchIdx(
        Math.max(
          0,
          branchIndex >= 0
            ? branchIndex
            : 0
        )
      );


      setCdTab(
        'overview'
      );
    };


  /*
  |--------------------------------------------------------------------------
  | COMPARE
  |--------------------------------------------------------------------------
  */

  const addCompare =
    (
      collegeId,
      branchName
    ) => {
      setCompareList(
        (prev) => {
          const exists =
            prev.some(
              (item) =>
                item.collegeId ===
                  collegeId &&
                item.branchName ===
                  branchName
            );


          if (
            exists ||
            prev.length >= 5
          ) {
            return prev;
          }


          return [
            ...prev,
            {
              collegeId,
              branchName,
            },
          ];
        }
      );
    };


  /*
  |--------------------------------------------------------------------------
  | CHOICE LIST
  |--------------------------------------------------------------------------
  */

  const addChoice =
    (
      collegeId,
      branchName
    ) => {
      setChoiceList(
        (prev) => {
          const exists =
            prev.some(
              (item) =>
                item.collegeId ===
                  collegeId &&
                item.branchName ===
                  branchName
            );


          if (exists) {
            return prev;
          }


          return [
            ...prev,
            {
              collegeId,
              branchName,
            },
          ];
        }
      );
    };


  /*
  |--------------------------------------------------------------------------
  | CONTEXT VALUE
  |--------------------------------------------------------------------------
  */

  const value = {
    user,
    setUser,
    authLoading,
    authError,
    refreshUser,
    logoutUser,

    selectedExamId,
    setSelectedExamId,

    profile,
    setProfile,

    results,
    setResults,

    resultsExamId,

    generateResults,

    resultsLoading,
    resultsError,

    exams,
    colleges,
    counsellingEvents,

    catalogLoading,
    catalogError,

    compareList,
    setCompareList,

    choiceList,
    setChoiceList,

    currentCollegeId,
    currentCollege,

    currentBranchIdx,
    setCurrentBranchIdx,

    cdTab,
    setCdTab,

    openCollege,
    addCompare,
    addChoice,
  };


  return (
    <AppContext.Provider
      value={value}
    >
      {children}
    </AppContext.Provider>
  );
}


export const useAppState =
  () =>
    useContext(
      AppContext
    );