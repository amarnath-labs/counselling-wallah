import {
  startCareerAssessment,
  answerCareerAssessment,
} from './src/services/career/assessmentService.js';

import {
  pool,
} from './src/db/pool.js';


const rawProfile = {
  stage:
    'Senior Secondary',

  currentClass:
    'Class 12',

  stream:
    'science-pcm-computer-science',

  subjects: [
    'Mathematics',
    'Physics',
    'Computer Science',
  ],

  entranceExams: [
    'jee-main',
    'jee-advanced',
  ],

  targetCourses: [
    'btech',
  ],

  careerInterests: [
    'engineering',
    'computer-technology',
  ],

  careerFamilies: [
    'engineering',
    'technology',
  ],
};


console.log(
  '\n===== START ASSESSMENT ====='
);


const started =
  await startCareerAssessment(
    rawProfile
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


const {
  rows,
} =
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
  '\n===== STORED ASSESSMENT ====='
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
  'Unique pool IDs:',
  new Set(
    assessment.question_pool_ids
  ).size
);

console.log(
  'First question in pool:',
  assessment.question_pool_ids.includes(
    started.question?.id
  )
);


console.log(
  '\n===== ANSWER FIRST QUESTION ====='
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


console.log(
  '\n===== ANSWER COUNT ====='
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
