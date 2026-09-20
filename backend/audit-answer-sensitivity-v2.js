import {
  retrieveNextQuestion,
} from './src/services/career/questionRetriever.js';

import {
  buildTraitEvidence,
} from './src/services/career/traitScorer.js';

import {
  getQuestionByIds,
} from './src/repositories/careerQuestionRepository.js';


const profile = {
  stage: 'foundation',
  currentClass: 'class-8',
};


async function evidenceFromAnswers(
  answers
) {
  if (!answers.length) {
    return {};
  }


  const ids =
    answers.map(
      answer =>
        answer.questionId
    );


  const questions =
    await getQuestionByIds(
      ids
    );


  const questionMap =
    new Map(
      questions.map(
        question => [
          question.id,
          question,
        ]
      )
    );


  return buildTraitEvidence(
    questionMap,
    answers
  );
}


async function runScenario(
  name,
  answerValue
) {
  const answers = [];

  const sequence = [];


  for (
    let index = 0;
    index < 42;
    index += 1
  ) {
    const traitEvidence =
      await evidenceFromAnswers(
        answers
      );


    const question =
      await retrieveNextQuestion({
        profile,
        answers,
        traitEvidence,
        careerMatches: [],
      });


    if (!question) {
      console.log(
        name,
        'stopped at',
        index + 1
      );

      break;
    }


    sequence.push({
      number:
        index + 1,

      id:
        question.id,

      trait:
        question.trait,
    });


    answers.push({
      questionId:
        question.id,

      value:
        answerValue,
    });
  }


  console.log(
    '\n=============================='
  );

  console.log(
    name
  );

  console.log(
    'Questions:',
    sequence.length
  );


  const finalEvidence =
    await evidenceFromAnswers(
      answers
    );


  console.log(
    'Final trait evidence:',
    finalEvidence
  );


  return sequence;
}


const high =
  await runScenario(
    'HIGH-ANSWER-SCENARIO',
    5
  );


const low =
  await runScenario(
    'LOW-ANSWER-SCENARIO',
    1
  );


console.log(
  '\n=============================='
);

console.log(
  'SEQUENCE COMPARISON'
);


let differences = 0;

let anchorDifferences = 0;

let profileDifferences = 0;

let adaptiveDifferences = 0;


for (
  let index = 0;
  index <
    Math.min(
      high.length,
      low.length
    );
  index += 1
) {
  if (
    high[index].id ===
    low[index].id
  ) {
    continue;
  }


  differences += 1;


  if (index < 15) {
    anchorDifferences += 1;
  }

  else if (index < 31) {
    profileDifferences += 1;
  }

  else {
    adaptiveDifferences += 1;
  }


  console.log(
    `Q${index + 1}`,
    high[index].id,
    '!=',
    low[index].id
  );
}


console.log(
  '\nDifferent positions:',
  differences
);

console.log(
  'Anchor differences:',
  anchorDifferences
);

console.log(
  'Profile differences:',
  profileDifferences
);

console.log(
  'Adaptive differences:',
  adaptiveDifferences
);
