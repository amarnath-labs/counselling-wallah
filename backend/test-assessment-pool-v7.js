import {
  normalizeCareerProfile,
} from './src/services/career/profileNormalizer.js';

import {
  buildAssessmentQuestionPool,
} from './src/services/career/assessmentPoolBuilder.js';

import {
  pool,
} from './src/db/pool.js';


const profiles = [
  {
    stage:
      'Senior Secondary',

    currentClass:
      'Class 11',

    stream:
      'science-pcm-computer-science',

    subjects: [
      'Mathematics',
      'Physics',
      'Computer Science',
    ],

    entranceExams: [
      'jee-main',
      'jee-advanced',
    ],

    careerFamilies: [
      'engineering',
      'technology',
    ],
  },

  {
    stage:
      'Senior Secondary',

    currentClass:
      'Class 12',

    stream:
      'science-pcb',

    subjects: [
      'Biology',
      'Chemistry',
      'Physics',
    ],

    entranceExams: [
      'neet-ug',
    ],

    targetCourses: [
      'mbbs',
    ],

    careerFamilies: [
      'healthcare',
      'life-sciences',
    ],
  },
];


for (
  const raw of
  profiles
) {
  const profile =
    normalizeCareerProfile(
      raw
    );


  const result =
    await buildAssessmentQuestionPool({
      profile,
    });


  console.log(
    '\n=============================='
  );

  console.log(
    'Stage:',
    profile.stage
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

  console.log(
    'First core IDs:',
    result.coreIds.slice(
      0,
      5
    )
  );

  console.log(
    'Personalised IDs:',
    result.personalisedIds
  );
}


await pool.end();
