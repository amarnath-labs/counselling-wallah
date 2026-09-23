import {
  getExternalReviewIntelligence,
  getExternalReviewStats,
} from './src/services/externalReviewJsonService.js';


console.log(
  '\n===== STATS ====='
);

console.dir(
  getExternalReviewStats(),
  {
    depth: 5,
    colors: true,
  }
);


const tests = [
  'NIT Trichy',
  'National Institute of Technology, Tiruchirappalli',

  'IIIT Vadodara',

  'Indian Institute of Information Technology Vadodara',

  'IIIT Vadodara - International Campus Diu',

  'IIIT Vadodara Diu',

  'IIITV-ICD',
];


for (
  const collegeName of tests
) {
  const result =
    getExternalReviewIntelligence({
      collegeName,
    });


  console.log(
    '\n========================================'
  );

  console.log(
    'INPUT:',
    collegeName
  );

  console.log(
    'MATCHED:',
    Boolean(result)
  );


  if (
    result
  ) {
    console.log(
      'INSTITUTION:',
      result.institution
    );

    console.log(
      'EVIDENCE:',
      result
        ?.evidence
        ?.usableEvidence
    );

    console.log(
      'SENTIMENT:',
      result
        ?.studentSentiment
        ?.label
    );
  }
}
