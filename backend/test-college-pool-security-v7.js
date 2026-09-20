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
      'College',

    degree:
      'B.Com',

    branch:
      'Finance',

    collegeYear:
      '3rd Year',

    goal:
      'Professional Qualification',

    skills: [
      'Accounting',
      'Finance',
    ],
  });


const {
  rows,
} =
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
    questionRows,
} =
  await pool.query(
    `
      SELECT id
      FROM career_questions
      WHERE stage = 'college'
        AND active = TRUE
        AND id LIKE 'v7_college_%'
      ORDER BY id
    `
  );


const outside =
  questionRows.find(
    row =>
      !allowed.has(
        row.id
      )
  );


console.log(
  'Assessment ID:',
  started.assessmentId
);

console.log(
  'Pool size:',
  allowed.size
);

console.log(
  'Outside question:',
  outside?.id
);


if (!outside) {
  throw new Error(
    'Could not find an outside-pool College question.'
  );
}


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
