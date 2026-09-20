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


const affectedIds =
  new Set();


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
      affectedIds.add(
        left.id
      );

      affectedIds.add(
        right.id
      );
    }
  }
}


const affectedQuestions =
  questions
    .filter(
      question =>
        affectedIds.has(
          question.id
        )
    )
    .sort(
      (a, b) => {
        const traitCompare =
          String(a.trait)
            .localeCompare(
              String(b.trait)
            );

        if (
          traitCompare !==
          0
        ) {
          return traitCompare;
        }

        return String(a.id)
          .localeCompare(
            String(b.id)
          );
      }
    );


console.log(
  '\n========================================'
);

console.log(
  'CLASS-8 AFFECTED QUESTION OBJECTS'
);

console.log(
  '========================================'
);

console.log(
  'Affected count:',
  affectedQuestions.length
);


for (
  const question of
  affectedQuestions
) {
  console.log(
    '\n----------------------------------------'
  );

  console.log(
    JSON.stringify(
      question,
      null,
      2
    )
  );
}


console.log(
  '\n========================================'
);

console.log(
  'AFFECTED QUESTION EXPORT COMPLETE'
);

console.log(
  '========================================\n'
);
