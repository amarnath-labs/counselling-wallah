import bank from './src/data/careerQuestions/v7/index.js';

const graduate =
  bank.filter(
    q =>
      Number(q.version) === 7 &&
      q.stage === 'graduate'
  );

console.log(
  'TOTAL V7 INDEX:',
  bank.length
);

console.log(
  'GRADUATE V7 IN INDEX:',
  graduate.length
);

console.log('');

console.table(
  graduate.slice(0, 10).map(
    q => ({
      id: q.id,
      version: q.version,
      stage: q.stage,
      contextScope:
        q.contextScope,
    })
  )
);
