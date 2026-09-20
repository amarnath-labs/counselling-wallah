import {
  Link,
  useNavigate,
} from 'react-router-dom';

import {
  useAppState,
} from '../hooks/useAppState';


const EXAM_CONFIG = {
  'jee-main': {
    name: 'JEE Main',

    heading:
      'JEE Main College Predictor 2026',

    eyebrow:
      'JEE Main College Predictor',

    description:
      'Explore relevant NIT, IIIT, GFTI and other engineering college options using your JEE Main admission profile and historical cutoff data.',

    dataLabel:
      'Historical JEE Main / JoSAA admission data',

    coverageTitle:
      'JEE Main Predictor Coverage',

    coverageItems: [
      'NIT college and branch possibilities',
      'IIIT college and branch possibilities',
      'GFTI college and branch possibilities',
      'Rank, category, quota and home-state based admission profile',
      'Historical opening and closing rank comparison',
    ],

    inputItems: [
      'JEE Main rank',
      'Category',
      'Home state',
      'Quota',
      'Branch preferences',
      'Other applicable counselling details',
    ],

    methodology:
      'TruMarg compares the student admission profile with available historical opening and closing rank information. The goal is to organize relevant college and branch possibilities for counselling planning.',

    siblingRoute:
      '/uptac-college-predictor',

    siblingLabel:
      'UPTAC College Predictor 2026',
  },

  uptac: {
    name: 'UPTAC',

    heading:
      'UPTAC College Predictor 2026',

    eyebrow:
      'UPTAC College Predictor',

    description:
      'Explore UPTAC engineering college and branch possibilities using your rank, category, counselling preferences and historical UPTAC cutoff data.',

    dataLabel:
      'UPTAC 2025 historical counselling cutoff data',

    coverageTitle:
      'UPTAC Predictor Data Coverage',

    coverageItems: [
      '10,804 historical UPTAC 2025 cutoff records',
      'Round-wise historical counselling cutoff information',
      'Category-aware historical cutoff information',
      'Quota information where available',
      'College and branch level admission possibilities',
    ],

    inputItems: [
      'JEE Main / applicable UPTAC rank',
      'Category',
      'Counselling preferences',
      'Branch preferences',
      'Applicable quota or admission details',
    ],

    methodology:
      'TruMarg compares the student admission profile with historical UPTAC opening and closing rank information where available. The predictor then organizes relevant college and branch possibilities for counselling planning.',

    siblingRoute:
      '/jee-main-college-predictor',

    siblingLabel:
      'JEE Main College Predictor 2026',
  },
};


export default function ExamCollegePredictorSEO({
  examId,
}) {
  const navigate =
    useNavigate();

  const {
    setSelectedExamId,
  } = useAppState();

  const config =
    EXAM_CONFIG[examId];

  if (!config) {
    return null;
  }


  const startPrediction = () => {
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
            color: '#f97316',
            fontWeight: 800,
          }}
        >
          {config.eyebrow}
        </p>

        <h1
          style={{
            margin: 0,
            color: '#172554',
            fontSize:
              'clamp(34px, 6vw, 56px)',
            lineHeight: 1.08,
          }}
        >
          {config.heading}
        </h1>

        <p
          style={{
            maxWidth: '760px',
            margin:
              '22px auto 0',
            color: '#475569',
            fontSize: '18px',
            lineHeight: 1.75,
          }}
        >
          {config.description}
        </p>

        <button
          type="button"
          className="btn btn-primary"
          onClick={startPrediction}
          style={{
            marginTop: '24px',
          }}
        >
          Start {config.name} Prediction
        </button>

        <p
          style={{
            marginTop: '14px',
            color: '#64748b',
            fontSize: '14px',
          }}
        >
          {config.dataLabel}
        </p>
      </section>


      <section
        aria-label={`${config.name} predictor inputs`}
        style={{
          marginTop: '52px',
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '18px',
        }}
      >
        {config.inputItems.map(
          item => (
            <div
              key={item}
              style={{
                border:
                  '1px solid #e2e8f0',
                borderRadius: '14px',
                padding: '18px',
                background: '#ffffff',
              }}
            >
              <strong
                style={{
                  color: '#172554',
                }}
              >
                {item}
              </strong>
            </div>
          )
        )}
      </section>


      <section
        style={{
          marginTop: '64px',
        }}
      >
        <h2>
          How the {config.name} College Predictor Works
        </h2>

        <ol
          style={{
            color: '#475569',
            lineHeight: 1.9,
          }}
        >
          <li>
            Start the {config.name} predictor.
          </li>

          <li>
            Enter your rank and applicable admission details.
          </li>

          <li>
            Add category, quota, home-state or counselling preferences where applicable.
          </li>

          <li>
            TruMarg compares your profile with available historical cutoff information.
          </li>

          <li>
            Review relevant college and branch possibilities.
          </li>
        </ol>
      </section>


      <section
        style={{
          marginTop: '56px',
        }}
      >
        <h2>
          {config.coverageTitle}
        </h2>

        <ul
          style={{
            color: '#475569',
            lineHeight: 1.9,
          }}
        >
          {config.coverageItems.map(
            item => (
              <li key={item}>
                {item}
              </li>
            )
          )}
        </ul>
      </section>


      <section
        style={{
          marginTop: '56px',
        }}
      >
        <h2>
          Historical Cutoff Methodology
        </h2>

        <p
          style={{
            color: '#475569',
            lineHeight: 1.8,
          }}
        >
          {config.methodology}
        </p>

        <p
          style={{
            color: '#475569',
            lineHeight: 1.8,
          }}
        >
          Historical cutoffs are useful for understanding previous admission patterns, but future cutoffs can change because of competition, seat availability, counselling rules, category, quota and student preferences.
        </p>
      </section>


      <section
        style={{
          marginTop: '56px',
        }}
      >
        <h2>
          Dream, Target, Safe and Backup College Options
        </h2>

        <p
          style={{
            color: '#475569',
            lineHeight: 1.8,
          }}
        >
          TruMarg may organize recommendations into Dream, Target, Safe and Backup categories to make counselling options easier to compare. These categories are guidance estimates and do not guarantee admission.
        </p>
      </section>


      <section
        style={{
          marginTop: '56px',
        }}
      >
        <h2>
          Frequently Asked Questions
        </h2>

        <h3>
          What information does the {config.name} predictor use?
        </h3>

        <p>
          It uses your admission profile together with available historical cutoff information and counselling preferences.
        </p>

        <h3>
          Does TruMarg guarantee admission?
        </h3>

        <p>
          No. Final admission depends on official counselling rules, seat availability and actual cutoff movement.
        </p>

        <h3>
          Why can cutoff ranks change every year?
        </h3>

        <p>
          Cutoffs can change because of applicant demand, seat availability, category, quota, counselling rounds and student choice preferences.
        </p>
      </section>


      <section
        style={{
          marginTop: '64px',
          padding: '28px',
          borderRadius: '18px',
          background: '#f8fafc',
        }}
      >
        <h2
          style={{
            marginTop: 0,
          }}
        >
          Start Your College Prediction
        </h2>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '14px',
          }}
        >
          <button
            type="button"
            className="btn btn-primary"
            onClick={startPrediction}
          >
            Predict My Colleges
          </button>

          <Link
            to={config.siblingRoute}
            className="btn"
          >
            {config.siblingLabel}
          </Link>

          <Link
            to="/college-predictor"
            className="btn"
          >
            All College Predictors
          </Link>

          <Link
            to="/college-counselling"
            className="btn"
          >
            College Counselling
          </Link>
        </div>
      </section>
    </main>
  );
}