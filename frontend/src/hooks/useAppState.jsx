import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { getApiCatalog } from '../services/apiClient';

import {
  fetchJosaaResults,
} from '../services/josaaRecommendationService';

import {
  fetchCounsellingResults,
} from '../services/counsellingService';

import { getCollegeById } from '../services/collegeService';

const initialProfile = {
  rank: 3000,
  pct: '',
  year: '2026',
  category: 'General',
  gender: 'Male',
  homeState: 'Maharashtra',
  branches: ['CSE', 'IT'],
  budget: 1000000,
  type: 'Both',
  hostel: 'Yes',
  prefState: '',
};

const AppContext = createContext(null);

export function AppStateProvider({ children }) {
  const [selectedExamIdState, setSelectedExamIdState] =
    useState(() => {
      try {
        return (
          localStorage.getItem('selectedExamId') ||
          'jee-main'
        );
      } catch {
        return 'jee-main';
      }
    });

  const [profile, setProfile] = useState(initialProfile);
  const [results, setResults] = useState([]);
  const [resultsExamId, setResultsExamId] = useState(null);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultsError, setResultsError] = useState('');

  const [exams, setExams] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [counsellingEvents, setCounsellingEvents] = useState([]);

  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState('');

  const [compareList, setCompareList] = useState([]);
  const [choiceList, setChoiceList] = useState([]);

  const [currentCollegeId, setCurrentCollegeId] = useState(null);
  const [currentBranchIdx, setCurrentBranchIdx] = useState(0);
  const [cdTab, setCdTab] = useState('overview');

  const selectedExamId = String(
    selectedExamIdState || 'jee-main'
  )
    .trim()
    .toLowerCase();

  const setSelectedExamId = (examId) => {
    const value = String(examId || '')
      .trim()
      .toLowerCase();

    if (!value) return;

    try {
      localStorage.setItem(
        'selectedExamId',
        value
      );
    } catch {}

    setSelectedExamIdState(value);
    setResults([]);
    setResultsExamId(null);
    setResultsError('');
    setResultsLoading(false);
  };

  useEffect(() => {
    let cancelled = false;

    const loadCatalog = async () => {
      setCatalogLoading(true);
      setCatalogError('');

      try {
        const catalog = await getApiCatalog();

        if (cancelled) return;

        setExams(
          Array.isArray(catalog?.exams)
            ? catalog.exams
            : []
        );

        setColleges(
          Array.isArray(catalog?.colleges)
            ? catalog.colleges
            : []
        );

        setCounsellingEvents(
          Array.isArray(catalog?.counsellingEvents)
            ? catalog.counsellingEvents
            : []
        );
      } catch (error) {
        if (cancelled) return;

        setCatalogError(
          error?.message ||
          'Unable to load API catalog.'
        );
      } finally {
        if (!cancelled) {
          setCatalogLoading(false);
        }
      }
    };

    loadCatalog();

    return () => {
      cancelled = true;
    };
  }, []);

  const currentCollege = useMemo(
    () => getCollegeById(currentCollegeId),
    [currentCollegeId]
  );

  const generateResults = async (nextProfile) => {
    const p = {
      ...(nextProfile || profile),
      examId:
        nextProfile?.examId ||
        selectedExamId,
    };

    const requestExamId = String(
      p.examId || ''
    )
      .trim()
      .toLowerCase();

    if (!requestExamId) {
      throw new Error(
        'Exam ID is missing from profile.'
      );
    }

    setResults([]);
    setResultsExamId(null);
    setResultsError('');
    setResultsLoading(true);

    const exactProfile = {
      ...p,
      examId: requestExamId,
    };

    setProfile(exactProfile);

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
       * UPTAC
       * Uses PostgreSQL through:
       * /api/counselling/results
       */
      if (requestExamId === 'uptac') {
        console.log(
          '[UPTAC] Calling PostgreSQL API...'
        );

        const uptacCategory =
  exactProfile.category === 'General' ||
  exactProfile.category === 'GEN' ||
  !exactProfile.category
    ? 'OPEN'
    : exactProfile.category;

        rows = await fetchCounsellingResults({
          examId: 'uptac',
          rank: Number(exactProfile.rank),
          category: uptacCategory,
          year: 2025,
          round: Number(exactProfile.round || 1),
        });

        console.log(
          '[UPTAC] Rows received:',
          rows.length
        );
      } else {
        rows = await fetchJosaaResults(
          exactProfile
        );
      }

      const safeRows =
        Array.isArray(rows)
          ? rows
          : [];

      setResults(safeRows);
      setResultsExamId(requestExamId);

      return safeRows;
    } catch (error) {
      console.error(
        '[RESULTS] API error:',
        error
      );

      setResults([]);
      setResultsExamId(null);

      setResultsError(
        error?.message ||
        'Unable to load counselling results.'
      );

      throw error;
    } finally {
      setResultsLoading(false);
    }
  };

  const openCollege = (
    id,
    branchName
  ) => {
    const college = getCollegeById(id);

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

  const addCompare = (
    collegeId,
    branchName
  ) => {
    setCompareList((prev) => {
      const exists = prev.some(
        (item) =>
          item.collegeId === collegeId &&
          item.branchName === branchName
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
    });
  };

  const addChoice = (
    collegeId,
    branchName
  ) => {
    setChoiceList((prev) => {
      const exists = prev.some(
        (item) =>
          item.collegeId === collegeId &&
          item.branchName === branchName
      );

      if (exists) return prev;

      return [
        ...prev,
        {
          collegeId,
          branchName,
        },
      ];
    });
  };

  const value = {
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
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export const useAppState = () =>
  useContext(AppContext);


