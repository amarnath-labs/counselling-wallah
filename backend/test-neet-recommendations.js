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
      10,
  });

console.log(
  JSON.stringify(
    {
      count:
        result.data.length,

      meta:
        result.meta,

      first:
        result.data[0] || null,
    },
    null,
    2
  )
);
