import questions from
  './src/data/careerQuestions/v7/class11Batch01.js';


const THRESHOLD =
  0.72;


const STOPWORDS =
  new Set([
    'i',
    'a',
    'an',
    'the',
    'to',
    'of',
    'for',
    'in',
    'on',
    'with',
    'and',
    'or',
    'is',
    'are',
    'be',
    'when',
    'while',
    'if',
    'it',
    'my',
    'me',
    'that',
    'this',
  ]);


function normalize(
  text
) {
  return String(
    text || ''
  )
    .toLowerCase()
    .replace(
      /[^a-z0-9\s]/g,
      ' '
    )
    .replace(
      /\s+/g,
      ' '
    )
    .trim();
}


function tokenSet(
  text
) {
  return new Set(
    normalize(
      text
    )
      .split(' ')
      .filter(
        token =>
          token &&
          !STOPWORDS.has(
            token
          )
      )
  );
}


function jaccard(
  left,
  right
) {
  const union =
    new Set([
      ...left,
      ...right,
    ]);


  if (
    union.size === 0
  ) {
    return 0;
  }


  let intersection =
    0;


  for (
    const token of left
  ) {
    if (
      right.has(
        token
      )
    ) {
      intersection += 1;
    }
  }


  return (
    intersection /
    union.size
  );
}


const pairs =
  [];


for (
  let i = 0;
  i < questions.length;
  i += 1
) {
  const a =
    questions[i];


  const aTokens =
    tokenSet(
      a.text
    );


  for (
    let j = i + 1;
    j < questions.length;
    j += 1
  ) {
    const b =
      questions[j];


    /*
    |--------------------------------------------------------------------------
    | Compare only questions measuring the same trait
    |--------------------------------------------------------------------------
    */

    if (
      a.trait !==
      b.trait
    ) {
      continue;
    }


    const similarity =
      jaccard(
        aTokens,
        tokenSet(
          b.text
        )
      );


    if (
      similarity >=
      THRESHOLD
    ) {
      pairs.push({
        trait:
          a.trait,

        similarity:
          Number(
            similarity.toFixed(
              3
            )
          ),

        idA:
          a.id,

        idB:
          b.id,

        familyA:
          a.scenarioFamily,

        familyB:
          b.scenarioFamily,

        textA:
          a.text,

        textB:
          b.text,
      });
    }
  }
}


/*
|--------------------------------------------------------------------------
| SUMMARY
|--------------------------------------------------------------------------
*/

console.log(
  ''
);

console.log(
  '========================================'
);

console.log(
  'CLASS-11 QUESTION DUPLICATE AUDIT'
);

console.log(
  '========================================'
);

console.log(
  'Class:',
  'CLASS-11'
);

console.log(
  'Questions:',
  questions.length
);

console.log(
  'Threshold:',
  THRESHOLD
);

console.log(
  'Near-duplicate pairs:',
  pairs.length
);


/*
|--------------------------------------------------------------------------
| CLEAN PASS OUTPUT
|--------------------------------------------------------------------------
*/

if (
  pairs.length === 0
) {
  console.log(
    ''
  );

  console.log(
    'RESULT: PASS'
  );

  console.log(
    'No near-duplicate pairs found.'
  );

  console.log(
    '========================================'
  );

  process.exit(0);
}


/*
|--------------------------------------------------------------------------
| DUPLICATE DETAILS
|--------------------------------------------------------------------------
*/

console.log(
  ''
);

console.log(
  'RESULT: FAIL'
);

console.log(
  ''
);

console.log(
  'DUPLICATE PAIRS'
);

console.log(
  '----------------------------------------'
);


for (
  let index = 0;
  index < pairs.length;
  index += 1
) {
  const pair =
    pairs[index];


  console.log(
    ''
  );

  console.log(
    `Pair ${index + 1}/${pairs.length}`
  );

  console.log(
    `Trait: ${pair.trait}`
  );

  console.log(
    `Similarity: ${pair.similarity}`
  );

  console.log(
    `Question A: ${pair.idA}`
  );

  console.log(
    `Family A: ${pair.familyA}`
  );

  console.log(
    `Text A: ${pair.textA}`
  );

  console.log(
    ''
  );

  console.log(
    `Question B: ${pair.idB}`
  );

  console.log(
    `Family B: ${pair.familyB}`
  );

  console.log(
    `Text B: ${pair.textB}`
  );

  console.log(
    ''
  );

  console.log(
    '----------------------------------------'
  );
}


console.log(
  ''
);

console.log(
  'QUALITY GATE: FAIL'
);

console.log(
  `${pairs.length} near-duplicate pair(s) must be reviewed.`
);

console.log(
  '========================================'
);


