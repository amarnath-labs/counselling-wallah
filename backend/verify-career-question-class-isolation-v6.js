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


async function getLegacyAnswers(
  stage
) {
  /*
  |--------------------------------------------------------------------------
  | Exclude legacy/non-V6 questions from THIS TEST only
  |--------------------------------------------------------------------------
  |
  | We are not modifying DB rows.
  |
  | This forces the retriever to prove that, among V6 class-targeted
  | questions, it never crosses the class boundary.
  |--------------------------------------------------------------------------
  */

  const { rows } =
    await pool.query(
      `
        SELECT id
        FROM career_questions
        WHERE active = TRUE
          AND stage = $1
          AND version <> 6
      `,
      [stage]
    );

  return rows.map(
    (row) => ({
      questionId: row.id,

      /*
      | Value is irrelevant here.
      | Retriever only needs questionId for exclusion.
      */
      value: 3,
    })
  );
}


async function testProfile(
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
      'biology',
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

    goal:
      test.goal,

    skills: [],

    careerFamilies: [],

    degree: '',

    specialization: '',

    branch: '',

    stream: '',
  };


  const legacyAnswers =
    await getLegacyAnswers(
      test.stage
    );


  const results =
    await retrieveRankedQuestionCandidates({
      profile,

      answers:
        legacyAnswers,

      traitEvidence: {},

      careerMatches: [],

      limit: 50,
    });


  const v6 =
    results.filter(
      (question) =>
        Number(
          question.version
        ) === 6
    );


  const wrongClass =
    v6.filter(
      (question) =>
        question.classes?.length &&
        !question.classes.includes(
          test.currentClass
        )
    );


  const correctClass =
    v6.filter(
      (question) =>
        question.classes?.includes(
          test.currentClass
        )
    );


  console.log(
    '\n========================================'
  );

  console.log(
    'PROFILE:',
    test.currentClass
  );

  console.log(
    'STAGE:',
    test.stage
  );

  console.log(
    'Legacy questions excluded:',
    legacyAnswers.length
  );

  console.log(
    'V6 returned:',
    v6.length
  );

  console.log(
    'Correct-class V6:',
    correctClass.length
  );

  console.log(
    'Cross-class violations:',
    wrongClass.length
  );


  console.table(
    v6.map(
      (question) => ({
        id:
          question.id,

        classes:
          question.classes
            ?.join(',') ||
          '',

        trait:
          question.trait,

        version:
          question.version,

        tier:
          question.metadataTier,

        score:
          question.retrievalScore,
      })
    )
  );


  /*
  |--------------------------------------------------------------------------
  | Assertions
  |--------------------------------------------------------------------------
  */

  if (
    correctClass.length === 0
  ) {
    throw new Error(
      `No Class-specific V6 questions returned for ${test.currentClass}`
    );
  }


  if (
    wrongClass.length > 0
  ) {
    throw new Error(
      `Cross-class leakage detected for ${test.currentClass}`
    );
  }


  const wrongIds =
    wrongClass.map(
      (question) =>
        question.id
    );

  if (
    wrongIds.length
  ) {
    console.error(
      'Wrong IDs:',
      wrongIds
    );
  }
}


async function verifyDatabase() {
  const { rows } =
    await pool.query(`
      SELECT
        stage,
        classes,
        COUNT(*)::int AS count
      FROM career_questions
      WHERE active = TRUE
        AND version = 6
      GROUP BY
        stage,
        classes
      ORDER BY
        stage,
        classes
    `);

  const total =
    rows.reduce(
      (sum, row) =>
        sum +
        Number(
          row.count
        ),
      0
    );


  console.log(
    '========================================'
  );

  console.log(
    'V6 DATABASE CHECK'
  );

  console.table(
    rows
  );

  console.log(
    'Total V6:',
    total
  );


  if (
    total !== 30
  ) {
    throw new Error(
      `Expected 30 V6 questions, found ${total}`
    );
  }
}


async function main() {
  await verifyDatabase();


  for (
    const test
    of TESTS
  ) {
    await testProfile(
      test
    );
  }


  console.log(
    '\n========================================'
  );

  console.log(
    '✅ V6 CLASS ISOLATION PASSED'
  );

  console.log(
    '✅ Every class received its own V6 questions'
  );

  console.log(
    '✅ No Class 8 ↔ Class 9 leakage'
  );

  console.log(
    '✅ No Class 11 ↔ Class 12 leakage'
  );
}


main()
  .catch(
    (error) => {
      console.error(
        '\n❌ V6 CLASS ISOLATION FAILED'
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
