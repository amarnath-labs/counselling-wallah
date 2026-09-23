import {
  applyPersonalizedV2Shadow,
} from './src/services/personalizedRecommendationV2.js';


const profile = {
  examId: 'jee-main',
  year: 2026,
  rank: 3000,
  category: 'OPEN',
  gender: 'Male',
  branches: [
    'CSE',
    'IT',
  ],
};


function aspect(
  score,
  count = 60,
  sources = 3
) {
  return {
    score,
    reviewCount: count,
    evidenceCount: count,
    sourceCount: sources,
  };
}


const fullAspects = {
  placements:
    aspect(86, 90, 4),

  faculty:
    aspect(78),

  hostel:
    aspect(68),

  infrastructure:
    aspect(82),

  academics:
    aspect(84),

  campus_life:
    aspect(80),

  administration:
    aspect(66),

  internships:
    aspect(79),

  value_for_money:
    aspect(76),

  location:
    aspect(83),
};


const incompleteAspects = {
  ...fullAspects,

  hostel:
    aspect(
      68,
      41,
      3
    ),
};


const rows = [
  {
    collegeId:
      'full-evidence',

    branch: {
      name:
        'Computer Science and Engineering',

      closingRank:
        5200,
    },

    year:
      2026,

    category:
      'OPEN',

    gender:
      'Male',

    premium: {
      score:
        84,

      componentScores: {
        branch:
          100,

        quality:
          82,

        budget:
          88,

        location:
          70,
      },
    },

    reviewIntelligenceV3: {
      score:
        79,

      aspects:
        fullAspects,
    },

    demand: {
      applicantsPerSeat:
        12,

      roundFilled:
        2,

      trendPercent:
        8,

      preferenceIntensity:
        85,
    },
  },


  {
    collegeId:
      'incomplete-evidence',

    branch: {
      name:
        'Information Technology',

      closingRank:
        9000,
    },

    year:
      2026,

    category:
      'OPEN',

    gender:
      'Male',

    premium: {
      score:
        76,

      componentScores: {
        branch:
          90,

        quality:
          72,

        budget:
          95,

        location:
          90,
      },
    },

    reviewIntelligenceV3: {
      score:
        75,

      aspects:
        incompleteAspects,
    },

    demand: {
      applicantsPerSeat:
        5,
    },
  },
];


const result =
  applyPersonalizedV2Shadow(
    rows,
    profile
  );


const [
  full,
  incomplete,
] = result;


console.log(
  '\n========================================'
);

console.log(
  'STRICT V2 REVIEW + CONFIDENCE AUDIT'
);

console.log(
  '========================================'
);


for (
  const row of result
) {
  const v2 =
    row.personalizedV2;


  console.log(
    '\nCOLLEGE:',
    row.collegeId
  );


  console.log(
    'Raw V2 score:',
    v2.score
  );


  console.log(
    'Ranking score:',
    v2.rankingScore
  );


  console.log(
    'Coverage:',
    `${v2.coverage}%`
  );


  console.log(
    'Evidence factor:',
    v2.evidenceFactor
  );


  console.log(
    'Review:',
    `${v2.reviewSentiment.readyAspects}/${v2.reviewSentiment.requiredAspects}`
  );


  console.log(
    'Review available:',
    v2.reviewSentiment.available
  );


  console.log(
    'Demand available:',
    v2.highDemand.available
  );
}


const checks = [
  [
    'All 10 review aspects required',
    full.personalizedV2
      .reviewSentiment
      .requiredAspects === 10,
  ],

  [
    '10/10 review evidence passes',
    full.personalizedV2
      .reviewSentiment
      .available === true &&
    full.personalizedV2
      .reviewSentiment
      .readyAspects === 10,
  ],

  [
    '49-or-less style evidence fails aspect gate',
    incomplete.personalizedV2
      .reviewSentiment
      .available === false &&
    incomplete.personalizedV2
      .reviewSentiment
      .readyAspects === 9,
  ],

  [
    'Full coverage ranking score equals raw score',
    full.personalizedV2
      .coverage === 100 &&
    full.personalizedV2
      .rankingScore ===
      full.personalizedV2
        .score,
  ],

  [
    'Incomplete coverage gets ranking penalty',
    incomplete.personalizedV2
      .rankingScore <
    incomplete.personalizedV2
      .score,
  ],

  [
    'Legacy score untouched',
    full.premium.score ===
      84 &&
    incomplete.premium.score ===
      76,
  ],
];


let pass =
  true;


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
    pass =
      false;
  }
}


console.log(
  '\nOVERALL:',
  pass
    ? 'PASS'
    : 'FAIL'
);


if (!pass) {
  process.exitCode =
    1;
}
