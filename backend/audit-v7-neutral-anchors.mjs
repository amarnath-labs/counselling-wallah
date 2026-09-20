import {
  getCandidateQuestions,
} from './src/repositories/careerQuestionRepository.js';

import {
  buildQuestionProfileMap,
} from './src/services/career/questionProfileMapper.js';

import {
  isNeutralAnchorQuestion,
} from './src/services/career/psychometricBlueprint.js';

import {
  pool,
} from './src/db/pool.js';


const CASES = [
  {
    name: 'CLASS_8',
    stage: 'foundation',
    currentClass: 'class-8',
  },
  {
    name: 'CLASS_9',
    stage: 'foundation',
    currentClass: 'class-9',
  },
  {
    name: 'CLASS_10',
    stage: 'class10',
    currentClass: 'class-10',
  },
  {
    name: 'CLASS_11',
    stage: 'senior-secondary',
    currentClass: 'class-11',
  },
  {
    name: 'CLASS_12',
    stage: 'senior-secondary',
    currentClass: 'class-12',
  },
  {
    name: 'COLLEGE',
    stage: 'college',
    currentClass: null,
  },
  {
    name: 'GRADUATE',
    stage: 'graduate',
    currentClass: null,
  },
];


try {
  for (const testCase of CASES) {
    const questions =
      await getCandidateQuestions({
        stage:
          testCase.stage,

        currentClass:
          testCase.currentClass,

        version: 7,

        limit: 2000,
      });


    const mapped =
      questions.map(
        question => {
          const profileMap =
            buildQuestionProfileMap(
              question
            );

          return {
            ...question,

            profileMap,

            inferredDomains:
              profileMap.domains,
          };
        }
      );


    const neutral =
      mapped.filter(
        question =>
          isNeutralAnchorQuestion(
            question
          )
      );


    const traitCounts = {};

    for (const question of neutral) {
      traitCounts[
        question.trait
      ] =
        (
          traitCounts[
            question.trait
          ] ||
          0
        ) + 1;
    }


    console.log('');
    console.log(
      '========================================'
    );

    console.log(
      testCase.name
    );

    console.log(
      '========================================'
    );

    console.log(
      'TOTAL V7:',
      mapped.length
    );

    console.log(
      'NEUTRAL:',
      neutral.length
    );

    console.log(
      'NEUTRAL %:',
      (
        neutral.length /
        Math.max(
          mapped.length,
          1
        ) *
        100
      ).toFixed(1) + '%'
    );

    console.log(
      'TRAITS:',
      traitCounts
    );

    console.log(
      'SAMPLE IDs:',
      neutral
        .slice(
          0,
          20
        )
        .map(
          question =>
            question.id
        )
    );
  }
}
finally {
  await pool.end();
}

