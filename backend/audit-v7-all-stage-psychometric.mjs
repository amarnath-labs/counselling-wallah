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


const CASES = [
  {
    name: 'CLASS_8',
    profile: {
      stage: 'foundation',
      currentClass: 'class-8',
      board: 'cbse',

      interestClusters: [
        'technology',
        'science',
        'problem solving',
      ],
    },
  },

  {
    name: 'CLASS_9',
    profile: {
      stage: 'foundation',
      currentClass: 'class-9',
      board: 'cbse',

      interestClusters: [
        'creative',
        'communication',
        'social helping',
      ],
    },
  },

  {
    name: 'CLASS_10',
    profile: {
      stage: 'class10',
      currentClass: 'class-10',
      board: 'cbse',

      targetStream: 'science pcm',

      subjects: [
        'mathematics',
        'science',
      ],

      interestClusters: [
        'engineering',
        'technology',
      ],
    },
  },

  {
    name: 'CLASS_11',
    profile: {
      stage: 'senior-secondary',
      currentClass: 'class-11',
      board: 'cbse',
      stream: 'science pcb',

      subjects: [
        'physics',
        'chemistry',
        'biology',
      ],

      entranceExams: [
        'neet ug',
      ],

      careerFamilies: [
        'healthcare',
      ],
    },
  },

  {
    name: 'CLASS_12',
    profile: {
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

      entranceExams: [
        'jee main',
        'jee advanced',
      ],

      targetCourses: [
        'btech',
      ],

      careerFamilies: [
        'engineering',
        'technology',
      ],
    },
  },

  {
    name: 'COLLEGE',
    profile: {
      stage: 'college',

      degree: 'btech',
      branch: 'computer science',

      skills: [
        'programming',
        'data analysis',
        'problem solving',
      ],

      careerFamilies: [
        'technology',
        'engineering',
      ],

      interestClusters: [
        'technology',
        'research',
      ],
    },
  },

  {
    name: 'GRADUATE',
    profile: {
      stage: 'graduate',

      degree: 'btech',
      branch: 'electronics',

      currentStatus:
        'looking for career opportunities',

      skills: [
        'problem solving',
        'technology',
        'communication',
      ],

      careerFamilies: [
        'technology',
        'engineering',
      ],
    },
  },
];


function updateEvidence(
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
      confidence: 0,
      score: 0.5,
    };


  const evidenceCount =
    current.evidenceCount + 1;


  return {
    ...traitEvidence,

    [trait]: {
      evidenceCount,

      confidence:
        Math.min(
          0.95,
          0.30 +
            evidenceCount *
              0.18
        ),

      score:
        0.55,
    },
  };
}


async function auditCase(
  name,
  profile
) {
  const blueprint =
    buildPsychometricBlueprint(
      profile
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
      break;
    }


    selected.push({
      number:
        index + 1,

      id:
        question.id,

      trait:
        question.trait,

      phase,

      domains:
        question.inferredDomains ||
        question.profileMap?.domains ||
        [],
    });


    answers.push({
      questionId:
        question.id,

      value: 3,
    });


    traitEvidence =
      updateEvidence(
        question,
        traitEvidence
      );
  }


  const ids =
    selected.map(
      item =>
        item.id
    );


  const phaseCounts = {};

  const traitCounts = {};

  let badAnchors = 0;


  for (
    const item of selected
  ) {
    phaseCounts[
      item.phase
    ] =
      (
        phaseCounts[
          item.phase
        ] ||
        0
      ) + 1;


    traitCounts[
      item.trait
    ] =
      (
        traitCounts[
          item.trait
        ] ||
        0
      ) + 1;


    if (
      item.phase === 'anchor'
    ) {
      const domains =
        item.domains || [];

      const neutral =
        domains.length === 0 ||
        (
          domains.length === 1 &&
          domains[0] === 'general'
        );


      if (!neutral) {
        badAnchors += 1;
      }
    }
  }


  const maxTrait =
    Math.max(
      0,
      ...Object.values(
        traitCounts
      )
    );


  const unique =
    new Set(
      ids
    ).size;


  const expectedAnchor =
    blueprint.anchorTarget;

  const expectedProfile =
    blueprint.profileTarget;

  const expectedAdaptive =
    blueprint.adaptiveTarget;


  const pass =
    selected.length ===
      blueprint.totalQuestions &&

    unique ===
      selected.length &&

    badAnchors ===
      0 &&

    phaseCounts.anchor ===
      expectedAnchor &&

    phaseCounts.profile ===
      expectedProfile &&

    phaseCounts.adaptive ===
      expectedAdaptive &&

    maxTrait <= 4;


  console.log('');
  console.log(
    '========================================'
  );

  console.log(name);

  console.log(
    '========================================'
  );

  console.log(
    'TOTAL:',
    selected.length,
    '/',
    blueprint.totalQuestions
  );

  console.log(
    'UNIQUE:',
    unique
  );

  console.log(
    'PHASES:',
    phaseCounts
  );

  console.log(
    'EXPECTED:',
    {
      anchor:
        expectedAnchor,

      profile:
        expectedProfile,

      adaptive:
        expectedAdaptive,
    }
  );

  console.log(
    'BAD ANCHORS:',
    badAnchors
  );

  console.log(
    'MAX TRAIT COUNT:',
    maxTrait
  );

  console.log(
    'TRAITS:',
    traitCounts
  );

  console.log(
    'ANCHOR IDS:',
    selected
      .filter(
        item =>
          item.phase ===
          'anchor'
      )
      .map(
        item =>
          item.id
      )
  );

  console.log(
    'RESULT:',
    pass
      ? 'PASS'
      : 'FAIL'
  );


  return {
    name,
    pass,
    total:
      selected.length,
    unique,
    badAnchors,
    maxTrait,
    phaseCounts,
  };
}


try {
  const results = [];


  for (
    const testCase of CASES
  ) {
    results.push(
      await auditCase(
        testCase.name,
        testCase.profile
      )
    );
  }


  console.log('');
  console.log(
    '========================================'
  );

  console.log(
    'FINAL ALL-STAGE SUMMARY'
  );

  console.log(
    '========================================'
  );


  console.table(
    results.map(
      result => ({
        stage:
          result.name,

        result:
          result.pass
            ? 'PASS'
            : 'FAIL',

        total:
          result.total,

        unique:
          result.unique,

        badAnchors:
          result.badAnchors,

        maxTrait:
          result.maxTrait,

        anchor:
          result.phaseCounts
            .anchor || 0,

        profile:
          result.phaseCounts
            .profile || 0,

        adaptive:
          result.phaseCounts
            .adaptive || 0,
      })
    )
  );


  const passed =
    results.filter(
      result =>
        result.pass
    ).length;


  console.log(
    `PASSED: ${passed}/${results.length}`
  );


  if (
    passed !==
    results.length
  ) {
    process.exitCode = 1;
  }
}
finally {
  await pool.end();
}
