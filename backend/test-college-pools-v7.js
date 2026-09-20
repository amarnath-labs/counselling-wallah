import {
  normalizeCareerProfile,
} from './src/services/career/profileNormalizer.js';

import {
  buildAssessmentQuestionPool,
} from './src/services/career/assessmentPoolBuilder.js';

import {
  pool,
} from './src/db/pool.js';


const tests = [
  {
    name:
      'BTECH CSE FINAL YEAR PLACEMENT',

    profile: {
      stage:
        'College',

      degree:
        'B.Tech',

      branch:
        'Computer Science',

      collegeYear:
        'Final Year',

      goal:
        'Placement',

      skills: [
        'Programming',
        'Problem Solving',
      ],
    },
  },

  {
    name:
      'BCOM FINANCE PROFESSIONAL',

    profile: {
      stage:
        'College',

      degree:
        'B.Com',

      branch:
        'Finance',

      collegeYear:
        '3rd Year',

      goal:
        'Professional Qualification',

      skills: [
        'Accounting',
        'Finance',
      ],
    },
  },

  {
    name:
      'BA PSYCHOLOGY HIGHER STUDIES',

    profile: {
      stage:
        'College',

      degree:
        'BA',

      branch:
        'Psychology',

      collegeYear:
        '3rd Year',

      goal:
        'Higher Studies',

      skills: [
        'Research',
        'Communication',
      ],
    },
  },

  {
    name:
      'BDES UIUX PORTFOLIO',

    profile: {
      stage:
        'College',

      degree:
        'B.Des',

      branch:
        'UI UX Design',

      collegeYear:
        'Final Year',

      goal:
        'Freelancing',

      skills: [
        'UI UX Design',
        'Graphic Design',
      ],
    },
  },
];


for (
  const test of
  tests
) {
  const profile =
    normalizeCareerProfile(
      test.profile
    );


  const result =
    await buildAssessmentQuestionPool({
      profile,
    });


  console.log(
    '\n========================================'
  );

  console.log(
    test.name
  );

  console.log(
    'Stage:',
    profile.stage
  );

  console.log(
    'Degree:',
    profile.degree
  );

  console.log(
    'Branch:',
    profile.branch
  );

  console.log(
    'Year:',
    profile.collegeYear
  );

  console.log(
    'Goal:',
    profile.goal
  );

  console.log(
    'Total:',
    result.total
  );

  console.log(
    'Core:',
    result.coreCount
  );

  console.log(
    'Personalised:',
    result.personalisedCount
  );

  console.log(
    'Unique:',
    new Set(
      result.ids
    ).size
  );


  const personalised =
    result.questions.filter(
      q =>
        result.personalisedIds.includes(
          q.id
        )
    );


  const counts = {};


  for (
    const q of
    personalised
  ) {
    counts[
      q.trait
    ] =
      (
        counts[
          q.trait
        ] ||
        0
      ) + 1;
  }


  console.log(
    'Trait counts:',
    counts
  );


  for (
    const q of
    personalised
  ) {
    console.log(
      '-',
      q.id,
      '|',
      q.trait,
      '|',
      q.scenario
    );
  }
}


await pool.end();
