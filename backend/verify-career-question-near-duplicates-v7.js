import CAREER_QUESTION_BANK_V7
  from './src/data/careerQuestions/v7/index.js';


const CLASS_KEY =
  process.argv[2] ||
  'class-8';


const REVIEW_THRESHOLD =
  Number(
    process.env.NEAR_DUP_THRESHOLD ||
    0.72
  );


function normalizeText(value) {
  return String(
    value || ''
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


const STOP_WORDS =
  new Set([
    'i',
    'me',
    'my',
    'a',
    'an',
    'the',
    'and',
    'or',
    'to',
    'of',
    'in',
    'on',
    'for',
    'with',
    'when',
    'where',
    'that',
    'this',
    'it',
    'is',
    'are',
    'be',
    'being',
    'been',
    'would',
    'could',
    'might',
    'like',
  ]);


function tokens(text) {
  return new Set(
    normalizeText(text)
      .split(' ')
      .filter(
        (token) =>
          token.length > 1 &&
          !STOP_WORDS.has(
            token
          )
      )
  );
}


function jaccard(a, b) {
  if (
    a.size === 0 ||
    b.size === 0
  ) {
    return 0;
  }


  let intersection = 0;

  for (
    const token of a
  ) {
    if (b.has(token)) {
      intersection += 1;
    }
  }


  const union =
    a.size +
    b.size -
    intersection;


  return union
    ? intersection / union
    : 0;
}


function getClassKey(question) {
  return (
    question.classes?.[0] ||
    question.stage
  );
}


const questions =
  CAREER_QUESTION_BANK_V7
    .filter(
      (question) =>
        getClassKey(
          question
        ) === CLASS_KEY
    );


const prepared =
  questions.map(
    (question) => ({
      question,
      tokenSet:
        tokens(
          question.text
        ),
    })
  );


const suspicious = [];


for (
  let i = 0;
  i < prepared.length;
  i += 1
) {
  for (
    let j = i + 1;
    j < prepared.length;
    j += 1
  ) {
    const left =
      prepared[i];

    const right =
      prepared[j];


    /*
    | Compare within the same trait.
    |
    | Cross-trait wording overlap is useful for a different QA pass,
    | but should not be mixed with conceptual duplicate detection.
    */

    if (
      left.question.trait !==
      right.question.trait
    ) {
      continue;
    }


    const similarity =
      jaccard(
        left.tokenSet,
        right.tokenSet
      );


    if (
      similarity >=
      REVIEW_THRESHOLD
    ) {
      suspicious.push({
        trait:
          left.question.trait,

        similarity:
          Number(
            similarity.toFixed(
              3
            )
          ),

        leftId:
          left.question.id,

        rightId:
          right.question.id,

        leftScenario:
          left.question.scenario,

        rightScenario:
          right.question.scenario,

        leftText:
          left.question.text,

        rightText:
          right.question.text,
      });
    }
  }
}


suspicious.sort(
  (a, b) =>
    b.similarity -
    a.similarity
);


console.log(
  '\nCLASS:',
  CLASS_KEY
);

console.log(
  'QUESTIONS:',
  questions.length
);

console.log(
  'THRESHOLD:',
  REVIEW_THRESHOLD
);

console.log(
  'REVIEW PAIRS:',
  suspicious.length
);


if (
  suspicious.length
) {
  console.table(
    suspicious.slice(
      0,
      50
    )
  );

  console.log(
    '\n⚠️ Near-duplicate candidates require review.'
  );
}
else {
  console.log(
    '\n✅ No high-similarity same-trait pairs detected.'
  );
}
