import bank from './src/data/careerQuestions/v7/index.js';

const values =
  [...new Set(
    bank
      .filter(
        q =>
          Number(q.version) === 7
      )
      .map(
        q => q.contextScope
      )
      .filter(Boolean)
  )].sort();

console.log(
  'V7 contextScope values:'
);

console.log(values);

console.log(
  'COUNT:',
  values.length
);
