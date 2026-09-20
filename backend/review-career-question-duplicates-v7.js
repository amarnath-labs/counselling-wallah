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


const pairs =
  [];


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
        score:
          Number(
            score.toFixed(3)
          ),

        trait:
          left.trait,

        sameFamily:
          left.scenarioFamily ===
          right.scenarioFamily,

        leftId:
          left.id,

        rightId:
          right.id,

        leftFamily:
          left.scenarioFamily,

        rightFamily:
          right.scenarioFamily,

        leftText:
          left.text,

        rightText:
          right.text,
      });
    }
  }
}


pairs.sort(
  (a, b) =>
    b.score -
    a.score
);


console.log(
  '\n========================================'
);

console.log(
  'CLASS-8 NEAR-DUPLICATE REVIEW'
);

console.log(
  '========================================'
);

console.log(
  'Questions:',
  questions.length
);

console.log(
  'Review pairs:',
  pairs.length
);

console.log(
  'Threshold:',
  THRESHOLD
);


pairs.forEach(
  (pair, index) => {
    console.log(
      '\n----------------------------------------'
    );

    console.log(
      `PAIR ${index + 1}`
    );

    console.log(
      'Score:',
      pair.score
    );

    console.log(
      'Trait:',
      pair.trait
    );

    console.log(
      'Same family:',
      pair.sameFamily
    );

    console.log(
      '\nLEFT'
    );

    console.log(
      'ID:',
      pair.leftId
    );

    console.log(
      'Family:',
      pair.leftFamily
    );

    console.log(
      'Text:',
      pair.leftText
    );

    console.log(
      '\nRIGHT'
    );

    console.log(
      'ID:',
      pair.rightId
    );

    console.log(
      'Family:',
      pair.rightFamily
    );

    console.log(
      'Text:',
      pair.rightText
    );
  }
);


console.log(
  '\n========================================'
);

console.log(
  'REVIEW COMPLETE'
);

console.log(
  '========================================\n'
);
