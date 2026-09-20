import {
  QUESTIONS,
} from './src/data/careerQuestions/v7/class8.js';

console.log(
  'Total:',
  QUESTIONS.length
);

console.log(
  'With scenario:',
  QUESTIONS.filter(
    (q) => Boolean(q.scenario)
  ).length
);

console.log(
  'Unique scenarios:',
  new Set(
    QUESTIONS
      .map((q) => q.scenario)
      .filter(Boolean)
  ).size
);

console.table(
  QUESTIONS.slice(0, 6).map(
    (q) => ({
      id: q.id,
      trait: q.trait,
      scenario: q.scenario,
    })
  )
);
