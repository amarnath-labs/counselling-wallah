import {
  fetchNeetAdmissionHistory,
} from './src/services/neetRecommendationService.js';

const result =
  await fetchNeetAdmissionHistory({
    collegeName:
      'Institute of Postgraduate Medical Education & Research, Kolkata',

    course:
      'MBBS',

    category:
      'Open',

    quota:
      'All India',

    rank:
      3000,
  });


console.log(
  JSON.stringify(
    {
      available:
        result
          ?.data
          ?.intelligence
          ?.josaa
          ?.available,

      historicalBucket:
        result
          ?.data
          ?.intelligence
          ?.josaa
          ?.historicalBucket,

      trend:
        result
          ?.data
          ?.intelligence
          ?.josaa
          ?.trend,

      confidence:
        result
          ?.data
          ?.intelligence
          ?.josaa
          ?.confidence,

      years:
        result
          ?.data
          ?.intelligence
          ?.josaa
          ?.years,
    },
    null,
    2
  )
);
