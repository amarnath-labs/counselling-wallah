import {
  retrieveRankedQuestionCandidates,
} from './src/services/career/questionRetriever.js';

import { pool } from
  './src/db/pool.js';


const profiles = [
  {
    name:
      'CLASS 12 PCM + JEE',

    profile: {
      stage:
        'senior-secondary',

      currentClass:
        'Class 12',

      board:
        'CBSE',

      stream:
        'Science - PCM',

      subjects: [
        'Mathematics',
        'Physics',
        'Chemistry',
        'Computer Science',
      ],

      targetExams: [
        'JEE Main',
        'BITSAT',
      ],

      entranceExams: [
        'JEE Main',
        'BITSAT',
      ],

      goal:
        'Explore career options',
    },
  },

  {
    name:
      'CLASS 12 PCB + NEET',

    profile: {
      stage:
        'senior-secondary',

      currentClass:
        'Class 12',

      board:
        'CBSE',

      stream:
        'Science - PCB',

      subjects: [
        'Biology',
        'Physics',
        'Chemistry',
      ],

      targetExams: [
        'NEET UG',
      ],

      entranceExams: [
        'NEET UG',
      ],

      goal:
        'Explore career options',
    },
  },

  {
    name:
      'CLASS 12 COMMERCE + IPMAT',

    profile: {
      stage:
        'senior-secondary',

      currentClass:
        'Class 12',

      board:
        'CBSE',

      stream:
        'Commerce with Mathematics',

      subjects: [
        'Mathematics',
        'Economics',
        'Accountancy',
        'Business Studies',
      ],

      targetExams: [
        'IPMAT',
        'CUET UG',
      ],

      entranceExams: [
        'IPMAT',
        'CUET UG',
      ],

      goal:
        'Explore career options',
    },
  },
];


const resultSets =
  new Map();


for (
  const item of
  profiles
) {
  const ranked =
    await retrieveRankedQuestionCandidates({
      profile:
        item.profile,

      answers: [],

      traitEvidence: {},

      careerMatches: [],

      limit:
        20,
    });


  resultSets.set(
    item.name,
    ranked.map(
      question =>
        question.id
    )
  );


  console.log('');
  console.log(
    '========================================'
  );

  console.log(
    item.name
  );

  console.log(
    '========================================'
  );

  console.log(
    'COUNT:',
    ranked.length
  );


  console.table(
    ranked.map(
      (
        question,
        index
      ) => ({
        rank:
          index + 1,

        id:
          question.id,

        trait:
          question.trait,

        section:
          question.section,

        text:
          question.text,
      })
    )
  );
}


/*
|--------------------------------------------------------------------------
| Pairwise overlap
|--------------------------------------------------------------------------
*/

const names =
  [
    ...resultSets.keys(),
  ];


console.log('');
console.log(
  '========================================'
);

console.log(
  'PROFILE OVERLAP'
);

console.log(
  '========================================'
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
    const leftName =
      names[i];

    const rightName =
      names[j];


    const left =
      new Set(
        resultSets.get(
          leftName
        )
      );


    const right =
      new Set(
        resultSets.get(
          rightName
        )
      );


    const overlap =
      [
        ...left,
      ].filter(
        id =>
          right.has(id)
      );


    const overlapPercent =
      (
        overlap.length /
        20
      ) *
      100;


    console.log('');
    console.log(
      `${leftName}`
    );

    console.log(
      'VS'
    );

    console.log(
      `${rightName}`
    );

    console.log(
      'Overlap:',
      overlap.length,
      '/ 20'
    );

    console.log(
      'Overlap %:',
      overlapPercent.toFixed(1)
    );

    console.log(
      'Same IDs:',
      overlap
    );
  }
}


await pool.end();