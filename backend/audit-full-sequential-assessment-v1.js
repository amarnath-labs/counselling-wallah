import {
  retrieveNextQuestion,
} from './src/services/career/questionRetriever.js';

import {
  psychometricPhase,
} from './src/services/career/psychometricBlueprint.js';


const profile = {
  stage: 'foundation',
  currentClass: 'class-8',
};


const answers = [];

const traitCounts = {};

const phaseCounts = {};

const seenIds =
  new Set();


for (
  let index = 0;
  index < 42;
  index += 1
) {
  const phase =
    psychometricPhase({
      profile,
      answers,
    });


  phaseCounts[phase] =
    (phaseCounts[phase] || 0) + 1;


  const question =
    await retrieveNextQuestion({
      profile,
      answers,
      traitEvidence: {},
      careerMatches: [],
    });


  if (!question) {
    console.log(
      'STOPPED EARLY at question',
      index + 1
    );

    break;
  }


  if (
    seenIds.has(
      question.id
    )
  ) {
    throw new Error(
      `Duplicate question returned: ${question.id}`
    );
  }


  seenIds.add(
    question.id
  );


  traitCounts[question.trait] =
    (
      traitCounts[
        question.trait
      ] || 0
    ) + 1;


  console.log(
    String(
      index + 1
    ).padStart(
      2,
      '0'
    ),
    phase.padEnd(
      8
    ),
    question.id,
    '=>',
    question.trait,
    '| context:',
    question.contextSpecificity
  );


  answers.push({
    questionId:
      question.id,

    value: 4,
  });
}


console.log(
  '\n=============================='
);

console.log(
  'TOTAL ANSWERS:',
  answers.length
);

console.log(
  'UNIQUE QUESTIONS:',
  seenIds.size
);

console.log(
  'PHASE COUNTS:',
  phaseCounts
);

console.log(
  'TRAIT DISTRIBUTION:',
  traitCounts
);
