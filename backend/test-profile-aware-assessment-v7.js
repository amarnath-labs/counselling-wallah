import bank from
  './src/data/careerQuestions/v7/index.js';

import {
  buildAssessment,
} from
  './src/careerAssessment/selectors/assessmentSelector.js';


const assessment =
  buildAssessment({

    bank,

    profile: {
      stage:
        'class-8',

      board:
        'cbse',

      interestDirection:
        'computer-technology',

      subjects: [
        'mathematics',
        'science',
        'computer-science',
      ],

      goals: [
        'explore-careers',
      ],

      seed:
        'class8-test-001',
    },
  });


console.log(
  '\n========================================'
);

console.log(
  'TRUMARG PROFILE-AWARE ASSESSMENT'
);

console.log(
  '========================================'
);

console.log(
  'Stage:',
  assessment.stage
);

console.log(
  'Candidates:',
  assessment.candidateCount
);

console.log(
  'Selected:',
  assessment.questionCount
);

console.log(
  '\nTRAIT COUNTS'
);

console.table(
  assessment.traitCounts
);


console.log(
  '\nQUESTIONS\n'
);


for (
  const [
    index,
    question,
  ] of assessment.questions.entries()
) {
  console.log(
    `${index + 1}.`,
    `[${question.trait}]`,
    question.id
  );

  console.log(
    '   ',
    question.text
  );
}


console.log(
  '\n========================================'
);
