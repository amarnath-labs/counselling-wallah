import {
  getExternalReviewIntelligence,
  getExternalReviewStats,
} from './src/services/externalReviewJsonService.js';


console.log(
  '\n========== STATS =========='
);

console.dir(
  getExternalReviewStats(),
  {
    depth: 10,
    colors: true,
  }
);


const names = [
  'National Institute of Technology, Tiruchirappalli',
  'NIT Trichy',

  'IIIT Vadodara - International Campus Diu',
  'IIIT Vadodara',
];


for (
  const collegeName of names
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
    !result
  ) {
    continue;
  }


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


  console.log(
    '\nPOSITIVE WRITTEN TEXT:'
  );

  console.dir(
    result
      .positiveThemes
      ?.slice(
        0,
        5
      ),
    {
      depth: 8,
      colors: true,
    }
  );


  console.log(
    '\nTHINGS TO CONSIDER:'
  );

  console.dir(
    result
      .negativeThemes
      ?.slice(
        0,
        5
      ),
    {
      depth: 8,
      colors: true,
    }
  );
}
