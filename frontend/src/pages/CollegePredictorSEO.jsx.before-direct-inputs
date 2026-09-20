import {
  useNavigate,
} from 'react-router-dom';

import {
  useAppState,
} from '../hooks/useAppState';


const EXAMS = [
  {
    id: 'jee-main',
    name: 'JEE Main',
    title: 'JEE Main College Predictor 2026',
    description:
      'Explore NIT, IIIT, GFTI and other engineering college options using your JEE Main admission profile and historical cutoff data.',
  },
  {
    id: 'uptac',
    name: 'UPTAC',
    title: 'UPTAC College Predictor 2026',
    description:
      'Explore UPTAC engineering college and branch options using your rank, category, counselling preferences and historical cutoff data.',
  },
];


export default function CollegePredictorSEO() {
  const navigate =
    useNavigate();

  const {
    setSelectedExamId,
  } = useAppState();


  const startPrediction = (
    examId
  ) => {
    setSelectedExamId(
      examId
    );

    navigate(
      '/profile'
    );
  };


  return (
    <main
      style={{
        maxWidth: '1120px',
        margin: '0 auto',
        padding: '48px 20px 80px',
      }}
    >
      <section
        style={{
          textAlign: 'center',
          maxWidth: '860px',
          margin: '0 auto',
        }}
      >
        <p
          style={{
            margin: '0 0 12px',
            fontWeight: 800,
            color: '#f97316',
          }}
        >
          TruMarg College Predictor
        </p>

        <h1
          style={{
            margin: 0,
            color: '#172554',
            fontSize:
              'clamp(36px, 6vw, 58px)',
            lineHeight: 1.08,
          }}
        >
          College Predictor 2026
        </h1>

        <p
          style={{
            margin:
              '22px auto 0',
            maxWidth: '760px',
            color: '#475569',
            fontSize: '18px',
            lineHeight: 1.75,
          }}
        >
          Predict relevant college and
          branch options using your
          entrance exam rank, category,
          quota, counselling preferences
          and historical cutoff data.
        </p>
      </section>


      <section
        aria-label="Choose college predictor"
        style={{
          marginTop: '42px',
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '22px',
        }}
      >
        {EXAMS.map(
          exam => (
            <article
              key={exam.id}
              style={{
                border:
                  '1px solid #e2e8f0',
                borderRadius: '18px',
                padding: '28px',
                background: '#ffffff',
                boxShadow:
                  '0 12px 32px rgba(15, 23, 42, 0.06)',
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontWeight: 800,
                  color: '#f97316',
                }}
              >
                {exam.name}
              </p>

              <h2
                style={{
                  color: '#172554',
                  margin:
                    '10px 0 12px',
                }}
              >
                {exam.title}
              </h2>

              <p
                style={{
                  color: '#475569',
                  lineHeight: 1.7,
                }}
              >
                {exam.description}
              </p>

              <button
                type="button"
                className="btn btn-primary"
                onClick={() =>
                  startPrediction(
                    exam.id
                  )
                }
                style={{
                  marginTop: '12px',
                }}
              >
                Start {exam.name} Prediction
              </button>
            </article>
          )
        )}
      </section>


      <section
        style={{
          marginTop: '72px',
        }}
      >
        <h2>
          How TruMarg College Predictor Works
        </h2>

        <ol
          style={{
            lineHeight: 1.9,
            color: '#475569',
          }}
        >
          <li>
            Choose your entrance exam.
          </li>

          <li>
            Enter your rank and applicable
            admission details.
          </li>

          <li>
            Add category, quota, branch and
            counselling preferences where
            applicable.
          </li>

          <li>
            TruMarg compares your profile
            with available historical
            admission and cutoff data.
          </li>

          <li>
            Review relevant college and
            branch possibilities.
          </li>
        </ol>
      </section>


      <section
        style={{
          marginTop: '56px',
        }}
      >
        <h2>
          College Prediction Using Historical Cutoffs
        </h2>

        <p
          style={{
            color: '#475569',
            lineHeight: 1.8,
          }}
        >
          Historical opening and closing
          ranks help students understand
          previous admission trends.
          TruMarg combines available cutoff
          information with the student's
          admission profile to organize
          relevant college possibilities.
        </p>

        <p
          style={{
            color: '#475569',
            lineHeight: 1.8,
          }}
        >
          Cutoffs can change every year
          because of seat availability,
          competition, counselling rules,
          category, quota and student
          preferences.
        </p>
      </section>


      <section
        style={{
          marginTop: '56px',
        }}
      >
        <h2>
          Dream, Target, Safe and Backup
          College Options
        </h2>

        <p
          style={{
            color: '#475569',
            lineHeight: 1.8,
          }}
        >
          TruMarg may organize college
          recommendations into admission
          feasibility categories such as
          Dream, Target, Safe and Backup
          so students can compare options
          more clearly during counselling.
        </p>
      </section>


      <section
        style={{
          marginTop: '56px',
        }}
      >
        <h2>
          College Predictor FAQs
        </h2>

        <h3>
          What is a college predictor?
        </h3>

        <p>
          A college predictor helps students
          explore possible colleges and
          branches using entrance exam rank
          and relevant admission information.
        </p>

        <h3>
          Which predictors are available on TruMarg?
        </h3>

        <p>
          TruMarg currently provides dedicated
          JEE Main and UPTAC college prediction
          flows.
        </p>

        <h3>
          Does TruMarg guarantee admission?
        </h3>

        <p>
          No. Prediction results are guidance
          estimates. Final admission depends
          on official counselling rules,
          available seats and actual cutoff
          movement.
        </p>
      </section>


      <section
        style={{
          marginTop: '64px',
          padding: '30px',
          borderRadius: '18px',
          background: '#f8fafc',
        }}
      >
        <h2
          style={{
            marginTop: 0,
          }}
        >
          Explore More TruMarg Guidance
        </h2>

        <p>
          Looking beyond college prediction?
          Explore college counselling and
          career guidance tools on TruMarg.
        </p>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '14px',
          }}
        >
          <button
            type="button"
            onClick={() =>
              navigate(
                '/college-counselling'
              )
            }
            className="btn"
          >
            College Counselling
          </button>

          <button
            type="button"
            onClick={() =>
              navigate(
                '/career-guidance'
              )
            }
            className="btn"
          >
            Career Guidance
          </button>
        </div>
      </section>
    </main>
  );
}