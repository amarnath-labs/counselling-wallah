import bank from './src/data/careerQuestions/v7/index.js';

const all =
  Array.isArray(bank)
    ? bank
    : [];

const class12 =
  all.filter(
    q =>
      Number(q.version) === 7 &&
      (
        q.classes?.includes('class-12') ||
        q.tags?.includes('class-12')
      )
  );

console.log('TOTAL V7 INDEX QUESTIONS:', all.length);
console.log('CLASS 12 V7 QUESTIONS:', class12.length);

console.log(
  'CLASS 12 WITH STREAMS:',
  class12.filter(
    q => q.streams?.length
  ).length
);

console.log(
  'CLASS 12 WITH EXAMS:',
  class12.filter(
    q => q.entranceExams?.length
  ).length
);

console.log(
  'CLASS 12 WITH COURSES:',
  class12.filter(
    q => q.targetCourses?.length
  ).length
);

console.log('');
console.log('SAMPLE:');

console.table(
  class12.slice(0, 10).map(
    q => ({
      id: q.id,
      version: q.version,
      classes: q.classes,
      streams: q.streams,
      exams: q.entranceExams,
      courses: q.targetCourses,
    })
  )
);
