import questions from
  './src/data/careerQuestions/v7/graduateBatch01.js';


function isObject(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value)
  );
}


function normalizeText(value) {
  return String(
    value ?? ''
  )
    .trim()
    .toLowerCase();
}


function getOptionText(option) {
  if (
    typeof option === 'string'
  ) {
    return option;
  }

  if (
    isObject(option)
  ) {
    return (
      option.text ??
      option.label ??
      option.title ??
      option.value ??
      ''
    );
  }

  return '';
}


function getOptionScore(option) {
  if (
    isObject(option)
  ) {
    const candidates = [
      option.score,
      option.points,
      option.weight,
      option.value,
    ];

    for (
      const candidate
      of candidates
    ) {
      if (
        typeof candidate === 'number' &&
        Number.isFinite(candidate)
      ) {
        return candidate;
      }
    }
  }

  return null;
}


console.log('');
console.log(
  '========================================'
);
console.log(
  'GRADUATE OPTION QUALITY AUDIT'
);
console.log(
  '========================================'
);
console.log(
  `Questions: ${questions.length}`
);


const issues = [];

let missingOptions = 0;
let malformedOptions = 0;
let duplicateOptionText = 0;
let missingOptionText = 0;
let scoredQuestions = 0;
let partiallyScoredQuestions = 0;
let sameScoreQuestions = 0;
let duplicateScoreQuestions = 0;
let ascendingScoreQuestions = 0;
let descendingScoreQuestions = 0;
let nonMonotonicScoreQuestions = 0;

const optionCountMap =
  new Map();


