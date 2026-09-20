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
        Predict Colleges from Your Rank
      </h1>

      <p>
        TruMarg College Predictor helps
        students explore engineering
        colleges based on entrance exam
        rank, category, quota and
        historical admission cutoff data.
      </p>

      <h2>
        JEE Main College Predictor
      </h2>

      <p>
        Use your JEE Main rank and
        counselling details to explore
        college and branch options using
        previous opening and closing rank
        information.
      </p>

      <h2>
        UPTAC College Predictor
      </h2>

      <p>
        TruMarg also supports UPTAC
        college prediction using rank,
        category, counselling preferences
        and historical cutoff information.
      </p>

      <h2>
        How the College Predictor Works
      </h2>

      <ol>
        <li>
          Select your entrance exam.
        </li>

        <li>
          Enter your rank.
        </li>

        <li>
          Select category and
          counselling preferences.
        </li>

        <li>
          Review relevant college and
          branch options.
        </li>
      </ol>

      <p>
        Predictions are indicative and
        do not guarantee admission.
        Final seat allocation depends on
        official counselling rules and
        actual cutoff movement.
      </p>

      <Link to="/">
        Start College Prediction
      </Link>
    </main>
  );
}
