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
      'B.Tech',

    branch:
      'Computer Science',

    collegeYear:
      'Final Year',

    goal:
      'Placement',

    skills: [
      'Programming',
      'Problem Solving',
      'Teamwork',
    ],

    careerFamilies: [
      'technology',
      'software',
    ],
  });


console.log(
  '\n===== COLLEGE START ====='
);

console.log(
  'Assessment ID:',
  started.assessmentId
);

console.log(
  'Completed:',
  started.completed
);

console.log(
  'First question:',
  started.question?.id
);


const { rows } =
  await pool.query(
    `
      SELECT
        stage,
        status,
        cardinality(
          question_pool_ids
        )::int AS pool_size,
        question_pool_ids
      FROM career_assessments
      WHERE id = $1
    `,
    [
      started.assessmentId,
    ]
  );


const assessment =
  rows[0];


console.log(
  '\n===== STORED POOL ====='
);

console.log(
  'Stage:',
  assessment.stage
);

console.log(
  'Status:',
  assessment.status
);

console.log(
  'Pool size:',
  assessment.pool_size
);

console.log(
  'Unique:',
  new Set(
    assessment.question_pool_ids
  ).size
);

console.log(
  'First question in pool:',
  assessment.question_pool_ids.includes(
    started.question.id
  )
);


const second =
  await answerCareerAssessment({
    assessmentId:
      started.assessmentId,

    questionId:
      started.question.id,

    value:
      4,
  });


console.log(
  '\n===== AFTER FIRST ANSWER ====='
);

console.log(
  'Completed:',
  second.completed
);

console.log(
  'Second question:',
  second.question?.id
);

console.log(
  'Second question in pool:',
  second.question
    ? assessment.question_pool_ids.includes(
        second.question.id
      )
    : null
);


const {
  rows:
    answerRows,
} =
  await pool.query(
    `
      SELECT
        COUNT(*)::int AS count
      FROM career_assessment_answers
      WHERE assessment_id = $1
    `,
    [
      started.assessmentId,
    ]
  );


console.log(
  'Answers stored:',
  answerRows[0].count
);


await pool.end();
