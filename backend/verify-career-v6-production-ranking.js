import {
  retrieveRankedQuestionCandidates,
} from './src/services/career/questionRetriever.js';

import {
  pool,
} from './src/db/pool.js';


const TESTS = [
  {
    currentClass: 'class-8',
    stage: 'foundation',
    goal: 'explore-careers',
  },

  {
    currentClass: 'class-9',
    stage: 'foundation',
    goal: 'explore-careers',
  },

  {
    currentClass: 'class-10',
    stage: 'class10',
    goal: 'choose-stream',
  },

  {
    currentClass: 'class-11',
    stage: 'senior-secondary',
    goal: 'choose-course',
  },

  {
    currentClass: 'class-12',
    stage: 'senior-secondary',
    goal: 'choose-course',
  },
];


async function runTest(
  test
) {
  const profile = {
    stage:
      test.stage,

    currentClass:
      test.currentClass,

    board:
      'cbse',

    subjects: [
      'mathematics',
      'science',
      'computer',
      'physics',
      'chemistry',
    ],

    careerInterests: [
      'technology',
      'engineering',
      'science',
    ],

    interestClusters: [
      'technology',
      'engineering',
      'science',
    ],

    careerFamilies: [],

    goal:
      test.goal,

    skills: [],

    degree: '',

    specialization: '',

    branch: '',

    stream: '',
  };


  /*
  |--------------------------------------------------------------------------
  | IMPORTANT
  |--------------------------------------------------------------------------
  |
  | No legacy exclusions here.
  |
  | This represents the real production pool:
  |
  | V5 universal + V6 exact-class
  |--------------------------------------------------------------------------
  */

  const results =
    await retrieveRankedQuestionCandidates({
      profile,

      answers: [],

      traitEvidence: {},

      careerMatches: [],

      limit: 20,
    });


  const wrongClass =
    results.filter(
      (question) =>
        question.classes?.length &&
        !question.classes.includes(
          test.currentClass
        )
    );


  const v6Count =
    results.filter(
      (question) =>
        Number(
          question.version
        ) === 6
    ).length;


  const topFiveV6 =
    results
      .slice(
        0,
        5
      )
      .filter(
        (question) =>
          Number(
            question.version
          ) === 6
      )
      .length;


  console.log(
    '\n========================================'
  );

  console.log(
    'PROFILE:',
    test.currentClass
  );

  console.log(
    'Returned:',
    results.length
  );

  console.log(
    'V6 in top 20:',
    v6Count
  );

  console.log(
    'V6 in top 5:',
    topFiveV6
  );

  console.log(
    'Cross-class violations:',
    wrongClass.length
  );


  console.table(
    results.map(
      (
        question,
        index
      ) => ({
        rank:
          index + 1,

        id:
          question.id,

        version:
          question.version,

        classes:
          question.classes
            ?.join(',') ||
          'universal',

        trait:
          question.trait,

        tier:
          question.metadataTier,

        context:
          question.rankingSignals
            ?.contextSpecificity,

        classSpecificity:
          question.rankingSignals
            ?.classSpecificity,

        score:
          question.retrievalScore,
      })
    )
  );


  if (
    wrongClass.length
  ) {
    throw new Error(
      `Cross-class leakage for ${test.currentClass}`
    );
  }


  if (
    v6Count === 0
  ) {
    throw new Error(
      `V6 received no ranking preference for ${test.currentClass}`
    );
  }
}


async function main() {
  for (
    const test
    of TESTS
  ) {
    await runTest(
      test
    );
  }


  console.log(
    '\nâœ… MIXED V5/V6 PRODUCTION RANKING PASSED'
  );
}


main()
  .catch(
    (error) => {
      console.error(
        '\nâŒ PRODUCTION RANKING TEST FAILED'
      );

      console.error(
        error
      );

      process.exitCode = 1;
    }
  )
  .finally(
    async () => {
      await pool.end();
    }
  );
