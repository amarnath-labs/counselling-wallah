import bank from
  './src/data/careerQuestions/v7/index.js';


const class8 =
  bank.filter(
    question =>
      question.stage ===
        'foundation' &&
      Array.isArray(
        question.classes
      ) &&
      question.classes.includes(
        'class-8'
      )
  );


console.log(
  'Class 8 questions:',
  class8.length
);


const fields =
  new Set();


for (
  const question
  of class8.slice(
    0,
    500
  )
) {
  for (
    const key
    of Object.keys(
      question
    )
  ) {
    fields.add(
      key
    );
  }
}


console.log(
  '\nAVAILABLE FIELDS:'
);

console.log(
  [...fields].sort()
);


console.log(
  '\n=============================='
);

console.log(
  'SAMPLE QUESTIONS'
);


for (
  const question
  of class8.slice(
    0,
    10
  )
) {
  console.log(
    '\n',
    question.id,
    {
      trait:
        question.trait,

      purpose:
        question.purpose,

      contextScope:
        question.contextScope,

      polarity:
        question.polarity,

      direction:
        question.direction,

      reverse:
        question.reverse,

      reverseScored:
        question.reverseScored,

      scoringDirection:
        question.scoringDirection,

      weight:
        question.weight,
    }
  );
}
