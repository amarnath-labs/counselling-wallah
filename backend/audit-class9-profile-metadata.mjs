import bank from './src/data/careerQuestions/v7/index.js';

const questions =
  bank.filter(
    q =>
      Array.isArray(q.classes) &&
      q.classes.includes('class-9')
  );

const has = value =>
  Array.isArray(value) &&
  value.length > 0;

const stats = {
  total:
    questions.length,

  streams:
    questions.filter(
      q => has(q.streams)
    ).length,

  subjects:
    questions.filter(
      q => has(q.subjects)
    ).length,

  interests:
    questions.filter(
      q => has(q.interestClusters)
    ).length,

  careerFamilies:
    questions.filter(
      q => has(q.careerFamilies)
    ).length,

  skills:
    questions.filter(
      q => has(q.skills)
    ).length,

  anyProfileMetadata:
    questions.filter(
      q =>
        has(q.streams) ||
        has(q.subjects) ||
        has(q.interestClusters) ||
        has(q.careerFamilies) ||
        has(q.skills)
    ).length,
};

console.log(
  '\nCLASS-9 PROFILE METADATA COVERAGE\n'
);

console.table(stats);

console.log(
  '\nSAMPLE PROFILE-SPECIFIC QUESTIONS\n'
);

questions
  .filter(
    q =>
      has(q.streams) ||
      has(q.subjects) ||
      has(q.interestClusters) ||
      has(q.careerFamilies)
  )
  .slice(0, 30)
  .forEach(
    q => {
      console.log({
        id:
          q.id,

        trait:
          q.trait,

        streams:
          q.streams,

        subjects:
          q.subjects,

        interests:
          q.interestClusters,

        families:
          q.careerFamilies,
      });
    }
  );
