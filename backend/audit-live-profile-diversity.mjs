import {
  retrieveNextQuestion,
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


    /*
    |--------------------------------------------------------------------------
    | Fake neutral answer
    |--------------------------------------------------------------------------
    |
    | Audit ka purpose question routing compare karna hai.
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
    (
      common.length /
      Math.max(
        1,
        idsA.length
      ) *
      100
    ).toFixed(2)
  );

  console.log(
    'Same position:',
    samePosition
  );

  console.log(
    'Different positions:',
    max -
      samePosition
  );


  console.log(
    '\nFIRST 12 COMPARISON'
  );


  for (
    let index = 0;
    index < 12;
    index += 1
  ) {
    console.log(
      String(
        index + 1
      ).padStart(
        2,
        '0'
      ),
      idsA[index] ||
        '-',
      ' | ',
      idsB[index] ||
        '-',
      idsA[index] ===
        idsB[index]
        ? 'SAME'
        : 'DIFF'
    );
  }


  console.log(
    '\nQUESTIONS 13–30 DIFFERENCES'
  );


  for (
    let index = 12;
    index < max;
    index += 1
  ) {
    if (
      idsA[index] !==
      idsB[index]
    ) {
      console.log(
        String(
          index + 1
        ).padStart(
          2,
          '0'
        ),
        idsA[index],
        ' != ',
        idsB[index]
      );
    }
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
    `\nSimulating ${name}...`
  );


  results[name] =
    await simulate(
      profile,
      30
    );


  console.log(
    'Questions:',
    results[name].length
  );


  results[name]
    .forEach(
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
          question.trait
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
