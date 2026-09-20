import {
  getCandidateQuestions,
} from './src/repositories/careerQuestionRepository.js';

import {
  finalProfileQuestionScore,
} from './src/services/career/profileCombinationScorer.js';

import {
  buildQuestionProfileMap,
} from './src/services/career/questionProfileMapper.js';

import {
  pool,
} from './src/db/pool.js';


const PROFILES = {
  PCM_JEE: {
    stage: 'senior-secondary',
    currentClass: 'class-12',
    board: 'cbse',
    stream: 'science pcm',
    subjects: [
      'physics',
      'chemistry',
      'mathematics',
      'computer science',
    ],
    targetExams: [
      'jee main',
      'jee advanced',
    ],
    entranceExams: [
      'jee main',
      'jee advanced',
    ],
    targetCourses: [
      'btech',
      'be',
    ],
    careerFamilies: [
      'engineering',
      'technology',
    ],
    interestClusters: [
      'technology',
      'engineering',
      'problem-solving',
      'quantitative',
    ],
  },

  PCB_NEET: {
    stage: 'senior-secondary',
    currentClass: 'class-12',
    board: 'cbse',
    stream: 'science pcb',
    subjects: [
      'physics',
      'chemistry',
      'biology',
    ],
    targetExams: [
      'neet ug',
    ],
    entranceExams: [
      'neet ug',
    ],
    targetCourses: [
      'mbbs',
      'bds',
      'bsc nursing',
    ],
    careerFamilies: [
      'healthcare',
      'medicine',
      'life sciences',
    ],
    interestClusters: [
      'healthcare',
      'science',
      'helping',
      'research',
    ],
  },

  COMMERCE_IPMAT: {
    stage: 'senior-secondary',
    currentClass: 'class-12',
    board: 'cbse',
    stream: 'commerce with mathematics',
    subjects: [
      'accountancy',
      'economics',
      'business studies',
      'mathematics',
    ],
    targetExams: [
      'ipmat',
      'jipmat',
    ],
    entranceExams: [
      'ipmat',
      'jipmat',
    ],
    targetCourses: [
      'bba',
      'bms',
      'ipm',
    ],
    careerFamilies: [
      'management',
      'business',
      'finance',
    ],
    interestClusters: [
      'business',
      'management',
      'leadership',
      'entrepreneurship',
    ],
  },
};


function enrich(question) {
  const profileMap =
    buildQuestionProfileMap(
      question
    );

  return {
    ...question,

    profileMap,

    inferredDomains:
      profileMap.domains,

    streams:
      profileMap.streams,

    subjects:
      profileMap.subjects,

    entranceExams:
      profileMap.entranceExams,

    targetCourses:
      profileMap.targetCourses,

    interestClusters:
      profileMap.interestClusters,

    careerFamilies:
      profileMap.careerFamilies,

    goals:
      profileMap.goals,

    skills:
      profileMap.skills,

    degrees:
      profileMap.degrees,

    branches:
      profileMap.branches,
  };
}


function topForProfile(
  questions,
  profile,
  limit = 20
) {
  return questions
    .map(
      question => {
        const enriched =
          enrich(question);

        return {
          id:
            question.id,

          text:
            question.text,

          trait:
            question.trait,

          domains:
            enriched.inferredDomains,

          score:
            finalProfileQuestionScore(
              enriched,
              profile
            ),
        };
      }
    )
    .sort(
      (a, b) =>
        b.score - a.score
    )
    .slice(
      0,
      limit
    );
}


function overlap(
  left,
  right
) {
  const rightIds =
    new Set(
      right.map(
        item =>
          item.id
      )
    );

  const common =
    left.filter(
      item =>
        rightIds.has(
          item.id
        )
    );

  return {
    count:
      common.length,

    percentage:
      (
        common.length /
        Math.max(
          left.length,
          1
        )
      ) * 100,

    ids:
      common.map(
        item =>
          item.id
      ),
  };
}


try {
  const questions =
    await getCandidateQuestions({
      stage:
        'senior-secondary',

      currentClass:
        'class-12',

      version:
        7,

      excludeIds: [],

      limit:
        500,
    });


  console.log(
    'CLASS 12 V7:',
    questions.length
  );


  const results = {};


  for (
    const [
      name,
      profile,
    ] of
    Object.entries(
      PROFILES
    )
  ) {
    results[name] =
      topForProfile(
        questions,
        profile,
        20
      );


    console.log('');
    console.log(
      '========================================'
    );

    console.log(
      name
    );

    console.log(
      '========================================'
    );


    console.table(
      results[name].map(
        (
          item,
          index
        ) => ({
          rank:
            index + 1,

          id:
            item.id,

          trait:
            item.trait,

          domains:
            item.domains.join(
              ' | '
            ),

          score:
            Number(
              item.score.toFixed(
                4
              )
            ),
        })
      )
    );
  }


  const comparisons = [
    [
      'PCM_JEE',
      'PCB_NEET',
    ],

    [
      'PCM_JEE',
      'COMMERCE_IPMAT',
    ],

    [
      'PCB_NEET',
      'COMMERCE_IPMAT',
    ],
  ];


  console.log('');
  console.log(
    '========================================'
  );

  console.log(
    'TOP-20 OVERLAP'
  );

  console.log(
    '========================================'
  );


  for (
    const [
      left,
      right,
    ] of
    comparisons
  ) {
    const stats =
      overlap(
        results[left],
        results[right]
      );

    console.log(
      `${left} vs ${right}: ` +
      `${stats.count}/20 = ` +
      `${stats.percentage.toFixed(1)}%`
    );

    console.log(
      'COMMON:',
      stats.ids
    );
  }
} finally {
  await pool.end();
}
