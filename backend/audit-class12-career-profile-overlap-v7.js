import {
  retrieveRankedQuestionCandidates,
} from './src/services/career/questionRetriever.js';


const LIMIT = 20;


const profiles = {
  'CLASS 12 PCM + JEE': {
    stage: 'senior-secondary',
    currentClass: 'class-12',
    stream: 'pcm',
    subjects: [
      'physics',
      'chemistry',
      'mathematics',
    ],
    entranceExams: [
      'jee',
      'jee main',
      'jee advanced',
    ],
    targetCourses: [
      'btech',
      'engineering',
    ],
  },

  'CLASS 12 PCB + NEET': {
    stage: 'senior-secondary',
    currentClass: 'class-12',
    stream: 'pcb',
    subjects: [
      'physics',
      'chemistry',
      'biology',
    ],
    entranceExams: [
      'neet',
      'neet ug',
    ],
    targetCourses: [
      'mbbs',
      'medicine',
    ],
  },

  'CLASS 12 COMMERCE + IPMAT': {
    stage: 'senior-secondary',
    currentClass: 'class-12',
    stream: 'commerce',
    subjects: [
      'accountancy',
      'business studies',
      'economics',
      'mathematics',
    ],
    entranceExams: [
      'ipmat',
    ],
    targetCourses: [
      'integrated programme in management',
      'management',
      'bba',
    ],
  },
};


async function getIds(profile) {
  const ranked =
    await retrieveRankedQuestionCandidates({
      profile,
      answers: [],
      traitEvidence: {},
      careerMatches: [],
      allowedQuestionIds: [],
      limit: LIMIT,
    });

  return ranked.map(
    question => question.id
  );
}


function compare(
  nameA,
  idsA,
  nameB,
  idsB
) {
  const setB =
    new Set(idsB);

  const same =
    idsA.filter(
      id => setB.has(id)
    );

  const denominator =
    Math.min(
      idsA.length,
      idsB.length
    ) || 1;

  const percentage =
    (
      same.length /
      denominator *
      100
    ).toFixed(1);


  console.log('');
  console.log(nameA);
  console.log('VS');
  console.log(nameB);
  console.log(
    `Overlap: ${same.length} / ${denominator}`
  );
  console.log(
    `Overlap %: ${percentage}`
  );
  console.log(
    'Same IDs:',
    same
  );
}


async function main() {
  const results = {};


  for (
    const [
      name,
      profile,
    ]
    of Object.entries(profiles)
  ) {
    results[name] =
      await getIds(profile);

    console.log('');
    console.log(
      `TOP ${LIMIT}: ${name}`
    );

    console.log(
      results[name]
    );
  }


  compare(
    'CLASS 12 PCM + JEE',
    results['CLASS 12 PCM + JEE'],
    'CLASS 12 PCB + NEET',
    results['CLASS 12 PCB + NEET']
  );


  compare(
    'CLASS 12 PCM + JEE',
    results['CLASS 12 PCM + JEE'],
    'CLASS 12 COMMERCE + IPMAT',
    results[
      'CLASS 12 COMMERCE + IPMAT'
    ]
  );


  compare(
    'CLASS 12 PCB + NEET',
    results['CLASS 12 PCB + NEET'],
    'CLASS 12 COMMERCE + IPMAT',
    results[
      'CLASS 12 COMMERCE + IPMAT'
    ]
  );
}


main()
  .then(() => {
    console.log('');
    console.log(
      'Class 12 overlap audit complete.'
    );
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
