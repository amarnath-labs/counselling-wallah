import {
  retrieveNextQuestion,
} from './src/services/career/questionRetriever.js';


const profile = {
  stage: 'foundation',
  currentClass: 'class-8',
};


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
    const question =
      await retrieveNextQuestion({
        profile,
        answers,
        traitEvidence: {},
        careerMatches: [],
      });


    if (!question) {
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


for (
  let index = 0;
  index <
    Math.min(
      high.length,
      low.length
    );
  index += 1
) {
  const same =
    high[index].id ===
    low[index].id;


  if (!same) {
    differences += 1;

    console.log(
      `Q${index + 1}`,
      high[index].id,
      '!=',
      low[index].id
    );
  }
}


console.log(
  '\nDifferent positions:',
  differences
);
