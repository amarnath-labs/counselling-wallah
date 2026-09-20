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
      126729
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
    `Expected Safe but got ${result.bucket}`
  );
}

console.log(
  'PASS: Screenshot example = SAFE'
);
