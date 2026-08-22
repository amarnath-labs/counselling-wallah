import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import PageHero from '../components/PageHero';
import Button from '../components/Button';

import {
  useAppState,
} from '../hooks/useAppState';

/*
|--------------------------------------------------------------------------
| CANONICAL EXAM ID
|--------------------------------------------------------------------------
*/

function getCanonicalExamId(exam) {
  const name =
    String(
      exam?.name || ''
    )
      .trim()
      .toLowerCase();

  const id =
    String(
      exam?.id || ''
    )
      .trim()
      .toLowerCase();

  /*
  |--------------------------------------------------------------------------
  | JEE ADVANCED
  |--------------------------------------------------------------------------
  */

  if (
    name.includes('jee') &&
    name.includes('advanced')
  ) {
    return 'jee-advanced';
  }

  /*
  |--------------------------------------------------------------------------
  | JEE MAIN
  |--------------------------------------------------------------------------
  */

  if (
    name.includes('jee') &&
    name.includes('main')
  ) {
    return 'jee-main';
  }

  /*
  |--------------------------------------------------------------------------
  | MHT CET
  |--------------------------------------------------------------------------
  */

  if (
    name.includes('mht') &&
    name.includes('cet')
  ) {
    return 'mht-cet';
  }

  /*
  |--------------------------------------------------------------------------
  | Fallback
  |--------------------------------------------------------------------------
  */

  return id;
}

export default function Exams() {
  const [
    q,
    setQ,
  ] = useState('');

  const {
    setSelectedExamId,
    exams: allExams = [],
    catalogLoading,
    catalogError,
  } = useAppState();

  const nav =
    useNavigate();

  /*
  |--------------------------------------------------------------------------
  | FILTER EXAMS
  |--------------------------------------------------------------------------
  */

  const exams =
    useMemo(() => {
      const list =
        Array.isArray(allExams)
          ? allExams
          : [];

      const search =
        String(q || '')
          .trim()
          .toLowerCase();

      if (!search) {
        return list;
      }

      return list.filter(
        (exam) =>
          String(
            exam?.name || ''
          )
            .toLowerCase()
            .includes(search)
      );
    }, [
      allExams,
      q,
    ]);

  /*
  |--------------------------------------------------------------------------
  | SELECT EXAM
  |--------------------------------------------------------------------------
  */

  const handleSelectExam = (
    exam
  ) => {
    if (!exam?.active) {
      return;
    }

    const examId =
      getCanonicalExamId(
        exam
      );

    if (!examId) {
      console.error(
        '[EXAMS] Could not determine exam ID:',
        exam
      );

      return;
    }

    console.log(
      '[EXAM SELECTED]',
      examId
    );

    console.log(
      '[EXAM OBJECT]',
      exam
    );

    /*
    |--------------------------------------------------------------------------
    | SAVE IN APP STATE
    |--------------------------------------------------------------------------
    */

    setSelectedExamId(
      examId
    );

    /*
    |--------------------------------------------------------------------------
    | SAVE IN BROWSER STORAGE
    |--------------------------------------------------------------------------
    */

    try {
      localStorage.setItem(
        'selectedExamId',
        examId
      );
    } catch {
      // Ignore storage errors.
    }

    /*
    |--------------------------------------------------------------------------
    | GO TO PROFILE
    |--------------------------------------------------------------------------
    */

    nav('/profile');
  };

  return (
    <>
      <PageHero
        title="Aapne Kaunsa Exam Diya Hai?"
        description="Apna exam chunein — hum aapko personalized college options dikhayenge."
        crumb={
          <>
            <a href="/">
              Home
            </a>

            {' / Select Exam'}
          </>
        }
      />

      <div className="container section">

        {catalogLoading && (
          <div className="source-note">
            Loading catalog from backend…
          </div>
        )}

        {catalogError &&
          !catalogLoading && (
            <div className="source-note">
              {catalogError}
            </div>
          )}

        <input
          className="exam-search"
          value={q}
          onChange={(e) =>
            setQ(
              e.target.value
            )
          }
          maxLength={60}
          placeholder="Search exam name…"
          type="search"
        />

        {!catalogLoading &&
          !catalogError &&
          exams.length === 0 && (
            <div className="empty-state">

              <h3>
                No exams found
              </h3>

              <p>
                Try a different exam
                name or clear the
                search.
              </p>

            </div>
          )}

        <div className="exam-grid">

          {exams.map(
            (exam) => {

              const isActive =
                Boolean(
                  exam?.active
                );

              const examName =
                String(
                  exam?.name ||
                    'Unknown Exam'
                );

              const examDescription =
                String(
                  exam?.desc ||
                    'Exam information unavailable.'
                );

              const initials =
                examName
                  .split(/\s+/)
                  .filter(Boolean)
                  .map(
                    (word) =>
                      word[0]
                  )
                  .join('')
                  .slice(0, 3)
                  .toUpperCase();

              const canonicalId =
                getCanonicalExamId(
                  exam
                );

              return (
                <div
                  className={
                    `exam-card ${
                      isActive
                        ? ''
                        : 'inactive'
                    }`
                  }
                  key={
                    canonicalId ||
                    examName
                  }
                >

                  <div className="exam-logo">
                    {initials ||
                      'EX'}
                  </div>

                  <h4
                    style={{
                      fontSize: 15,
                    }}
                  >
                    {examName}
                  </h4>

                  <p
                    style={{
                      fontSize: 12.5,
                      flex: 1,
                    }}
                  >
                    {examDescription}
                  </p>

                  <span
                    className={
                      `tag ${
                        isActive
                          ? ''
                          : 'soon'
                      }`
                    }
                  >
                    {isActive
                      ? 'Live'
                      : 'Coming soon'}
                  </span>

                  <Button
                    variant={
                      isActive
                        ? 'primary'
                        : 'ghost'
                    }
                    size="sm"
                    disabled={
                      !isActive
                    }
                    onClick={() =>
                      handleSelectExam(
                        exam
                      )
                    }
                  >
                    {isActive
                      ? 'Select Exam →'
                      : 'Coming Soon'}
                  </Button>

                </div>
              );
            }
          )}

        </div>
      </div>
    </>
  );
}