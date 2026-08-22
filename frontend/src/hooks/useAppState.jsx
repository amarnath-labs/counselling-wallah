import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  getApiCatalog,
} from '../services/apiClient';

import {
  fetchJosaaResults,
} from '../services/josaaRecommendationService';

import {
  getCollegeById,
} from '../services/collegeService';

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

export function AppStateProvider({
  children,
}) {
  /*
  |--------------------------------------------------------------------------
  | SELECTED EXAM
  |--------------------------------------------------------------------------
  */

  const [
    selectedExamIdState,
    setSelectedExamIdState,
  ] = useState(() => {
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
  });

  /*
  |--------------------------------------------------------------------------
  | PROFILE
  |--------------------------------------------------------------------------
  */

  const [
    profile,
    setProfile,
  ] = useState(initialProfile);

  /*
  |--------------------------------------------------------------------------
  | RESULTS
  |--------------------------------------------------------------------------
  */

  const [
    results,
    setResults,
  ] = useState([]);

  /*
  |--------------------------------------------------------------------------
  | EXAM ID OF CURRENT RESULTS
  |--------------------------------------------------------------------------
  */

  const [
    resultsExamId,
    setResultsExamId,
  ] = useState(null);

  /*
  |--------------------------------------------------------------------------
  | LOADING / ERROR
  |--------------------------------------------------------------------------
  */

  const [
    resultsLoading,
    setResultsLoading,
  ] = useState(false);

  const [
    resultsError,
    setResultsError,
  ] = useState('');

  /*
  |--------------------------------------------------------------------------
  | CATALOG
  |--------------------------------------------------------------------------
  */

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

  /*
  |--------------------------------------------------------------------------
  | OTHER APP STATE
  |--------------------------------------------------------------------------
  */

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
  ] = useState('overview');

  /*
  |--------------------------------------------------------------------------
  | SELECTED EXAM VALUE
  |--------------------------------------------------------------------------
  */

  const selectedExamId =
    String(
      selectedExamIdState ||
        'jee-main'
    )
      .trim()
      .toLowerCase();

  /*
  |--------------------------------------------------------------------------
  | SET SELECTED EXAM
  |--------------------------------------------------------------------------
  */

  const setSelectedExamId = (
    examId
  ) => {
    const value =
      String(
        examId || ''
      )
        .trim()
        .toLowerCase();

    if (!value) {
      return;
    }

    console.log(
      '[EXAM SELECTED]',
      value
    );

    try {
      localStorage.setItem(
        'selectedExamId',
        value
      );
    } catch {
      // Ignore localStorage failures.
    }

    setSelectedExamIdState(
      value
    );

    /*
    |--------------------------------------------------------------------------
    | Clear results from previous exam
    |--------------------------------------------------------------------------
    */

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
  | LOAD API CATALOG
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    let cancelled =
      false;

    const loadCatalog =
      async () => {
        setCatalogLoading(
          true
        );

        setCatalogError('');

        console.log(
          '[FRONTEND] Loading API catalog...'
        );

        try {
          const catalog =
            await getApiCatalog();

          if (
            cancelled
          ) {
            return;
          }

          const apiExams =
            Array.isArray(
              catalog?.exams
            )
              ? catalog.exams
              : [];

          const apiColleges =
            Array.isArray(
              catalog?.colleges
            )
              ? catalog.colleges
              : [];

          const apiEvents =
            Array.isArray(
              catalog?.counsellingEvents
            )
              ? catalog.counsellingEvents
              : [];

          setExams(
            apiExams
          );

          setColleges(
            apiColleges
          );

          setCounsellingEvents(
            apiEvents
          );

          console.log(
            '[FRONTEND] API catalog received:',
            {
              exams:
                apiExams.length,

              colleges:
                apiColleges.length,

              counsellingEvents:
                apiEvents.length,
            }
          );

          console.log(
            '[FRONTEND] Exams:',
            apiExams
          );

        } catch (
          error
        ) {
          if (
            cancelled
          ) {
            return;
          }

          console.error(
            '[FRONTEND] Failed to load API catalog:',
            error
          );

          setCatalogError(
            error?.message ||
              'Unable to load API catalog.'
          );

        } finally {
          if (
            !cancelled
          ) {
            setCatalogLoading(
              false
            );
          }
        }
      };

    loadCatalog();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | CURRENT COLLEGE
  |--------------------------------------------------------------------------
  */

  const currentCollege =
    useMemo(
      () =>
        getCollegeById(
          currentCollegeId
        ),
      [
        currentCollegeId,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | GENERATE RESULTS
  |--------------------------------------------------------------------------
  |
  | IMPORTANT:
  |
  | This function uses the JoSAA API.
  |
  | It does NOT use:
  |
  | computeResults()
  |
  | and does NOT use local college data
  | as the counselling result source.
  |--------------------------------------------------------------------------
  */

  const generateResults =
    async (
      nextProfile
    ) => {

      /*
      |--------------------------------------------------------------------------
      | Exact profile
      |--------------------------------------------------------------------------
      */

      const p = {
        ...(nextProfile ||
          profile),

        examId:
          nextProfile?.examId ||
          selectedExamId,
      };

      /*
      |--------------------------------------------------------------------------
      | Normalize exam ID
      |--------------------------------------------------------------------------
      */

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

      /*
      |--------------------------------------------------------------------------
      | Clear previous results
      |--------------------------------------------------------------------------
      */

      setResults([]);

      setResultsExamId(
        null
      );

      setResultsError('');

      setResultsLoading(
        true
      );

      /*
      |--------------------------------------------------------------------------
      | Keep profile synced
      |--------------------------------------------------------------------------
      */

      const exactProfile = {
        ...p,
        examId:
          requestExamId,
      };

      setProfile(
        exactProfile
      );

      console.log(
        '[FRONTEND] Fetching results:',
        requestExamId
      );

      console.log(
        '[FRONTEND] Exact profile:',
        exactProfile
      );

      try {

        /*
        |--------------------------------------------------------------------------
        | CALL REAL JOOSA API
        |--------------------------------------------------------------------------
        */

        const rows =
          await fetchJosaaResults(
            exactProfile
          );

        const safeRows =
          Array.isArray(rows)
            ? rows
            : [];

        console.log(
          '[FRONTEND] Results received:',
          safeRows.length
        );

        console.log(
          '[FRONTEND] Results exam:',
          requestExamId
        );

        /*
        |--------------------------------------------------------------------------
        | SAVE RESULTS
        |--------------------------------------------------------------------------
        */

        setResults(
          safeRows
        );

        setResultsExamId(
          requestExamId
        );

        return safeRows;

      } catch (
        error
      ) {

        console.error(
          '[FRONTEND] Failed to load JoSAA results:',
          error
        );

        setResults([]);

        setResultsExamId(
          null
        );

        const message =
          error?.message ||
          'Unable to load counselling results.';

        setResultsError(
          message
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

      const college =
        getCollegeById(id);

      setCurrentCollegeId(
        id
      );

      const branchIndex =
        college?.branches?.findIndex(
          (branch) =>
            branch.name ===
            branchName
        );

      setCurrentBranchIdx(
        Math.max(
          0,
          branchIndex ?? 0
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
    ) =>
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

  /*
  |--------------------------------------------------------------------------
  | CHOICE LIST
  |--------------------------------------------------------------------------
  */

  const addChoice =
    (
      collegeId,
      branchName
    ) =>
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

          if (
            exists
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

  /*
  |--------------------------------------------------------------------------
  | CONTEXT
  |--------------------------------------------------------------------------
  */

  const value = {
    /*
    | Exam
    */

    selectedExamId,
    setSelectedExamId,

    /*
    | Profile
    */

    profile,
    setProfile,

    /*
    | Results
    */

    results,
    setResults,

    resultsExamId,

    generateResults,

    resultsLoading,
    resultsError,

    /*
    | Catalog
    */

    exams,
    colleges,
    counsellingEvents,

    catalogLoading,
    catalogError,

    /*
    | Compare
    */

    compareList,
    setCompareList,

    /*
    | Choice list
    */

    choiceList,
    setChoiceList,

    /*
    | College
    */

    currentCollegeId,
    currentCollege,

    currentBranchIdx,
    setCurrentBranchIdx,

    cdTab,
    setCdTab,

    /*
    | Actions
    */

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