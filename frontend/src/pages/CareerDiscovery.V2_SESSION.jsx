import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Link,
} from 'react-router-dom';

import {
  BOARD_OPTIONS,
  CAREER_GOAL_OPTIONS,
  CLASS_OPTIONS,
  COLLEGE_YEAR_OPTIONS,
  CURRENT_STATUS_OPTIONS,
  DEGREE_OPTIONS,
  EXPERIENCE_OPTIONS,
  getExamsForStage,
  getStageFromClass,
  SCHOOL_SUBJECT_OPTIONS,
  SCORE_OPTIONS,
  SKILL_OPTIONS,
  STREAM_OPTIONS,
} from '../data/careerAdaptiveData';

import {
  buildCareerReport,
} from '../services/careerAdaptiveService';


const STORAGE_KEY =
  'trumarg-career-assessment-v5';


const API_BASE_URL =
  String(
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    (import.meta.env.DEV
      ? 'http://localhost:4000/api'
      : 'https://counsellingwallah-backend.onrender.com/api')
  ).replace(/\/+$/, '');


const EMPTY_BASICS = {
  currentClass: '',
  board: '',
  stream: '',
  subjects: [],

  targetExams: [],

  degree: '',
  specialization: '',
  collegeYear: '',

  skills: [],

  highestQualification: '',
  graduationYear: '',
  experience: '',
  currentStatus: '',

  goal: '',
};


/*
|--------------------------------------------------------------------------
| SMALL HELPERS
|--------------------------------------------------------------------------
*/

function toggleArrayValue(
  values,
  value
) {
  if (
    values.includes(value)
  ) {
    return values.filter(
      (item) =>
        item !== value
    );
  }

  return [
    ...values,
    value,
  ];
}


function stageTitle(stage) {
  switch (stage) {
    case 'foundation':
      return 'Foundation Career Exploration';

    case 'class10':
      return 'Stream & Career Discovery';

    case 'senior-secondary':
      return 'Course & Career Discovery';

    case 'college':
      return 'Professional Direction';

    case 'graduate':
      return 'Career Launch & Transition';

    default:
      return 'Career Discovery';
  }
}


function stageDescription(
  stage
) {
  switch (stage) {
    case 'foundation':
      return 'Explore your interests, curiosity and broad strengths without forcing an early career decision.';

    case 'class10':
      return 'Understand which streams and broad career directions deserve deeper exploration after Class 10.';

    case 'senior-secondary':
      return 'Connect your subjects, interests and strengths with courses, careers and entrance routes.';

    case 'college':
      return 'Explore job roles, professional directions, skills and higher-study options beyond your degree title.';

    case 'graduate':
      return 'Evaluate suitable job directions, reskilling, higher studies, government careers or career transitions.';

    default:
      return 'Understand your career direction before choosing your path.';
  }
}


/*
|--------------------------------------------------------------------------
| CHIP
|--------------------------------------------------------------------------
*/

function Chip({
  active,
  children,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      style={{
        border:
          active
            ? '1.5px solid #5368f5'
            : '1px solid #dfe5ef',

        background:
          active
            ? 'rgba(83,104,245,0.08)'
            : '#fff',

        color:
          active
            ? '#4054de'
            : '#24314d',

        borderRadius:
          999,

        padding:
          '9px 13px',

        fontWeight:
          active
            ? 700
            : 500,

        cursor:
          'pointer',

        font:
          'inherit',
      }}
    >
      {children}
    </button>
  );
}


/*
|--------------------------------------------------------------------------
| FIELD
|--------------------------------------------------------------------------
*/

function SelectField({
  label,
  value,
  onChange,
  children,
}) {
  return (
    <label
      style={{
        display:
          'grid',
        gap: 8,
      }}
    >
      <strong
        style={{
          fontSize:
            13,
        }}
      >
        {label}
      </strong>

      <select
        value={
          value
        }
        onChange={
          (event) =>
            onChange(
              event.target.value
            )
        }
        style={{
          width:
            '100%',

          minHeight:
            46,

          border:
            '1px solid #dce3ef',

          borderRadius:
            10,

          padding:
            '0 12px',

          background:
            '#fff',

          color:
            '#17223b',

          font:
            'inherit',
        }}
      >
        {children}
      </select>
    </label>
  );
}


