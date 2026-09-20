import {
  normalizeCareerProfile,
} from './src/services/career/profileNormalizer.js';

import {
  retrieveRankedQuestionCandidates,
} from './src/services/career/questionRetriever.js';

import {
  pool,
} from './src/db/pool.js';


const profiles = [
  {
    name:
      'CLASS 11 - PCM + CS + JEE',

    input: {
      stage:
        'Senior Secondary',

      currentClass:
        'Class 11',

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

      careerInterests: [
        'engineering',
        'computer-technology',
      ],

      careerFamilies: [
        'engineering',
        'technology',
      ],
    },
  },

  {
    name:
      'CLASS 11 - PCB + NEET',

    input: {
      stage:
        'Senior Secondary',

      currentClass:
        'Class 11',

      stream:
        'science-pcb',

      subjects: [
        'Biology',
        'Chemistry',
        'Physics',
      ],

      entranceExams: [
        'neet-ug',
      ],

      careerInterests: [
        'healthcare-medical',
        'science',
      ],

      careerFamilies: [
        'healthcare',
        'life-sciences',
      ],
    },
  },

  {
    name:
      'CLASS 11 - LAW + CLAT',

    input: {
      stage:
        'Senior Secondary',

      currentClass:
        'Class 11',

      stream:
        'humanities-with-legal-studies',

      subjects: [
        'Legal Studies',
        'Political Science',
        'English',
      ],

      entranceExams: [
        'clat',
        'ailet',
      ],

      careerInterests: [
        'law-governance',
        'humanities-social-sciences',
      ],

      careerFamilies: [
        'law',
        'governance',
      ],
    },
  },

  {
    name:
      'CLASS 12 - PCM + JEE',

    input: {
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
        'bitsat',
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
    },
  },

  {
    name:
      'CLASS 12 - PCB + NEET',

    input: {
      stage:
        'Senior Secondary',

      currentClass:
        'Class 12',

      stream:
        'science-pcb',

      subjects: [
        'Biology',
        'Chemistry',
        'Physics',
      ],

      entranceExams: [
        'neet-ug',
        'aiims-nursing',
      ],

      targetCourses: [
        'mbbs',
        'nursing',
      ],

      careerInterests: [
        'healthcare-medical',
        'science',
      ],

      careerFamilies: [
        'healthcare',
        'life-sciences',
      ],
    },
  },

  {
    name:
      'CLASS 12 - COMMERCE + CA',

    input: {
      stage:
        'Senior Secondary',

      currentClass:
        'Class 12',

      stream:
        'commerce-with-mathematics',

      subjects: [
        'Accountancy',
        'Economics',
        'Business Studies',
        'Mathematics',
      ],

      entranceExams: [
        'ca-foundation',
      ],

      targetCourses: [
        'bcom',
      ],

      careerInterests: [
        'commerce',
        'finance',
      ],

      careerFamilies: [
        'finance',
        'accounting',
      ],
    },
  },

  {
    name:
      'CLASS 12 - LAW + CLAT',

    input: {
      stage:
        'Senior Secondary',

      currentClass:
        'Class 12',

      stream:
        'humanities-with-legal-studies',

      subjects: [
        'Legal Studies',
        'Political Science',
        'English',
      ],

      entranceExams: [
        'clat',
        'ailet',
      ],

      targetCourses: [
        'llb',
      ],

      careerInterests: [
        'law-governance',
        'humanities-social-sciences',
      ],

      careerFamilies: [
        'law',
        'governance',
        'policy',
      ],
    },
  },

  {
    name:
      'CLASS 12 - DEFENCE + NDA',

    input: {
      stage:
        'Senior Secondary',

      currentClass:
        'Class 12',

      stream:
        'science-pcm',

      subjects: [
        'Mathematics',
        'Physics',
        'Physical Education',
      ],

      entranceExams: [
        'nda-na',
        'technical-entry-scheme-10plus2',
      ],

      careerInterests: [
        'engineering',
        'sports',
      ],

      careerFamilies: [
        'defence',
        'engineering',
        'public-service',
      ],
    },
  },
];


function normalizeList(
  value = []
) {
  return (
    Array.isArray(value)
      ? value
      : []
  )
    .map(
      item =>
        String(item)
          .trim()
          .toLowerCase()
          .replace(/&/g, 'and')
          .replace(/[./(),_-]+/g, ' ')
          .replace(/\s+/g, ' ')
    )
    .filter(Boolean);
}


function overlap(
  a = [],
  b = []
) {
  const left =
    normalizeList(a);

  const right =
    normalizeList(b);


  return left.some(
    value =>
      right.includes(
        value
      )
  );
}


for (
  const test of
  profiles
) {
  const profile =
    normalizeCareerProfile(
      test.input
    );


  const ranked =
    await retrieveRankedQuestionCandidates({
      profile,
      answers: [],
      traitEvidence: {},
      careerMatches: [],
      limit: 12,
    });


  const streamMatches =
    ranked.filter(
      q =>
        overlap(
          [
            profile.stream,
          ],
          q.streams
        )
    ).length;


  const examMatches =
    ranked.filter(
      q =>
        overlap(
          profile.entranceExams,
          q.entranceExams
        )
    ).length;


  const subjectMatches =
    ranked.filter(
      q =>
        overlap(
          profile.subjects,
          q.subjects
        )
    ).length;


  const courseMatches =
    ranked.filter(
      q =>
        overlap(
          profile.targetCourses,
          q.targetCourses
        )
    ).length;


  console.log(
    '\n========================================'
  );

  console.log(
    test.name
  );

  console.log(
    'Stage:',
    profile.stage
  );

  console.log(
    'Questions returned:',
    ranked.length
  );

  console.log(
    'Stream matches:',
    streamMatches
  );

  console.log(
    'Exam matches:',
    examMatches
  );

  console.log(
    'Subject matches:',
    subjectMatches
  );

  console.log(
    'Course matches:',
    courseMatches
  );


  console.log(
    '\nTop questions:'
  );


  for (
    const q of
    ranked.slice(
      0,
      8
    )
  ) {
    console.log(
      '-',
      q.id,
      '|',
      q.trait,
      '| tier:',
      q.metadataTier,
      '| context:',
      q.contextSpecificity
    );

    console.log(
      ' ',
      q.text
    );
  }
}


await pool.end();
