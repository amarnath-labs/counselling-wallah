import {
  retrieveNextQuestion,
} from './src/services/career/questionRetriever.js';


const PROFILE_A = {
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
    'Web Development',
  ],
};


const PROFILE_A_REORDERED = {
  stage: 'college',
  currentClass: 'college',
  degree: 'B.Tech',
  branch: 'Computer Science Engineering',
  specialization: 'Computer Science Engineering',
  collegeYear: '3',
  goal: 'career-direction',

  /*
  | Same values.
  | Only array order changed.
  */

  skills: [
    'Web Development',
    'Data Structures',
    'Machine Learning',
    'Python',
  ],
};


const PROFILE_B_DIFFERENT = {
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
    | Neutral deterministic answers
    |--------------------------------------------------------------------------
    |
    | Same answer path across runs so only profile/fingerprint stability
    | is being tested.
    |--------------------------------------------------------------------------
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


function ids(
  questions
) {
  return questions.map(
    question =>
      question.id
  );
}


function compareExact(
  label,
  left,
  right,
  expectSame
) {
  const a =
    ids(
      left
    );

  const b =
    ids(
      right
    );


  const max =
    Math.max(
      a.length,
      b.length
    );


  let samePosition =
    0;


  for (
    let index = 0;
    index < max;
    index += 1
  ) {
    if (
      a[index] ===
      b[index]
    ) {
      samePosition += 1;
    }
  }


  const exactlySame =
    a.length ===
      b.length &&
    samePosition ===
      a.length;


  console.log(
    '\n========================================'
  );

  console.log(
    label
  );

  console.log(
    '========================================'
  );

  console.log(
    'Questions A:',
    a.length
  );

  console.log(
    'Questions B:',
    b.length
  );

  console.log(
    'Same positions:',
    samePosition
  );

  console.log(
    'Different positions:',
    max - samePosition
  );

  console.log(
    'Exact same sequence:',
    exactlySame
  );


  if (
    expectSame
  ) {
    console.log(
      exactlySame
        ? 'PASS'
        : 'FAIL'
    );
  }
  else {
    console.log(
      !exactlySame
        ? 'PASS'
        : 'FAIL'
    );
  }


  console.log(
    '\nPOSITION CHECK'
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

      a[index] || '-',

      ' | ',

      b[index] || '-',

      a[index] ===
        b[index]
        ? 'SAME'
        : 'DIFF'
    );
  }
}


/*
|--------------------------------------------------------------------------
| RUN 1 + RUN 2
|--------------------------------------------------------------------------
|
| Same exact profile twice.
|
*/

const runA1 =
  await simulate(
    PROFILE_A,
    30
  );

const runA2 =
  await simulate(
    PROFILE_A,
    30
  );


/*
|--------------------------------------------------------------------------
| Reordered arrays
|--------------------------------------------------------------------------
*/

const runAReordered =
  await simulate(
    PROFILE_A_REORDERED,
    30
  );


/*
|--------------------------------------------------------------------------
| Meaningfully different profile
|--------------------------------------------------------------------------
*/

const runB =
  await simulate(
    PROFILE_B_DIFFERENT,
    30
  );


compareExact(
  'TEST 1: SAME PROFILE VS SAME PROFILE',
  runA1,
  runA2,
  true
);


compareExact(
  'TEST 2: SAME VALUES, DIFFERENT ARRAY ORDER',
  runA1,
  runAReordered,
  true
);


compareExact(
  'TEST 3: DIFFERENT PROFILE',
  runA1,
  runB,
  false
);


console.log(
  '\n========================================'
);

console.log(
  'FINAL AUDIT SUMMARY'
);

console.log(
  '========================================'
);


const sameProfilePass =
  ids(
    runA1
  ).join(
    '|'
  ) ===
  ids(
    runA2
  ).join(
    '|'
  );


const reorderedPass =
  ids(
    runA1
  ).join(
    '|'
  ) ===
  ids(
    runAReordered
  ).join(
    '|'
  );


const differentProfilePass =
  ids(
    runA1
  ).join(
    '|'
  ) !==
  ids(
    runB
  ).join(
    '|'
  );


console.log(
  'Same profile deterministic:',
  sameProfilePass
    ? 'PASS'
    : 'FAIL'
);

console.log(
  'Array order independent:',
  reorderedPass
    ? 'PASS'
    : 'FAIL'
);

console.log(
  'Different profile diverges:',
  differentProfilePass
    ? 'PASS'
    : 'FAIL'
);


if (
  sameProfilePass &&
  reorderedPass &&
  differentProfilePass
) {
  console.log(
    '\nOVERALL: PASS'
  );
}
else {
  console.log(
    '\nOVERALL: FAIL'
  );

  process.exitCode =
    1;
}
