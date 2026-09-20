import bank
  from './src/data/careerQuestions/v7/index.js';


console.log(
  'Bank is array:',
  Array.isArray(bank)
);

console.log(
  'Bank length:',
  Array.isArray(bank)
    ? bank.length
    : 'N/A'
);


if (
  Array.isArray(bank)
) {
  console.log(
    '\nFirst 5 question shapes:'
  );

  for (
    const question
    of bank.slice(0, 5)
  ) {
    console.log({
      id:
        question.id,

      stage:
        question.stage,

      currentClass:
        question.currentClass,

      classKey:
        question.classKey,

      class:
        question.class,

      classes:
        question.classes,

      targetClasses:
        question.targetClasses,
    });
  }


  const class8Ids =
    bank
      .filter(
        question =>
          String(
            question.id || ''
          ).startsWith(
            'v7_class8_'
          )
      )
      .slice(
        0,
        20
      );


  console.log(
    '\nClass-8 by ID prefix:',
    class8Ids.length
  );


  for (
    const question
    of class8Ids.slice(0, 5)
  ) {
    console.log({
      id:
        question.id,

      stage:
        question.stage,

      currentClass:
        question.currentClass,

      classKey:
        question.classKey,

      class:
        question.class,

      classes:
        question.classes,

      targetClasses:
        question.targetClasses,
    });
  }
}
