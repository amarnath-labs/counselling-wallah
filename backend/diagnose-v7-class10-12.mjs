import {
  getCandidateQuestions,
} from './src/repositories/careerQuestionRepository.js';

import { pool } from './src/db/pool.js';


const tests = [
  {
    label: 'Class 10 WITHOUT class filter',
    stage: 'class-10',
    currentClass: null,
  },
  {
    label: 'Class 10 normalized class filter',
    stage: 'class-10',
    currentClass: 'class-10',
  },

  {
    label: 'Class 11 WITHOUT class filter',
    stage: 'class-11',
    currentClass: null,
  },
  {
    label: 'Class 11 normalized class filter',
    stage: 'class-11',
    currentClass: 'class-11',
  },

  {
    label: 'Class 12 WITHOUT class filter',
    stage: 'class-12',
    currentClass: null,
  },
  {
    label: 'Class 12 normalized class filter',
    stage: 'class-12',
    currentClass: 'class-12',
  },
];


for (const test of tests) {
  const rows =
    await getCandidateQuestions({
      stage: test.stage,
      currentClass: test.currentClass,
      version: 7,
      limit: 2000,
    });

  console.log('');
  console.log(
    '========================================'
  );
  console.log(test.label);
  console.log(
    '========================================'
  );

  console.log('COUNT:', rows.length);

  console.log(
    'STAGES:',
    [...new Set(
      rows.map(q => q.stage)
    )]
  );

  console.log(
    'CLASSES:',
    [...new Set(
      rows.flatMap(
        q => q.classes || []
      )
    )]
  );

  console.log(
    'FIRST:',
    rows[0]?.id || 'NONE'
  );
}


/*
|--------------------------------------------------------------------------
| Raw DB truth
|--------------------------------------------------------------------------
*/

const { rows: dbRows } =
  await pool.query(`
    SELECT
      stage,
      version,
      classes,
      active,
      COUNT(*)::int AS count
    FROM career_questions
    WHERE version = 7
      AND stage IN (
        'class-10',
        'class10',
        'class-11',
        'class-12'
      )
    GROUP BY
      stage,
      version,
      classes,
      active
    ORDER BY
      stage,
      classes,
      active DESC
  `);


console.log('');
console.log(
  '========================================'
);
console.log(
  'RAW DATABASE'
);
console.log(
  '========================================'
);

console.table(dbRows);


await pool.end();
