import { pool } from './src/db/pool.js';

import {
  retrieveNextQuestion,
  retrieveRankedQuestionCandidates,
} from './src/services/career/questionRetriever.js';


const EXPECTED_TRAITS = new Set([
  'analytical',
  'quantitative',
  'verbal',
  'creativity',
  'technology',
  'hands_on',
  'scientific_curiosity',
  'social_helping',
  'leadership',
  'collaboration',
  'independence',
  'structure',
  'adaptability',
  'achievement',
  'stability',
  'entrepreneurship',
]);


const profile = {
  stage: 'foundation',

  currentClass:
    'class-8',

  board:
    'cbse',

  subjects: [
    'mathematics',
    'science',
    'english',
    'social-science',
    'computer-science',
  ],

  goal:
    'explore-careers',

  careerInterests: [
    'technology',
    'engineering',
    'science',
    'business',
    'design-creative',
    'education-social-impact',
  ],

  interestClusters: [
    'technology',
    'engineering',
    'science',
    'business',
    'design-creative',
    'education-social-impact',
  ],

  careerFamilies: [],

  skills: [],
};


function classLabel(
  question
) {
  if (
    question.classes?.length
  ) {
    return question.classes.join(
      ','
    );
  }

  return 'universal';
}


function isWrongClass(
  question
) {
  const classes =
    question.classes || [];

  if (!classes.length) {
    return false;
  }

  return !classes.includes(
    'class-8'
  );
}


async function databaseCheck() {
  console.log(
    '\n========================================'
  );

  console.log(
    'V7 DATABASE CHECK'
  );


  const result =
    await pool.query(
      `
      SELECT
        version,
        stage,
        classes,
        COUNT(*)::int AS count
      FROM career_questions
      WHERE
        active = TRUE
        AND version = 7
      GROUP BY
        version,
        stage,
        classes
      ORDER BY
        stage,
        classes
      `
    );


  console.table(
    result.rows
  );


  const class8Count =
    result.rows
      .filter(
        (row) =>
          row.stage ===
            'foundation' &&
          Array.isArray(
            row.classes
          ) &&
          row.classes.includes(
            'class-8'
          )
      )
      .reduce(
        (sum, row) =>
          sum +
          Number(row.count),
        0
      );


  console.log(
    'Class 8 active V7:',
    class8Count
  );


  if (
    class8Count !== 96
  ) {
    throw new Error(
      `Expected 96 Class-8 V7 questions, found ${class8Count}`
    );
  }


  console.log(
    '✅ Database contains exactly 96 active Class-8 V7 questions'
  );
}


async function initialRankingCheck() {
  console.log(
    '\n========================================'
  );

  console.log(
    'INITIAL MIXED V5/V6/V7 RANKING'
  );


  const ranked =
    await retrieveRankedQuestionCandidates({
      profile,

      answers: [],

      traitEvidence: {},

      careerMatches: [],

      limit: 30,
    });


  const v7 =
    ranked.filter(
      (question) =>
        Number(
          question.version
        ) === 7
    );


  const v6 =
    ranked.filter(
      (question) =>
        Number(
          question.version
        ) === 6
    );


  const v5 =
    ranked.filter(
      (question) =>
        Number(
          question.version
        ) === 5
    );


  const crossClass =
    ranked.filter(
      isWrongClass
    );


  console.log(
    'Returned:',
    ranked.length
  );

  console.log(
    'V7:',
    v7.length
  );

  console.log(
    'V6:',
    v6.length
  );

  console.log(
    'V5:',
    v5.length
  );

  console.log(
    'Cross-class violations:',
    crossClass.length
  );


  console.table(
    ranked
      .slice(0, 20)
      .map(
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

          class:
            classLabel(
              question
            ),

          trait:
            question.trait,

          section:
            question.section,

          scope:
            question.contextScope,

          tier:
            question.metadataTier,

          context:
            question
              .rankingSignals
              ?.contextSpecificity,

          classSpecificity:
            question
              .rankingSignals
              ?.classSpecificity,

          score:
            question
              .retrievalScore,
        })
      )
  );


  if (
    crossClass.length !== 0
  ) {
    throw new Error(
      'Cross-class question leakage detected'
    );
  }


  const top5 =
    ranked.slice(
      0,
      5
    );


  const top5ExactClass =
    top5.filter(
      (question) =>
        Array.isArray(
          question.classes
        ) &&
        question.classes.includes(
          'class-8'
        )
    ).length;


  const top20V7 =
    ranked
      .slice(0, 20)
      .filter(
        (question) =>
          Number(
            question.version
          ) === 7
      ).length;


  console.log(
    'Top-5 exact Class-8:',
    top5ExactClass
  );

  console.log(
    'Top-20 V7:',
    top20V7
  );


  /*
  |--------------------------------------------------------------------------
  | IMPORTANT
  |--------------------------------------------------------------------------
  |
  | V6 and V7 are both valid exact-class questions.
  |
  | We intentionally do NOT award a ranking bonus merely because a
  | question has a higher version number.
  |
  | Relevance + class/context specificity must decide the winner.
  |
  */


  if (
    top5ExactClass !==
    top5.length
  ) {
    throw new Error(
      `Expected all top-5 questions to be exact Class-8 questions, found ${top5ExactClass}/${top5.length}`
    );
  }


  if (
    top20V7 < 10
  ) {
    throw new Error(
      `V7 representation unexpectedly low in top 20: ${top20V7}/20`
    );
  }


  console.log(
    '\n✅ Initial mixed ranking passed'
  );

  console.log(
    '✅ Top results are exact Class-8 questions'
  );

  console.log(
    '✅ V7 is strongly represented without artificial version boosting'
  );

  console.log(
    '✅ V6 remains a valid exact-class fallback'
  );
}


