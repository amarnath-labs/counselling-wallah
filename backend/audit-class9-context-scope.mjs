import questions from
  './src/data/careerQuestions/v7/class9Batch01.js';

const counts = {};

for (const q of questions) {
  const value =
    q.contextScope ?? '(null)';

  counts[value] =
    (counts[value] || 0) + 1;
}

console.table(
  Object.entries(counts).map(
    ([contextScope, count]) => ({
      contextScope,
      count,
    })
  )
);