for (
  const question
  of questions
) {
  const id =
    question.id ??
    '(missing-id)';

  const options =
    question.options;


  if (
    !Array.isArray(options) ||
    options.length === 0
  ) {
    missingOptions += 1;

    issues.push(
      `${id}: missing options`
    );

    continue;
  }


  optionCountMap.set(
    options.length,
    (
      optionCountMap.get(
        options.length
      ) ||
      0
    ) + 1
  );


  /*
  |--------------------------------------------------------------------------
  | Validate each option
  |--------------------------------------------------------------------------
  */

  const texts = [];
  const scores = [];

  let malformedInQuestion =
    false;

  for (
    const option
    of options
  ) {
    if (
      typeof option !== 'string' &&
      !isObject(option)
    ) {
      malformedOptions += 1;
      malformedInQuestion =
        true;

      continue;
    }


    const text =
      normalizeText(
        getOptionText(
          option
        )
      );


    if (!text) {
      missingOptionText += 1;

      issues.push(
        `${id}: option missing text`
      );
    }

    texts.push(
      text
    );


    const score =
      getOptionScore(
        option
      );

    scores.push(
      score
    );
  }


  if (
    malformedInQuestion
  ) {
    issues.push(
      `${id}: malformed option value`
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Duplicate option wording
  |--------------------------------------------------------------------------
  */

  const nonEmptyTexts =
    texts.filter(
      Boolean
    );

  const uniqueTexts =
    new Set(
      nonEmptyTexts
    );


  if (
    uniqueTexts.size !==
    nonEmptyTexts.length
  ) {
    duplicateOptionText += 1;

    issues.push(
      `${id}: duplicate option text`
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Scoring checks
  |--------------------------------------------------------------------------
  */

  const numericScores =
    scores.filter(
      score =>
        typeof score === 'number'
    );


  if (
    numericScores.length ===
    options.length
  ) {
    scoredQuestions += 1;


    const uniqueScores =
      new Set(
        numericScores
      );


    if (
      uniqueScores.size === 1
    ) {
      sameScoreQuestions += 1;

      issues.push(
        `${id}: all options have same score`
      );
    }


    if (
      uniqueScores.size <
      numericScores.length
    ) {
      duplicateScoreQuestions += 1;
    }


    let ascending =
      true;

    let descending =
      true;


    for (
      let i = 1;
      i < numericScores.length;
      i += 1
    ) {
      if (
        numericScores[i] <
        numericScores[i - 1]
      ) {
        ascending =
          false;
      }

      if (
        numericScores[i] >
        numericScores[i - 1]
      ) {
        descending =
          false;
      }
    }


    if (
      ascending &&
      !descending
    ) {
      ascendingScoreQuestions += 1;
    } else if (
      descending &&
      !ascending
    ) {
      descendingScoreQuestions += 1;
    } else if (
      !ascending &&
      !descending
    ) {
      nonMonotonicScoreQuestions += 1;

      issues.push(
        `${id}: non-monotonic option scores [${numericScores.join(
          ', '
        )}]`
      );
    }
  } else if (
    numericScores.length > 0
  ) {
    partiallyScoredQuestions += 1;

    issues.push(
      `${id}: partially scored options`
    );
  }
}


/*
|--------------------------------------------------------------------------
| Option count distribution
|--------------------------------------------------------------------------
*/

console.log('');
console.log(
  'OPTION COUNT DISTRIBUTION'
);
console.log(
  '-'.repeat(
    70
  )
);


for (
  const [
    count,
    total,
  ]
  of [
    ...optionCountMap.entries(),
  ].sort(
    (
      a,
      b
    ) =>
      a[0] -
      b[0]
  )
) {
  console.log(
    `${count} options: ${total} questions`
  );
}


/*
|--------------------------------------------------------------------------
| Validation summary
|--------------------------------------------------------------------------
*/

console.log('');
console.log(
  'OPTION STRUCTURE'
);
console.log(
  '-'.repeat(
    70
  )
);

console.log(
  `Missing option arrays: ${missingOptions}`
);

console.log(
  `Malformed options: ${malformedOptions}`
);

console.log(
  `Missing option text: ${missingOptionText}`
);

console.log(
  `Questions with duplicate option text: ${duplicateOptionText}`
);


/*
|--------------------------------------------------------------------------
| Scoring summary
|--------------------------------------------------------------------------
*/

console.log('');
console.log(
  'SCORING CONSISTENCY'
);
console.log(
  '-'.repeat(
    70
  )
);

console.log(
  `Fully scored questions: ${scoredQuestions}`
);

console.log(
  `Partially scored questions: ${partiallyScoredQuestions}`
);

console.log(
  `All-same-score questions: ${sameScoreQuestions}`
);

console.log(
  `Questions with repeated scores: ${duplicateScoreQuestions}`
);

console.log(
  `Ascending score order: ${ascendingScoreQuestions}`
);

console.log(
  `Descending score order: ${descendingScoreQuestions}`
);

console.log(
  `Non-monotonic score order: ${nonMonotonicScoreQuestions}`
);


/*
|--------------------------------------------------------------------------
| Issue preview
|--------------------------------------------------------------------------
*/

console.log('');
console.log(
  'ISSUE PREVIEW'
);
console.log(
  '-'.repeat(
    70
  )
);

if (
  issues.length === 0
) {
  console.log(
    'No option/scoring issues detected.'
  );
} else {
  console.log(
    `Total issues: ${issues.length}`
  );

  for (
    const issue
    of issues.slice(
      0,
      30
    )
  ) {
    console.log(
      `REVIEW: ${issue}`
    );
  }

  if (
    issues.length > 30
  ) {
    console.log(
      `... ${issues.length - 30} more`
    );
  }
}


/*
|--------------------------------------------------------------------------
| Final decision
|--------------------------------------------------------------------------
*/

const structurePass =
  missingOptions === 0 &&
  malformedOptions === 0 &&
  missingOptionText === 0 &&
  duplicateOptionText === 0;


const scoringPass =
  partiallyScoredQuestions === 0 &&
  sameScoreQuestions === 0 &&
  nonMonotonicScoreQuestions === 0;


console.log('');
console.log(
  'EXPECTED STRUCTURE CHECK'
);
console.log(
  '-'.repeat(
    70
  )
);

console.log(
  `Option structure: ${
    structurePass
      ? 'PASS'
      : 'REVIEW'
  }`
);

console.log(
  `Scoring consistency: ${
    scoringPass
      ? 'PASS'
      : 'REVIEW'
  }`
);


const passed =
  questions.length === 500 &&
  structurePass &&
  scoringPass;


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