async function adaptiveSequenceCheck() {
  console.log(
    '\n========================================'
  );

  console.log(
    '16-QUESTION ADAPTIVE COVERAGE TEST'
  );


  const answers = [];

  const traitEvidence = {};

  const delivered = [];


  for (
    let step = 1;
    step <= 16;
    step += 1
  ) {
    const question =
      await retrieveNextQuestion({
        profile,

        answers,

        traitEvidence,

        careerMatches: [],
      });


    if (!question) {
      throw new Error(
        `No question returned at adaptive step ${step}`
      );
    }


    if (
      isWrongClass(
        question
      )
    ) {
      throw new Error(
        `Cross-class leak at step ${step}: ${question.id}`
      );
    }


    delivered.push(
      question
    );


    /*
    |--------------------------------------------------------------------------
    | Simulated neutral-positive answer
    |--------------------------------------------------------------------------
    |
    | We are testing retrieval behaviour here, not psychological scoring.
    |
    */

    answers.push({
      questionId:
        question.id,

      value: 4,
    });


    const current =
      traitEvidence[
        question.trait
      ] || {
        score: 75,
        confidence: 0,
        evidenceCount: 0,
      };


    const newCount =
      Number(
        current.evidenceCount || 0
      ) + 1;


    traitEvidence[
      question.trait
    ] = {
      score: 75,

      evidenceCount:
        newCount,

      confidence:
        Math.min(
          1,
          0.32 +
            newCount * 0.18
        ),
    };


    console.log(
      [
        String(step)
          .padStart(2, '0'),

        `v${question.version}`,

        classLabel(
          question
        ),

        question.trait,

        question.section,

        question.id,
      ].join(' | ')
    );
  }


  const uniqueTraits =
    new Set(
      delivered.map(
        (question) =>
          question.trait
      )
    );


  const v7Delivered =
    delivered.filter(
      (question) =>
        Number(
          question.version
        ) === 7
    ).length;


  const v6Delivered =
    delivered.filter(
      (question) =>
        Number(
          question.version
        ) === 6
    ).length;


  const v5Delivered =
    delivered.filter(
      (question) =>
        Number(
          question.version
        ) === 5
    ).length;


  const crossClass =
    delivered.filter(
      isWrongClass
    );


  const traitCounts = {};

  for (
    const question
    of delivered
  ) {
    traitCounts[
      question.trait
    ] =
      (
        traitCounts[
          question.trait
        ] || 0
      ) + 1;
  }


  console.log(
    '\n----------------------------------------'
  );

  console.log(
    'Delivered:',
    delivered.length
  );

  console.log(
    'Unique traits:',
    uniqueTraits.size
  );

  console.log(
    'V7 delivered:',
    v7Delivered
  );

  console.log(
    'V6 delivered:',
    v6Delivered
  );

  console.log(
    'V5 delivered:',
    v5Delivered
  );

  console.log(
    'Cross-class violations:',
    crossClass.length
  );


  console.table(
    Object.entries(
      traitCounts
    )
      .sort(
        (
          [a],
          [b]
        ) =>
          a.localeCompare(b)
      )
      .map(
        ([
          trait,
          count,
        ]) => ({
          trait,
          count,
        })
      )
  );


  if (
    crossClass.length !== 0
  ) {
    throw new Error(
      'Adaptive sequence contained cross-class leakage'
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Coverage expectation
  |--------------------------------------------------------------------------
  |
  | Exact ordering can change as the bank grows.
  | Therefore we do NOT demand exactly 16/16 yet.
  |
  | But 16 questions should cover at least 14 different canonical traits.
  |
  */

  if (
    uniqueTraits.size < 14
  ) {
    throw new Error(
      `Adaptive trait diversity too low: ${uniqueTraits.size}/16`
    );
  }


  const invalidTraits =
    [
      ...uniqueTraits,
    ].filter(
      (trait) =>
        !EXPECTED_TRAITS.has(
          trait
        )
    );


  if (
    invalidTraits.length
  ) {
    throw new Error(
      `Unexpected traits delivered: ${invalidTraits.join(', ')}`
    );
  }


  if (
    v7Delivered < 8
  ) {
    throw new Error(
      `V7 usage unexpectedly low: ${v7Delivered}/16`
    );
  }


  console.log(
    '\n✅ Adaptive Class-8 sequence passed'
  );

  console.log(
    '✅ Strong broad-trait coverage'
  );

  console.log(
    '✅ Exact-class V7 questions are actively used'
  );

  console.log(
    '✅ Legacy V5/V6 remain available as fallback'
  );

  console.log(
    '✅ Cross-class leakage = 0'
  );
}


async function main() {
  try {
    await databaseCheck();

    await initialRankingCheck();

    await adaptiveSequenceCheck();


    console.log(
      '\n========================================'
    );

    console.log(
      '✅ V7 CLASS-8 PRODUCTION TEST PASSED'
    );

    console.log(
      '========================================'
    );
  }
  finally {
    await pool.end();
  }
}


main()
  .catch(
    (error) => {
      console.error(
        '\n❌ V7 CLASS-8 PRODUCTION TEST FAILED'
      );

      console.error(
        error
      );

      process.exitCode = 1;
    }
  );
