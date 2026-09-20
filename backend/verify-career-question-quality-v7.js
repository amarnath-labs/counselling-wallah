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


  let common = 0;


  for (
    const token of a
  ) {
    if (
      b.has(token)
    ) {
      common += 1;
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
      (
        question.classes?.[0] ||
        question.stage
      ) === CLASS_KEY
  );


const pairs = [];


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
      score >=
      THRESHOLD
    ) {
      pairs.push({
        trait:
          left.trait,

        score:
          Number(
            score.toFixed(3)
          ),

        left:
          left.id,

        right:
          right.id,

        sameFamily:
          left.scenarioFamily ===
          right.scenarioFamily,

        leftFamily:
          left.scenarioFamily,

        rightFamily:
          right.scenarioFamily,
      });
    }
  }
}


const byTrait =
  {};


for (
  const pair of pairs
) {
  byTrait[
    pair.trait
  ] =
    (
      byTrait[
        pair.trait
      ] || 0
    ) + 1;
}


console.log(
  '\nCLASS:',
  CLASS_KEY
);

console.log(
  'QUESTIONS:',
  questions.length
);

console.log(
  'NEAR-DUPLICATE PAIRS:',
  pairs.length
);


console.table(
  Object.entries(
    byTrait
  )
    .map(
      ([trait, count]) => ({
        trait,
        count,
      })
    )
    .sort(
      (a, b) =>
        b.count -
        a.count
    )
);


console.table(
  pairs
    .sort(
      (a, b) =>
        b.score -
        a.score
    )
    .slice(
      0,
      30
    )
);


if (
  pairs.length > 10
) {
  console.log(
    '\nQUALITY GATE: FAIL'
  );

  process.exitCode =
    1;
}
else {
  console.log(
    '\nQUALITY GATE: PASS'
  );
}
