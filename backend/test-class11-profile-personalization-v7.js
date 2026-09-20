import bank from
  './src/data/careerQuestions/v7/index.js';

import {
  buildAssessment,
} from
  './src/careerAssessment/selectors/assessmentSelector.js';


const profiles = [
  {
    name:
      'PCM + CS + JEE',

    profile: {
      stage:
        'class-11',

      board:
        'cbse',

      stream:
        'science-pcm-computer-science',

      subjects: [
        'mathematics',
        'physics',
        'chemistry',
        'computer-science',
      ],

      entranceExams: [
        'jee-main',
        'jee-advanced',
        'bitsat',
      ],

      interestDirection:
        'computer-technology',

      careerFamilies: [
        'engineering',
        'technology',
      ],

      seed:
        'class11-pcm-jee',
    },
  },

  {
    name:
      'PCB + NEET',

    profile: {
      stage:
        'class-11',

      board:
        'cbse',

      stream:
        'science-pcb',

      subjects: [
        'physics',
        'chemistry',
        'biology',
      ],

      entranceExams: [
        'neet-ug',
      ],

      interestDirection:
        'healthcare-medical',

      careerFamilies: [
        'healthcare',
        'life-sciences',
      ],

      seed:
        'class11-pcb-neet',
    },
  },

  {
    name:
      'Humanities + Legal Studies + CLAT',

    profile: {
      stage:
        'class-11',

      board:
        'cbse',

      stream:
        'humanities-with-legal-studies',

      subjects: [
        'political-science',
        'history',
        'legal-studies',
        'english',
      ],

      entranceExams: [
        'clat',
        'ailet',
      ],

      interestDirection:
        'law-governance',

      careerFamilies: [
        'law',
        'governance',
        'policy',
      ],

      seed:
        'class11-law-clat',
    },
  },
];


for (
  const item of profiles
) {
  const result =
    buildAssessment({
      bank,
      profile:
        item.profile,
    });


  console.log(
    '\n========================================'
  );

  console.log(
    item.name
  );

  console.log(
    'Questions:',
    result.questionCount
  );


  const streamMatches =
    result.questions.filter(
      q =>
        q.streams?.includes(
          item.profile.stream
        )
    ).length;


  const examMatches =
    result.questions.filter(
      q =>
        q.entranceExams?.some(
          exam =>
            item.profile
              .entranceExams
              .includes(
                exam
              )
        )
    ).length;


  const subjectMatches =
    result.questions.filter(
      q =>
        q.subjects?.some(
          subject =>
            item.profile
              .subjects
              .includes(
                subject
              )
        )
    ).length;


  console.log(
    'Stream matches:',
    streamMatches
  );

  console.log(
    'Entrance-exam matches:',
    examMatches
  );

  console.log(
    'Subject matches:',
    subjectMatches
  );

  console.log(
    'Trait counts:',
    result.traitCounts
  );


  console.log(
    '\nTop selected questions:'
  );


  for (
    const question of
    result.questions.slice(
      0,
      12
    )
  ) {
    console.log(
      '-',
      question.id,
      '|',
      question.trait,
      '|',
      question.text
    );
  }
}
