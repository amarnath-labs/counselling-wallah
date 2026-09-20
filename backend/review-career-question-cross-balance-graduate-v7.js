import questions from
  './src/data/careerQuestions/v7/graduateBatch01.js';


function normalize(value) {
  return String(
    value ?? ''
  )
    .trim()
    .toLowerCase();
}


function countBy(items, getter) {
  const map =
    new Map();

  for (
    const item
    of items
  ) {
    const key =
      normalize(
        getter(item)
      ) ||
      '(missing)';

    map.set(
      key,
      (
        map.get(key) ||
        0
      ) + 1
    );
  }

  return [
    ...map.entries(),
  ].sort(
    (
      left,
      right
    ) =>
      right[1] -
      left[1]
  );
}


function groupBy(items, getter) {
  const map =
    new Map();

  for (
    const item
    of items
  ) {
    const key =
      normalize(
        getter(item)
      ) ||
      '(missing)';

    if (
      !map.has(key)
    ) {
      map.set(
        key,
        []
      );
    }

    map.get(
      key
    ).push(
      item
    );
  }

  return map;
}


function printRows(
  title,
  rows,
  total
) {
  console.log('');
  console.log(title);
  console.log('-'.repeat(80));

  for (
    const [
      key,
      count,
    ]
    of rows
  ) {
    const pct =
      total > 0
        ? (
            (
              count /
              total
            ) *
            100
          ).toFixed(1)
        : '0.0';

    console.log(
      `${key.padEnd(50)} ${String(count).padStart(4)}  ${pct.padStart(6)}%`
    );
  }
}


if (
  !Array.isArray(
    questions
  )
) {
  throw new Error(
    'graduateBatch01.js did not export an array.'
  );
}


console.log('');
console.log(
  '========================================'
);
console.log(
  'GRADUATE CROSS-BALANCE AUDIT'
);
console.log(
  '========================================'
);
console.log(
  `Questions: ${questions.length}`
);


/*
|--------------------------------------------------------------------------
| Global distributions
|--------------------------------------------------------------------------
*/

const sectionRows =
  countBy(
    questions,
    q => q.section
  );

const traitRows =
  countBy(
    questions,
    q => q.trait
  );

const difficultyRows =
  countBy(
    questions,
    q => q.difficulty
  );

const priorityRows =
  countBy(
    questions,
    q => q.priority
  );


printRows(
  'SECTION DISTRIBUTION',
  sectionRows,
  questions.length
);

printRows(
  'TRAIT DISTRIBUTION',
  traitRows,
  questions.length
);

printRows(
  'DIFFICULTY DISTRIBUTION',
  difficultyRows,
  questions.length
);

printRows(
  'PRIORITY DISTRIBUTION',
  priorityRows,
  questions.length
);


/*
|--------------------------------------------------------------------------
| Section × trait
|--------------------------------------------------------------------------
*/

const sectionGroups =
  groupBy(
    questions,
    q => q.section
  );


console.log('');
console.log(
  'SECTION x TRAIT'
);
console.log(
  '-'.repeat(80)
);


const issues =
  [];


for (
  const [
    section,
    sectionQuestions,
  ]
  of [
    ...sectionGroups.entries(),
  ].sort()
) {
  console.log('');
  console.log(
    section
  );

  const rows =
    countBy(
      sectionQuestions,
      q => q.trait
    );

  for (
    const [
      trait,
      count,
    ]
    of rows
  ) {
    console.log(
      `  ${trait.padEnd(32)} ${count}`
    );
  }

  const uniqueTraits =
    rows.length;

  if (
    uniqueTraits <
    4
  ) {
    issues.push(
      `${section}: only ${uniqueTraits} traits represented`
    );
  }
}


/*
|--------------------------------------------------------------------------
| Trait × difficulty
|--------------------------------------------------------------------------
*/

const traitGroups =
  groupBy(
    questions,
    q => q.trait
  );


console.log('');
console.log(
  'TRAIT x DIFFICULTY'
);
console.log(
  '-'.repeat(80)
);


for (
  const [
    trait,
    traitQuestions,
  ]
  of [
    ...traitGroups.entries(),
  ].sort()
) {
  const rows =
    countBy(
      traitQuestions,
      q => q.difficulty
    );

  const text =
    rows
      .map(
        (
          [
            difficulty,
            count,
          ]
        ) =>
          `${difficulty}:${count}`
      )
      .join(
        '  '
      );

  console.log(
    `${trait.padEnd(32)} ${text}`
  );


  const d3 =
    traitQuestions.filter(
      q =>
        q.difficulty ===
        3
    ).length;

  const d4 =
    traitQuestions.filter(
      q =>
        q.difficulty ===
        4
    ).length;


  if (
    d3 === 0 ||
    d4 === 0
  ) {
    issues.push(
      `${trait}: missing one difficulty level`
    );
  }


  const dominant =
    Math.max(
      d3,
      d4
    );

  const share =
    traitQuestions.length
      ? (
          dominant /
          traitQuestions.length
        ) *
        100
      : 0;


  if (
    share >
    80
  ) {
    issues.push(
      `${trait}: difficulty distribution too concentrated (${share.toFixed(
        1
      )}%)`
    );
  }
}


/*
|--------------------------------------------------------------------------
| Trait × priority
|--------------------------------------------------------------------------
*/

console.log('');
console.log(
  'TRAIT x PRIORITY'
);
console.log(
  '-'.repeat(80)
);


