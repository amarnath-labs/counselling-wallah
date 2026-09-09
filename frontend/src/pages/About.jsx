import {
  useEffect,
} from 'react';


export default function About() {
  useEffect(
    () => {
      document.title =
        'About TruMarg - College & Career Guidance Platform';

      let description =
        document.querySelector(
          'meta[name="description"]'
        );

      if (!description) {
        description =
          document.createElement(
            'meta'
          );

        description.setAttribute(
          'name',
          'description'
        );

        document.head.appendChild(
          description
        );
      }

      description.setAttribute(
        'content',
        'Learn about TruMarg, a college prediction and career guidance platform helping students make informed academic and career decisions.'
      );


      let canonical =
        document.querySelector(
          'link[rel="canonical"]'
        );

      if (!canonical) {
        canonical =
          document.createElement(
            'link'
          );

        canonical.setAttribute(
          'rel',
          'canonical'
        );

        document.head.appendChild(
          canonical
        );
      }

      canonical.setAttribute(
        'href',
        'https://www.trumarg.com/about'
      );
    },
    []
  );


  return (
    <main
      style={{
        maxWidth: '1000px',
        margin: '0 auto',
        padding: '48px 20px',
        lineHeight: 1.7,
      }}
    >
      <h1>
        About TruMarg
      </h1>

      <p>
        TruMarg is a college prediction
        and career guidance platform
        designed to help students make
        more informed academic and
        career decisions.
      </p>

      <h2>
        What TruMarg Helps With
      </h2>

      <p>
        TruMarg helps students explore
        colleges using entrance exam
        ranks, counselling information
        and historical cutoff data.
        It also provides career
        assessment and guidance tools
        designed around student
        profiles, interests and
        preferences.
      </p>

      <h2>
        Our Goal
      </h2>

      <p>
        Our goal is to make college and
        career decision-making clearer,
        more personalized and easier to
        understand for students.
      </p>
    </main>
  );
}
