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


function getCanonicalExamId(exam) {
  const name =
    String(exam?.name || '')
      .trim()
      .toLowerCase();

  const id =
    String(exam?.id || '')
      .trim()
      .toLowerCase();

  if (id === 'josaa') {
    return 'josaa';
  }

  if (id === 'csab') {
    return 'csab';
  }

  if (
    name.includes('jee') &&
    name.includes('advanced')
  ) {
    return 'jee-advanced';
  }

  if (
    name.includes('jee') &&
    name.includes('main')
  ) {
    return 'jee-main';
  }

  if (
    name.includes('mht') &&
    name.includes('cet')
  ) {
    return 'mht-cet';
  }

  return id;
}


const COUNSELLING_CARDS = [
  {
    id: 'josaa',
    name: 'JoSAA',
    desc:
      'Joint Seat Allocation Authority counselling for IITs, NITs, IIITs and GFTIs.',
    active: true,
  },
  {
    id: 'csab',
    name: 'CSAB',
    desc:
      'Central Seat Allocation Board counselling for NIT+ system vacant seats.',
    active: true,
  },
];


export default function Exams() {
  const [q, setQ] =
    useState('');

  const [
    selectedCounselling,
    setSelectedCounselling,
  ] = useState(null);

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
  | DISPLAY CATALOG
  |--------------------------------------------------------------------------
  |
  | JEE Main / JEE Advanced are rank sources.
  | They are no longer top-level counselling cards.
  |
  */

  const exams =
    useMemo(() => {
      const source =
        Array.isArray(allExams)
          ? allExams
          : [];

      const filtered =
        source.filter(
          (exam) => {
            const id =
              getCanonicalExamId(
                exam
              );

            return ![
              'jee-main',
              'jee-advanced',
              'josaa',
              'csab',
            ].includes(id);
          }
        );

      const list = [
        ...COUNSELLING_CARDS,
        ...filtered,
      ];

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
  | NORMAL EXAM SELECTION
  |--------------------------------------------------------------------------
  */

  const saveAndContinue = ({
    examId,
    counsellingId = null,
    rankType = null,
  }) => {
    if (!examId) {
      return;
    }

    console.log(
      '[EXAM SELECTED]',
      {
        counsellingId,
        examId,
        rankType,
      }
    );

    setSelectedExamId(
      examId
    );

    try {
      localStorage.setItem(
        'selectedExamId',
        examId
      );

      if (counsellingId) {
        localStorage.setItem(
          'selectedCounsellingId',
          counsellingId
        );
      } else {
        localStorage.removeItem(
          'selectedCounsellingId'
        );
      }

      if (rankType) {
        localStorage.setItem(
          'selectedRankType',
          rankType
        );
      } else {
        localStorage.removeItem(
          'selectedRankType'
        );
      }
    } catch {
      // Ignore storage errors.
    }

    nav('/profile');
  };


  const handleSelectExam =
    (exam) => {
      if (!exam) {
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

      /*
      |------------------------------------------------------
      | COUNSELLING FIRST
      |------------------------------------------------------
      */

      if (
        examId === 'josaa' ||
        examId === 'csab'
      ) {
        setSelectedCounselling(
          examId
        );

        return;
      }

      /*
      |------------------------------------------------------
      | OTHER EXAMS
      |------------------------------------------------------
      */

      saveAndContinue({
        examId,
      });
    };


  /*
  |--------------------------------------------------------------------------
  | COUNSELLING + RANK SOURCE
  |--------------------------------------------------------------------------
  */

  const selectRankSource =
    (rankType) => {
      if (
        selectedCounselling ===
        'josaa'
      ) {
        if (
          rankType ===
          'jee-main'
        ) {
          saveAndContinue({
            counsellingId:
              'josaa',
            examId:
              'jee-main',
            rankType:
              'jee-main',
          });

          return;
        }

        if (
          rankType ===
          'jee-advanced'
        ) {
          saveAndContinue({
            counsellingId:
              'josaa',
            examId:
              'jee-advanced',
            rankType:
              'jee-advanced',
          });

          return;
        }
      }

      if (
        selectedCounselling ===
          'csab' &&
        rankType ===
          'jee-main'
      ) {
        saveAndContinue({
          counsellingId:
            'csab',
          examId:
            'csab',
          rankType:
            'jee-main',
        });
      }
    };


  return (
    <>
      <PageHero
        title="Aap Kis Counselling / Exam Ke Liye College Options Dekhna Chahte Hain?"
        description="Counselling ya exam chunein — TruMarg aapke admission profile ke basis par personalized college options dikhayega."
        crumb={
          <>
            <a href="/">
              Home
            </a>

            {
              ' / Select Counselling'
            }
          </>
        }
      />


      <div className="container section">

        {catalogLoading && (
          <div className="source-note">
            Loading catalog from backend...
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
          placeholder="Search counselling or exam..."
          type="search"
        />


        {!catalogLoading &&
          !catalogError &&
          exams.length === 0 && (
            <div className="empty-state">
              <h3>
                No options found
              </h3>

              <p>
                Try a different name
                or clear the search.
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
                    'Information unavailable.'
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

              const isCounselling =
                [
                  'josaa',
                  'csab',
                ].includes(
                  canonicalId
                );

              return (
                <div
                  className="exam-card"
                  key={
                    canonicalId ||
                    examName
                  }
                >

                  <div className="exam-logo">
                    {
                      initials ||
                      'EX'
                    }
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
                      fontSize:
                        12.5,
                      flex: 1,
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
                    variant="primary"
                    size="sm"
                    disabled={false}
                    onClick={() =>
                      handleSelectExam(
                        exam
                      )
                    }
                  >
                    {
                      isCounselling
                        ? 'Select Counselling →'
                        : 'Select Exam →'
                    }
                  </Button>

                </div>
              );
            }
          )}

        </div>


        {selectedCounselling && (
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Select rank type"
            style={{
              position:
                'fixed',
              top:
                '50%',
              left:
                '50%',
              transform:
                'translate(-50%, -50%)',
              width:
                'min(760px, calc(100vw - 32px))',
              maxHeight:
                'calc(100vh - 40px)',
              overflowY:
                'auto',
              padding:
                '26px',
              border:
                '1px solid #e2e8f0',
              borderRadius:
                '18px',
              background:
                '#ffffff',
              boxShadow:
                '0 24px 80px rgba(15, 23, 42, 0.28)',
              zIndex:
                9999,
            }}
          >

            <div
              style={{
                display:
                  'flex',
                justifyContent:
                  'space-between',
                gap: '16px',
                alignItems:
                  'flex-start',
              }}
            >

              <div>
                <div
                  style={{
                    fontSize:
                      '12px',
                    fontWeight:
                      800,
                    color:
                      '#4f46e5',
                    textTransform:
                      'uppercase',
                    letterSpacing:
                      '.06em',
                  }}
                >
                  Select Rank Type
                </div>

                <h2
                  style={{
                    margin:
                      '8px 0 4px',
                  }}
                >
                  {
                    selectedCounselling ===
                    'josaa'
                      ? 'JoSAA'
                      : 'CSAB'
                  }
                </h2>

                <p
                  style={{
                    margin: 0,
                    color:
                      '#64748b',
                  }}
                >
                  Choose the rank
                  you want to use
                  for prediction.
                </p>
              </div>


              <button
                type="button"
                onClick={() =>
                  setSelectedCounselling(
                    null
                  )
                }
                style={{
                  border:
                    'none',
                  background:
                    'transparent',
                  cursor:
                    'pointer',
                  fontSize:
                    '22px',
                  color:
                    '#64748b',
                }}
                aria-label="Close rank selector"
              >
                ×
              </button>

            </div>


            <div
              role="tablist"
              aria-label="Rank type"
              style={{
                display:
                  'grid',
                gridTemplateColumns:
                  selectedCounselling ===
                  'josaa'
                    ? '1fr 1fr'
                    : '1fr',
                gap:
                  '12px',
                marginTop:
                  '24px',
              }}
            >

              <button
                type="button"
                role="tab"
                onClick={() =>
                  selectRankSource(
                    'jee-main'
                  )
                }
                style={{
                  padding:
                    '16px 18px',
                  borderRadius:
                    '12px',
                  border:
                    '1px solid #c7d2fe',
                  background:
                    '#eef2ff',
                  color:
                    '#172554',
                  fontWeight:
                    800,
                  cursor:
                    'pointer',
                }}
              >
                JEE Main Rank
              </button>


              {selectedCounselling ===
                'josaa' && (
                <button
                  type="button"
                  role="tab"
                  onClick={() =>
                    selectRankSource(
                      'jee-advanced'
                    )
                  }
                  style={{
                    padding:
                      '16px 18px',
                    borderRadius:
                      '12px',
                    border:
                      '1px solid #c7d2fe',
                    background:
                      '#eef2ff',
                    color:
                      '#172554',
                    fontWeight:
                      800,
                    cursor:
                      'pointer',
                  }}
                >
                  JEE Advanced Rank
                </button>
              )}

            </div>


            {selectedCounselling ===
              'csab' && (
                <p
                  style={{
                    margin:
                      '16px 0 0',
                    fontSize:
                      '13px',
                    color:
                      '#64748b',
                  }}
                >
                  CSAB Special uses
                  the applicable
                  JEE Main rank for
                  NIT+ seat allocation.
                </p>
              )}

          </section>
        )}


        <section
          aria-labelledby="college-predictor-guides"
          style={{
            marginTop:
              '56px',
            padding:
              '28px',
            border:
              '1px solid #e2e8f0',
            borderRadius:
              '18px',
            background:
              '#f8fafc',
          }}
        >
          <h2
            id="college-predictor-guides"
            style={{
              marginTop: 0,
            }}
          >
            College Predictor 2026
          </h2>

          <p
            style={{
              lineHeight: 1.7,
              color:
                '#475569',
            }}
          >
            Explore TruMarg college
            predictor tools using your
            counselling profile and
            historical cutoff data.
          </p>

          <div
            style={{
              display:
                'flex',
              flexWrap:
                'wrap',
              gap:
                '14px',
              marginTop:
                '20px',
            }}
          >
            <Link
              to="/college-predictor"
              className="btn"
            >
              College Predictor 2026
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