function humanizeTrait(value) {
  return String(value || '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}


function normalizeBackendReport(payload) {
  const source = payload?.report || payload || {};

  return {
    ...source,
    confidence: {
      score: Number(source?.confidence?.score || 0),
      label: source?.confidence?.label || 'Developing',
      explanation:
        source?.confidence?.explanation ||
        'TruMarg is using the evidence collected in your adaptive assessment.',
    },
    topTraits: Array.isArray(source?.topTraits)
      ? source.topTraits
      : [],
    matches: Array.isArray(source?.matches)
      ? source.matches.map((match) => ({
          ...match,
          strongestTraits: Array.isArray(match?.strongestTraits)
            ? match.strongestTraits.map((trait) => ({
                ...trait,
                label: trait?.label || humanizeTrait(trait?.trait),
              }))
            : [],
          courses: Array.isArray(match?.courses) ? match.courses : [],
          roles: Array.isArray(match?.roles) ? match.roles : [],
          nextSteps: Array.isArray(match?.nextSteps) ? match.nextSteps : [],
          missingSkills: Array.isArray(match?.missingSkills)
            ? match.missingSkills
            : [],
          why: Array.isArray(match?.why) ? match.why : [],
          gaps: Array.isArray(match?.gaps) ? match.gaps : [],
        }))
      : [],
    suggestedStreams: Array.isArray(source?.suggestedStreams)
      ? source.suggestedStreams
      : [],
  };
}


/*
|--------------------------------------------------------------------------
| CAREER DISCOVERY
|--------------------------------------------------------------------------
*/

export default function CareerDiscovery() {
  const [
    screen,
    setScreen,
  ] = useState(
    'basics'
  );

  const [
    assessmentId,
    setAssessmentId,
  ] = useState('');

  const [
    basics,
    setBasics,
  ] = useState(
    EMPTY_BASICS
  );

  const [
    answers,
    setAnswers,
  ] = useState({});

  const [
    adaptiveQuestions,
    setAdaptiveQuestions,
  ] = useState([]);

  const [
    questionIndex,
    setQuestionIndex,
  ] = useState(0);

  const [
    adaptiveProgress,
    setAdaptiveProgress,
  ] = useState({
    answered: 0,
    minimum: 12,
    maximum: 30,
  });

  const [
    backendTraitScores,
    setBackendTraitScores,
  ] = useState({});

  const [
    loadingQuestion,
    setLoadingQuestion,
  ] = useState(false);

  const [
    assessmentError,
    setAssessmentError,
  ] = useState('');

  const [
    report,
    setReport,
  ] = useState(null);


  /*
  |--------------------------------------------------------------------------
  | RESTORE DRAFT
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      try {
        const raw =
          localStorage.getItem(
            STORAGE_KEY
          );

        if (!raw) {
          return;
        }

        const parsed =
          JSON.parse(raw);

        if (
          parsed?.basics
        ) {
          setBasics({
            ...EMPTY_BASICS,
            ...parsed.basics,
          });
        }

        if (
          parsed?.answers
        ) {
          setAnswers(
            parsed.answers
          );
        }

        if (parsed?.assessmentId) {
          setAssessmentId(
            parsed.assessmentId
          );
        }

      } catch {
        // Ignore invalid old draft.
      }
    },
    []
  );


  /*
  |--------------------------------------------------------------------------
  | SAVE DRAFT
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            basics,
            answers,
            assessmentId,
          })
        );
      } catch {
        // Storage failure must not break assessment.
      }
    },
    [
      basics,
      answers,
      assessmentId,
    ]
  );


  /*
  |--------------------------------------------------------------------------
  | DERIVED STAGE
  |--------------------------------------------------------------------------
  */

  const stage =
    useMemo(
      () =>
        getStageFromClass(
          basics.currentClass
        ),
      [
        basics.currentClass,
      ]
    );


  const availableExams =
    useMemo(
      () =>
        stage
          ? getExamsForStage(
              stage
            )
          : [],
      [
        stage,
      ]
    );


  const currentQuestion =
    adaptiveQuestions[
      questionIndex
    ] ||
    null;


  const currentAnswer =
    currentQuestion
      ? answers[
          currentQuestion.id
        ]
      : undefined;


  /*
  |--------------------------------------------------------------------------
  | RESET DEPENDENT FIELDS WHEN CLASS CHANGES
  |--------------------------------------------------------------------------
  */

  function setClass(
    value
  ) {
    setBasics(
      (current) => ({
        ...EMPTY_BASICS,

        currentClass:
          value,

        subjects:
          current.subjects,

        skills:
          current.skills,
      })
    );

    setAssessmentId('');
    setAnswers({});
    setAdaptiveQuestions([]);
    setQuestionIndex(0);
    setAdaptiveProgress({
      answered: 0,
      minimum: 12,
      maximum: 30,
    });
    setBackendTraitScores({});
    setAssessmentError('');
    setReport(null);
  }


  /*
  |--------------------------------------------------------------------------
  | BASICS VALIDATION
  |--------------------------------------------------------------------------
  */

  const basicsValid =
    useMemo(
      () => {
        if (
          !basics.currentClass ||
          !stage
        ) {
          return false;
        }

        if (
          (
            stage ===
              'foundation' ||
            stage ===
              'class10' ||
            stage ===
              'senior-secondary'
          ) &&
          !basics.board
        ) {
          return false;
        }

        if (
          stage ===
            'class10' &&
          !basics.stream
        ) {
          return false;
        }

        if (
          stage ===
            'senior-secondary' &&
          !basics.stream
        ) {
          return false;
        }

        if (
          (
            stage ===
              'foundation' ||
            stage ===
              'class10' ||
            stage ===
              'senior-secondary'
          ) &&
          basics.subjects.length <
            1
        ) {
          return false;
        }

        if (
          stage ===
            'college' &&
          (
            !basics.degree ||
            !basics.collegeYear ||
            !basics.goal
          )
        ) {
          return false;
        }

        if (
          stage ===
            'graduate' &&
          (
            !basics.highestQualification ||
            !basics.specialization ||
            !basics.goal
          )
        ) {
          return false;
        }

        return true;
      },
      [
        basics,
        stage,
      ]
    );


  /*
  |--------------------------------------------------------------------------
  | START
  |--------------------------------------------------------------------------
  */

  function buildBackendProfile() {
    return {
      stage,
      currentClass:
        basics.currentClass,
      board:
        basics.board,
      stream:
        basics.stream,
      subjects:
        basics.subjects,
      exams:
        basics.targetExams,
      targetExams:
        basics.targetExams,
      degree:
        stage === 'graduate'
          ? basics.highestQualification
          : basics.degree,
      branch:
        basics.specialization,
      specialization:
        basics.specialization,
      collegeYear:
        basics.collegeYear,
      skills:
        basics.skills,
      highestQualification:
        basics.highestQualification,
      graduationYear:
        basics.graduationYear,
      experience:
        basics.experience,
      currentStatus:
        basics.currentStatus,
      goal:
        basics.goal,
    };
  }


  async function readJsonResponse(response) {
    let payload = null;

    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (!response.ok) {
      throw new Error(
        payload?.error ||
        `Career assessment request failed (${response.status})`
      );
    }

    return payload;
  }


  async function startBackendAssessment() {
    const response = await fetch(
      `${API_BASE_URL}/career/assessment/start`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profile: buildBackendProfile(),
        }),
      }
    );

    return readJsonResponse(response);
  }


  async function submitBackendAnswer({
    id,
    questionId,
    value,
  }) {
    const response = await fetch(
      `${API_BASE_URL}/career/assessment/${encodeURIComponent(id)}/answer`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionId,
          value,
        }),
      }
    );

    return readJsonResponse(response);
  }


  async function requestBackendReport(id) {
    const response = await fetch(
      `${API_BASE_URL}/career/assessment/${encodeURIComponent(id)}/report`
    );

    return readJsonResponse(response);
  }


  async function startAssessment() {
    if (
      !basicsValid ||
      loadingQuestion
    ) {
      return;
    }

    setLoadingQuestion(true);
    setAssessmentError('');
    setAssessmentId('');
    setAnswers({});
    setAdaptiveQuestions([]);
    setQuestionIndex(0);
    setReport(null);
    setBackendTraitScores({});

    try {
      const payload =
        await startBackendAssessment();

      if (
        !payload?.assessmentId ||
        payload?.completed ||
        !payload?.question
      ) {
        throw new Error(
          'The adaptive assessment did not return a valid starting session.'
        );
      }

      setAssessmentId(
        payload.assessmentId
      );

      setAdaptiveQuestions([
        payload.question,
      ]);

      setAdaptiveProgress(
        payload.progress || {
          answered: 0,
          minimum: 12,
          typicalTarget: 16,
          maximum: 30,
        }
      );

      setBackendTraitScores(
        payload.traitScores || {}
      );

      setScreen(
        'assessment'
      );

      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    } catch (error) {
      setAssessmentError(
        error?.message ||
        'Unable to start the adaptive assessment.'
      );
    } finally {
      setLoadingQuestion(false);
    }
  }


  /*
  |--------------------------------------------------------------------------
  | ANSWER
  |--------------------------------------------------------------------------
  */

  function answerQuestion(
    value
  ) {
    if (
      !currentQuestion
    ) {
      return;
    }

    setAnswers(
      (current) => ({
        ...current,

        [
          currentQuestion.id
        ]:
          value,
      })
    );
  }


  /*
  |--------------------------------------------------------------------------
  | NEXT
  |--------------------------------------------------------------------------
  |
  | Important:
  | Uses questionIndex against the dynamically-created question list.
  |
  | This prevents the old "stops after Question 6" / section-transition issue.
  |
  */

  async function nextQuestion() {
    if (
      !assessmentId ||
      !currentQuestion ||
      currentAnswer === undefined ||
      loadingQuestion
    ) {
      return;
    }

    setLoadingQuestion(true);
    setAssessmentError('');

    try {
      const payload =
        await submitBackendAnswer({
          id: assessmentId,
          questionId: currentQuestion.id,
          value: currentAnswer,
        });

      setAdaptiveProgress(
        payload?.progress ||
        adaptiveProgress
      );

      setBackendTraitScores(
        payload?.traitScores || {}
      );

      if (payload?.completed) {
        let backendReport =
          payload?.report || null;

        if (!backendReport) {
          backendReport =
            await requestBackendReport(
              assessmentId
            );
        }

        setReport(
          normalizeBackendReport(
            backendReport
          )
        );

        setScreen(
          'results'
        );

        window.scrollTo({
          top: 0,
          behavior: 'smooth',
        });

        return;
      }

      if (!payload?.question) {
        throw new Error(
          'The adaptive assessment did not return the next question.'
        );
      }

      // Always rebuild the path after the current question.
      // If the student goes back and changes an answer, stale future
      // questions are discarded and the backend chooses a new branch.
      setAdaptiveQuestions(
        (current) => [
          ...current.slice(
            0,
            questionIndex + 1
          ),
          payload.question,
        ]
      );

      setQuestionIndex(
        questionIndex + 1
      );
    } catch (error) {
      setAssessmentError(
        error?.message ||
        'Unable to load the next adaptive question.'
      );
    } finally {
      setLoadingQuestion(false);
    }
  }


  /*
  |--------------------------------------------------------------------------
  | BACK
  |--------------------------------------------------------------------------
  */

  function previousQuestion() {
    if (
      questionIndex ===
      0
    ) {
      setScreen(
        'basics'
      );

      return;
    }

    setQuestionIndex(
      (current) =>
        Math.max(
          0,
          current - 1
        )
    );
  }


  /*
  |--------------------------------------------------------------------------
  | RETAKE
  |--------------------------------------------------------------------------
  */

  function resetAssessment() {
    setBasics(
      EMPTY_BASICS
    );

    setAssessmentId('');

    setAnswers({});

    setAdaptiveQuestions([]);

    setAdaptiveProgress({
      answered: 0,
      minimum: 12,
      maximum: 30,
    });

    setBackendTraitScores({});

    setAssessmentError('');

    setQuestionIndex(
      0
    );

    setReport(null);

    setScreen(
      'basics'
    );

    try {
      localStorage.removeItem(
        STORAGE_KEY
      );
    } catch {
      // Ignore.
    }
  }


  /*
  |--------------------------------------------------------------------------
  | PROGRESS
  |--------------------------------------------------------------------------
  */

  const progress =
    adaptiveProgress.maximum > 0
      ? Math.min(
          100,
          Math.round(
            (
              adaptiveProgress.answered /
              adaptiveProgress.maximum
            ) * 100
          )
        )
      : 0;


  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */

  return (
    <div
      style={{
        minHeight:
          '100vh',

        background:
          '#f6f8fc',

        paddingBottom:
          80,
      }}
    >

      {/* ============================================================
          HERO
      ============================================================ */}

      <section
        style={{
          background:
            '#fff',

          borderBottom:
            '1px solid #e8edf5',

          padding:
            '44px 20px 30px',
        }}
      >
        <div
          className="container"
          style={{
            maxWidth:
              760,
          }}
        >
          <div
            style={{
              color:
                '#5368f5',

              fontSize:
                12,

              fontWeight:
                800,

              textTransform:
                'uppercase',

              letterSpacing:
                '.06em',
            }}
          >
            TruMarg Career Discovery
          </div>

          <h1
            style={{
              margin:
                '12px 0 10px',

              fontSize:
                'clamp(34px, 5vw, 52px)',

              lineHeight:
                1.05,

              color:
                '#121827',
            }}
          >
            Understand your career
            direction before choosing
            the path.
          </h1>

          <p
            style={{
              margin:
                0,

              color:
                '#69758d',

              lineHeight:
                1.7,

              maxWidth:
                760,
            }}
          >
            TruMarg adapts the
            assessment to your current
            education stage, interests,
            strengths, academics, work
            preferences and career
            priorities.
          </p>

          <div
            style={{
              marginTop:
                18,

              display:
                'flex',

              gap:
                8,

              flexWrap:
                'wrap',
            }}
          >
            {stage && (
              <span
                style={badgeStyle}
              >
                {
                  stageTitle(
                    stage
                  )
                }
              </span>
            )}

            {stage && (
              <span
                style={badgeStyle}
              >
                12–30 adaptive questions
              </span>
            )}

            <span
              style={badgeStyle}
            >
              India-focused paths
            </span>

            <span
              style={badgeStyle}
            >
              Explainable results
            </span>
          </div>
        </div>
      </section>


      {/* ============================================================
          BASICS
      ============================================================ */}

      {screen ===
        'basics' && (
        <section
          className="container"
          style={{
            maxWidth:
              1000,

            padding:
              '42px 20px',
          }}
        >
          <div
            style={cardStyle}
          >
            <div
              style={{
                color:
                  '#5368f5',

                fontSize:
                  12,

                fontWeight:
                  800,
              }}
            >
              Before we begin
            </div>

            <h2
              style={{
                margin:
                  '8px 0 4px',
              }}
            >
              Student Basics
            </h2>

            <p
              style={{
                margin:
                  '0 0 26px',

                color:
                  '#758198',
              }}
            >
              Select your current
              stage first. TruMarg will
              automatically change the
              profile fields and
              assessment level.
            </p>


            {/* CURRENT CLASS */}

            <div
              style={{
                display:
                  'grid',

                gridTemplateColumns:
                  'repeat(auto-fit, minmax(220px, 1fr))',

                gap:
                  16,
              }}
            >
              <SelectField
                label="Current class / stage"
                value={
                  basics.currentClass
                }
                onChange={
                  setClass
                }
              >
                <option value="">
                  Select class
                </option>

                {CLASS_OPTIONS.map(
                  (item) => (
                    <option
                      key={
                        item.value
                      }
                      value={
                        item.value
                      }
                    >
                      {
                        item.label
                      }
                    </option>
                  )
                )}
              </SelectField>


              {/* SCHOOL BOARD */}

              {(
                stage ===
                  'foundation' ||
                stage ===
                  'class10' ||
                stage ===
                  'senior-secondary'
              ) && (
                <SelectField
                  label="Board"
                  value={
                    basics.board
                  }
                  onChange={
                    (value) =>
                      setBasics(
                        (
                          current
                        ) => ({
                          ...current,
                          board:
                            value,
                        })
                      )
                  }
                >
                  <option value="">
                    Select board
                  </option>

                  {BOARD_OPTIONS.map(
                    (board) => (
                      <option
                        key={
                          board
                        }
                        value={
                          board
                        }
                      >
                        {board}
                      </option>
                    )
                  )}
                </SelectField>
              )}


              {/* STREAM */}

              {stage &&
                STREAM_OPTIONS[
                  stage
                ] && (
                  <SelectField
                    label={
                      stage ===
                      'foundation'
                        ? 'Current interest direction'
                        : 'Current / intended stream'
                    }
                    value={
                      basics.stream
                    }
                    onChange={
                      (value) =>
                        setBasics(
                          (
                            current
                          ) => ({
                            ...current,
                            stream:
                              value,
                          })
                        )
                    }
                  >
                    <option value="">
                      Select option
                    </option>

                    {STREAM_OPTIONS[
                      stage
                    ].map(
                      (
                        stream
                      ) => (
                        <option
                          key={
                            stream
                          }
                          value={
                            stream
                          }
                        >
                          {
                            stream
                          }
                        </option>
                      )
                    )}
                  </SelectField>
                )}
            </div>


            {/* ======================================================
                SCHOOL SUBJECTS
            ====================================================== */}

            {(
              stage ===
                'foundation' ||
              stage ===
                'class10' ||
              stage ===
                'senior-secondary'
            ) && (
              <div
                style={{
                  marginTop:
                    26,
                }}
              >
                <strong>
                  Subjects you
                  currently study or
                  feel most connected
                  to
                </strong>

                <div
                  style={chipGridStyle}
                >
                  {SCHOOL_SUBJECT_OPTIONS.map(
                    (
                      subject
                    ) => (
                      <Chip
                        key={
                          subject
                        }
                        active={
                          basics.subjects.includes(
                            subject
                          )
                        }
                        onClick={() =>
                          setBasics(
                            (
                              current
                            ) => ({
                              ...current,

                              subjects:
                                toggleArrayValue(
                                  current.subjects,
                                  subject
                                ),
                            })
                          )
                        }
                      >
                        {
                          subject
                        }
                      </Chip>
                    )
                  )}
                </div>
              </div>
            )}


            {/* ======================================================
                CLASS 11 / 12 EXAMS
            ====================================================== */}

            {stage ===
              'senior-secondary' && (
              <div
                style={{
                  marginTop:
                    28,
                }}
              >
                <strong>
                  Entrance exams /
                  admission routes you
                  are considering
                </strong>

                <p
                  style={helperStyle}
                >
                  Optional. Select all
                  that currently
                  interest you. This
                  does not lock your
                  recommendations.
                </p>

                <div
                  style={chipGridStyle}
                >
                  {availableExams.map(
                    (exam) => (
                      <Chip
                        key={
                          exam.id
                        }
                        active={
                          basics.targetExams.includes(
                            exam.id
                          )
                        }
                        onClick={() =>
                          setBasics(
                            (
                              current
                            ) => ({
                              ...current,

                              targetExams:
                                toggleArrayValue(
                                  current.targetExams,
                                  exam.id
                                ),
                            })
                          )
                        }
                      >
                        {
                          exam.name
                        }
                      </Chip>
                    )
                  )}
                </div>
              </div>
            )}


            {/* ======================================================
                COLLEGE PROFILE
            ====================================================== */}

            {stage ===
              'college' && (
              <>
                <div
                  style={{
                    marginTop:
                      24,

                    display:
                      'grid',

                    gridTemplateColumns:
                      'repeat(auto-fit, minmax(220px, 1fr))',

                    gap:
                      16,
                  }}
                >
                  <SelectField
                    label="Current degree"
                    value={
                      basics.degree
                    }
                    onChange={
                      (value) =>
                        setBasics(
                          (
                            current
                          ) => ({
                            ...current,
                            degree:
                              value,
                          })
                        )
                    }
                  >
                    <option value="">
                      Select degree
                    </option>

                    {DEGREE_OPTIONS.map(
                      (degree) => (
                        <option
                          key={
                            degree
                          }
                          value={
                            degree
                          }
                        >
                          {
                            degree
                          }
                        </option>
                      )
                    )}
                  </SelectField>


                  <label
                    style={{
                      display:
                        'grid',

                      gap:
                        8,
                    }}
                  >
                    <strong
                      style={{
                        fontSize:
                          13,
                      }}
                    >
                      Branch /
                      specialization
                    </strong>

                    <input
                      type="text"
                      value={
                        basics.specialization
                      }
                      placeholder="e.g. Computer Science, ECE, Finance..."
                      onChange={
                        (
                          event
                        ) =>
                          setBasics(
                            (
                              current
                            ) => ({
                              ...current,

                              specialization:
                                event
                                  .target
                                  .value,
                            })
                          )
                      }
                      style={inputStyle}
                    />
                  </label>


                  <SelectField
                    label="Current year"
                    value={
                      basics.collegeYear
                    }
                    onChange={
                      (value) =>
                        setBasics(
                          (
                            current
                          ) => ({
                            ...current,
                            collegeYear:
                              value,
                          })
                        )
                    }
                  >
                    <option value="">
                      Select year
                    </option>

                    {COLLEGE_YEAR_OPTIONS.map(
                      (year) => (
                        <option
                          key={
                            year
                          }
                          value={
                            year
                          }
                        >
                          {year}
                        </option>
                      )
                    )}
                  </SelectField>


                  <SelectField
                    label="Current goal"
                    value={
                      basics.goal
                    }
                    onChange={
                      (value) =>
                        setBasics(
                          (
                            current
                          ) => ({
                            ...current,
                            goal:
                              value,
                          })
                        )
                    }
                  >
                    <option value="">
                      Select goal
                    </option>

                    {CAREER_GOAL_OPTIONS.map(
                      (goal) => (
                        <option
                          key={
                            goal
                          }
                          value={
                            goal
                          }
                        >
                          {goal}
                        </option>
                      )
                    )}
                  </SelectField>
                </div>

                <SkillSelector
                  basics={
                    basics
                  }
                  setBasics={
                    setBasics
                  }
                />
              </>
            )}


            {/* ======================================================
                GRADUATE PROFILE
            ====================================================== */}

            {stage ===
              'graduate' && (
              <>
                <div
                  style={{
                    marginTop:
                      24,

                    display:
                      'grid',

                    gridTemplateColumns:
                      'repeat(auto-fit, minmax(220px, 1fr))',

                    gap:
                      16,
                  }}
                >
                  <SelectField
                    label="Highest qualification"
                    value={
                      basics.highestQualification
                    }
                    onChange={
                      (value) =>
                        setBasics(
                          (
                            current
                          ) => ({
                            ...current,

                            highestQualification:
                              value,
                          })
                        )
                    }
                  >
                    <option value="">
                      Select qualification
                    </option>

                    {DEGREE_OPTIONS.map(
                      (degree) => (
                        <option
                          key={
                            degree
                          }
                          value={
                            degree
                          }
                        >
                          {
                            degree
                          }
                        </option>
                      )
                    )}
                  </SelectField>


                  <label
                    style={{
                      display:
                        'grid',

                      gap:
                        8,
                    }}
                  >
                    <strong
                      style={{
                        fontSize:
                          13,
                      }}
                    >
                      Specialization
                    </strong>

                    <input
                      type="text"
                      value={
                        basics.specialization
                      }
                      placeholder="e.g. ECE, Psychology, Commerce..."
                      onChange={
                        (
                          event
                        ) =>
                          setBasics(
                            (
                              current
                            ) => ({
                              ...current,

                              specialization:
                                event
                                  .target
                                  .value,
                            })
                          )
                      }
                      style={inputStyle}
                    />
                  </label>


                  <SelectField
                    label="Current career goal"
                    value={
                      basics.goal
                    }
                    onChange={
                      (value) =>
                        setBasics(
                          (
                            current
                          ) => ({
                            ...current,

                            goal:
                              value,
                          })
                        )
                    }
                  >
                    <option value="">
                      Select goal
                    </option>

                    {CAREER_GOAL_OPTIONS.map(
                      (goal) => (
                        <option
                          key={
                            goal
                          }
                          value={
                            goal
                          }
                        >
                          {goal}
                        </option>
                      )
                    )}
                  </SelectField>
                </div>
              </>
            )}


            {/* ======================================================
                STAGE DESCRIPTION
            ====================================================== */}

            {stage && (
              <div
                style={{
                  marginTop:
                    28,

                  padding:
                    16,

                  borderRadius:
                    12,

                  background:
                    '#f6f8ff',

                  border:
                    '1px solid #e1e6ff',
                }}
              >
                <strong>
                  {
                    stageTitle(
                      stage
                    )
                  }
                </strong>

                <p
                  style={{
                    margin:
                      '6px 0 0',

                    color:
                      '#68758d',

                    lineHeight:
                      1.6,
                  }}
                >
                  {
                    stageDescription(
                      stage
                    )
                  }
                </p>
              </div>
            )}


            {/* ACTIONS */}

            <div
              style={{
                display:
                  'flex',

                justifyContent:
                  'space-between',

                alignItems:
                  'center',

                gap:
                  16,

                flexWrap:
                  'wrap',

                marginTop:
                  30,
              }}
            >
              <Link
                to="/"
                style={{
                  ...secondaryButtonStyle,

                  textDecoration:
                    'none',
                }}
              >
                Back to Home
              </Link>

              <button
                type="button"
                disabled={
                  !basicsValid ||
                  loadingQuestion
                }
                onClick={
                  startAssessment
                }
                style={{
                  ...primaryButtonStyle,

                  opacity:
                    basicsValid &&
                    !loadingQuestion
                      ? 1
                      : 0.45,

                  cursor:
                    basicsValid &&
                    !loadingQuestion
                      ? 'pointer'
                      : 'not-allowed',
                }}
              >
                {loadingQuestion
                  ? 'Starting...'
                  : 'Start Assessment'}
              </button>
            </div>
          </div>

          {assessmentError && (
            <div style={errorStyle}>
              {assessmentError}
            </div>
          )}

          <Disclaimer />
        </section>
      )}


      {/* ============================================================
          ASSESSMENT
      ============================================================ */}

      {screen ===
        'assessment' &&
        currentQuestion && (
        <section
          className="container"
          style={{
            maxWidth:
              760,

            padding:
              '32px 20px',
          }}
        >
          <div
            style={{
              display:
                'flex',

              justifyContent:
                'space-between',

              marginBottom:
                8,

              fontSize:
                13,

              fontWeight:
                700,
            }}
          >
            <span>
              Question{' '}
              {
                adaptiveProgress.answered +
                1
              }
              {' '}· minimum{' '}
              {adaptiveProgress.minimum}
            </span>

            <span
              style={{
                color:
                  '#5368f5',
              }}
            >
              {progress}% complete
            </span>
          </div>

          <div
            style={{
              height:
                7,

              borderRadius:
                999,

              background:
                '#e8edf5',

              overflow:
                'hidden',

              marginBottom:
                16,
            }}
          >
            <div
              style={{
                height:
                  '100%',

                width:
                  `${progress}%`,

                background:
                  'linear-gradient(90deg, #4968f2, #744cf3)',

                transition:
                  'width .2s ease',
              }}
            />
          </div>


          <div
            style={cardStyle}
          >
            <div
              style={{
                color:
                  '#5368f5',

                fontWeight:
                  800,

                fontSize:
                  12,
              }}
            >
              {
                stageTitle(
                  stage
                )
              }
            </div>

            <div
              style={{
                color:
                  '#738098',

                marginTop:
                  8,

                fontSize:
                  13,
              }}
            >
              {
                currentQuestion.section
                  .charAt(
                    0
                  )
                  .toUpperCase() +
                currentQuestion.section.slice(
                  1
                )
              }
            </div>

            <h2
              style={{
                margin:
                  '24px 0 20px',

                lineHeight:
                  1.35,

                fontSize:
                  23,
              }}
            >
              {
                currentQuestion.text
              }
            </h2>


            <div
              style={{
                display:
                  'grid',

                gap:
                  10,
              }}
            >
              {(currentQuestion.options ||
                SCORE_OPTIONS).map(
                (option) => {
                  const active =
                    currentAnswer ===
                    option.value;

                  return (
                    <button
                      type="button"
                      key={
                        option.value
                      }
                      onClick={() =>
                        answerQuestion(
                          option.value
                        )
                      }
                      style={{
                        width:
                          '100%',

                        textAlign:
                          'left',

                        minHeight:
                          52,

                        padding:
                          '12px 14px',

                        borderRadius:
                          10,

                        border:
                          active
                            ? '2px solid #5368f5'
                            : '1px solid #dfe5ef',

                        background:
                          active
                            ? 'rgba(83,104,245,.08)'
                            : '#fff',

                        color:
                          '#17223b',

                        font:
                          'inherit',

                        fontWeight:
                          active
                            ? 700
                            : 500,

                        cursor:
                          'pointer',
                      }}
                    >
                      {
                        option.label
                      }
                    </button>
                  );
                }
              )}
            </div>


            <div
              style={{
                display:
                  'flex',

                justifyContent:
                  'space-between',

                gap:
                  12,

                marginTop:
                  24,
              }}
            >
              <button
                type="button"
                onClick={
                  previousQuestion
                }
                style={
                  secondaryButtonStyle
                }
              >
                Back
              </button>

              <button
                type="button"
                onClick={
                  nextQuestion
                }
                disabled={
                  currentAnswer ===
                  undefined ||
                  loadingQuestion
                }
                style={{
                  ...primaryButtonStyle,

                  opacity:
                    currentAnswer ===
                    undefined ||
                    loadingQuestion
                      ? 0.45
                      : 1,

                  cursor:
                    currentAnswer ===
                    undefined ||
                    loadingQuestion
                      ? 'not-allowed'
                      : 'pointer',
                }}
              >
                {loadingQuestion
                  ? 'Loading...'
                  : 'Next'}
              </button>
            </div>

            {assessmentError && (
              <div style={errorStyle}>
                {assessmentError}
              </div>
            )}
          </div>

          <p
            style={{
              textAlign:
                'center',

              color:
                '#8792a7',

              fontSize:
                12,

              marginTop:
                14,
            }}
          >
            Choose what describes
            you naturally, not what
            you think a successful
            person should choose.
          </p>
        </section>
      )}


      {/* ============================================================
          RESULTS
      ============================================================ */}

      {screen ===
        'results' &&
        report && (
        <section
          className="container"
          style={{
            maxWidth:
              1000,

            padding:
              '36px 20px',
          }}
        >
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

              flexWrap:
                'wrap',

              marginBottom:
                24,
            }}
          >
            <div>
              <div
                style={{
                  color:
                    '#5368f5',

                  fontSize:
                    12,

                  fontWeight:
                    800,
                }}
              >
                YOUR TRUMARG CAREER REPORT
              </div>

              <h2
                style={{
                  margin:
                    '8px 0 6px',

                  fontSize:
                    32,
                }}
              >
                Your strongest career
                directions
              </h2>

              <p
                style={{
                  margin:
                    0,

                  color:
                    '#758198',
                }}
              >
                Based on your
                stage-specific assessment
                and current academic
                context.
              </p>
            </div>

            <button
              type="button"
              onClick={
                resetAssessment
              }
              style={
                secondaryButtonStyle
              }
            >
              Start Again
            </button>
          </div>


          {/* CONFIDENCE */}

          <div
            style={{
              ...cardStyle,

              marginBottom:
                20,
            }}
          >
            <strong>
              Assessment confidence:{' '}
              {
                report.confidence
                  .label
              }{' '}
              (
              {
                report.confidence
                  .score
              }
              %)
            </strong>

            <p
              style={{
                margin:
                  '6px 0 0',

                color:
                  '#758198',
              }}
            >
              {
                report.confidence
                  .explanation
              }
            </p>
          </div>


          {/* TOP TRAITS */}

          <div
            style={{
              ...cardStyle,

              marginBottom:
                20,
            }}
          >
            <h3
              style={{
                marginTop:
                  0,
              }}
            >
              Your strongest signals
            </h3>

            <div
              style={chipGridStyle}
            >
              {(report.topTraits || []).map(
                (trait) => (
                  <span
                    key={
                      trait.trait
                    }
                    style={{
                      ...badgeStyle,

                      padding:
                        '10px 14px',
                    }}
                  >
                    {
                      trait.label
                    }{' '}
                    ·{' '}
                    {
                      trait.score
                    }
                    %
                  </span>
                )
              )}
            </div>
          </div>


          {/* CLASS 10 STREAM RESULT */}

          {(
            stage ===
              'foundation' ||
            stage ===
              'class10'
          ) &&
            (report.suggestedStreams || [])
              .length >
              0 && (
              <div
                style={{
                  ...cardStyle,

                  marginBottom:
                    20,

                  background:
                    '#f7f8ff',
                }}
              >
                <h3
                  style={{
                    marginTop:
                      0,
                  }}
                >
                  Streams / directions
                  worth exploring
                </h3>

                <div
                  style={chipGridStyle}
                >
                  {(report.suggestedStreams || []).map(
                    (stream) => (
                      <span
                        key={
                          stream
                        }
                        style={{
                          ...badgeStyle,

                          background:
                            '#fff',
                        }}
                      >
                        {
                          stream
                        }
                      </span>
                    )
                  )}
                </div>

                <p
                  style={{
                    color:
                      '#758198',

                    marginBottom:
                      0,
                  }}
                >
                  This is guidance for
                  exploration, not a
                  compulsory stream
                  decision.
                </p>
              </div>
            )}


          {/* MATCHES */}

          <div
            style={{
              display:
                'grid',

              gap:
                18,
            }}
          >
            {(report.matches || []).map(
              (
                match,
                index
              ) => (
                <div
                  key={
                    match.id
                  }
                  style={
                    cardStyle
                  }
                >
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

                      flexWrap:
                        'wrap',
                    }}
                  >
                    <div
                      style={{
                        flex:
                          1,

                        minWidth:
                          240,
                      }}
                    >
                      <div
                        style={{
                          color:
                            '#5368f5',

                          fontWeight:
                            800,

                          fontSize:
                            12,
                        }}
                      >
                        CAREER DIRECTION{' '}
                        #
                        {
                          index +
                          1
                        }
                      </div>

                      <h3
                        style={{
                          margin:
                            '8px 0 6px',

                          fontSize:
                            23,
                        }}
                      >
                        {
                          match.name
                        }
                      </h3>

                      <p
                        style={{
                          margin:
                            0,

                          color:
                            '#758198',

                          lineHeight:
                            1.6,
                        }}
                      >
                        {
                          match.description
                        }
                      </p>
                    </div>

                    <div
                      style={{
                        minWidth:
                          105,

                        textAlign:
                          'center',

                        border:
                          '1px solid #dfe5ef',

                        borderRadius:
                          14,

                        padding:
                          '12px 16px',

                        background:
                          '#fafbff',
                      }}
                    >
                      <div
                        style={{
                          fontSize:
                            28,

                          fontWeight:
                            900,

                          color:
                            '#3549ce',
                        }}
                      >
                        {
                          match.score
                        }
                        %
                      </div>

                      <div
                        style={{
                          color:
                            '#7d899e',

                          fontSize:
                            11,
                        }}
                      >
                        alignment
                      </div>
                    </div>
                  </div>


                  {/* WHY */}

                  {match
                    .strongestTraits
                    .length >
                    0 && (
                    <ResultSection
                      title="Why it matches"
                    >
                      {match.strongestTraits.map(
                        (
                          trait
                        ) => (
                          <span
                            key={
                              trait.trait
                            }
                            style={
                              smallChipStyle
                            }
                          >
                            {
                              trait.label
                            }{' '}
                            {
                              trait.score
                            }
                            %
                          </span>
                        )
                      )}
                    </ResultSection>
                  )}


                  {/* COURSES */}

                  <ResultSection
                    title="Courses / paths to explore"
                  >
                    {match.courses.map(
                      (
                        course
                      ) => (
                        <span
                          key={
                            course
                          }
                          style={
                            smallChipStyle
                          }
                        >
                          {
                            course
                          }
                        </span>
                      )
                    )}
                  </ResultSection>


                  {/* JOB ROLES */}

                  <ResultSection
                    title="Example career roles"
                  >
                    {match.roles.map(
                      (
                        role
                      ) => (
                        <span
                          key={
                            role
                          }
                          style={
                            smallChipStyle
                          }
                        >
                          {role}
                        </span>
                      )
                    )}
                  </ResultSection>


                  {/* EXAMS */}

                  {match.exams.length >
                    0 && (
                    <ResultSection
                      title="Relevant Indian entrance / progression routes"
                    >
                      {match.exams.map(
                        (
                          exam
                        ) => (
                          <span
                            key={
                              exam.id
                            }
                            style={
                              smallChipStyle
                            }
                          >
                            {
                              exam.name
                            }
                          </span>
                        )
                      )}
                    </ResultSection>
                  )}
                </div>
              )
            )}
          </div>


          <Disclaimer />
        </section>
      )}

    </div>
  );
}


