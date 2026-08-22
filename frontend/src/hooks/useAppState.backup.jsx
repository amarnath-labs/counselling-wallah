import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  fetchJosaaResults,
} from '../services/josaaRecommendationService';

import {
  getCollegeById,
} from '../services/collegeService';

import {
  getApiCatalog,
} from '../services/apiClient';

import {
  COLLEGES as LOCAL_COLLEGES,
} from '../data/colleges';

import {
  EXAMS as LOCAL_EXAMS,
} from '../data/exams';

import {
  SAMPLE_EVENTS as LOCAL_EVENTS,
} from '../services/counsellingService';


/*
|--------------------------------------------------------------------------
| Initial Profile
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


/*
|--------------------------------------------------------------------------
| Context
|--------------------------------------------------------------------------
*/

const AppContext = createContext(null);


/*
|--------------------------------------------------------------------------
| Provider
|--------------------------------------------------------------------------
*/

export function AppStateProvider({
  children,
}) {

  /*
  |--------------------------------------------------------------------------
  | Exam
  |--------------------------------------------------------------------------
  */

  const [
    selectedExamId,
    setSelectedExamId,
  ] = useState('jee-main');


  /*
  |--------------------------------------------------------------------------
  | Profile
  |--------------------------------------------------------------------------
  */

  const [
    profile,
    setProfile,
  ] = useState(initialProfile);


  /*
  |--------------------------------------------------------------------------
  | Results
  |--------------------------------------------------------------------------
  */

  const [
    results,
    setResults,
  ] = useState([]);


  /*
  |--------------------------------------------------------------------------
  | Compare List
  |--------------------------------------------------------------------------
  */

  const [
    compareList,
    setCompareList,
  ] = useState([]);


  /*
  |--------------------------------------------------------------------------
  | Choice List
  |--------------------------------------------------------------------------
  */

  const [
    choiceList,
    setChoiceList,
  ] = useState([]);


  /*
  |--------------------------------------------------------------------------
  | Current College
  |--------------------------------------------------------------------------
  */

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
  | Real API Catalog
  |--------------------------------------------------------------------------
  */

  const [
    exams,
    setExams,
  ] = useState(LOCAL_EXAMS);


  const [
    colleges,
    setColleges,
  ] = useState(LOCAL_COLLEGES);


  const [
    counsellingEvents,
    setCounsellingEvents,
  ] = useState(LOCAL_EVENTS);


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
  | Results Loading / Error
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
  | Load Backend Catalog
  |--------------------------------------------------------------------------
  */

  useEffect(() => {

    let cancelled = false;

    async function loadCatalog() {

      try {

        console.log(
          '[FRONTEND] Loading API catalog...'
        );

        const catalog =
          await getApiCatalog();

        console.log(
          '[FRONTEND] API catalog received:',
          catalog
        );

        console.log(
          '[FRONTEND] Exams:',
          catalog?.exams
        );

        if (cancelled) {
          return;
        }

        /*
        |----------------------------------------------------------------------
        | Protect against malformed API response
        |----------------------------------------------------------------------
        */

        const nextExams =
          Array.isArray(catalog?.exams)
            ? catalog.exams
            : [];

        const nextColleges =
          Array.isArray(catalog?.colleges)
            ? catalog.colleges
            : [];

        const nextCounsellingEvents =
          Array.isArray(
            catalog?.counsellingEvents
          )
            ? catalog.counsellingEvents
            : [];


        /*
        |----------------------------------------------------------------------
        | Only replace local data when API returned valid arrays
        |----------------------------------------------------------------------
        */

        if (nextExams.length > 0) {
          setExams(nextExams);
        }

        if (nextColleges.length > 0) {
          setColleges(nextColleges);
        }

        if (
          nextCounsellingEvents.length > 0
        ) {
          setCounsellingEvents(
            nextCounsellingEvents
          );
        }


        setCatalogError('');

      } catch (error) {

        console.error(
          '[FRONTEND] Failed to load API catalog:',
          error
        );

        if (cancelled) {
          return;
        }

        /*
        |----------------------------------------------------------------------
        | Keep local demo data as fallback
        |----------------------------------------------------------------------
        */

        setCatalogError(
          `Backend unavailable — using local demo data. ${
            error?.message || ''
          }`
        );

      } finally {

        if (!cancelled) {
          setCatalogLoading(false);
        }

      }
    }

    loadCatalog();

    return () => {
      cancelled = true;
    };

  }, []);


  /*
  |--------------------------------------------------------------------------
  | Current College
  |--------------------------------------------------------------------------
  */

  const currentCollege =
    useMemo(
      () =>
        getCollegeById(
          currentCollegeId
        ),
      [currentCollegeId]
    );


  /*
  |--------------------------------------------------------------------------
  | Generate Results
  |--------------------------------------------------------------------------
  */

  const generateResults =
    async (nextProfile) => {

      const p =
        nextProfile || profile;

      setProfile(p);

      setResultsLoading(true);

      setResultsError('');

      try {

        console.log(
          '[FRONTEND] Fetching JoSAA results for:',
          p
        );

        const rows =
          await fetchJosaaResults(p);

        const safeRows =
          Array.isArray(rows)
            ? rows
            : [];

        console.log(
          '[FRONTEND] JoSAA results received:',
          safeRows.length
        );

        setResults(safeRows);

        return safeRows;

      } catch (error) {

        console.error(
          '[FRONTEND] Failed to load JoSAA results:',
          error
        );

        setResults([]);

        setResultsError(
          error?.message ||
          'Unable to load counselling results.'
        );

        return [];

      } finally {

        setResultsLoading(false);

      }
    };


  /*
  |--------------------------------------------------------------------------
  | Open College
  |--------------------------------------------------------------------------
  */

  const openCollege =
    (
      id,
      branchName
    ) => {

      const college =
        getCollegeById(id);

      setCurrentCollegeId(id);

      const branchIndex =
        college?.branches?.findIndex(
          (branch) =>
            branch.name === branchName
        );

      setCurrentBranchIdx(
        Math.max(
          0,
          branchIndex ?? 0
        )
      );

      setCdTab('overview');
    };


  /*
  |--------------------------------------------------------------------------
  | Compare
  |--------------------------------------------------------------------------
  */

  const addCompare =
    (
      collegeId,
      branchName
    ) => {

      setCompareList(
        (prev) => {

          const alreadyExists =
            prev.some(
              (item) =>
                item.collegeId ===
                  collegeId &&
                item.branchName ===
                  branchName
            );

          if (
            prev.length >= 5 ||
            alreadyExists
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
  | Choice List
  |--------------------------------------------------------------------------
  */

  const addChoice =
    (
      collegeId,
      branchName
    ) => {

      setChoiceList(
        (prev) => {

          const alreadyExists =
            prev.some(
              (item) =>
                item.collegeId ===
                  collegeId &&
                item.branchName ===
                  branchName
            );

          if (alreadyExists) {
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
  | Context Value
  |--------------------------------------------------------------------------
  */

  const value = {

    /*
    | Exam
    */

    selectedExamId,
    setSelectedExamId,

    exams,


    /*
    | Profile
    */

    profile,
    setProfile,


    /*
    | Catalog
    */

    colleges,
    setColleges,

    counsellingEvents,
    setCounsellingEvents,

    catalogLoading,
    catalogError,


    /*
    | Results
    */

    results,
    setResults,

    generateResults,

    resultsLoading,
    resultsError,


    /*
    | Compare
    */

    compareList,
    setCompareList,

    addCompare,


    /*
    | Choice List
    */

    choiceList,
    setChoiceList,

    addChoice,


    /*
    | College
    */

    currentCollegeId,
    currentCollege,

    currentBranchIdx,
    setCurrentBranchIdx,

    cdTab,
    setCdTab,

    openCollege,
  };


  return (
    <AppContext.Provider
      value={value}
    >
      {children}
    </AppContext.Provider>
  );
}


/*
|--------------------------------------------------------------------------
| Hook
|--------------------------------------------------------------------------
*/

export const useAppState =
  () =>
    useContext(AppContext);