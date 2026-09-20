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

    description:
      'Use your JEE Main rank, category, quota and preferences to explore relevant NIT, IIIT, GFTI and other engineering college options using available historical admission data.',

    overview:
      'The TruMarg JEE Main College Predictor helps students narrow down college and branch possibilities instead of manually checking large cutoff tables. Enter your admission details and preferences to explore options relevant to your profile.',

    inputs: [
      'JEE Main rank',
      'Category and applicable quota',
      'Branch preferences',
      'Counselling preferences',
      'Available historical opening and closing ranks',
    ],

    dataText:
      'TruMarg compares your admission profile with available historical opening and closing rank information. Previous cutoffs can help identify patterns, but they should be treated as guidance rather than a guarantee of future admission.',

    counsellingText:
      'College prediction is most useful when combined with a sensible counselling strategy. Students can use predicted options to compare branches and colleges and prepare a broader preference list instead of depending on a single expected cutoff.',

    faq: [
      {
        question:
          'How does the JEE Main College Predictor work?',
        answer:
          'It uses your admission profile together with available historical cutoff information to organize relevant college and branch possibilities.',
      },
      {
        question:
          'Can TruMarg predict NIT, IIIT and GFTI options?',
        answer:
          'Where relevant historical admission data is available, the JEE Main prediction flow can help students explore NIT, IIIT, GFTI and other supported engineering college options.',
      },
      {
        question:
          'Does a predicted college guarantee admission?',
        answer:
          'No. Final admission depends on official counselling rules, seat availability, category, quota, preference order and actual cutoff movement.',
      },
    ],
  },


  uptac: {
    name: 'UPTAC',

    heading:
      'UPTAC College Predictor 2026',

    description:
      'Use your UPTAC rank, category and counselling preferences to explore engineering college and branch options using available historical UPTAC cutoff data.',

    overview:
      'The TruMarg UPTAC College Predictor helps students explore relevant college and branch possibilities using their admission profile and available historical counselling data.',

    inputs: [
      'UPTAC rank',
      'Category',
      'Counselling preferences',
      'Branch preferences',
      'Available historical opening and closing ranks',
    ],

    dataText:
      'TruMarg uses available historical UPTAC opening and closing rank information together with your admission details to organize relevant options. Historical cutoffs can change from one counselling cycle to another.',

    counsellingText:
      'Use predicted options as a starting point for counselling planning. A broader preference strategy can help students compare realistic, ambitious and additional backup options before final choice filling.',

    faq: [
      {
        question:
          'How does the UPTAC College Predictor work?',
        answer:
          'It combines your admission details with available historical UPTAC cutoff information to organize relevant college and branch possibilities.',
      },
      {
        question:
          'What information should I enter?',
        answer:
          'Use accurate rank, category and counselling preferences so that the prediction flow can evaluate options against the available admission data.',
      },
      {
        question:
          'Is UPTAC admission guaranteed by the prediction?',
        answer:
          'No. Predictions are indicative. Final seat allocation depends on official counselling rules, seat availability and actual cutoff movement.',
      },
    ],
  },
};


export default function ExamCollegePredictorSEO({
  examId,
}) {
  const nav =
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

    nav('/profile');
  };


  return (
    <main
      style={{
        maxWidth: '1050px',
        margin: '0 auto',
        padding: '48px 20px 80px',
        lineHeight: 1.7,
      }}
    >
      <section
        style={{
          maxWidth: '850px',
        }}
      >
        <p
          style={{
            fontWeight: 700,
            color: '#f97316',
            marginBottom: '10px',
          }}
        >
          TruMarg College Predictor
        </p>

        <h1>
          {config.heading}
        </h1>

        <p>
          {config.description}
        </p>

        <button
          type="button"
          className="btn btn-primary"
          onClick={startPrediction}
        >
          Start {config.name} College Prediction
        </button>
      </section>


      <section
        style={{
          marginTop: '56px',
        }}
      >
        <h2>
          {config.name} College Prediction Using Your Rank
        </h2>

        <p>
          {config.overview}
        </p>
      </section>


      <section
        style={{
          marginTop: '40px',
        }}
      >
        <h2>
          Information Used for Prediction
        </h2>

        <ul>
          {config.inputs.map(
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
          marginTop: '40px',
        }}
      >
        <h2>
          How the {config.name} College Predictor Works
        </h2>

        <ol>
          <li>
            {config.name} is automatically selected.
          </li>

          <li>
            Enter your rank and applicable admission details.
          </li>

          <li>
            Add branch and counselling preferences.
          </li>

          <li>
            TruMarg compares your profile with available historical admission data.
          </li>

          <li>
            Review relevant college and branch possibilities.
          </li>
        </ol>
      </section>


      <section
        style={{
          marginTop: '40px',
        }}
      >
        <h2>
          Historical Cutoff Data
        </h2>

        <p>
          {config.dataText}
        </p>
      </section>


      <section
        style={{
          marginTop: '40px',
        }}
      >
        <h2>
          Dream, Target, Safe and Backup Options
        </h2>

        <p>
          TruMarg may organize college possibilities into
          admission-feasibility categories to make comparison
          and counselling planning easier. These categories
          are guidance estimates and do not guarantee admission.
        </p>
      </section>


      <section
        style={{
          marginTop: '40px',
        }}
      >
        <h2>
          Use Prediction for College Counselling
        </h2>

        <p>
          {config.counsellingText}
        </p>

        <p>
          <Link to="/college-counselling">
            Explore TruMarg College Counselling
          </Link>
        </p>

        <p>
          <Link to="/college-predictor">
            View College Predictor 2026
          </Link>
        </p>
      </section>


      <section
        style={{
          marginTop: '40px',
        }}
      >
        <h2>
          {config.name} College Predictor FAQs
        </h2>

        {config.faq.map(
          item => (
            <div
              key={item.question}
              style={{
                marginBottom: '22px',
              }}
            >
              <h3>
                {item.question}
              </h3>

              <p>
                {item.answer}
              </p>
            </div>
          )
        )}
      </section>


      <section
        style={{
          marginTop: '40px',
        }}
      >
        <h2>
          Important Admission Disclaimer
        </h2>

        <p>
          Historical cutoffs can change from year to year
          because of competition, seat availability,
          counselling rules, category, quota and student
          preferences. Final admission depends on the
          official counselling authority.
        </p>

        <button
          type="button"
          className="btn btn-primary"
          onClick={startPrediction}
        >
          Predict My Colleges
        </button>
      </section>
    </main>
  );
}