/*
|--------------------------------------------------------------------------
| SUB COMPONENTS
|--------------------------------------------------------------------------
*/

function SkillSelector({
  basics,
  setBasics,
}) {
  return (
    <div
      style={{
        marginTop:
          28,
      }}
    >
      <strong>
        Skills you already have or
        enjoy using
      </strong>

      <p
        style={helperStyle}
      >
        Optional but useful for
        better professional
        recommendations.
      </p>

      <div
        style={chipGridStyle}
      >
        {SKILL_OPTIONS.map(
          (skill) => (
            <Chip
              key={
                skill
              }
              active={
                basics.skills.includes(
                  skill
                )
              }
              onClick={() =>
                setBasics(
                  (
                    current
                  ) => ({
                    ...current,

                    skills:
                      toggleArrayValue(
                        current.skills,
                        skill
                      ),
                  })
                )
              }
            >
              {skill}
            </Chip>
          )
        )}
      </div>
    </div>
  );
}


function ResultSection({
  title,
  children,
}) {
  return (
    <div
      style={{
        marginTop:
          20,
      }}
    >
      <strong
        style={{
          display:
            'block',

          marginBottom:
            9,

          fontSize:
            13,
        }}
      >
        {title}
      </strong>

      <div
        style={chipGridStyle}
      >
        {children}
      </div>
    </div>
  );
}


