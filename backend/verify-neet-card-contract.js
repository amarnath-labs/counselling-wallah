import {
  fetchNeetRecommendations,
} from './src/services/neetRecommendationService.js';

const result =
  await fetchNeetRecommendations({
    rank:
      3000,

    year:
      2026,

    round:
      1,

    category:
      'Open',

    courses: [
      'MBBS',
    ],

    counsellingMode:
      'mcc',

    limit:
      1,
  });

const row =
  result.data[0];

console.log({
  college:
    row?.collegeName,

  bucket:
    row?.bucket,

  overall:
    row?.overall,

  overallScore:
    row?.overallScore,

  recommendationScore:
    row?.recommendationScore,

  admissionScore:
    row?.admission?.score,

  examId:
    row?.examId,

  neetMccAuthoritative:
    row?.neetMccAuthoritative,
});
