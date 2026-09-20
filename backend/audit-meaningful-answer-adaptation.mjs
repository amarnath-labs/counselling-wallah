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


const TECH_HIGH = new Set([
  'analytical',
  'quantitative',
  'technology',
  'scientific_curiosity',
  'structure',
  'hands_on',
  'achievement',
]);


const PEOPLE_CREATIVE_HIGH = new Set([
  'social_helping',
  'creativity',
  'verbal',
  'collaboration',
  'leadership',
  'adaptability',
  'entrepreneurship',
]);


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
      stage: profile.stage,
      profile,
      traitScores,
      limit: 5,
    });

  return {
    traitEvidence,
    traitScores,
    careerMatches,
  };
}


function valueForScenario(
  scenario,
  question
) {
  if (
    scenario ===
    'TECH_ANALYTICAL'
  ) {
    if (
      TECH_HIGH.has(
        question.trait
      )
    ) {
      return 5;
    }

    if (
      PEOPLE_CREATIVE_HIGH.has(
        question.trait
      )
    ) {
      return 1;
    }

    return 3;
  }


  if (
    scenario ===
    'PEOPLE_CREATIVE'
  ) {
    if (
      PEOPLE_CREATIVE_HIGH.has(
        question.trait
      )
    ) {
      return 5;
    }

    if (
      TECH_HIGH.has(
        question.trait
      )
    ) {
      return 1;
    }

    return 3;
  }


  return 3;
}


async function simulate(
  scenario,
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
        profile: PROFILE,
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
        valueForScenario(
          scenario,
          question
        ),
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
    scenario
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
        question.section,
        '| answer:',
        answers[index]?.value
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
    '\nTOP CAREERS'
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
  left,
  right
) {
  let totalDifferent =
    0;

  let laterDifferent =
    0;


  console.log(
    '\n========================================'
  );

  console.log(
    'TECH_ANALYTICAL VS PEOPLE_CREATIVE'
  );

  console.log(
    '========================================'
  );


  const max =
    Math.max(
      left.questions.length,
      right.questions.length
    );


  for (
    let index = 0;
    index < max;
    index += 1
  ) {
    const a =
      left.questions[index]?.id;

    const b =
      right.questions[index]?.id;

    const same =
      a === b;


    if (!same) {
      totalDifferent += 1;

      if (
        index >= 15
      ) {
        laterDifferent += 1;
      }
    }


    console.log(
      String(
        index + 1
      ).padStart(
        2,
        '0'
      ),

      a || '-',

      ' | ',

      b || '-',

      same
        ? 'SAME'
        : 'DIFF'
    );
  }


  console.log(
    '\nTotal differences:',
    totalDifferent
  );

  console.log(
    'Q16-Q30 differences:',
    laterDifferent
  );


  console.log(
    '\nAnswer-pattern adaptive routing:',
    laterDifferent > 0
      ? 'PASS'
      : 'FAIL'
  );


  if (
    laterDifferent === 0
  ) {
    process.exitCode = 1;
  }
}


const tech =
  await simulate(
    'TECH_ANALYTICAL'
  );


const people =
  await simulate(
    'PEOPLE_CREATIVE'
  );


compare(
  tech,
  people
);