function Disclaimer() {
  return (
    <div
      style={{
        marginTop:
          20,

        color:
          '#8590a5',

        fontSize:
          12,

        lineHeight:
          1.65,
      }}
    >
      TruMarg Career Discovery is a
      career-guidance and exploration
      tool. It is not a clinical,
      personality or psychometric
      diagnosis and does not guarantee
      admission, employment or career
      success. Entrance requirements
      and exam processes can change;
      always verify the latest rules
      from the relevant official
      authority before applying.
    </div>
  );
}


/*
|--------------------------------------------------------------------------
| STYLES
|--------------------------------------------------------------------------
*/

const cardStyle = {
  background:
    '#fff',

  border:
    '1px solid #e0e6ef',

  borderRadius:
    18,

  padding:
    24,

  boxShadow:
    '0 8px 28px rgba(30,44,74,.03)',
};


const chipGridStyle = {
  display:
    'flex',

  flexWrap:
    'wrap',

  gap:
    9,

  marginTop:
    12,
};


const badgeStyle = {
  display:
    'inline-flex',

  alignItems:
    'center',

  border:
    '1px solid #dfe5ef',

  background:
    '#fff',

  borderRadius:
    999,

  padding:
    '7px 11px',

  fontSize:
    12,

  fontWeight:
    700,

  color:
    '#34415f',
};


