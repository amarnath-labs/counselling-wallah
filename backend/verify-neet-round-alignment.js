import {
  fetchNeetAdmissionHistory,
} from './src/services/neetRecommendationService.js';


const result =
  await fetchNeetAdmissionHistory({
    collegeName:
      'RUHS College of Medical Sciences, Jaipur',

    course:
      'MBBS',

    category:
      'Open',

    rank:
      3000,

    round:
      1,
  });


const intelligence =
  result
    ?.data
    ?.intelligence
    ?.josaa;


console.log(
  JSON.stringify(
    {
      available:
        intelligence?.available,

      historicalBucket:
        intelligence?.historicalBucket,

      likelyRound:
        intelligence?.likelyRound,

      years:
        intelligence?.years?.map(
          item => ({
            year:
              item.year,

            selectedRound:
              item.selectedRound,

            openingRank:
              item.openingRank,

            closingRank:
              item.closingRank,

            bucket:
              item.bucket,

            latestAvailableRound:
              item.latestAvailableRound,

            latestAvailableClosingRank:
              item.latestAvailableClosingRank,
          })
        ),
    },
    null,
    2
  )
);
