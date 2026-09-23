import {
  getExternalReviewIntelligence,
  getExternalReviewStats,
} from './src/services/externalReviewJsonService.js';


console.log(
  '\nSTATS'
);

console.dir(
  getExternalReviewStats(),
  {
    depth: 10,
    colors: true,
  }
);


const tests = [
  'NIT Trichy',
  'National Institute of Technology Tiruchirappalli',
  'National Institute of Technology, Tiruchirappalli',

  'IIIT Vadodara - International Campus Diu',
  'IIIT Vadodara Diu',

  'IIIT Vadodara',
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
      'Institution:',
      result.institution
    );

    console.log(
      'Family:',
      result.family
    );

    console.log(
      'Evidence:',
      result.evidence
    );

    console.log(
      'Sentiment:',
      result.studentSentiment
    );

    console.log(
      'Ratings:',
      result.ratings
    );

    console.log(
      'Breakdown:',
      result.sentimentBreakdown
    );
  }
}
