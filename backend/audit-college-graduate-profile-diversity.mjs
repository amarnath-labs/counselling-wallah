import {
  retrieveNextQuestion,
} from './src/services/career/questionRetriever.js';


const scenarios = {
  COLLEGE_BTECH_ECE: {
    stage: 'college',
    currentClass: 'college',
    degree: 'B.Tech',
    branch: 'Electronics and Communication Engineering',
    specialization: 'Electronics and Communication Engineering',
    collegeYear: '3',
    goal: 'career-direction',
    skills: [
      'Python',
      'Machine Learning',
    ],
  },

  COLLEGE_BTECH_CSE: {
    stage: 'college',
    currentClass: 'college',
    degree: 'B.Tech',
    branch: 'Computer Science Engineering',
    specialization: 'Computer Science Engineering',
    collegeYear: '3',
    goal: 'career-direction',
    skills: [
      'Programming',
      'Data Structures',
      'Web Development',
    ],
  },

  COLLEGE_BCOM: {
    stage: 'college',
    currentClass: 'college',
    degree: 'B.Com',
    branch: 'Commerce',
    specialization: 'Finance',
    collegeYear: '3',
    goal: 'career-direction',
    skills: [
      'Accounting',
      'Excel',
      'Finance',
    ],
  },

  COLLEGE_BA_PSYCHOLOGY: {
    stage: 'college',
    currentClass: 'college',
    degree: 'BA',
    branch: 'Psychology',
    specialization: 'Psychology',
    collegeYear: '3',
    goal: 'career-direction',
    skills: [
      'Communication',
      'Research',
    ],
  },

  GRADUATE_BTECH_FRESHER: {
    stage: 'graduate',
    currentClass: 'graduate',
    highestQualification: 'B.Tech',
    specialization: 'Computer Science Engineering',
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

  GRADUATE_BCOM_FRESHER: {
    stage: 'graduate',
    currentClass: 'graduate',
    highestQualification: 'B.Com',
    specialization: 'Finance',
    currentStatus: 'Fresher',
    goal: 'career-direction',
    skills: [
      'Accounting',
      'Excel',
      'Finance',
    ],
    experience: [
      'Internship',
    ],
  },

  GRADUATE_EXPERIENCED_TECH: {
    stage: 'graduate',
    currentClass: 'graduate',
    highestQualification: 'B.Tech',
    specialization: 'Computer Science Engineering',
    currentStatus: 'Working Professional',
    goal: 'career-switch',
    skills: [
      'JavaScript',
      'Node.js',
      'Cloud',
    ],
    experience: [
      '2 years software development',
    ],
  },
};


async function simulate(
  profile,
  count = 30
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

  const overlap =
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
    overlap.toFixed(2)
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
    '\nQ1-Q15 BASELINE'
  );

  for (
    let index = 0;
    index < Math.min(
      15,
      max
    );
    index += 1
  ) {
    console.log(
      String(
        index + 1
      ).padStart(
        2,
        '0'
      ),

      idsA[index],

      ' | ',

      idsB[index],

      idsA[index] ===
        idsB[index]
        ? 'SAME'
        : 'DIFF'
    );
  }


  console.log(
    '\nQ16-Q30 PROFILE DIFFERENCES'
  );

  for (
    let index = 15;
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

      idsA[index],

      ' | ',

      idsB[index],

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

  const questions =
    await simulate(
      profile,
      30
    );

  results[name] =
    questions;

  console.log(
    'Questions:',
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


const groups = [
  [
    'COLLEGE_BTECH_ECE',
    'COLLEGE_BTECH_CSE',
  ],

  [
    'COLLEGE_BTECH_ECE',
    'COLLEGE_BCOM',
  ],

  [
    'COLLEGE_BTECH_ECE',
    'COLLEGE_BA_PSYCHOLOGY',
  ],

  [
    'COLLEGE_BCOM',
    'COLLEGE_BA_PSYCHOLOGY',
  ],

  [
    'GRADUATE_BTECH_FRESHER',
    'GRADUATE_BCOM_FRESHER',
  ],

  [
    'GRADUATE_BTECH_FRESHER',
    'GRADUATE_EXPERIENCED_TECH',
  ],

  [
    'GRADUATE_BCOM_FRESHER',
    'GRADUATE_EXPERIENCED_TECH',
  ],
];


for (
  const [
    left,
    right,
  ]
  of groups
) {
  compare(
    left,
    results[left],
    right,
    results[right]
  );
}
