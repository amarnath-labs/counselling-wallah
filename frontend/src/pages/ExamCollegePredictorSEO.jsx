import {
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
      'Use your JEE Main rank, category, quota and preferences to explore relevant NIT, IIIT, GFTI and other engineering college options using historical admission data.',
  },

  uptac: {
    name: 'UPTAC',
    heading:
      'UPTAC College Predictor 2026',
    description:
      'Use your UPTAC rank, category and counselling preferences to explore engineering college and branch options using historical UPTAC cutoff data.',
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
          TruMarg compares your profile with available historical cutoff data.
        </li>

        <li>
          Review relevant college and branch possibilities.
        </li>
      </ol>


      <h2>
        College Prediction Using Your Rank
      </h2>

      <p>
        TruMarg uses your admission profile together with historical opening and closing rank information where available to organize relevant college options.
      </p>


      <h2>
        Dream, Target, Safe and Backup Options
      </h2>

      <p>
        College possibilities may be organized into admission-feasibility categories to make comparison and counselling planning easier. These categories are guidance estimates and do not guarantee admission.
      </p>


      <h2>
        Important Admission Disclaimer
      </h2>

      <p>
        Historical cutoffs can change from year to year because of competition, seat availability, counselling rules, category, quota and student preferences. Final admission depends on the official counselling authority.
      </p>


      <button
        type="button"
        className="btn btn-primary"
        onClick={startPrediction}
      >
        Predict My Colleges
      </button>
    </main>
  );
}
