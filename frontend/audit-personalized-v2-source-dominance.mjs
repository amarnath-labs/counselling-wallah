import {
  applyPersonalizedV2Shadow,
} from './src/services/personalizedRecommendationV2.js';


const REQUIRED = [
  'placements',
  'faculty',
  'hostel',
  'infrastructure',
  'academics',
  'campus_life',
  'administration',
  'internships',
  'value_for_money',
  'location',
];


function aspect(
  {
    score = 80,
    reviews = 50,
    sources = 3,
    maxShare = 0.50,
    dominancePass = true,
  } = {}
) {
  return {
    score,

    reviewCount:
      reviews,

    effectiveReviewCount:
      reviews,

    sourceCount:
      sources,

    effectiveSourceCount:
      sources,

    maxSourceShare:
      maxShare,

    sourceDominancePass:
      dominancePass,

    sourceDistribution: [
      {
        source:
          'source-a',

        effectiveCount:
          Math.round(
            reviews *
            maxShare
          ),

        share:
          maxShare,
      },
    ],
  };
}


function aspects(
  override = {}
) {
  return Object.fromEntries(
    REQUIRED.map(
      key => [
        key,
        aspect(
          override[
            key
          ] || {}
        ),
      ]
    )
  );
}


const rows = [
  {
    collegeId:
      'balanced',

    premium: {
      score:
        80,

      componentScores: {
        branch:
          90,

        quality:
          80,

        budget:
          80,

        location:
          80,
      },
    },

    reviewIntelligenceV3: {
      score:
        82,

      aspects:
        aspects(),
    },

    demand: {
      applicantsPerSeat:
        10,

      roundFilled:
        2,
    },
  },


  {
    collegeId:
      'dominated',

    premium: {
      score:
        80,

      componentScores: {
        branch:
          90,

        quality:
          80,

        budget:
          80,

        location:
          80,
      },
    },

    reviewIntelligenceV3: {
      score:
        90,

      aspects:
        aspects({
          placements: {
            reviews:
              50,

            sources:
              3,

            maxShare:
              0.84,

            dominancePass:
              false,
          },
        }),
    },

    demand: {
      applicantsPerSeat:
        10,

      roundFilled:
        2,
    },
  },
];


const result =
  applyPersonalizedV2Shadow(
    rows,
    {
      examId:
        'jee-main',

      category:
        'OPEN',

      year:
        2026,
    }
  );


const balanced =
  result[0]
    .personalizedV2;


const dominated =
  result[1]
    .personalizedV2;


console.log(
  '\nBALANCED'
);

console.log(
  'Review available:',
  balanced
    .reviewSentiment
    .available
);

console.log(
  'Ready:',
  `${balanced.reviewSentiment.readyAspects}/${balanced.reviewSentiment.requiredAspects}`
);


console.log(
  '\nDOMINATED'
);

console.log(
  'Review available:',
  dominated
    .reviewSentiment
    .available
);

console.log(
  'Ready:',
  `${dominated.reviewSentiment.readyAspects}/${dominated.reviewSentiment.requiredAspects}`
);

console.log(
  'Placement max share:',
  dominated
    .reviewSentiment
    .aspectChecks
    .placements
    .maxSourceShare
);


const checks = [
  [
    'Balanced 10/10 passes',
    balanced
      .reviewSentiment
      .available === true &&
    balanced
      .reviewSentiment
      .readyAspects === 10,
  ],

  [
    'Dominated aspect fails',
    dominated
      .reviewSentiment
      .available === false,
  ],

  [
    'Dominated review becomes 9/10',
    dominated
      .reviewSentiment
      .readyAspects === 9,
  ],

  [
    '84% single-source share captured',
    dominated
      .reviewSentiment
      .aspectChecks
      .placements
      .maxSourceShare === 0.84,
  ],

  [
    '60% rule active',
    dominated
      .reviewSentiment
      .sourceDominanceRule ===
      'MAX_SINGLE_SOURCE_SHARE_60_PERCENT',
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
  process.exitCode =
    1;
}
