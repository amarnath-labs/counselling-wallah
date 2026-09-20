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


const HIGH_TRAITS =
  new Set([
    'analytical',
    'quantitative',
    'technology',
    'scientific_curiosity',
    'structure',
    'achievement',
    'independence',
    'hands_on',
  ]);


const LOW_TRAITS =
  new Set([
    'collaboration',
    'social_helping',
    'verbal',
    'creativity',
    'leadership',
    'entrepreneurship',
    'adaptability',
    'stability',
  ]);


function valueForScenario(
  trait,
  reverse
) {
  if (
    HIGH_TRAITS.has(
      trait
    )
  ) {
    return reverse
      ? 1
      : 5;
  }


  if (
    LOW_TRAITS.has(
      trait
    )
  ) {
    return reverse
      ? 5
      : 1;
  }


  return 3;
}


async function runScenario(
  name,
  reverse = false
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
        valueForScenario(
          question.trait,
          reverse
        ),
    });
  }


  const evidence =
    await evidenceFromAnswers(
      answers
    );


  console.log(
    '\n=============================='
  );

  console.log(name);

  console.log(
    'Questions:',
    sequence.length
  );


  console.log(
    'Trait scores:',
    Object.fromEntries(
      Object.entries(
        evidence
      ).map(
        ([trait, item]) => [
          trait,
          item.score,
        ]
      )
    )
  );


  return sequence;
}


const scenarioA =
  await runScenario(
    'SCENARIO-A',
    false
  );


const scenarioB =
  await runScenario(
    'SCENARIO-B',
    true
  );


console.log(
  '\n=============================='
);

console.log(
  'SEQUENCE COMPARISON'
);


let totalDifferences = 0;

let anchorDifferences = 0;

let profileDifferences = 0;

let adaptiveDifferences = 0;


for (
  let index = 0;
  index <
    Math.min(
      scenarioA.length,
      scenarioB.length
    );
  index += 1
) {
  if (
    scenarioA[index].id ===
    scenarioB[index].id
  ) {
    continue;
  }


  totalDifferences += 1;


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
    scenarioA[index].id,
    '!=',
    scenarioB[index].id
  );
}


console.log(
  '\nDifferent positions:',
  totalDifferences
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
