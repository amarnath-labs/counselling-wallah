import {
  retrieveRankedQuestionCandidates,
} from './src/services/career/questionRetriever.js';

import {
  buildPsychometricBlueprint,
  psychometricPhase,
} from './src/services/career/psychometricBlueprint.js';

import bank
  from './src/data/careerQuestions/v7/index.js';


const profile = {
  stage: 'foundation',
  currentClass: 'class-8',
};


const blueprint =
  buildPsychometricBlueprint(
    profile
  );


console.log(
  'Blueprint targets:',
  {
    totalQuestions:
      blueprint.totalQuestions,

    anchorTarget:
      blueprint.anchorTarget,

    profileTarget:
      blueprint.profileTarget,

    adaptiveTarget:
      blueprint.adaptiveTarget,
  }
);


const class8Questions =
  bank.filter(
    question =>
      question.stage ===
        'foundation' &&
      Array.isArray(
        question.classes
      ) &&
      question.classes.includes(
        'class-8'
      )
  );


function makeAnswers(
  count
) {
  return class8Questions
    .slice(
      0,
      count
    )
    .map(
      question => ({
        questionId:
          question.id,

        value: 4,
      })
    );
}


const boundaries = [
  {
    name:
      'ANCHOR-LAST',

    answerCount:
      Math.max(
        0,
        blueprint.anchorTarget - 1
      ),

    expected:
      'anchor',
  },

  {
    name:
      'PROFILE-FIRST',

    answerCount:
      blueprint.anchorTarget,

    expected:
      'profile',
  },

  {
    name:
      'ADAPTIVE-FIRST',

    answerCount:
      blueprint.anchorTarget +
      blueprint.profileTarget,

    expected:
      'adaptive',
  },
];


for (
  const testCase
  of boundaries
) {
  const answers =
    makeAnswers(
      testCase.answerCount
    );


  const actualPhase =
    psychometricPhase({
      profile,
      answers,
    });


  const results =
    await retrieveRankedQuestionCandidates({
      profile,
      answers,
      traitEvidence: {},
      careerMatches: [],
      limit: 20,
    });


  const traitCounts = {};

  for (
    const question
    of results
  ) {
    traitCounts[question.trait] =
      (
        traitCounts[
          question.trait
        ] || 0
      ) + 1;
  }


  const maxTraitCount =
    Math.max(
      0,
      ...Object.values(
        traitCounts
      )
    );


  const contextSpecificities =
    [
      ...new Set(
        results.map(
          question =>
            question.contextSpecificity
        )
      ),
    ];


  console.log(
    '\n=============================='
  );

  console.log(
    testCase.name
  );

  console.log(
    'Requested answers:',
    testCase.answerCount
  );

  console.log(
    'Actual answers:',
    answers.length
  );

  console.log(
    'Expected phase:',
    testCase.expected
  );

  console.log(
    'Actual phase:',
    actualPhase
  );

  console.log(
    'Returned:',
    results.length
  );

  console.log(
    'Max trait count:',
    maxTraitCount
  );

  console.log(
    'Trait distribution:',
    traitCounts
  );

  console.log(
    'Context specificities:',
    contextSpecificities
  );
}

