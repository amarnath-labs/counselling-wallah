import {
  retrieveRankedQuestionCandidates,
} from './src/services/career/questionRetriever.js';


const scenarios = {
  NOT_DECIDED_ENGLISH: {
    stage: 'foundation',
    currentClass: 'class-9',
    board: 'CBSE',
    stream: 'Not decided yet',
    subjects: [
      'English',
    ],
  },

  SCIENCE_PCM: {
    stage: 'foundation',
    currentClass: 'class-9',
    board: 'CBSE',
    stream: 'Science',
    subjects: [
      'Mathematics',
      'Physics',
      'Chemistry',
    ],
  },

  COMPUTER_TECH: {
    stage: 'foundation',
    currentClass: 'class-9',
    board: 'CBSE',
    stream: 'Computer / Technology',
    subjects: [
      'Mathematics',
      'Computer Science',
      'Artificial Intelligence',
      'Data Science',
    ],
  },

  COMMERCE: {
    stage: 'foundation',
    currentClass: 'class-9',
    board: 'CBSE',
    stream: 'Commerce',
    subjects: [
      'Economics',
      'Accountancy',
      'Business Studies',
      'Entrepreneurship',
    ],
  },

  HUMANITIES: {
    stage: 'foundation',
    currentClass: 'class-9',
    board: 'CBSE',
    stream: 'Humanities / Social Sciences',
    subjects: [
      'History',
      'Geography',
      'Psychology',
      'Sociology',
      'Political Science',
    ],
  },
};


async function getQuestions(
  profile
) {
  return retrieveRankedQuestionCandidates({
    profile,
    answers: [],
    traitEvidence: {},
    careerMatches: [],
    limit: 30,
  });
}


function compare(
  nameA,
  questionsA,
  nameB,
  questionsB
) {
  const idsA =
    questionsA.map(
      question =>
        question.id
    );

  const idsB =
    questionsB.map(
      question =>
        question.id
    );

  const setB =
    new Set(
      idsB
    );

  const common =
    idsA.filter(
      id =>
        setB.has(id)
    );

  let samePosition = 0;

  const max =
    Math.min(
      idsA.length,
      idsB.length
    );

  for (
    let index = 0;
    index < max;
    index += 1
  ) {
    if (
      idsA[index] ===
      idsB[index]
    ) {
      samePosition += 1;
    }
  }

  const overlapPercent =
    idsA.length
      ? (
          common.length /
          idsA.length
        ) * 100
      : 0;

  console.log(
    '\n========================================'
  );

  console.log(
    `${nameA}  VS  ${nameB}`
  );

  console.log(
    '========================================'
  );

  console.log(
    'Questions A:',
    idsA.length
  );

  console.log(
    'Questions B:',
    idsB.length
  );

  console.log(
    'Common IDs:',
    common.length
  );

  console.log(
    'Overlap %:',
    overlapPercent.toFixed(2)
  );

  console.log(
    'Same position:',
    samePosition
  );

  console.log(
    'Different positions:',
    max - samePosition
  );

  console.log(
    'Common question IDs:',
    common
  );
}


const results = {};


for (
  const [
    name,
    profile,
  ]
  of Object.entries(
    scenarios
  )
) {
  const questions =
    await getQuestions(
      profile
    );

  results[name] =
    questions;

  console.log(
    '\n########################################'
  );

  console.log(
    name
  );

  console.log(
    '########################################'
  );

  console.log(
    'Profile:',
    profile
  );

  console.log(
    '\nTop Questions:'
  );

  questions.forEach(
    (
      question,
      index
    ) => {
      console.log(
        `${String(index + 1).padStart(2, '0')}.`,
        question.id,
        '|',
        question.trait,
        '|',
        question.section
      );
    }
  );
}


const names =
  Object.keys(
    results
  );


for (
  let i = 0;
  i < names.length;
  i += 1
) {
  for (
    let j = i + 1;
    j < names.length;
    j += 1
  ) {
    compare(
      names[i],
      results[names[i]],
      names[j],
      results[names[j]]
    );
  }
}
