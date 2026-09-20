import {
  calculateHistoricalFit,
} from './backend/src/services/cwRecV1.js';


const result =
  calculateHistoricalFit({

    studentRank:
      100000,


    r1OpeningRank:
      82452,


    lastRoundClosingRank:
      126729,


    closingRanks: [
      93535
    ],

  });


console.log(
  JSON.stringify(
    result,
    null,
    2
  )
);


if (
  result.bucket !==
  'Safe'
) {

  throw new Error(
    `Expected Safe, got ${result.bucket}`
  );

}


if (
  result.admissionModel !==
  'R1_OPENING_TO_LAST_ROUND_CLOSING'
) {

  throw new Error(
    `Wrong model: ${result.admissionModel}`
  );

}


console.log('');
console.log('PASS: 1,00,000 => SAFE');
console.log('PASS: R1 82,452 -> Final 1,26,729');
