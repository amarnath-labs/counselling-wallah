import {
  retrieveRankedQuestionCandidates,
} from './src/services/career/questionRetriever.js';


const profile = {
  stage: 'foundation',
  currentClass: 'class-8',
};


const results =
  await retrieveRankedQuestionCandidates({
    profile,
    answers: [],
    traitEvidence: {},
    careerMatches: [],
    limit: 20,
  });


const counts = {};

for (
  const question
  of results
) {
  counts[question.trait] =
    (counts[question.trait] || 0) + 1;
}


console.log(
  'Returned:',
  results.length
);

console.log(
  'Trait distribution:',
  counts
);

console.log(
  '\nQuestions:'
);

for (
  const question
  of results
) {
  console.log(
    question.id,
    '=>',
    question.trait,
    '| contextSpecificity:',
    question.contextSpecificity
  );
}
