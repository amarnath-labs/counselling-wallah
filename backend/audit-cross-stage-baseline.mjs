import {
  retrieveNextQuestion,
} from './src/services/career/questionRetriever.js';


const scenarios = {
  CLASS_8: {
    stage: 'foundation',
    currentClass: 'class-8',
    board: 'CBSE',
    stream: 'Not decided yet',
    subjects: [
      'English',
      'Mathematics',
      'Science',
    ],
  },

  CLASS_9: {
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

  CLASS_10: {
    stage: 'class10',
    currentClass: 'class-10',
    board: 'CBSE',
    stream: 'Science',
    subjects: [
      'Mathematics',
      'Science',
      'English',
    ],
  },

  CLASS_11: {
    stage: 'senior-secondary',
    currentClass: 'class-11',
    board: 'CBSE',
    stream: 'Science PCM',
    subjects: [
      'Physics',
      'Chemistry',
      'Mathematics',
    ],
    targetExams: [
      'jee-main',
    ],
  },

  CLASS_12: {
    stage: 'senior-secondary',
    currentClass: 'class-12',
    board: 'CBSE',
    stream: 'Science PCM',
    subjects: [
      'Physics',
      'Chemistry',
      'Mathematics',
    ],
    targetExams: [
      'jee-main',
      'jee-advanced',
    ],
  },

  COLLEGE: {
    stage: 'college',
    currentClass: 'college',
    degree: 'B.Tech',
    branch: 'Electronics and Communication Engineering',
    specialization:
      'Electronics and Communication Engineering',
    collegeYear: '3',
    goal: 'career-direction',
    skills: [
      'Python',
      'Machine Learning',
    ],
  },

  GRADUATE: {
    stage: 'graduate',
    currentClass: 'graduate',
    highestQualification: 'B.Tech',
    specialization:
      'Electronics and Communication Engineering',
    currentStatus: 'Fresher',
    goal: 'career-direction',
    skills: [
      'Python',
      'Machine Learning',
    ],
    experience: [
      'Internship',
    ],
  },
};


async function simulate(
  profile,
  count = 15
) {
  const answers = [];
  const questions = [];
  const traitEvidence = {};
  const careerMatches = [];

  for (
    let index = 0;
    index < count;
    index += 1
  ) {
    const question =
      await retrieveNextQuestion({
        profile,
        answers,
        traitEvidence,
        careerMatches,
      });

    if (!question) {
      break;
    }

    questions.push(
      question
    );

    /*
    |--------------------------------------------------------------------------
    | Neutral answer
    |--------------------------------------------------------------------------
    |
    | We only want to inspect stage/class baseline routing.
    |
    */
    answers.push({
      questionId:
        question.id,

      value:
        3,
    });
  }

  return questions;
}


function compare(
  nameA,
  listA,
  nameB,
  listB
) {
  const idsA =
    listA.map(
      q => q.id
    );

  const idsB =
    listB.map(
      q => q.id
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

  let samePosition =
    0;

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
      samePosition +=
        1;
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
    `${nameA} VS ${nameB}`
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
    '\nPOSITION COMPARISON'
  );

  for (
    let index = 0;
    index < max;
    index += 1
  ) {
    console.log(
      String(
        index + 1
      ).padStart(
        2,
        '0'
      ),

      idsA[index] || '-',

      ' | ',

      idsB[index] || '-',

      idsA[index] ===
        idsB[index]
        ? 'SAME'
        : 'DIFF'
    );
  }
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

  const questions =
    await simulate(
      profile,
      15
    );

  results[name] =
    questions;

  console.log(
    '\nBASELINE QUESTIONS:',
    questions.length
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
