import {
  retrieveNextQuestion,
} from './src/services/career/questionRetriever.js';

import {
  buildTraitEvidence,
  flatTraitScores,
} from './src/services/career/traitScorer.js';

import {
  rankCareers,
} from './src/services/career/careerMatcher.js';

import {
  getQuestionMap,
} from './src/repositories/careerQuestionRepository.js';


const PROFILE = {
  stage: 'college',
  currentClass: 'college',
  degree: 'B.Tech',
  branch: 'Computer Science Engineering',
  specialization: 'Computer Science Engineering',
  collegeYear: '3',
  goal: 'career-direction',

  skills: [
    'Python',
    'Machine Learning',
    'Data Structures',
  ],
};


async function computeState(
  profile,
  answers
) {
  const questionMap =
    await getQuestionMap(
      answers.map(
        answer =>
          answer.questionId
      )
    );


  const traitEvidence =
    buildTraitEvidence(
      questionMap,
      answers
    );


  const traitScores =
    flatTraitScores(
      traitEvidence
    );


  const careerMatches =
    rankCareers({
      stage:
        profile.stage,

      profile,

      traitScores,

      limit:
        5,
    });


  return {
    traitEvidence,
    traitScores,
    careerMatches,
  };
}


async function simulate(
  name,
  answerValue,
  total = 30
) {
  const answers = [];
  const questions = [];


  for (
    let index = 0;
    index < total;
    index += 1
  ) {
    const state =
      await computeState(
        PROFILE,
        answers
      );


    const question =
      await retrieveNextQuestion({
        profile:
          PROFILE,

        answers,

        traitEvidence:
          state.traitEvidence,

        careerMatches:
          state.careerMatches,
      });


    if (!question) {
      break;
    }


    questions.push(
      question
    );


    answers.push({
      questionId:
        question.id,

      value:
        answerValue,
    });
  }


  const finalState =
    await computeState(
      PROFILE,
      answers
    );


  console.log(
    '\n########################################'
  );

  console.log(
    name
  );

  console.log(
    '########################################'
  );


  questions.forEach(
    (
      question,
      index
    ) => {
      console.log(
        String(
          index + 1
        ).padStart(
          2,
          '0'
        ),

        question.id,

        '|',

        question.trait,

        '|',

        question.section
      );
    }
  );


  console.log(
    '\nTRAIT SCORES'
  );

  console.log(
    finalState.traitScores
  );


  console.log(
    '\nTOP CAREER MATCHES'
  );

  console.log(
    finalState.careerMatches.map(
      match => ({
        id:
          match.id ||
          match.careerId ||
          match.slug ||
          match.name,

        score:
          match.score,
      })
    )
  );


  return {
    questions,
    answers,
    state:
      finalState,
  };
}


function compare(
  leftName,
  left,
  rightName,
  right
) {
  const a =
    left.questions;

  const b =
    right.questions;


  let same =
    0;

  let different =
    0;


  console.log(
    '\n========================================'
  );

  console.log(
    `${leftName} VS ${rightName}`
  );

  console.log(
    '========================================'
  );


  for (
    let index = 0;
    index <
      Math.max(
        a.length,
        b.length
      );
    index += 1
  ) {
    const leftId =
      a[index]?.id;

    const rightId =
      b[index]?.id;


    const isSame =
      leftId ===
      rightId;


    if (isSame) {
      same += 1;
    }
    else {
      different += 1;
    }


    console.log(
      String(
        index + 1
      ).padStart(
        2,
        '0'
      ),

      leftId || '-',

      ' | ',

      rightId || '-',

      isSame
        ? 'SAME'
        : 'DIFF'
    );
  }


  const laterA =
    a
      .slice(15)
      .map(
        question =>
          question.id
      );

  const laterB =
    b
      .slice(15)
      .map(
        question =>
          question.id
      );


  let laterDifferent =
    0;


  for (
    let index = 0;
    index <
      Math.max(
        laterA.length,
        laterB.length
      );
    index += 1
  ) {
    if (
      laterA[index] !==
      laterB[index]
    ) {
      laterDifferent += 1;
    }
  }


  console.log(
    '\nSUMMARY'
  );

  console.log(
    'Same positions:',
    same
  );

  console.log(
    'Different positions:',
    different
  );

  console.log(
    'Q16-Q30 differences:',
    laterDifferent
  );


  return {
    same,
    different,
    laterDifferent,
  };
}


/*
|--------------------------------------------------------------------------
| Three answer paths
|--------------------------------------------------------------------------
|
| HIGH    = always 5
| LOW     = always 1
| NEUTRAL = always 3
|
*/

const high =
  await simulate(
    'HIGH_ANSWERS',
    5
  );


const low =
  await simulate(
    'LOW_ANSWERS',
    1
  );


const neutral =
  await simulate(
    'NEUTRAL_ANSWERS',
    3
  );


const highVsLow =
  compare(
    'HIGH',
    high,
    'LOW',
    low
  );


const highVsNeutral =
  compare(
    'HIGH',
    high,
    'NEUTRAL',
    neutral
  );


const lowVsNeutral =
  compare(
    'LOW',
    low,
    'NEUTRAL',
    neutral
  );


const adaptivePass =
  highVsLow.laterDifferent > 0 &&
  highVsNeutral.laterDifferent > 0 &&
  lowVsNeutral.laterDifferent > 0;


console.log(
  '\n========================================'
);

console.log(
  'FINAL ANSWER-ADAPTIVE AUDIT'
);

console.log(
  '========================================'
);

console.log(
  'HIGH vs LOW later divergence:',
  highVsLow.laterDifferent
);

console.log(
  'HIGH vs NEUTRAL later divergence:',
  highVsNeutral.laterDifferent
);

console.log(
  'LOW vs NEUTRAL later divergence:',
  lowVsNeutral.laterDifferent
);

console.log(
  'Answer-adaptive routing:',
  adaptivePass
    ? 'PASS'
    : 'FAIL'
);


if (!adaptivePass) {
  process.exitCode = 1;
}