const smallChipStyle = {
  display:
    'inline-flex',

  border:
    '1px solid #e0e6ef',

  background:
    '#f8faff',

  borderRadius:
    999,

  padding:
    '7px 10px',

  fontSize:
    12,

  color:
    '#3d4963',
};


const primaryButtonStyle = {
  border:
    'none',

  background:
    '#5368f5',

  color:
    '#fff',

  borderRadius:
    10,

  minHeight:
    44,

  padding:
    '0 20px',

  fontWeight:
    800,

  font:
    'inherit',
};


const secondaryButtonStyle = {
  border:
    '1px solid #dfe5ef',

  background:
    '#fff',

  color:
    '#24314d',

  borderRadius:
    10,

  minHeight:
    44,

  padding:
    '0 16px',

  display:
    'inline-flex',

  alignItems:
    'center',

  justifyContent:
    'center',

  fontWeight:
    700,

  font:
    'inherit',

  cursor:
    'pointer',
};


const inputStyle = {
  width:
    '100%',

  minHeight:
    46,

  boxSizing:
    'border-box',

  border:
    '1px solid #dce3ef',

  borderRadius:
    10,

  padding:
    '0 12px',

  background:
    '#fff',

  color:
    '#17223b',

  font:
    'inherit',
};


const helperStyle = {
  margin:
    '5px 0 0',

  color:
    '#8590a5',

  fontSize:
    12,
};

const errorStyle = {
  marginTop: 16,
  padding: '12px 14px',
  borderRadius: 10,
  border: '1px solid #f1c6c6',
  background: '#fff7f7',
  color: '#a33a3a',
  fontSize: 13,
  lineHeight: 1.5,
};
