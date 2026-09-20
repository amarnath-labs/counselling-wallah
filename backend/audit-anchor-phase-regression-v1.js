import {
  retrieveRankedQuestionCandidates,
} from './src/services/career/questionRetriever.js';


const cases = [
  {
    name: 'ANCHOR',
    profile: {
      stage: 'foundation',
      currentClass: 'class-8',
    },
    answers: [],
  },

  {
    name: 'LATER-PHASE',
    profile: {
      stage: 'foundation',
      currentClass: 'class-8',
    },
    answers: [
      {
        questionId:
          'v7_class8_achievement_001',
        value: 4,
      },
      {
        questionId:
          'v7_class8_adaptability_001',
        value: 3,
      },
      {
        questionId:
          'v7_class8_analytical_001',
        value: 5,
      },
      {
        questionId:
          'v7_class8_collaboration_001',
        value: 4,
      },
      {
        questionId:
          'v7_class8_stability_001',
        value: 2,
      },
    ],
  },
];


for (
  const testCase
  of cases
) {
  const results =
    await retrieveRankedQuestionCandidates({
      profile:
        testCase.profile,

      answers:
        testCase.answers,

      traitEvidence: {},

      careerMatches: [],

      limit: 20,
    });


  const counts = {};

  for (
    const question
    of results
  ) {
    counts[question.trait] =
      (counts[question.trait] || 0) + 1;
  }


  console.log(
    '\n=============================='
  );

  console.log(
    testCase.name
  );

  console.log(
    'Returned:',
    results.length
  );

  console.log(
    'Trait distribution:',
    counts
  );

  console.log(
    'Context specificities:',
    [
      ...new Set(
        results.map(
          question =>
            question.contextSpecificity
        )
      ),
    ]
  );
}
