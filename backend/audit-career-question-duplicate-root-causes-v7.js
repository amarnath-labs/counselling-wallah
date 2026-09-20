import bank from
  './src/data/careerQuestions/v7/index.js';


const CLASS_KEY =
  'class-8';

const THRESHOLD =
  0.72;


function normalize(text) {
  return String(text || '')
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


const STOP_WORDS =
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


function tokenSet(text) {
  return new Set(
    normalize(text)
      .split(' ')
      .filter(
        token =>
          token.length > 1 &&
          !STOP_WORDS.has(token)
      )
  );
}


function similarity(a, b) {
  if (
    !a.size ||
    !b.size
  ) {
    return 0;
  }


  let common =
    0;


  for (
    const token of a
  ) {
    if (
      b.has(token)
    ) {
      common +=
        1;
    }
  }


  return (
    common /
    (
      a.size +
      b.size -
      common
    )
  );
}


const questions =
  bank.filter(
    question =>
      question.classes?.includes(
        CLASS_KEY
      ) ||
      question.stage ===
        CLASS_KEY
  );


const questionMap =
  new Map(
    questions.map(
      question => [
        question.id,
        question,
      ]
    )
  );


const pairCounts =
  new Map();

const familyCounts =
  new Map();

const traitCounts =
  new Map();

const pairs =
  [];


function increment(
  map,
  key
) {
  map.set(
    key,
    (
      map.get(key) ||
      0
    ) + 1
  );
}


for (
  let i = 0;
  i < questions.length;
  i += 1
) {
  for (
    let j = i + 1;
    j < questions.length;
    j += 1
  ) {
    const left =
      questions[i];

    const right =
      questions[j];


    if (
      left.trait !==
      right.trait
    ) {
      continue;
    }


    const score =
      similarity(
        tokenSet(left.text),
        tokenSet(right.text)
      );


    if (
      score <
      THRESHOLD
    ) {
      continue;
    }


    pairs.push({
      left:
        left.id,

      right:
        right.id,

      trait:
        left.trait,

      family:
        left.scenarioFamily,

      score:
        Number(
          score.toFixed(3)
        ),
    });


    increment(
      pairCounts,
      left.id
    );

    increment(
      pairCounts,
      right.id
    );


    increment(
      familyCounts,
      `${left.trait} :: ${left.scenarioFamily}`
    );


    increment(
      traitCounts,
      left.trait
    );
  }
}


const rankedQuestions =
  [...pairCounts.entries()]
    .map(
      ([id, duplicatePairs]) => {
        const question =
          questionMap.get(id);

        return {
          id,

          duplicatePairs,

          trait:
            question?.trait,

          family:
            question?.scenarioFamily,

          text:
            question?.text,
        };
      }
    )
    .sort(
      (a, b) =>
        b.duplicatePairs -
        a.duplicatePairs
    );


const rankedFamilies =
  [...familyCounts.entries()]
    .map(
      ([family, duplicatePairs]) => ({
        family,
        duplicatePairs,
      })
    )
    .sort(
      (a, b) =>
        b.duplicatePairs -
        a.duplicatePairs
    );


const rankedTraits =
  [...traitCounts.entries()]
    .map(
      ([trait, duplicatePairs]) => ({
        trait,
        duplicatePairs,
      })
    )
    .sort(
      (a, b) =>
        b.duplicatePairs -
        a.duplicatePairs
    );


console.log(
  '\n========================================'
);

console.log(
  'CLASS-8 DUPLICATE ROOT-CAUSE AUDIT'
);

console.log(
  '========================================'
);

console.log(
  'Questions:',
  questions.length
);

console.log(
  'Duplicate pairs:',
  pairs.length
);

console.log(
  'Affected questions:',
  pairCounts.size
);


console.log(
  '\nTOP DUPLICATE-PRODUCING QUESTIONS\n'
);


console.table(
  rankedQuestions
    .slice(
      0,
      40
    )
    .map(
      item => ({
        duplicatePairs:
          item.duplicatePairs,

        id:
          item.id,

        trait:
          item.trait,

        family:
          item.family,

        text:
          item.text,
      })
    )
);


console.log(
  '\nTOP DUPLICATE-PRODUCING FAMILIES\n'
);


console.table(
  rankedFamilies
    .slice(
      0,
      30
    )
);


console.log(
  '\nDUPLICATES BY TRAIT\n'
);


console.table(
  rankedTraits
);


console.log(
  '\n========================================'
);

console.log(
  'ROOT-CAUSE AUDIT COMPLETE'
);

console.log(
  '========================================\n'
);
