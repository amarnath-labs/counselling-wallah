import {
  getExternalReviewStats,
  getExternalReviewInstitutions,
  getExternalReviewIntelligence,
} from './src/services/externalReviewJsonService.js';


console.log(
  '\n===== DATASET STATS ====='
);

console.log(
  getExternalReviewStats()
);


console.log(
  '\n===== LOADED INSTITUTIONS ====='
);

console.table(
  getExternalReviewInstitutions()
);


console.log(
  '\n===== IIITV-ICD TEST ====='
);

console.dir(
  getExternalReviewIntelligence({
    collegeName:
      'IIITV-ICD',
  }),
  {
    depth:
      5,
  }
);


console.log(
  '\n===== IIIT VADODARA DIU FULL NAME TEST ====='
);

console.dir(
  getExternalReviewIntelligence({
    collegeName:
      'Indian Institute of Information Technology Vadodara - International Campus Diu',
  }),
  {
    depth:
      3,
  }
);


console.log(
  '\n===== NIT ROURKELA VARIANT TEST ====='
);

console.dir(
  getExternalReviewIntelligence({
    collegeName:
      'NIT Rourkela',
  }),
  {
    depth:
      3,
  }
);