import {
  useMemo,
  useState,
} from 'react';

import {
  Link,
  useNavigate,
} from 'react-router-dom';

import PageHero from '../components/PageHero';
import Button from '../components/Button';

import {
  useAppState,
} from '../hooks/useAppState';


const ENABLED_EXAMS = [
  {
    id: 'jee-main',
    name: 'JEE Main',
    desc:
      'Explore NITs, IIITs and GFTIs using your JEE Main rank and admission profile.',
    active: true,
  },

  {
    id: 'jee-advanced',
    name: 'JEE Advanced',
    desc:
      'Explore IIT admission possibilities using your JEE Advanced rank.',
    active: true,
  },

  {
    id: 'uptac',
    name: 'UPTAC',
    desc:
      'Explore Uttar Pradesh engineering college options through UPTAC counselling.',
    active: true,
  },

  {
    id: 'neet',
    name: 'NEET UG',
    desc:
      'Explore MBBS, BDS and other medical admission possibilities using your NEET UG rank.',
    active: true,
  },
];


export default function Exams() {
  const [q, setQ] =
    useState('');

  const {
    setSelectedExamId,
  } = useAppState();

  const nav =
    useNavigate();


  /*
  |--------------------------------------------------------------------------
  | ENABLED EXAMS
  |--------------------------------------------------------------------------
  */

  const exams =
    useMemo(() => {
      const search =
        String(q || '')
          .trim()
          .toLowerCase();

      if (!search) {
        return ENABLED_EXAMS;
      }

      return ENABLED_EXAMS.filter(
        (exam) =>
          String(
            exam.name || ''
          )
            .toLowerCase()
            .includes(search) ||
          String(
            exam.desc || ''
          )
            .toLowerCase()
            .includes(search)
      );
    }, [
      q,
    ]);


  /*
  |--------------------------------------------------------------------------
  | SELECT EXAM
  |--------------------------------------------------------------------------
  */

  const handleSelectExam =
    (exam) => {
      if (!exam?.id) {
        return;
      }

      const examId =
        String(
          exam.id
        )
          .trim()
          .toLowerCase();


      /*
      |--------------------------------------------------------------------------
      | FINAL SAFETY GATE
      |--------------------------------------------------------------------------
      */

      const allowed =
        new Set([
          'jee-main',
          'jee-advanced',
          'uptac',
          'neet',
        ]);

      if (
        !allowed.has(
          examId
        )
      ) {
        console.warn(
          '[EXAMS] Disabled exam blocked:',
          examId
        );

        return;
      }


      console.log(
        '[EXAM SELECTED]',
        examId
      );


      setSelectedExamId(
        examId
      );


      try {
        localStorage.setItem(
          'selectedExamId',
          examId
        );

        localStorage.removeItem(
          'selectedCounsellingId'
        );

        localStorage.setItem(
          'selectedRankType',
          examId
        );
      }
      catch (error) {
        console.warn(
          '[EXAMS] localStorage unavailable:',
          error
        );
      }


      nav(
        '/profile'
      );
    };


  return (
    <>
      <PageHero
        title="Choose Your Exam"
        description="Select JEE Main, JEE Advanced, UPTAC or NEET UG to continue with TruMarg college recommendations."
        crumb={
          <>
            <a href="/">
              Home
            </a>

            {
              ' / Select Exam'
            }
          </>
        }
      />


      <div className="container section">

        <input
          className="exam-search"
          value={q}
          onChange={(e) =>
            setQ(
              e.target.value
            )
          }
          maxLength={60}
          placeholder="Search exam..."
          type="search"
        />


        {exams.length === 0 && (
          <div className="empty-state">
            <h3>
              No exam found
            </h3>

            <p>
              JEE Main, JEE Advanced, UPTAC and NEET UG are currently available.
            </p>
          </div>
        )}


        <div className="exam-grid">

          {exams.map(
            (exam) => {
              const examName =
                String(
                  exam?.name ||
                  'Unknown'
                );

              const examDescription =
                String(
                  exam?.desc ||
                  ''
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
                  .slice(
                    0,
                    3
                  )
                  .toUpperCase();


              return (
                <div
                  className="exam-card"
                  key={exam.id}
                >

                  <div className="exam-logo">
                    {
                      initials ||
                      'EX'
                    }
                  </div>


                  <h4>
                    {examName}
                  </h4>


                  <p
                    style={{
                      fontSize:
                        12.5,
                      flex:
                        1,
                    }}
                  >
                    {
                      examDescription
                    }
                  </p>


                  <span className="tag">
                    Available
                  </span>


                  <Button
                    disabled={false}
                    onClick={() =>
                      handleSelectExam(
                        exam
                      )
                    }
                  >
                    Select Exam →
                  </Button>

                </div>
              );
            }
          )}

        </div>


        <section
          style={{
            marginTop:
              '36px',
          }}
        >
          <h3>
            College Predictor Tools
          </h3>

          <p>
            Explore TruMarg college predictor tools using your rank and historical cutoff data.
          </p>

          <div
            style={{
              display:
                'flex',
              flexWrap:
                'wrap',
              gap:
                '12px',
            }}
          >

            <Link
              to="/college-predictor"
              className="btn"
            >
              College Predictor 2026
            </Link>

            <Link
              to="/jee-main-college-predictor"
              className="btn"
            >
              JEE Main College Predictor
            </Link>

            <Link
              to="/uptac-college-predictor"
              className="btn"
            >
              UPTAC College Predictor
            </Link>

          </div>
        </section>

      </div>
    </>
  );
}
