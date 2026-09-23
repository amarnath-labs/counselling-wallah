import {
  getExternalReviewIntelligence,
  getExternalReviewStats,
  getExternalReviewInstitutions,
} from './src/services/externalReviewJsonService.js';

console.log(
  '\n================ STATS ================'
);

console.dir(
  getExternalReviewStats(),
  {
    depth: 10,
    colors: true,
  }
);


console.log(
  '\n================ INSTITUTIONS ================'
);

const institutions =
  getExternalReviewInstitutions();

console.log(
  'Total:',
  institutions.length
);

for (
  const item of institutions
) {
  const text =
    JSON.stringify(
      item
    ).toLowerCase();

  if (
    text.includes('trichy') ||
    text.includes('tiruchirappalli') ||
    text.includes('vadodara') ||
    text.includes('diu')
  ) {
    console.dir(
      item,
      {
        depth: 10,
        colors: true,
      }
    );
  }
}


const tests = [
  'National Institute of Technology, Tiruchirappalli',
  'National Institute of Technology Tiruchirappalli',
  'NIT Tiruchirappalli',
  'NIT Trichy',

  'IIIT Vadodara - International Campus Diu',
  'IIIT Vadodara – International Campus Diu',
  'Indian Institute of Information Technology Vadodara International Campus Diu',
  'Indian Institute of Information Technology Vadodara - International Campus Diu',
  'IIIT Vadodara Diu',
];


console.log(
  '\n================ LOOKUP TEST ================'
);

for (
  const collegeName of tests
) {
  const result =
    getExternalReviewIntelligence({
      collegeName,
    });

  console.log(
    '\n----------------------------------------'
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
      'Institution:',
      result.institution
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
  }
}
