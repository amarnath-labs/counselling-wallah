import {
  startCareerAssessment,
  answerCareerAssessment,
} from './src/services/career/assessmentService.js';

import {
  pool,
} from './src/db/pool.js';


const started =
  await startCareerAssessment({
    stage:
      'Senior Secondary',

    currentClass:
      'Class 12',

    stream:
      'science-pcm',

    subjects: [
      'Mathematics',
      'Physics',
    ],

    entranceExams: [
      'jee-main',
    ],
  });


const { rows } =
  await pool.query(
    `
      SELECT
        question_pool_ids
      FROM career_assessments
      WHERE id = $1
    `,
    [
      started.assessmentId,
    ]
  );


const allowed =
  new Set(
    rows[0].question_pool_ids
  );


const {
  rows:
    outsideRows,
} =
  await pool.query(
    `
      SELECT id
      FROM career_questions
      WHERE stage = 'class-12'
        AND active = TRUE
      ORDER BY id
    `
  );


const outside =
  outsideRows.find(
    row =>
      !allowed.has(
        row.id
      )
  );


console.log(
  'Outside question:',
  outside?.id
);


try {
  await answerCareerAssessment({
    assessmentId:
      started.assessmentId,

    questionId:
      outside.id,

    value:
      4,
  });


  console.log(
    'FAIL: outside question was accepted.'
  );
} catch (error) {
  console.log(
    'Rejected:',
    true
  );

  console.log(
    'Code:',
    error.code
  );

  console.log(
    'Message:',
    error.message
  );
}


await pool.end();