for (
  const [
    trait,
    traitQuestions,
  ]
  of [
    ...traitGroups.entries(),
  ].sort()
) {
  const rows =
    countBy(
      traitQuestions,
      q => q.priority
    );

  const text =
    rows
      .map(
        (
          [
            priority,
            count,
          ]
        ) =>
          `${priority}:${count}`
      )
      .join(
        '  '
      );

  console.log(
    `${trait.padEnd(32)} ${text}`
  );


  const p3 =
    traitQuestions.filter(
      q =>
        q.priority ===
        3
    ).length;

  const p4 =
    traitQuestions.filter(
      q =>
        q.priority ===
        4
    ).length;


  if (
    p3 === 0 ||
    p4 === 0
  ) {
    issues.push(
      `${trait}: missing one priority level`
    );
  }


  const dominant =
    Math.max(
      p3,
      p4
    );

  const share =
    traitQuestions.length
      ? (
          dominant /
          traitQuestions.length
        ) *
        100
      : 0;


  if (
    share >
    85
  ) {
    issues.push(
      `${trait}: priority distribution too concentrated (${share.toFixed(
        1
      )}%)`
    );
  }
}


/*
|--------------------------------------------------------------------------
| Section × difficulty
|--------------------------------------------------------------------------
*/

console.log('');
console.log(
  'SECTION x DIFFICULTY'
);
console.log(
  '-'.repeat(80)
);


for (
  const [
    section,
    sectionQuestions,
  ]
  of [
    ...sectionGroups.entries(),
  ].sort()
) {
  const rows =
    countBy(
      sectionQuestions,
      q => q.difficulty
    );

  const text =
    rows
      .map(
        (
          [
            difficulty,
            count,
          ]
        ) =>
          `${difficulty}:${count}`
      )
      .join(
        '  '
      );

  console.log(
    `${section.padEnd(32)} ${text}`
  );
}


/*
|--------------------------------------------------------------------------
| Section × priority
|--------------------------------------------------------------------------
*/

console.log('');
console.log(
  'SECTION x PRIORITY'
);
console.log(
  '-'.repeat(80)
);


for (
  const [
    section,
    sectionQuestions,
  ]
  of [
    ...sectionGroups.entries(),
  ].sort()
) {
  const rows =
    countBy(
      sectionQuestions,
      q => q.priority
    );

  const text =
    rows
      .map(
        (
          [
            priority,
            count,
          ]
        ) =>
          `${priority}:${count}`
      )
      .join(
        '  '
      );

  console.log(
    `${section.padEnd(32)} ${text}`
  );
}


/*
|--------------------------------------------------------------------------
| Combination uniqueness / concentration
|--------------------------------------------------------------------------
*/

const combinationMap =
  new Map();


for (
  const question
  of questions
) {
  const key =
    [
      question.section,
      question.trait,
      question.difficulty,
      question.priority,
    ]
      .map(
        normalize
      )
      .join(
        '::'
      );

  combinationMap.set(
    key,
    (
      combinationMap.get(
        key
      ) ||
      0
    ) + 1
  );
}


const combinationRows =
  [
    ...combinationMap.entries(),
  ].sort(
    (
      left,
      right
    ) =>
      right[1] -
      left[1]
  );


console.log('');
console.log(
  'TOP SECTION + TRAIT + DIFFICULTY + PRIORITY COMBINATIONS'
);
console.log(
  '-'.repeat(80)
);


for (
  const [
    key,
    count,
  ]
  of combinationRows.slice(
    0,
    25
  )
) {
  console.log(
    `${key.padEnd(65)} ${count}`
  );
}


const maxCombinationCount =
  combinationRows[0]?.[1] ??
  0;


if (
  maxCombinationCount >
  8
) {
  issues.push(
    `One section/trait/difficulty/priority combination appears ${maxCombinationCount} times`
  );
}


/*
|--------------------------------------------------------------------------
| Summary
|--------------------------------------------------------------------------
*/

console.log('');
console.log(
  'BALANCE FLAGS'
);
console.log(
  '-'.repeat(80)
);


if (
  issues.length ===
  0
) {
  console.log(
    'No major cross-balance issues detected.'
  );
} else {
  console.log(
    `Issues: ${issues.length}`
  );

  for (
    const issue
    of issues
  ) {
    console.log(
      `REVIEW: ${issue}`
    );
  }
}


/*
|--------------------------------------------------------------------------
| Final result
|--------------------------------------------------------------------------
*/

const passed =
  questions.length ===
    500 &&
  sectionRows.length ===
    8 &&
  traitRows.length ===
    16 &&
  difficultyRows.length ===
    2 &&
  priorityRows.length ===
    2 &&
  issues.length ===
    0;


console.log('');
console.log(
  'EXPECTED STRUCTURE CHECK'
);
console.log(
  '-'.repeat(80)
);

console.log(
  `500 questions: ${
    questions.length ===
    500
      ? 'PASS'
      : 'FAIL'
  }`
);

console.log(
  `8 sections: ${
    sectionRows.length ===
    8
      ? 'PASS'
      : 'REVIEW'
  }`
);

console.log(
  `16 traits: ${
    traitRows.length ===
    16
      ? 'PASS'
      : 'REVIEW'
  }`
);

console.log(
  `2 difficulty levels: ${
    difficultyRows.length ===
    2
      ? 'PASS'
      : 'REVIEW'
  }`
);

console.log(
  `2 priority levels: ${
    priorityRows.length ===
    2
      ? 'PASS'
      : 'REVIEW'
  }`
);

console.log(
  `Cross-balance: ${
    issues.length ===
    0
      ? 'PASS'
      : 'REVIEW'
  }`
);


console.log('');
console.log(
  '========================================'
);

console.log(
  passed
    ? 'RESULT: PASS'
    : 'RESULT: REVIEW'
);

console.log(
  '========================================'
);