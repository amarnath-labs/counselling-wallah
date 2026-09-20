import {
  retrieveNextQuestion,
} from './src/services/career/questionRetriever.js';

import {
  buildPsychometricBlueprint,
  psychometricPhase,
} from './src/services/career/psychometricBlueprint.js';

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
      'engineering',
      'technology',
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
    ],

    interestClusters: [
      'healthcare',
      'science',
      'helping',
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
      'management',
      'business',
      'leadership',
      'entrepreneurship',
    ],
  },
};


function makeEvidence(
  question,
  traitEvidence
) {
  const trait =
    question.trait;

  const current =
    traitEvidence[
      trait
    ] || {
      evidenceCount: 0,
      score: 0.5,
      confidence: 0,
    };


  const evidenceCount =
    current.evidenceCount +
    1;


  /*
   * Deterministic simulated answer.
   *
   * This is NOT a psychometric scoring model.
   * It only allows the adaptive engine to
   * progress through a complete audit.
   */
  const simulatedScore =
    (
      (
        String(
          question.id
        )
          .split('')
          .reduce(
            (
              total,
              char
            ) =>
              total +
              char.charCodeAt(
                0
              ),
            0
          )
      ) %
      5
    ) / 4;


  const score =
    (
      current.score *
        current.evidenceCount +
      simulatedScore
    ) /
    evidenceCount;


  const confidence =
    Math.min(
      0.95,
      0.30 +
        evidenceCount *
          0.18
    );


  return {
    ...traitEvidence,

    [trait]: {
      evidenceCount,
      score,
      confidence,
    },
  };
}


async function simulate(
  name,
  profile
) {
  const blueprint =
    buildPsychometricBlueprint(
      profile
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

  console.log(
    'BLUEPRINT:',
    blueprint
  );


  const answers = [];

  let traitEvidence = {};

  const selected = [];


  for (
    let index = 0;
    index <
      blueprint.totalQuestions;
    index += 1
  ) {
    const phase =
      psychometricPhase({
        profile,
        answers,
      });


    const question =
      await retrieveNextQuestion({
        profile,
        answers,
        traitEvidence,
        careerMatches: [],
      });


    if (!question) {
      console.log(
        'STOP: no question available at',
        index + 1
      );

      break;
    }


    selected.push({
      number:
        index + 1,

      id:
        question.id,

      trait:
        question.trait,

      section:
        question.section,

      domains:
        (
          question.inferredDomains ||
          question.profileMap?.domains ||
          []
        ),

      phase,
    });


    answers.push({
      questionId:
        question.id,

      value:
        3,
    });


    traitEvidence =
      makeEvidence(
        question,
        traitEvidence
      );
  }


  const ids =
    selected.map(
      item =>
        item.id
    );


  const duplicates =
    ids.filter(
      (
        id,
        index
      ) =>
        ids.indexOf(
          id
        ) !==
        index
    );


  const traitCounts = {};

  const phaseCounts = {};

  const domainCounts = {};


  for (
    const item of
    selected
  ) {
    traitCounts[
      item.trait
    ] =
      (
        traitCounts[
          item.trait
        ] ||
        0
      ) + 1;


    phaseCounts[
      item.phase
    ] =
      (
        phaseCounts[
          item.phase
        ] ||
        0
      ) + 1;


    for (
      const domain of
      item.domains
    ) {
      domainCounts[
        domain
      ] =
        (
          domainCounts[
            domain
          ] ||
          0
        ) + 1;
    }
  }


  console.table(
    selected
  );


  console.log(
    'QUESTIONS:',
    selected.length
  );

  console.log(
    'UNIQUE:',
    new Set(
      ids
    ).size
  );

  console.log(
    'DUPLICATES:',
    [
      ...new Set(
        duplicates
      ),
    ]
  );

  console.log(
    'PHASE COUNTS:',
    phaseCounts
  );

  console.log(
    'TRAIT COUNTS:',
    traitCounts
  );

  console.log(
    'DOMAIN COUNTS:',
    domainCounts
  );


  return selected;
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

    denominator:
      Math.max(
        left.length,
        1
      ),

    percentage:
      (
        common.length /
        Math.max(
          left.length,
          1
        )
      ) *
      100,

    ids:
      common.map(
        item =>
          item.id
      ),
  };
}


try {
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
    results[
      name
    ] =
      await simulate(
        name,
        profile
      );
  }


  console.log('');
  console.log(
    '========================================'
  );

  console.log(
    'FULL EXAM OVERLAP'
  );

  console.log(
    '========================================'
  );


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


  for (
    const [
      left,
      right,
    ] of
    comparisons
  ) {
    const stats =
      overlap(
        results[
          left
        ],
        results[
          right
        ]
      );


    console.log(
      `${left} vs ${right}: ` +
      `${stats.count}/${stats.denominator} = ` +
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
