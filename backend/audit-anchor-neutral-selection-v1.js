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
    limit: 10,
  });


console.log(
  'Returned:',
  results.length
);


for (
  const question
  of results
) {
  console.log({
    id:
      question.id,

    trait:
      question.trait,

    contextSpecificity:
      question.contextSpecificity,

    streams:
      question.streams,

    subjects:
      question.subjects,

    entranceExams:
      question.entranceExams,

    targetCourses:
      question.targetCourses,

    careerFamilies:
      question.careerFamilies,

    interestClusters:
      question.interestClusters,
  });
}

