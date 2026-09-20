import assert from 'node:assert/strict';

import {
  FACTOR_STATUS,
  calculateHistoricalFit,
  calculateAdmissionConfidence,
  calculateBudgetScore,
  calculateMatchScore,
  calculateOverallConfidence,
  getAdmissionBucketFromFit,
  getMatchCategory,
  compareRecommendations,
} from './cwRecV1.js';


function approx(
  actual,
  expected,
  tolerance = 0.01
) {
  assert.ok(
    Math.abs(
      actual - expected
    ) <= tolerance,
    `Expected ${actual} â‰ˆ ${expected}`
  );
}


/* Exact closing rank */

{
  const result =
    calculateHistoricalFit({
      studentRank: 10000,
      closingRanks: [10000],
    });

  approx(
    result.historicalFitScore,
    60
  );

  assert.equal(
    result.bucket,
    'Target'
  );
}


/* Better rank */

{
  const result =
    calculateHistoricalFit({
      studentRank: 8000,
      closingRanks: [10000],
    });

  assert.equal(
    result.historicalFitScore,
    100
  );

  assert.equal(
    result.bucket,
    'Backup'
  );
}


/* Slightly worse rank */

{
  const result =
    calculateHistoricalFit({
      studentRank: 10250,
      closingRanks: [10000],
    });

  assert.ok(
    result.historicalFitScore > 40
  );

  assert.ok(
    result.historicalFitScore < 60
  );

  assert.equal(
    result.bucket,
    'Target'
  );
}


/* Bucket boundaries */

assert.equal(
  getAdmissionBucketFromFit(85),
  'Backup'
);

assert.equal(
  getAdmissionBucketFromFit(65),
  'Safe'
);

assert.equal(
  getAdmissionBucketFromFit(35),
  'Target'
);

assert.equal(
  getAdmissionBucketFromFit(34.9),
  'Dream'
);


/* Admission confidence */

{
  const result =
    calculateAdmissionConfidence({
      historicalRows: [
        {
          year: 2025,
          closingRank: 10000,
        },
        {
          year: 2024,
          closingRank: 10200,
        },
        {
          year: 2023,
          closingRank: 9800,
        },
      ],

      contextScore: 100,
      currentYear: 2026,
    });

  assert.ok(
    result.score >= 80
  );
}


/* Budget */

assert.equal(
  calculateBudgetScore({
    annualCost: 100000,
    annualBudget: 100000,
  }),
  100
);

approx(
  calculateBudgetScore({
    annualCost: 110000,
    annualBudget: 100000,
  }),
  90
);

approx(
  calculateBudgetScore({
    annualCost: 125000,
    annualBudget: 100000,
  }),
  70
);

approx(
  calculateBudgetScore({
    annualCost: 150000,
    annualBudget: 100000,
  }),
  30
);

assert.equal(
  calculateBudgetScore({
    annualCost: 200000,
    annualBudget: 100000,
  }),
  0
);


/* Full Match Score */

{
  const result =
    calculateMatchScore({
      admission: {
        score: 80,
        status:
          FACTOR_STATUS.AVAILABLE,
      },

      branch: {
        score: 100,
        status:
          FACTOR_STATUS.AVAILABLE,
      },

      quality: {
        score: 75,
        status:
          FACTOR_STATUS.AVAILABLE,
      },

      reviews: {
        score: 70,
        status:
          FACTOR_STATUS.AVAILABLE,
      },

      budget: {
        score: 90,
        status:
          FACTOR_STATUS.AVAILABLE,
      },

      location: {
        score: 50,
        status:
          FACTOR_STATUS.AVAILABLE,
      },
    });

  approx(
    result.score,
    81.05
  );

  assert.equal(
    result.availableWeight,
    100
  );
}


/* Missing review */

{
  const result =
    calculateMatchScore({
      admission: {
        score: 80,
        status:
          FACTOR_STATUS.AVAILABLE,
      },

      branch: {
        score: 100,
        status:
          FACTOR_STATUS.AVAILABLE,
      },

      quality: {
        score: 75,
        status:
          FACTOR_STATUS.AVAILABLE,
      },

      reviews: {
        score: null,
        status:
          FACTOR_STATUS.UNAVAILABLE,
      },

      budget: {
        score: 90,
        status:
          FACTOR_STATUS.AVAILABLE,
      },

      location: {
        score: 50,
        status:
          FACTOR_STATUS.AVAILABLE,
      },
    });

  assert.equal(
    result.availableWeight,
    90
  );

  assert.ok(
    result.score > 80
  );
}


/* Confidence states */

{
  const result =
    calculateOverallConfidence({
      admission: {
        status:
          FACTOR_STATUS.AVAILABLE,
        confidence: 90,
      },

      quality: {
        status:
          FACTOR_STATUS.AVAILABLE,
        confidence: 90,
      },

      reviews: {
        status:
          FACTOR_STATUS.UNAVAILABLE,
        confidence: 0,
      },

      budget: {
        status:
          FACTOR_STATUS.AVAILABLE,
        confidence: 80,
      },

      branch: {
        status:
          FACTOR_STATUS.AVAILABLE,
        confidence: 100,
      },

      location: {
        status:
          FACTOR_STATUS.NOT_APPLICABLE,
        confidence: null,
      },
    });

  assert.ok(
    result.score < 90
  );

  assert.equal(
    result.applicableWeight,
    95
  );
}


/* Match labels */

assert.equal(
  getMatchCategory(92),
  'Excellent Match'
);

assert.equal(
  getMatchCategory(84),
  'Great Match'
);

assert.equal(
  getMatchCategory(72),
  'Good Match'
);

assert.equal(
  getMatchCategory(60),
  'Consider'
);


/* Bucket ranking */

{
  const rows = [
    {
      college: {
        name: 'Backup College',
      },
      admission: {
        bucket: 'Backup',
      },
      matchScore: 99,
      confidenceScore: 99,
    },

    {
      college: {
        name: 'Target College',
      },
      admission: {
        bucket: 'Target',
      },
      matchScore: 75,
      confidenceScore: 80,
    },

    {
      college: {
        name: 'Safe College',
      },
      admission: {
        bucket: 'Safe',
      },
      matchScore: 90,
      confidenceScore: 90,
    },

    {
      college: {
        name: 'Dream College',
      },
      admission: {
        bucket: 'Dream',
      },
      matchScore: 100,
      confidenceScore: 100,
    },
  ];

  rows.sort(
    compareRecommendations
  );

  assert.deepEqual(
    rows.map(
      (row) =>
        row.admission.bucket
    ),
    [
      'Target',
      'Safe',
      'Backup',
      'Dream',
    ]
  );
}


console.log(
  'âœ… CW-REC-1.0 pure scoring tests passed'
);

