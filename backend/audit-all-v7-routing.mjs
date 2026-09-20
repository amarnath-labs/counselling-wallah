import {
  getCandidateQuestions,
} from './src/repositories/careerQuestionRepository.js';

import { pool } from
  './src/db/pool.js';


const tests = [
  {
    label: 'Class 8',
    stage: 'foundation',
    currentClass: 'class-8',
  },

  {
    label: 'Class 9',
    stage: 'foundation',
    currentClass: 'class-9',
  },

  {
    label: 'Class 10',
    stage: 'class10',
    currentClass: 'class-10',
  },

  {
    label: 'Class 11',
    stage: 'senior-secondary',
    currentClass: 'class-11',
  },

  {
    label: 'Class 12',
    stage: 'senior-secondary',
    currentClass: 'class-12',
  },

  {
    label: 'College',
    stage: 'college',
    currentClass: null,
  },

  {
    label: 'Graduate',
    stage: 'graduate',
    currentClass: null,
  },
];


console.log('');
console.log(
  '========================================'
);
console.log(
  'TRUMARG V7 ROUTING AUDIT'
);
console.log(
  '========================================'
);


for (const test of tests) {
  try {
    const rows =
      await getCandidateQuestions({
        stage:
          test.stage,

        currentClass:
          test.currentClass,

        version:
          7,

        limit:
          2000,
      });


    const versions = [
      ...new Set(
        rows.map(
          q => q.version
        )
      ),
    ];


    const stages = [
      ...new Set(
        rows.map(
          q => q.stage
        )
      ),
    ];


    const classes = [
      ...new Set(
        rows.flatMap(
          q => q.classes || []
        )
      ),
    ];


    console.log('');
    console.log(
      `----- ${test.label} -----`
    );

    console.log(
      'COUNT:',
      rows.length
    );

    console.log(
      'VERSIONS:',
      versions
    );

    console.log(
      'STAGES:',
      stages
    );

    console.log(
      'CLASSES:',
      classes
    );

    console.log(
      'FIRST:',
      rows[0]?.id || 'NONE'
    );


    const pass =
      rows.length === 500 &&
      versions.length === 1 &&
      versions[0] === 7;


    console.log(
      'STATUS:',
      pass
        ? 'PASS'
        : 'CHECK'
    );
  } catch (error) {
    console.log('');
    console.log(
      `----- ${test.label} -----`
    );

    console.log(
      'STATUS: ERROR'
    );

    console.log(
      error.message
    );
  }
}


await pool.end();
