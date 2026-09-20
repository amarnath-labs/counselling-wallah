import {
  buildHistoricalAdmissionIntelligence,
} from './src/services/historicalAdmissionIntelligence.js';


const studentRank =
  40000;


const josaaRows = [
  {
    year: 2026,
    round: '1',
    openingRank: 21304,
    closingRank: 35213,
  },
  {
    year: 2026,
    round: '2',
    openingRank: 31876,
    closingRank: 38759,
  },
  {
    year: 2026,
    round: '3',
    openingRank: 31876,
    closingRank: 39467,
  },
  {
    year: 2026,
    round: '4',
    openingRank: 31876,
    closingRank: 39488,
  },
  {
    year: 2026,
    round: '5',
    openingRank: 31876,
    closingRank: 41618,
  },

  {
    year: 2025,
    round: '1',
    openingRank: 24828,
    closingRank: 29823,
  },
  {
    year: 2025,
    round: '6',
    openingRank: 24828,
    closingRank: 35928,
  },

  {
    year: 2024,
    round: '1',
    openingRank: 24188,
    closingRank: 28558,
  },
  {
    year: 2024,
    round: '5',
    openingRank: 25414,
    closingRank: 31601,
  },
];


const csabRows = [
  {
    year: 2026,
    round: '1',
    openingRank: 25903,
    closingRank: 51129,
  },
  {
    year: 2026,
    round: '2',
    openingRank: 51556,
    closingRank: 55006,
  },

  {
    year: 2025,
    round: '1',
    openingRank: 30999,
    closingRank: 46229,
  },
  {
    year: 2025,
    round: '2',
    openingRank: 46747,
    closingRank: 47797,
  },
  {
    year: 2025,
    round: '3',
    openingRank: 48493,
    closingRank: 49257,
  },

  {
    year: 2024,
    round: '1',
    openingRank: 35597,
    closingRank: 41570,
  },
  {
    year: 2024,
    round: '2',
    openingRank: 41692,
    closingRank: 43273,
  },
];


const result =
  buildHistoricalAdmissionIntelligence({
    studentRank,
    josaaRows,
    csabRows,
  });


console.dir(
  result,
  {
    depth: null,
  }
);
