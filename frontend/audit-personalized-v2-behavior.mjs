import {
  applyPersonalizedV2Shadow,
} from './src/services/personalizedRecommendationV2.js';


/*
|--------------------------------------------------------------------------
| SAMPLE REALISTIC ROW AUDIT
|--------------------------------------------------------------------------
|
| This does not change production files.
|--------------------------------------------------------------------------
*/


const profile = {
  examId: 'jee-main',
  year: 2026,
  rank: 3000,
  category: 'OPEN',
  gender: 'Male',
  homeState: 'Maharashtra',
  branches: [
    'CSE',
    'IT',
    'ECE',
  ],
  budget: 1000000,
};


const rows = [
  {
    collegeId: 'college-a',

    branch: {
      name: 'Computer Science and Engineering',
      closingRank: 5200,
    },

    year: 2026,
    category: 'OPEN',
    gender: 'Male',

    premium: {
      score: 84,

      componentScores: {
        branch: 100,
        quality: 82,
        budget: 88,
        location: 70,
      },
    },

    reviewIntelligenceV3: {
      score: 78,

      aspects: {
        placements: {
          score: 84,
          reviewCount: 80,
          evidenceCount: 80,
          sourceCount: 4,
        },

        faculty: {
          score: 75,
          reviewCount: 65,
          evidenceCount: 65,
          sourceCount: 3,
        },

        hostel: {
          score: 68,
          reviewCount: 58,
          evidenceCount: 58,
          sourceCount: 3,
        },
      },
    },

    demand: {
      applicantsPerSeat: 12,
      roundFilled: 2,
      trendPercent: 8,
      preferenceIntensity: 85,
    },
  },


  {
    collegeId: 'college-b',

    branch: {
      name: 'Information Technology',
      closingRank: 9000,
    },

    year: 2026,
    category: 'OPEN',
    gender: 'Male',

    premium: {
      score: 76,

      componentScores: {
        branch: 90,
        quality: 72,
        budget: 95,
        location: 90,
      },
    },

    reviewIntelligenceV3: {
      score: 73,

      aspects: {
        placements: {
          score: 78,
          reviewCount: 22,
          evidenceCount: 22,
          sourceCount: 2,
        },

        faculty: {
          score: 70,
          reviewCount: 55,
          evidenceCount: 55,
          sourceCount: 3,
        },
      },
    },

    demand: {
      applicantsPerSeat: 5,
    },
  },
];


const enriched =
  applyPersonalizedV2Shadow(
    rows,
    profile
  );


console.log(
  '\n========================================'
);

console.log(
  'PERSONALIZED V2 BEHAVIOR AUDIT'
);

console.log(
  '========================================\n'
);


for (
  const row of enriched
) {
  const v2 =
    row.personalizedV2;


  console.log(
    'COLLEGE:',
    row.collegeId
  );


  console.log(
    'Legacy score:',
    v2.legacyScore
  );


  console.log(
    'V2 score:',
    v2.score
  );


  console.log(
    'Coverage:',
    `${v2.coverage}%`
  );


  console.log(
    'Components:',
    v2.components
  );


  console.log(
    'Review available:',
    v2.reviewSentiment.available
  );


  console.log(
    'Review aspects:',
    `${v2.reviewSentiment.readyAspects}/${v2.reviewSentiment.requiredAspects}`
  );


  console.log(
    'Review reason:',
    v2.reviewSentiment.reason
  );


  console.log(
    'Demand available:',
    v2.highDemand.available
  );


  console.log(
    'Demand factors:',
    v2.highDemand.availableFactors
  );


  console.log(
    'Demand reason:',
    v2.highDemand.reason
  );


  console.log(
    'Selectivity:',
    v2.cutoffSelectivity
  );


  console.log(
    'Shadow only:',
    v2.shadowOnly
  );


  console.log(
    '----------------------------------------'
  );
}


/*
|--------------------------------------------------------------------------
| ASSERTIONS
|--------------------------------------------------------------------------
*/


const [
  strong,
  weak,
] = enriched;


const checks = [
  [
    'V2 does not overwrite legacy premium score',
    strong.premium.score === 84 &&
    weak.premium.score === 76,
  ],

  [
    'Strong review gate passes',
    strong.personalizedV2
      .reviewSentiment
      .available === true,
  ],

  [
    'Weak review gate fails',
    weak.personalizedV2
      .reviewSentiment
      .available === false,
  ],

  [
    'Strong demand passes',
    strong.personalizedV2
      .highDemand
      .available === true,
  ],

  [
    'Weak demand fails',
    weak.personalizedV2
      .highDemand
      .available === false,
  ],

  [
    'No NaN V2 score',
    Number.isFinite(
      strong.personalizedV2.score
    ) &&
    Number.isFinite(
      weak.personalizedV2.score
    ),
  ],

  [
    'Shadow flag preserved',
    strong.personalizedV2
      .shadowOnly === true &&
    weak.personalizedV2
      .shadowOnly === true,
  ],
];


let pass = true;


console.log(
  '\nASSERTIONS\n'
);


for (
  const [
    name,
    ok,
  ]
  of checks
) {
  console.log(
    ok
      ? 'PASS'
      : 'FAIL',
    name
  );


  if (!ok) {
    pass = false;
  }
}


console.log(
  '\nOVERALL:',
  pass
    ? 'PASS'
    : 'FAIL'
);


if (!pass) {
  process.exitCode = 1;
}
