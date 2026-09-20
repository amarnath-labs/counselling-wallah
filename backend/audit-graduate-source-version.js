import graduateQuestions from
  './src/data/careerQuestions/v7/graduate.js';

const questions =
  Array.isArray(graduateQuestions)
    ? graduateQuestions
    : [];

const versionCounts = {};

for (const q of questions) {
  const version =
    String(q.version);

  versionCounts[version] =
    (versionCounts[version] || 0) + 1;
}

console.log(
  'GRADUATE SOURCE TOTAL:',
  questions.length
);

console.log(
  'VERSION COUNTS:',
  versionCounts
);

console.log(
  'STAGE COUNTS:'
);

const stageCounts = {};

for (const q of questions) {
  const stage =
    String(q.stage);

  stageCounts[stage] =
    (stageCounts[stage] || 0) + 1;
}

console.log(stageCounts);

console.log('');
console.log('FIRST 10:');

console.table(
  questions.slice(0, 10).map(
    q => ({
      id: q.id,
      version: q.version,
      stage: q.stage,
      active: q.active,
      classes: q.classes,
    })
  )
);
