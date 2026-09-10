import {
  useEffect,
} from 'react';

import {
  Link,
} from 'react-router-dom';


function setMeta(
  name,
  content
) {
  let element =
    document.querySelector(
      `meta[name="${name}"]`
    );

  if (!element) {
    element =
      document.createElement(
        'meta'
      );

    element.setAttribute(
      'name',
      name
    );

    document.head.appendChild(
      element
    );
  }

  element.setAttribute(
    'content',
    content
  );
}


function setCanonical(
  href
) {
  let element =
    document.querySelector(
      'link[rel="canonical"]'
    );

  if (!element) {
    element =
      document.createElement(
        'link'
      );

    element.setAttribute(
      'rel',
      'canonical'
    );

    document.head.appendChild(
      element
    );
  }

  element.setAttribute(
    'href',
    href
  );
}


export default function CollegePredictorSEO() {
  useEffect(
    () => {
      document.title =
        'College Predictor 2026 - JEE Main & UPTAC | TruMarg';

      setMeta(
        'description',
        'Use TruMarg College Predictor 2026 to explore engineering colleges using JEE Main or UPTAC rank, category, quota and historical cutoff data.'
      );

      setMeta(
        'robots',
        'index, follow'
      );

      setCanonical(
        'https://www.trumarg.com/college-predictor'
      );
    },
    []
  );


  const faqItems = [
    {
      question:
        'What is the TruMarg College Predictor?',
      answer:
        'TruMarg College Predictor helps students explore possible college and branch options using entrance exam rank, category, quota and historical cutoff data.',
    },
    {
      question:
        'Which exams are supported by the college predictor?',
      answer:
        'TruMarg currently provides college prediction support for JEE Main and UPTAC based counselling flows.',
    },
    {
      question:
        'Does the college predictor guarantee admission?',
      answer:
        'No. Predictions are indicative. Final admission depends on official counselling rules, seat availability, category, quota, preferences and actual cutoff movement.',
    },
    {
      question:
        'What data is used for college prediction?',
      answer:
        'The predictor uses student inputs such as rank, category and counselling preferences together with historical opening and closing rank information where available.',
    },
    {
      question:
        'What do Dream, Target, Safe and Backup mean?',
      answer:
        'These labels help organize college options by relative admission feasibility. They are guidance categories and should not be treated as guaranteed admission outcomes.',
    },
  ];


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
        College Predictor 2026 -
        JEE Main & UPTAC College Predictor
      </h1>

      <p>
        TruMarg College Predictor helps
        students explore engineering
        college and branch options using
        entrance exam rank, category,
        quota, counselling preferences
        and historical cutoff data.
      </p>


      <h2>
        JEE Main College Predictor 2026
      </h2>

      <p>
        Enter your JEE Main rank and
        relevant counselling details to
        explore college and branch
        options using historical opening
        and closing rank information.
      </p>


      <h2>
        UPTAC College Predictor 2026
      </h2>

      <p>
        TruMarg also supports UPTAC
        college prediction using rank,
        category, counselling preferences
        and historical UPTAC cutoff
        information.
      </p>


      <h2>
        How TruMarg College Predictor Works
      </h2>

      <ol>
        <li>
          Select your entrance exam.
        </li>

        <li>
          Enter your rank and applicable
          category details.
        </li>

        <li>
          Choose counselling and college
          preferences.
        </li>

        <li>
          TruMarg compares your profile
          with historical admission data.
        </li>

        <li>
          Review relevant college and
          branch options.
        </li>
      </ol>


      <h2>
        What Data Is Used
      </h2>

      <p>
        College predictions may use
        historical opening ranks, closing
        ranks, counselling round data,
        category, quota and other
        relevant admission information
        available for the selected exam.
      </p>

      <p>
        Historical cutoffs are useful for
        understanding previous admission
        trends, but future cutoffs can
        change because of seat
        availability, competition,
        counselling rules and student
        preferences.
      </p>


      <h2>
        Dream, Target, Safe & Backup
        College Options
      </h2>

      <p>
        TruMarg organizes recommendations
        into admission-feasibility
        categories to make college
        options easier to understand.
      </p>

      <h3>
        Dream
      </h3>

      <p>
        Competitive options where
        admission may be more difficult
        based on historical cutoff
        patterns.
      </p>

      <h3>
        Target
      </h3>

      <p>
        College and branch options that
        may be comparatively realistic
        for the student's profile.
      </p>

      <h3>
        Safe
      </h3>

      <p>
        Options with relatively stronger
        historical admission feasibility.
      </p>

      <h3>
        Backup
      </h3>

      <p>
        Additional options that students
        may keep in their counselling
        preference strategy.
      </p>


      <h2>
        Why Use TruMarg College Predictor
      </h2>

      <p>
        Instead of checking large cutoff
        tables manually, TruMarg helps
        students organize relevant
        college and branch possibilities
        according to their own admission
        profile.
      </p>


      <h2>
        College Predictor FAQs
      </h2>

      {faqItems.map(
        ({
          question,
          answer,
        }) => (
          <section
            key={question}
            style={{
              marginBottom: '24px',
            }}
          >
            <h3>
              {question}
            </h3>

            <p>
              {answer}
            </p>
          </section>
        )
      )}


      <p>
        Predictions are indicative and
        do not guarantee admission.
        Final seat allocation depends on
        official counselling rules,
        actual cutoff movement and seat
        availability.
      </p>


      <Link
        to="/exams"
        className="btn btn-primary"
      >
        Start College Prediction
      </Link>
    </main>
  );
}
