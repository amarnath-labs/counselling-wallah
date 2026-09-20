import {
  useMemo,
} from 'react';


/*
|--------------------------------------------------------------------------
| SCORE PARTS
|--------------------------------------------------------------------------
*/

const PARTS = [
  ['rank', 'Admission Fit', 45],
  ['branch', 'Branch Match', 20],
  ['quality', 'College Quality', 15],
  ['reviews', 'Review Intelligence', 10],
  ['budget', 'Budget', 7],
  ['location', 'Location', 3],
];

const CWREC_WEIGHTS = {
  rank: 45,
  branch: 20,
  quality: 15,
  reviews: 10,
  budget: 7,
  location: 3,
};


/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

const num = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null;
  }

  const number =
    Number(value);

  return Number.isFinite(
    number
  )
    ? number
    : null;
};


/*
|--------------------------------------------------------------------------
| CW-REC 1.0 HISTORICAL FIT HELPERS
|--------------------------------------------------------------------------
*/

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function median(values = []) {
  const clean = values
    .map(Number)
    .filter(Number.isFinite)
    .sort((a, b) => a - b);

  if (!clean.length) return null;

  const mid = Math.floor(clean.length / 2);

  return clean.length % 2
    ? clean[mid]
    : (clean[mid - 1] + clean[mid]) / 2;
}

function getHistoricalClosingRanks(row) {
  const sources = [
    row?.historicalCutoffs,
    row?.premium?.historicalCutoffs,
    row?.admission?.historicalCutoffs,
    row?.cutoffHistory,
  ];

  for (const source of sources) {
    if (!Array.isArray(source)) continue;

    const values = source
      .map((item) =>
        Number(
          item?.closingRank ??
          item?.closing_rank ??
          item?.closing
        )
      )
      .filter(Number.isFinite)
      .filter((value) => value > 0);

    if (values.length) {
      return values;
    }
  }

  const single = Number(
    row?.closingRank ??
    row?.closing_rank ??
    row?.cutoff?.closingRank ??
    row?.premium?.closingRank
  );

  return Number.isFinite(single) && single > 0
    ? [single]
    : [];
}

function getStudentRank(row) {
  const value = Number(
    row?.studentRank ??
    row?.profileRank ??
    row?.premium?.studentRank
  );

  return Number.isFinite(value) && value > 0
    ? value
    : null;
}

function calculateHistoricalFitScore(relativeMargin) {
  if (!Number.isFinite(relativeMargin)) {
    return null;
  }

  const m = relativeMargin;

  if (m >= 0.20) return 100;

  if (m >= 0.10) {
    return clamp(
      80 + 15 * ((m - 0.10) / 0.10)
    );
  }

  if (m >= 0) {
    return clamp(
      60 + 20 * (m / 0.10)
    );
  }

  if (m >= -0.05) {
    return clamp(
      40 + 20 * ((m + 0.05) / 0.05)
    );
  }

  return clamp(
    40 + 400 * (m + 0.05)
  );
}

function getAdmissionBucketFromFit(score) {
  if (!Number.isFinite(score)) {
    return 'Admission data pending';
  }

  if (score >= 85) return 'Backup';
  if (score >= 65) return 'Safe';
  if (score >= 35) return 'Target';

  return 'Dream';
}

function getHistoricalFitLabel(score) {
  if (!Number.isFinite(score)) {
    return 'Historical data pending';
  }

  if (score >= 85) {
    return 'Very Strong Historical Fit';
  }

  if (score >= 65) {
    return 'Strong Historical Fit';
  }

  if (score >= 35) {
    return 'Competitive Historical Fit';
  }

  return 'Difficult Historical Fit';
}

function getHistoricalFitMeta(row) {
  const existingScore = Number(
    row?.admission?.historicalFitScore ??
    row?.premium?.historicalFit?.score
  );

  if (Number.isFinite(existingScore)) {
    const score = clamp(existingScore);

    return {
      score,
      label:
        row?.premium?.historicalFit?.label ||
        getHistoricalFitLabel(score),
      bucket:
        row?.admission?.bucket ||
        getAdmissionBucketFromFit(score),
      yearsUsed:
        row?.admission?.yearsUsed ?? null,
      relativeMargin:
        row?.admission?.relativeMargin ?? null,
    };
  }

  const studentRank = getStudentRank(row);
  const closingRanks = getHistoricalClosingRanks(row);

  if (
    studentRank === null ||
    !closingRanks.length
  ) {
    return {
      score: null,
      label: 'Historical data pending',
      bucket:
        row?.bucket ||
        'Admission data pending',
      yearsUsed: closingRanks.length,
      relativeMargin: null,
    };
  }

  const medianClosingRank =
    median(closingRanks);

  if (
    medianClosingRank === null ||
    medianClosingRank <= 0
  ) {
    return {
      score: null,
      label: 'Historical data pending',
      bucket:
        row?.bucket ||
        'Admission data pending',
      yearsUsed: closingRanks.length,
      relativeMargin: null,
    };
  }

  const relativeMargin =
    (
      medianClosingRank -
      studentRank
    ) /
    medianClosingRank;

  const score =
    calculateHistoricalFitScore(
      relativeMargin
    );

  return {
    score,
    label:
      getHistoricalFitLabel(score),
    bucket:
      getAdmissionBucketFromFit(score),
    yearsUsed:
      closingRanks.length,
    relativeMargin,
    medianClosingRank,
  };
}



/*
|--------------------------------------------------------------------------
| CW-REC 1.0 ADMISSION CONFIDENCE
|--------------------------------------------------------------------------
|
| Confidence measures how trustworthy the admission evidence is.
| It is separate from Historical Fit and Match Score.
|--------------------------------------------------------------------------
*/

function getHistoricalCutoffRows(row) {
  const sources = [
    row?.historicalCutoffs,
    row?.premium?.historicalCutoffs,
    row?.admission?.historicalCutoffs,
    row?.cutoffHistory,
  ];

  for (const source of sources) {
    if (
      Array.isArray(source) &&
      source.length
    ) {
      return source;
    }
  }

  return [];
}


function getYearCoverageScore(rows = []) {
  const years =
    new Set(
      rows
        .map(
          (item) =>
            Number(
              item?.year ??
              item?.academicYear
            )
        )
        .filter(
          Number.isFinite
        )
    );

  const count =
    years.size;

  if (count >= 3) {
    return 100;
  }

  if (count === 2) {
    return 75;
  }

  if (count === 1) {
    return 50;
  }

  return 0;
}


function getCutoffStabilityScore(
  rows = []
) {
  const values =
    rows
      .map(
        (item) =>
          Number(
            item?.closingRank ??
            item?.closing_rank ??
            item?.closing
          )
      )
      .filter(
        Number.isFinite
      )
      .filter(
        (value) =>
          value > 0
      );

  if (values.length < 2) {
    return values.length === 1
      ? 50
      : 0;
  }

  const mean =
    values.reduce(
      (sum, value) =>
        sum + value,
      0
    ) / values.length;

  if (
    !Number.isFinite(mean) ||
    mean <= 0
  ) {
    return 0;
  }

  const variance =
    values.reduce(
      (sum, value) =>
        sum +
        Math.pow(
          value - mean,
          2
        ),
      0
    ) / values.length;

  const sigma =
    Math.sqrt(
      variance
    );

  const cv =
    sigma / mean;

  return clamp(
    100 *
      Math.max(
        0,
        1 -
          Math.min(
            cv,
            1
          )
      )
  );
}


function getFreshnessScore(
  rows = []
) {
  const years =
    rows
      .map(
        (item) =>
          Number(
            item?.year ??
            item?.academicYear
          )
      )
      .filter(
        Number.isFinite
      );

  if (!years.length) {
    return 0;
  }

  const latestYear =
    Math.max(...years);

  const currentYear =
    new Date().getFullYear();

  const age =
    Math.max(
      0,
      currentYear -
        latestYear
    );

  if (age === 0) {
    return 100;
  }

  if (age === 1) {
    return 90;
  }

  if (age === 2) {
    return 75;
  }

  if (age === 3) {
    return 55;
  }

  return 30;
}


function getExactContextScore(row) {
  const explicit =
    num(
      row?.admission
        ?.contextMatchScore ??
      row?.premium
        ?.admissionConfidence
        ?.contextScore
    );

  if (explicit !== null) {
    return clamp(
      explicit
    );
  }

  const exact =
    row?.admission
      ?.exactContext ??
    row?.premium
      ?.admissionConfidence
      ?.exactContext ??
    null;

  if (exact === true) {
    return 100;
  }

  if (exact === false) {
    return 40;
  }

  /*
   * Backend has not explicitly confirmed
   * the complete category/quota/gender/
   * seat-pool context yet.
   */
  return 60;
}


function getConfidenceLabel(score) {
  if (!Number.isFinite(score)) {
    return 'Limited Confidence';
  }

  if (score >= 85) {
    return 'High Confidence';
  }

  if (score >= 65) {
    return 'Moderate Confidence';
  }

  return 'Limited Confidence';
}


function getAdmissionConfidenceMeta(row) {
  const existing =
    num(
      row?.admission
        ?.confidence ??
      row?.premium
        ?.admissionConfidence
        ?.score
    );

  if (existing !== null) {
    const score =
      clamp(existing);

    return {
      score,
      label:
        getConfidenceLabel(
          score
        ),
      source:
        'backend',
    };
  }

  const cutoffRows =
    getHistoricalCutoffRows(
      row
    );

  const yearCoverage =
    getYearCoverageScore(
      cutoffRows
    );

  const stability =
    getCutoffStabilityScore(
      cutoffRows
    );

  const freshness =
    getFreshnessScore(
      cutoffRows
    );

  const exactContext =
    getExactContextScore(
      row
    );

  const score =
    clamp(
      0.30 * yearCoverage +
      0.25 * stability +
      0.20 * freshness +
      0.25 * exactContext
    );

  return {
    score,
    label:
      getConfidenceLabel(
        score
      ),
    yearCoverage,
    stability,
    freshness,
    exactContext,
    source:
      'frontend-derived',
  };
}



/*
|--------------------------------------------------------------------------
| CW-REC 1.0 OVERALL CONFIDENCE
|--------------------------------------------------------------------------
|
| Match Score and Confidence Score remain separate.
|--------------------------------------------------------------------------
*/

const OVERALL_CONFIDENCE_WEIGHTS = {
  admission: 40,
  quality: 25,
  reviews: 15,
  budget: 10,
  branch: 5,
  location: 5,
};





function normalizeStatus(value) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null;
  }

  const normalized =
    String(value)
      .trim()
      .toUpperCase()
      .replace(
        /[\s-]+/g,
        '_'
      );

  if (
    normalized ===
      'NOT_APPLICABLE' ||
    normalized === 'NA' ||
    normalized === 'N_A'
  ) {
    return 'NOT_APPLICABLE';
  }

  if (
    normalized ===
      'UNAVAILABLE' ||
    normalized ===
      'MISSING' ||
    normalized ===
      'PENDING' ||
    normalized ===
      'DATA_PENDING'
  ) {
    return 'UNAVAILABLE';
  }

  if (
    normalized ===
      'AVAILABLE' ||
    normalized ===
      'VERIFIED' ||
    normalized ===
      'READY'
  ) {
    return 'AVAILABLE';
  }

  return null;
}


function getFirstConfidence(
  ...values
) {
  for (const value of values) {
    const number =
      num(value);

    if (number !== null) {
      return clamp(number);
    }
  }

  return null;
}


function getQualityConfidenceMeta(
  row
) {
  const status =
    normalizeStatus(
      row?.quality?.status ??
      row?.collegeQuality?.status
    );

  if (
    status ===
    'NOT_APPLICABLE'
  ) {
    return {
      status,
      confidence: null,
    };
  }

  const confidence =
    getFirstConfidence(
      row?.quality?.confidence,
      row?.quality
        ?.confidenceScore,
      row?.collegeQuality
        ?.confidence,
      row?.collegeQuality
        ?.confidenceScore
    );

  if (confidence !== null) {
    return {
      status: 'AVAILABLE',
      confidence,
    };
  }

  const score =
    num(
      row?.quality?.score ??
      row?.collegeQuality?.score ??
      row?.premium
        ?.breakdown
        ?.quality
    );

  return {
    status:
      score !== null
        ? 'AVAILABLE'
        : 'UNAVAILABLE',

    confidence: 0,
  };
}


function getReviewConfidenceMeta(
  row
) {
  const review =
    row?.reviewIntelligenceV3 ??
    row?.reviews ??
    null;

  const status =
    normalizeStatus(
      review?.status
    );

  if (
    status ===
    'NOT_APPLICABLE'
  ) {
    return {
      status,
      confidence: null,
    };
  }

  const confidence =
    getFirstConfidence(
      review?.confidence,
      review?.confidenceScore,
      review?.reviewConfidence
    );

  if (confidence !== null) {
    return {
      status: 'AVAILABLE',
      confidence,
    };
  }

  const score =
    num(
      review?.score ??
      row?.premium
        ?.breakdown
        ?.reviews
    );

  return {
    status:
      score !== null
        ? 'AVAILABLE'
        : 'UNAVAILABLE',

    confidence: 0,
  };
}


function getBudgetConfidenceMeta(
  row
) {
  const budget =
    row?.budget ??
    row?.budgetFit ??
    null;

  const status =
    normalizeStatus(
      budget?.status
    );

  if (
    status ===
    'NOT_APPLICABLE'
  ) {
    return {
      status,
      confidence: null,
    };
  }

  const confidence =
    getFirstConfidence(
      budget?.confidence,
      budget?.confidenceScore
    );

  if (confidence !== null) {
    return {
      status: 'AVAILABLE',
      confidence,
    };
  }

  const score =
    num(
      budget?.score ??
      row?.premium
        ?.breakdown
        ?.budget
    );

  return {
    status:
      score !== null
        ? 'AVAILABLE'
        : 'UNAVAILABLE',

    confidence: 0,
  };
}


function getBranchConfidenceMeta(
  row
) {
  const branchFit =
    row?.branchFit ??
    row?.branch_fit ??
    null;

  const status =
    normalizeStatus(
      branchFit?.status
    );

  if (
    status ===
    'NOT_APPLICABLE'
  ) {
    return {
      status,
      confidence: null,
    };
  }

  const confidence =
    getFirstConfidence(
      branchFit?.confidence,
      branchFit?.confidenceScore,
      branchFit
        ?.mappingConfidence
    );

  if (confidence !== null) {
    return {
      status: 'AVAILABLE',
      confidence,
    };
  }

  const structuredScore =
    num(
      branchFit?.score
    );

  if (structuredScore !== null) {
    return {
      status: 'AVAILABLE',
      confidence: 100,
    };
  }

  const legacy =
    num(
      row?.premium
        ?.breakdown
        ?.branch
    );

  return {
    status:
      legacy !== null
        ? 'AVAILABLE'
        : 'UNAVAILABLE',

    confidence: 0,
  };
}


function getLocationConfidenceMeta(
  row
) {
  const location =
    row?.locationFit ??
    row?.location ??
    null;

  const mode =
    String(
      location?.mode ??
      row?.locationMode ??
      ''
    )
      .trim()
      .toUpperCase();

  const status =
    normalizeStatus(
      location?.status
    );

  if (
    status ===
      'NOT_APPLICABLE' ||
    mode === 'NONE'
  ) {
    return {
      status:
        'NOT_APPLICABLE',

      confidence: null,
    };
  }

  const confidence =
    getFirstConfidence(
      location?.confidence,
      location?.confidenceScore
    );

  if (confidence !== null) {
    return {
      status: 'AVAILABLE',
      confidence,
    };
  }

  const structuredScore =
    num(
      location?.score
    );

  if (structuredScore !== null) {
    return {
      status: 'AVAILABLE',
      confidence: 100,
    };
  }

  const legacy =
    num(
      row?.premium
        ?.breakdown
        ?.location
    );

  return {
    status:
      legacy !== null
        ? 'AVAILABLE'
        : 'UNAVAILABLE',

    confidence: 0,
  };
}


function getOverallConfidenceMeta(
  row
) {
  const backendConfidence =
    getFirstConfidence(
      row?.confidenceScore,
      row?.overallConfidence
        ?.score,
      row?.premium
        ?.overallConfidence
        ?.score
    );

  if (
    backendConfidence !== null
  ) {
    return {
      score:
        backendConfidence,

      label:
        getConfidenceLabel(
          backendConfidence
        ),

      source:
        'backend',
    };
  }

  const admission =
    getAdmissionConfidenceMeta(
      row
    );

  const factors = {
    admission: {
      status: 'AVAILABLE',
      confidence:
        admission.score,
    },

    quality:
      getQualityConfidenceMeta(
        row
      ),

    reviews:
      getReviewConfidenceMeta(
        row
      ),

    budget:
      getBudgetConfidenceMeta(
        row
      ),

    branch:
      getBranchConfidenceMeta(
        row
      ),

    location:
      getLocationConfidenceMeta(
        row
      ),
  };

  let weightedTotal = 0;
  let applicableWeight = 0;

  Object.entries(
    OVERALL_CONFIDENCE_WEIGHTS
  ).forEach(
    ([key, weight]) => {
      const factor =
        factors[key];

      if (
        factor?.status ===
        'NOT_APPLICABLE'
      ) {
        return;
      }

      applicableWeight +=
        weight;

      const confidence =
        factor?.status ===
        'AVAILABLE'
          ? (
              num(
                factor.confidence
              ) ?? 0
            )
          : 0;

      weightedTotal +=
        weight *
        clamp(confidence);
    }
  );

  const score =
    applicableWeight > 0
      ? clamp(
          weightedTotal /
          applicableWeight
        )
      : 0;

  return {
    score,

    label:
      getConfidenceLabel(
        score
      ),

    factors,

    source:
      'frontend-derived',
  };
}


/*
|--------------------------------------------------------------------------
| CW-REC 1.0 MATCH SCORE NORMALIZATION
|--------------------------------------------------------------------------
|
| Converts raw 0-100 scores into weighted score contributions.
| Legacy breakdown values are safely normalized from their old maxima.
| Missing data remains null and is excluded from the score denominator.
|--------------------------------------------------------------------------
*/

function toComponent(score, weight) {
  const number = num(score);

  if (number === null) {
    return null;
  }

  return clamp(number) * (weight / 100);
}


function normalizeLegacyComponent(
  value,
  oldMax,
  newWeight
) {
  const number = num(value);

  if (
    number === null ||
    !Number.isFinite(oldMax) ||
    oldMax <= 0
  ) {
    return null;
  }

  const normalizedScore =
    clamp(
      (number / oldMax) * 100
    );

  return toComponent(
    normalizedScore,
    newWeight
  );
}


function getNormalizedBreakdown(row) {
  const premium =
    row?.premium || {};

  const oldBreakdown =
    premium?.breakdown || {};

  const historicalFit =
    getHistoricalFitMeta(row);

  const admission =
    historicalFit.score !== null
      ? toComponent(
          historicalFit.score,
          CWREC_WEIGHTS.rank
        )
      : normalizeLegacyComponent(
          oldBreakdown.rank,
          50,
          CWREC_WEIGHTS.rank
        );

  const branchScore =
    num(
      row?.branchFit?.score ??
      row?.branch_fit?.score
    );

  const branch =
    branchScore !== null
      ? toComponent(
          branchScore,
          CWREC_WEIGHTS.branch
        )
      : normalizeLegacyComponent(
          oldBreakdown.branch,
          15,
          CWREC_WEIGHTS.branch
        );

  const qualityScore =
    num(
      row?.quality?.score ??
      row?.collegeQuality?.score
    );

  const quality =
    qualityScore !== null
      ? toComponent(
          qualityScore,
          CWREC_WEIGHTS.quality
        )
      : normalizeLegacyComponent(
          oldBreakdown.quality,
          15,
          CWREC_WEIGHTS.quality
        );

  const reviewScore =
    num(
      row?.reviewIntelligenceV3?.score
    );

  const reviews =
    reviewScore !== null
      ? toComponent(
          reviewScore,
          CWREC_WEIGHTS.reviews
        )
      : normalizeLegacyComponent(
          oldBreakdown.reviews,
          10,
          CWREC_WEIGHTS.reviews
        );

  const budgetScore =
    num(
      row?.budget?.score ??
      row?.budgetFit?.score
    );

  const budget =
    budgetScore !== null
      ? toComponent(
          budgetScore,
          CWREC_WEIGHTS.budget
        )
      : normalizeLegacyComponent(
          oldBreakdown.budget,
          7,
          CWREC_WEIGHTS.budget
        );

  const locationScore =
    num(
      row?.locationFit?.score ??
      row?.location?.score
    );

  const location =
    locationScore !== null
      ? toComponent(
          locationScore,
          CWREC_WEIGHTS.location
        )
      : normalizeLegacyComponent(
          oldBreakdown.location,
          3,
          CWREC_WEIGHTS.location
        );

  return {
    rank: admission,
    branch,
    quality,
    reviews,
    budget,
    location,
  };
}


function calculateMatchScore(
  breakdown
) {
  const entries = [
    ['rank', CWREC_WEIGHTS.rank],
    ['branch', CWREC_WEIGHTS.branch],
    ['quality', CWREC_WEIGHTS.quality],
    ['reviews', CWREC_WEIGHTS.reviews],
    ['budget', CWREC_WEIGHTS.budget],
    ['location', CWREC_WEIGHTS.location],
  ];

  let weightedTotal = 0;
  let availableWeight = 0;

  for (const [key, weight] of entries) {
    const component =
      num(
        breakdown?.[key]
      );

    if (component === null) {
      continue;
    }

    weightedTotal +=
      component;

    availableWeight +=
      weight;
  }

  if (availableWeight <= 0) {
    return null;
  }

  return clamp(
    (weightedTotal / availableWeight) *
      100
  );
}


/*
|--------------------------------------------------------------------------
| FINAL PREMIUM RANKING ARCHITECTURE
|--------------------------------------------------------------------------
|
| Score and confidence are intentionally separate.
|
| Missing data remains null.
| We do not assign artificial fallback scores.
|--------------------------------------------------------------------------
*/

const PREMIUM_WEIGHTS = {
  ...CWREC_WEIGHTS,
};


function getEffectiveReviewComponent(
  row
) {
  const v3Component =
    num(
      row
        ?.reviewIntelligenceV3
        ?.component
    );

  if (
    v3Component !== null
  ) {
    return v3Component;
  }

  return num(
    row
      ?.premium
      ?.breakdown
      ?.reviews
  );
}


function getPremiumRankingMeta(
  row
) {
  const premium =
    row?.premium || {};

  const historicalFit =
    getHistoricalFitMeta(row);

  const breakdown =
    getNormalizedBreakdown(row);

  const rank =
    num(
      breakdown.rank
    );

  const branch =
    num(
      breakdown.branch
    );

  const quality =
    num(
      breakdown.quality
    );

  const reviews =
    num(
      breakdown.reviews
    );

  const budget =
    num(
      breakdown.budget
    );

  const location =
    num(
      breakdown.location
    );

  const calculatedScore =
    calculateMatchScore(
      breakdown
    );

  const score =
    calculatedScore ??
    num(
      premium?.score
    ) ??
    num(
      premium?.finalScore
    ) ??
    -1;


  /*
  |--------------------------------------------------------------------------
  | DATA COVERAGE
  |--------------------------------------------------------------------------
  |
  | Coverage is the total intended model weight for which real data exists.
  |
  | Example:
  | rank + branch + location
  | = 45 + 20 + 3
  | = 68% coverage
  |--------------------------------------------------------------------------
  */

  let coverage = 0;

  if (
    rank !== null
  ) {
    coverage +=
      PREMIUM_WEIGHTS.rank;
  }

  if (
    branch !== null
  ) {
    coverage +=
      PREMIUM_WEIGHTS.branch;
  }

  if (
    quality !== null
  ) {
    coverage +=
      PREMIUM_WEIGHTS.quality;
  }

  if (
    reviews !== null
  ) {
    coverage +=
      PREMIUM_WEIGHTS.reviews;
  }

  if (
    budget !== null
  ) {
    coverage +=
      PREMIUM_WEIGHTS.budget;
  }

  if (
    location !== null
  ) {
    coverage +=
      PREMIUM_WEIGHTS.location;
  }


  /*
  |--------------------------------------------------------------------------
  | CORE DATA GATE
  |--------------------------------------------------------------------------
  |
  | High-confidence premium recommendation requires:
  |
  | 1. Admission Fit
  | 2. Branch Match
  | 3. College Quality
  |--------------------------------------------------------------------------
  */

  const missingCoreFactors = [];

  if (
    rank === null
  ) {
    missingCoreFactors.push(
      'Admission Fit'
    );
  }

  if (
    branch === null
  ) {
    missingCoreFactors.push(
      'Branch Match'
    );
  }

  if (
    quality === null
  ) {
    missingCoreFactors.push(
      'College Quality'
    );
  }

  const coreComplete =
    missingCoreFactors.length === 0;


  return {
    rank,
    branch,
    quality,
    reviews,
    budget,
    location,

    score,

    coverage,

    coreComplete,

    missingCoreFactors,

    branchPriority:
      branch ?? -1,
  };
}


/*
|--------------------------------------------------------------------------
| FINAL PREMIUM CATEGORY
|--------------------------------------------------------------------------
|
| A high normalized score alone is not enough for "Excellent Match".
|--------------------------------------------------------------------------
*/

function getFinalPremiumCategory(
  row
) {
  const meta =
    getPremiumRankingMeta(
      row
    );

  const score =
    meta.score;

  if (score < 0) {
    return {
      key: 'pending',
      label: 'Data Pending',
    };
  }

  if (score >= 90) {
    return {
      key: 'excellent',
      label: 'Excellent Match',
    };
  }

  if (score >= 80) {
    return {
      key: 'great',
      label: 'Great Match',
    };
  }

  if (score >= 70) {
    return {
      key: 'good',
      label: 'Good Match',
    };
  }

  return {
    key: 'consider',
    label: 'Consider',
  };
}


/*
|--------------------------------------------------------------------------
| FINAL CW-REC 1.0 RANKING COMPARATOR
|--------------------------------------------------------------------------
|
| Final order:
|
| 1. Admission Bucket: Target -> Safe -> Backup -> Dream
| 2. Match Score
| 3. Overall Confidence
| 4. College Quality
| 5. Review Intelligence
| 6. Data Coverage
| 7. Branch Match
| 8. Budget
| 9. Location
| 10. Stable college/branch tie-breaker
|--------------------------------------------------------------------------
*/

function getBucketPriority(row) {
  const historicalFit =
    getHistoricalFitMeta(row);

  const bucket =
    String(
      historicalFit?.bucket ??
      row?.admission?.bucket ??
      row?.premium
        ?.admissionBucket
        ?.label ??
      row?.premium
        ?.admissionBucket ??
      row?.bucket ??
      ''
    )
      .trim()
      .toLowerCase();

  const priority = {
    target: 0,
    safe: 1,
    backup: 2,
    dream: 3,
  };

  return (
    priority[bucket] ??
    4
  );
}


function comparePremiumRows(
  a,
  b
) {
  const bucketA =
    getBucketPriority(a);

  const bucketB =
    getBucketPriority(b);

  /*
  |--------------------------------------------------------------------------
  | 1. ADMISSION BUCKET
  |--------------------------------------------------------------------------
  |
  | Final recommendation ordering:
  |
  | Target -> Safe -> Backup -> Dream
  |
  | This keeps realistic, competitive options at the top instead of allowing
  | very easy backups or unrealistic dreams to dominate purely by score.
  |--------------------------------------------------------------------------
  */

  if (
    bucketA !==
    bucketB
  ) {
    return (
      bucketA -
      bucketB
    );
  }


  const A =
    getPremiumRankingMeta(
      a
    );

  const B =
    getPremiumRankingMeta(
      b
    );


  /*
  |--------------------------------------------------------------------------
  | 2. MATCH SCORE
  |--------------------------------------------------------------------------
  */

  if (
    B.score !==
    A.score
  ) {
    return (
      B.score -
      A.score
    );
  }


  /*
  |--------------------------------------------------------------------------
  | 3. OVERALL CONFIDENCE
  |--------------------------------------------------------------------------
  */

  const confidenceA =
    getOverallConfidenceMeta(
      a
    )?.score ?? -1;

  const confidenceB =
    getOverallConfidenceMeta(
      b
    )?.score ?? -1;

  if (
    confidenceB !==
    confidenceA
  ) {
    return (
      confidenceB -
      confidenceA
    );
  }


  /*
  |--------------------------------------------------------------------------
  | 4. COLLEGE QUALITY
  |--------------------------------------------------------------------------
  */

  const qualityA =
    A.quality ?? -1;

  const qualityB =
    B.quality ?? -1;

  if (
    qualityB !==
    qualityA
  ) {
    return (
      qualityB -
      qualityA
    );
  }


  /*
  |--------------------------------------------------------------------------
  | 5. REVIEW INTELLIGENCE
  |--------------------------------------------------------------------------
  */

  const reviewA =
    A.reviews ?? -1;

  const reviewB =
    B.reviews ?? -1;

  if (
    reviewB !==
    reviewA
  ) {
    return (
      reviewB -
      reviewA
    );
  }


  /*
  |--------------------------------------------------------------------------
  | 6. DATA COVERAGE
  |--------------------------------------------------------------------------
  */

  if (
    B.coverage !==
    A.coverage
  ) {
    return (
      B.coverage -
      A.coverage
    );
  }


  /*
  |--------------------------------------------------------------------------
  | 7. BRANCH MATCH
  |--------------------------------------------------------------------------
  */

  const branchA =
    A.branch ?? -1;

  const branchB =
    B.branch ?? -1;

  if (
    branchB !==
    branchA
  ) {
    return (
      branchB -
      branchA
    );
  }


  /*
  |--------------------------------------------------------------------------
  | 8. BUDGET
  |--------------------------------------------------------------------------
  */

  const budgetA =
    A.budget ?? -1;

  const budgetB =
    B.budget ?? -1;

  if (
    budgetB !==
    budgetA
  ) {
    return (
      budgetB -
      budgetA
    );
  }


  /*
  |--------------------------------------------------------------------------
  | 9. LOCATION
  |--------------------------------------------------------------------------
  */

  const locationA =
    A.location ?? -1;

  const locationB =
    B.location ?? -1;

  if (
    locationB !==
    locationA
  ) {
    return (
      locationB -
      locationA
    );
  }


  /*
  |--------------------------------------------------------------------------
  | 10. STABLE DETERMINISTIC TIE-BREAKER
  |--------------------------------------------------------------------------
  */

  const collegeA =
    String(
      a?.college?.name ??
      a?.college_name ??
      ''
    );

  const collegeB =
    String(
      b?.college?.name ??
      b?.college_name ??
      ''
    );

  const collegeCompare =
    collegeA.localeCompare(
      collegeB,
      'en',
      {
        sensitivity: 'base',
      }
    );

  if (
    collegeCompare !== 0
  ) {
    return collegeCompare;
  }

  const branchNameA =
    String(
      a?.branch?.name ??
      a?.branch_name ??
      ''
    );

  const branchNameB =
    String(
      b?.branch?.name ??
      b?.branch_name ??
      ''
    );

  return branchNameA.localeCompare(
    branchNameB,
    'en',
    {
      sensitivity: 'base',
    }
  );
}


/*
|--------------------------------------------------------------------------
| CW-REC 1.0 DETERMINISTIC EXPLANATION ENGINE
|--------------------------------------------------------------------------
|
| Explanations are generated only from scores/statuses that are actually
| present in the recommendation row. Missing evidence is never converted
| into a positive or negative factual claim.
|--------------------------------------------------------------------------
*/

function componentToRawScore(
  component,
  weight
) {
  const value =
    num(component);

  if (
    value === null ||
    !Number.isFinite(weight) ||
    weight <= 0
  ) {
    return null;
  }

  return clamp(
    (value / weight) * 100
  );
}


function getDeterministicReasons(row) {
  const historicalFit =
    getHistoricalFitMeta(row);

  const ranking =
    getPremiumRankingMeta(row);

  const overallConfidence =
    getOverallConfidenceMeta(row);

  const branchScore =
    componentToRawScore(
      ranking.branch,
      CWREC_WEIGHTS.branch
    );

  const qualityScore =
    componentToRawScore(
      ranking.quality,
      CWREC_WEIGHTS.quality
    );

  const reviewScore =
    componentToRawScore(
      ranking.reviews,
      CWREC_WEIGHTS.reviews
    );

  const budgetScore =
    componentToRawScore(
      ranking.budget,
      CWREC_WEIGHTS.budget
    );

  const locationScore =
    componentToRawScore(
      ranking.location,
      CWREC_WEIGHTS.location
    );

  const strong = [];
  const weak = [];

  /*
  |--------------------------------------------------------------------------
  | ADMISSION FIT
  |--------------------------------------------------------------------------
  */

  if (
    historicalFit.score !== null
  ) {
    if (
      historicalFit.score >= 85
    ) {
      strong.push({
        code:
          'ADMISSION_VERY_STRONG',

        text:
          `Historical admission fit is very strong (${Math.round(
            historicalFit.score
          )}/100).`,
      });
    } else if (
      historicalFit.score >= 65
    ) {
      strong.push({
        code:
          'ADMISSION_STRONG',

        text:
          `Historical admission fit is strong (${Math.round(
            historicalFit.score
          )}/100).`,
      });
    } else if (
      historicalFit.score < 35
    ) {
      weak.push({
        code:
          'ADMISSION_DIFFICULT',

        text:
          `Historical admission fit is difficult (${Math.round(
            historicalFit.score
          )}/100).`,
      });
    } else {
      weak.push({
        code:
          'ADMISSION_COMPETITIVE',

        text:
          `Historical admission fit is competitive (${Math.round(
            historicalFit.score
          )}/100).`,
      });
    }
  } else {
    weak.push({
      code:
        'ADMISSION_DATA_UNAVAILABLE',

      text:
        'Historical admission-fit evidence is unavailable.',
    });
  }


  /*
  |--------------------------------------------------------------------------
  | BRANCH MATCH
  |--------------------------------------------------------------------------
  */

  if (branchScore !== null) {
    if (branchScore >= 85) {
      strong.push({
        code:
          'BRANCH_HIGH',

        text:
          `Branch match is strong (${Math.round(
            branchScore
          )}/100).`,
      });
    } else if (branchScore < 60) {
      weak.push({
        code:
          'BRANCH_LOW',

        text:
          `Branch match is relatively low (${Math.round(
            branchScore
          )}/100).`,
      });
    }
  } else {
    weak.push({
      code:
        'BRANCH_DATA_UNAVAILABLE',

      text:
        'Branch-match evidence is unavailable.',
    });
  }


  /*
  |--------------------------------------------------------------------------
  | COLLEGE QUALITY
  |--------------------------------------------------------------------------
  */

  if (qualityScore !== null) {
    if (qualityScore >= 75) {
      strong.push({
        code:
          'QUALITY_HIGH',

        text:
          `College-quality score is strong (${Math.round(
            qualityScore
          )}/100).`,
      });
    } else if (qualityScore < 55) {
      weak.push({
        code:
          'QUALITY_LOW',

        text:
          `College-quality score is comparatively low (${Math.round(
            qualityScore
          )}/100).`,
      });
    }
  } else {
    weak.push({
      code:
        'QUALITY_DATA_UNAVAILABLE',

      text:
        'Verified college-quality data is unavailable.',
    });
  }


  /*
  |--------------------------------------------------------------------------
  | REVIEW INTELLIGENCE
  |--------------------------------------------------------------------------
  */

  if (reviewScore !== null) {
    if (reviewScore >= 70) {
      strong.push({
        code:
          'REVIEWS_POSITIVE',

        text:
          `Review-intelligence score is positive (${Math.round(
            reviewScore
          )}/100).`,
      });
    } else if (reviewScore < 50) {
      weak.push({
        code:
          'REVIEWS_WEAK',

        text:
          `Review-intelligence score is weak (${Math.round(
            reviewScore
          )}/100).`,
      });
    }
  } else {
    weak.push({
      code:
        'REVIEWS_UNAVAILABLE',

      text:
        'Verified review intelligence is unavailable.',
    });
  }


  /*
  |--------------------------------------------------------------------------
  | BUDGET
  |--------------------------------------------------------------------------
  */

  if (budgetScore !== null) {
    if (budgetScore >= 75) {
      strong.push({
        code:
          'BUDGET_GOOD',

        text:
          `Budget fit is strong (${Math.round(
            budgetScore
          )}/100).`,
      });
    } else if (budgetScore < 50) {
      weak.push({
        code:
          'BUDGET_LOW',

        text:
          `Budget fit is low (${Math.round(
            budgetScore
          )}/100).`,
      });
    }
  } else {
    weak.push({
      code:
        'BUDGET_UNAVAILABLE',

      text:
        'Verified fee or budget-fit data is unavailable.',
    });
  }


  /*
  |--------------------------------------------------------------------------
  | LOCATION
  |--------------------------------------------------------------------------
  */

  const locationMeta =
    getLocationConfidenceMeta(row);

  if (
    locationMeta.status !==
    'NOT_APPLICABLE'
  ) {
    if (locationScore !== null) {
      if (locationScore >= 75) {
        strong.push({
          code:
            'LOCATION_GOOD',

          text:
            `Location fit is strong (${Math.round(
              locationScore
            )}/100).`,
        });
      } else if (
        locationScore < 40
      ) {
        weak.push({
          code:
            'LOCATION_LOW',

          text:
            `Location fit is low (${Math.round(
              locationScore
            )}/100).`,
        });
      }
    } else {
      weak.push({
        code:
          'LOCATION_UNAVAILABLE',

        text:
          'Location-fit evidence is unavailable.',
      });
    }
  }


  /*
  |--------------------------------------------------------------------------
  | EVIDENCE CONFIDENCE / COVERAGE
  |--------------------------------------------------------------------------
  */

  if (
    overallConfidence.score >= 85
  ) {
    strong.push({
      code:
        'CONFIDENCE_HIGH',

      text:
        `Evidence confidence is high (${Math.round(
          overallConfidence.score
        )}/100).`,
    });
  } else if (
    overallConfidence.score < 65
  ) {
    weak.push({
      code:
        'CONFIDENCE_LIMITED',

      text:
        `Evidence confidence is limited (${Math.round(
          overallConfidence.score
        )}/100).`,
    });
  }

  if (
    ranking.coverage >= 80
  ) {
    strong.push({
      code:
        'COVERAGE_HIGH',

      text:
        `Scoring-data coverage is ${Math.round(
          ranking.coverage
        )}%.`,
    });
  } else if (
    ranking.coverage < 60
  ) {
    weak.push({
      code:
        'COVERAGE_LOW',

      text:
        `Only ${Math.round(
          ranking.coverage
        )}% of scoring weight currently has usable data.`,
    });
  }

  /*
  |--------------------------------------------------------------------------
  | Keep UI concise and deterministic.
  |--------------------------------------------------------------------------
  */

  return {
    strong:
      strong.slice(0, 4),

    weak:
      weak.slice(0, 4),

    allCodes: [
      ...strong,
      ...weak,
    ].map(
      (item) =>
        item.code
    ),
  };
}


function formatNumber(
  value,
  digits = 1
) {
  const number =
    num(value);

  if (number === null) {
    return null;
  }

  return Number(
    number.toFixed(
      digits
    )
  );
}


function humanizeAspect(
  value
) {
  if (!value) {
    return '';
  }

  return String(value)
    .replace(
      /_/g,
      ' '
    )
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
}


function formatDate(
  value
) {
  if (!value) {
    return null;
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return date.toLocaleDateString(
    'en-IN',
    {
      year: 'numeric',
      month: 'short',
    }
  );
}


function getReviewV3(
  row
) {
  return (
    row?.reviewIntelligenceV3 ??
    null
  );
}


/*
|--------------------------------------------------------------------------
| EVIDENCE COLLECTION
|--------------------------------------------------------------------------
|
| Actual source-backed sentences only.
|--------------------------------------------------------------------------
*/

function collectReviewEvidence(
  reviewV3
) {
  if (
    !reviewV3?.aspects ||
    typeof reviewV3.aspects !==
      'object'
  ) {
    return [];
  }

  const result = [];

  const sentimentFields = [
    [
      'representativePositiveSentences',
      'positive',
    ],
    [
      'representativeNegativeSentences',
      'negative',
    ],
    [
      'representativeMixedSentences',
      'mixed',
    ],
    [
      'representativeNeutralSentences',
      'neutral',
    ],
  ];

  Object.entries(
    reviewV3.aspects
  ).forEach(
    ([
      aspect,
      aspectData,
    ]) => {
      sentimentFields.forEach(
        ([
          field,
          fallbackSentiment,
        ]) => {
          const evidence =
            Array.isArray(
              aspectData?.[field]
            )
              ? aspectData[field]
              : [];

          evidence.forEach(
            (item) => {
              if (
                !item?.text
              ) {
                return;
              }

              result.push({
                ...item,

                aspect,

                sentiment:
                  item.sentiment ||
                  fallbackSentiment,
              });
            }
          );
        }
      );
    }
  );


  /*
  |--------------------------------------------------------------------------
  | Prevent same review sentence appearing repeatedly.
  |--------------------------------------------------------------------------
  */

  const seen =
    new Set();

  return result.filter(
    (item) => {
      const key =
        `${item.reviewItemId || ''}::` +
        `${String(
          item.text
        )
          .trim()
          .toLowerCase()}`;

      if (
        seen.has(key)
      ) {
        return false;
      }

      seen.add(key);

      return true;
    }
  );
}


/*
|--------------------------------------------------------------------------
| SCORE ROW
|--------------------------------------------------------------------------
*/

function ScoreRow({
  label,
  value,
  max,
}) {
  const number =
    num(value);

  const pct =
    number === null
      ? 0
      : Math.max(
          0,
          Math.min(
            100,
            (number / max) *
              100
          )
        );

  return (
    <div className="rec-score-row">
      <div className="rec-score-row__top">
        <span>
          {label}
        </span>

        <strong
          className={
            number === null
              ? 'is-pending'
              : ''
          }
        >
          {number === null
            ? 'Data pending'
            : `${formatNumber(
                number,
                1
              )}/${max}`}
        </strong>
      </div>

      <div className="rec-score-track">
        <div
          className="rec-score-fill"
          style={{
            width:
              `${pct}%`,
          }}
        />
      </div>
    </div>
  );
}


/*
|--------------------------------------------------------------------------
| LOCKED RECOMMENDATION
|--------------------------------------------------------------------------
*/

function LockedRecommendation({
  isLoggedIn,
  onUnlock,
  onLogin,
}) {
  return (
    <section className="rec-locked">
      <div className="rec-locked__badge">
        PERSONALIZED RECOMMENDATION
      </div>

      <div className="rec-locked__icon">
        🔒
      </div>

      <h2>
        Unlock Your Personalized
        Recommendation
      </h2>

      <p>
        Get ranked college
        suggestions using admission
        fit, branch preference,
        college quality, review
        intelligence, budget and
        location.
      </p>

      <div className="rec-locked__grid">
        <div>
          <strong>
            {CWREC_WEIGHTS.rank}%
          </strong>

          <span>
            Admission Fit
          </span>
        </div>

        <div>
          <strong>
            {CWREC_WEIGHTS.branch}%
          </strong>

          <span>
            Branch Match
          </span>
        </div>

        <div>
          <strong>
            {CWREC_WEIGHTS.quality}%
          </strong>

          <span>
            College Quality
          </span>
        </div>

        <div>
          <strong>
            {CWREC_WEIGHTS.reviews}%
          </strong>

          <span>
            Review Intelligence
          </span>
        </div>

        <div>
          <strong>
            {CWREC_WEIGHTS.budget}%
          </strong>

          <span>
            Budget
          </span>
        </div>

        <div>
          <strong>
            {CWREC_WEIGHTS.location}%
          </strong>

          <span>
            Location
          </span>
        </div>
      </div>

      <button
        type="button"
        className="rec-primary-btn"
        onClick={
          isLoggedIn
            ? onUnlock
            : onLogin
        }
      >
        {isLoggedIn
          ? 'Unlock Recommendation ₹99'
          : 'Login to Unlock'}
      </button>
    </section>
  );
}


/*
|--------------------------------------------------------------------------
| ASPECT TAG
|--------------------------------------------------------------------------
*/

function AspectTag({
  aspect,
  tone = 'normal',
}) {
  const palette = {
    positive: {
      background:
        '#ECFDF3',
      border:
        '#BBF7D0',
      color:
        '#166534',
    },

    negative: {
      background:
        '#FFF1F2',
      border:
        '#FECDD3',
      color:
        '#9F1239',
    },

    missing: {
      background:
        '#F8FAFC',
      border:
        '#E2E8F0',
      color:
        '#64748B',
    },

    normal: {
      background:
        '#F3F4F6',
      border:
        '#E5E7EB',
      color:
        '#374151',
    },
  };

  const style =
    palette[tone] ||
    palette.normal;

  return (
    <span
      style={{
        display:
          'inline-flex',

        alignItems:
          'center',

        padding:
          '5px 9px',

        borderRadius:
          999,

        border:
          `1px solid ${style.border}`,

        background:
          style.background,

        color:
          style.color,

        fontSize:
          11,

        fontWeight:
          700,
      }}
    >
      {humanizeAspect(
        aspect
      )}
    </span>
  );
}


/*
|--------------------------------------------------------------------------
| REVIEW EVIDENCE CARD
|--------------------------------------------------------------------------
*/

function ReviewEvidenceCard({
  evidence,
}) {
  const sentiment =
    String(
      evidence?.sentiment ||
      ''
    ).toLowerCase();

  const sentimentStyle =
    sentiment ===
    'positive'
      ? {
          background:
            '#ECFDF3',
          color:
            '#166534',
        }
      : sentiment ===
          'negative'
        ? {
            background:
              '#FFF1F2',
            color:
              '#9F1239',
          }
        : sentiment ===
            'mixed'
          ? {
              background:
                '#FFF7ED',
              color:
                '#9A3412',
            }
          : {
              background:
                '#F1F5F9',
              color:
                '#475569',
            };

  const date =
    formatDate(
      evidence?.reviewDate
    );

  return (
    <article
      style={{
        padding:
          14,

        border:
          '1px solid #E5EAF4',

        borderRadius:
          12,

        background:
          '#FFFFFF',
      }}
    >
      <div
        style={{
          display:
            'flex',

          flexWrap:
            'wrap',

          alignItems:
            'center',

          gap:
            7,

          marginBottom:
            9,
        }}
      >
        <strong
          style={{
            color:
              '#0F2454',

            fontSize:
              12,
          }}
        >
          {humanizeAspect(
            evidence?.aspect
          )}
        </strong>

        <span
          style={{
            padding:
              '3px 7px',

            borderRadius:
              999,

            background:
              sentimentStyle
                .background,

            color:
              sentimentStyle
                .color,

            fontSize:
              9,

            fontWeight:
              800,

            textTransform:
              'uppercase',
          }}
        >
          {sentiment ||
            'evidence'}
        </span>

        {evidence?.scope && (
          <span
            style={{
              padding:
                '3px 7px',

              borderRadius:
                999,

              background:
                '#EEF2FF',

              color:
                '#4338CA',

              fontSize:
                9,

              fontWeight:
                700,
            }}
          >
            {humanizeAspect(
              evidence.scope
            )}
          </span>
        )}
      </div>

      <p
        style={{
          margin:
            '0 0 10px',

          color:
            '#334155',

          fontSize:
            12,

          lineHeight:
            1.65,
        }}
      >
        “{evidence.text}”
      </p>

      <div
        style={{
          display:
            'flex',

          flexWrap:
            'wrap',

          alignItems:
            'center',

          gap:
            7,

          color:
            '#64748B',

          fontSize:
            10.5,
        }}
      >
        {evidence?.source && (
          <strong
            style={{
              color:
                '#334155',
            }}
          >
            {evidence.source}
          </strong>
        )}

        {evidence?.branch && (
          <>
            <span>·</span>

            <span>
              {evidence.branch}
            </span>
          </>
        )}

        {date && (
          <>
            <span>·</span>

            <span>
              {date}
            </span>
          </>
        )}

        {evidence
          ?.evidenceStrength && (
          <>
            <span>·</span>

            <span>
              {String(
                evidence
                  .evidenceStrength
              ).replace(
                /_/g,
                ' '
              )}
            </span>
          </>
        )}

        {evidence?.sourceUrl && (
          <>
            <span>·</span>

            <a
              href={
                evidence.sourceUrl
              }
              target="_blank"
              rel="noreferrer"
              style={{
                color:
                  '#2853E0',

                fontWeight:
                  700,

                textDecoration:
                  'none',
              }}
            >
              View source
            </a>
          </>
        )}
      </div>
    </article>
  );
}


/*
|--------------------------------------------------------------------------
| REVIEW INTELLIGENCE V3 PANEL
|--------------------------------------------------------------------------
*/

function ReviewIntelligencePanel({
  reviewV3,
}) {
  if (!reviewV3) {
    return (
      <section
        style={{
          marginTop:
            18,

          padding:
            16,

          border:
            '1px solid #E5EAF4',

          borderRadius:
            14,

          background:
            '#FAFBFF',
        }}
      >
        <strong
          style={{
            color:
              '#0F2454',
          }}
        >
          Review Intelligence
        </strong>

        <p
          style={{
            margin:
              '6px 0 0',

            color:
              '#64748B',

            fontSize:
              11.5,
          }}
        >
          Verified review
          intelligence is not
          available for this
          college yet.
        </p>
      </section>
    );
  }


  const score =
    num(
      reviewV3?.score
    );

  const component =
    num(
      reviewV3
        ?.component
    );


  const strengths =
    Array.isArray(
      reviewV3?.strengths
    )
      ? reviewV3.strengths
      : [];


  const concerns =
    Array.isArray(
      reviewV3?.concerns
    )
      ? reviewV3.concerns
      : [];


  const missing =
    Array.isArray(
      reviewV3
        ?.missingAspects
    )
      ? reviewV3
          .missingAspects
      : [];


  const evidence =
    collectReviewEvidence(
      reviewV3
    );


  const coverage =
    reviewV3?.evidence ||
    {};


  return (
    <section
      style={{
        marginTop:
          18,

        padding:
          18,

        border:
          '1px solid #DDE5F4',

        borderRadius:
          15,

        background:
          'linear-gradient(135deg,#FFFFFF,#F8FAFF)',
      }}
    >
      {/* ==========================================
          TITLE + SCORE
      ========================================== */}

      <div
        style={{
          display:
            'flex',

          alignItems:
            'flex-start',

          justifyContent:
            'space-between',

          gap:
            16,

          marginBottom:
            16,
        }}
      >
        <div>
          <span
            style={{
              display:
                'block',

              marginBottom:
                4,

              color:
                '#6D28D9',

              fontSize:
                9,

              fontWeight:
                900,

              letterSpacing:
                '.08em',
            }}
          >
            REVIEW INTELLIGENCE V3
          </span>

          <h4
            style={{
              margin:
                '0 0 5px',

              color:
                '#0F2454',

              fontSize:
                15,
            }}
          >
            What students are
            saying
          </h4>

          <p
            style={{
              margin:
                0,

              color:
                '#64748B',

              fontSize:
                11,
            }}
          >
            Source-backed review
            evidence with branch
            and programme scope.
          </p>
        </div>

        <div
          style={{
            flex:
              '0 0 auto',

            minWidth:
              96,

            padding:
              '10px 12px',

            borderRadius:
              12,

            background:
              '#EEF2FF',

            textAlign:
              'center',
          }}
        >
          <span
            style={{
              display:
                'block',

              color:
                '#64748B',

              fontSize:
                8,

              fontWeight:
                800,

              marginBottom:
                3,
            }}
          >
            REVIEW SCORE
          </span>

          <strong
            style={{
              color:
                '#3730A3',

              fontSize:
                19,
            }}
          >
            {score === null
              ? '—'
              : formatNumber(
                  score,
                  1
                )}

            {score !== null && (
              <small
                style={{
                  fontSize:
                    10,
                }}
              >
                /100
              </small>
            )}
          </strong>

          {component !==
            null && (
            <span
              style={{
                display:
                  'block',

                marginTop:
                  3,

                color:
                  '#64748B',

                fontSize:
                  9,
              }}
            >
              {formatNumber(
                component,
                2
              )}
              /10 contribution
            </span>
          )}
        </div>
      </div>


      {/* ==========================================
          STRENGTH / CONCERN / MISSING
      ========================================== */}

      <div
        style={{
          display:
            'grid',

          gridTemplateColumns:
            'repeat(auto-fit,minmax(180px,1fr))',

          gap:
            10,

          marginBottom:
            16,
        }}
      >
        <div
          style={{
            padding:
              12,

            border:
              '1px solid #DDF5E6',

            borderRadius:
              11,

            background:
              '#FBFFFC',
          }}
        >
          <strong
            style={{
              display:
                'block',

              marginBottom:
                8,

              color:
                '#166534',

              fontSize:
                11,
            }}
          >
            Strengths
          </strong>

          <div
            style={{
              display:
                'flex',

              flexWrap:
                'wrap',

              gap:
                6,
            }}
          >
            {strengths.length ? (
              strengths.map(
                (aspect) => (
                  <AspectTag
                    key={
                      aspect
                    }
                    aspect={
                      aspect
                    }
                    tone="positive"
                  />
                )
              )
            ) : (
              <span
                style={{
                  color:
                    '#64748B',

                  fontSize:
                    10.5,
                }}
              >
                No verified strength
                identified yet.
              </span>
            )}
          </div>
        </div>


        <div
          style={{
            padding:
              12,

            border:
              '1px solid #FEE2E2',

            borderRadius:
              11,

            background:
              '#FFFBFB',
          }}
        >
          <strong
            style={{
              display:
                'block',

              marginBottom:
                8,

              color:
                '#9F1239',

              fontSize:
                11,
            }}
          >
            Concerns
          </strong>

          <div
            style={{
              display:
                'flex',

              flexWrap:
                'wrap',

              gap:
                6,
            }}
          >
            {concerns.length ? (
              concerns.map(
                (aspect) => (
                  <AspectTag
                    key={
                      aspect
                    }
                    aspect={
                      aspect
                    }
                    tone="negative"
                  />
                )
              )
            ) : (
              <span
                style={{
                  color:
                    '#64748B',

                  fontSize:
                    10.5,
                }}
              >
                No major verified
                concern identified.
              </span>
            )}
          </div>
        </div>


        <div
          style={{
            padding:
              12,

            border:
              '1px solid #E2E8F0',

            borderRadius:
              11,

            background:
              '#FAFAFB',
          }}
        >
          <strong
            style={{
              display:
                'block',

              marginBottom:
                8,

              color:
                '#475569',

              fontSize:
                11,
            }}
          >
            Missing Evidence
          </strong>

          <div
            style={{
              display:
                'flex',

              flexWrap:
                'wrap',

              gap:
                6,
            }}
          >
            {missing.length ? (
              missing.map(
                (aspect) => (
                  <AspectTag
                    key={
                      aspect
                    }
                    aspect={
                      aspect
                    }
                    tone="missing"
                  />
                )
              )
            ) : (
              <span
                style={{
                  color:
                    '#166534',

                  fontSize:
                    10.5,
                }}
              >
                All review aspects
                have evidence.
              </span>
            )}
          </div>
        </div>
      </div>


      {/* ==========================================
          COVERAGE
      ========================================== */}

      <div
        style={{
          display:
            'flex',

          flexWrap:
            'wrap',

          gap:
            7,

          marginBottom:
            evidence.length
              ? 15
              : 0,
        }}
      >
        <CoverageChip
          label="Reviews"
          value={
            coverage
              ?.usableReviews
          }
        />

        <CoverageChip
          label="Sources"
          value={
            coverage
              ?.independentSources
          }
        />

        <CoverageChip
          label="Branch evidence"
          value={
            coverage
              ?.branchEvidence
          }
        />

        <CoverageChip
          label="Recent reviews"
          value={
            coverage
              ?.recentReviews
          }
        />
      </div>


      {/* ==========================================
          ACTUAL REVIEW EVIDENCE
      ========================================== */}

      {evidence.length >
        0 && (
        <div>
          <div
            style={{
              marginBottom:
                9,

              color:
                '#0F2454',

              fontSize:
                11,

              fontWeight:
                800,
            }}
          >
            SOURCE-BACKED REVIEW
            EVIDENCE
          </div>

          <div
            style={{
              display:
                'grid',

              gap:
                9,
            }}
          >
            {evidence
              .slice(
                0,
                4
              )
              .map(
                (
                  item,
                  index
                ) => (
                  <ReviewEvidenceCard
                    key={
                      `${item.reviewItemId}-${item.aspect}-${index}`
                    }
                    evidence={
                      item
                    }
                  />
                )
              )}
          </div>

          {evidence.length >
            4 && (
            <p
              style={{
                margin:
                  '9px 0 0',

                color:
                  '#64748B',

                fontSize:
                  10,
              }}
            >
              Showing 4 of{' '}
              {evidence.length}{' '}
              available representative
              evidence sentences.
            </p>
          )}
        </div>
      )}
    </section>
  );
}


/*
|--------------------------------------------------------------------------
| COVERAGE CHIP
|--------------------------------------------------------------------------
*/

function CoverageChip({
  label,
  value,
}) {
  const number =
    num(value);

  if (
    number === null
  ) {
    return null;
  }

  return (
    <span
      style={{
        display:
          'inline-flex',

        alignItems:
          'center',

        gap:
          4,

        padding:
          '5px 8px',

        borderRadius:
          999,

        background:
          '#F1F5F9',

        color:
          '#475569',

        fontSize:
          9.5,
      }}
    >
      <strong>
        {number}
      </strong>

      {label}
    </span>
  );
}


/*
|--------------------------------------------------------------------------
| RECOMMENDATION CARD
|--------------------------------------------------------------------------
*/

function RecommendationCard({
  row,
  index,
}) {
  const premium =
    row?.premium || {};

  const historicalFit =
    getHistoricalFitMeta(row);

  const admissionConfidence =
    getAdmissionConfidenceMeta(row);

  const overallConfidence =
    getOverallConfidenceMeta(row);

  const breakdown =
    getNormalizedBreakdown(row);

  const reviewV3 =
    getReviewV3(row);


  /*
  |--------------------------------------------------------------------------
  | NORMALIZED BREAKDOWN
  |--------------------------------------------------------------------------
  |
  | Review V3 score is normalized inside getNormalizedBreakdown().
  |--------------------------------------------------------------------------
  */

  const effectiveBreakdown =
    breakdown;


  const deterministicReasons =
    getDeterministicReasons(row);

  const strong =
    deterministicReasons.strong;

  const weak =
    deterministicReasons.weak;


  const college =
    row?.college?.name ||
    row?.college_name ||
    'College';


  const branch =
    row?.branch?.name ||
    row?.branch_name ||
    'Branch';


  const overall =
    calculateMatchScore(
      effectiveBreakdown
    ) ??
    num(
      premium?.score
    );


  const admission =
    historicalFit?.bucket ||
    premium
      ?.admissionBucket
      ?.label ||
    premium
      ?.admissionBucket ||
    row?.bucket ||
    'Admission fit';


  const finalCategory =
    getFinalPremiumCategory(
      row
    );

  const category =
    finalCategory.label;

  const rankingMeta =
    getPremiumRankingMeta(
      row
    );

  const dataCoverage =
    rankingMeta.coverage;


  return (
    <article className="rec-card">
      <div className="rec-card__rank">
        #{index + 1}
      </div>


      {/* ==========================================
          HEADER
      ========================================== */}

      <div className="rec-card__header">
        <div>
          <div className="rec-kicker">
            PERSONALIZED
            RECOMMENDATION
          </div>

          <h3>
            {college}
          </h3>

          <p>
            {branch}
          </p>

          <div className="rec-labels">
            <span className="rec-admission-label">
              {admission}
            </span>

            <span
              style={{
                padding:
                  '5px 9px',

                borderRadius:
                  999,

                background:
                  '#F1F5F9',

                color:
                  '#475569',

                fontSize:
                  10,

                fontWeight:
                  800,
              }}
            >
              {admissionConfidence.label}

              {' · '}

              {Math.round(
                admissionConfidence.score
              )}
              /100
            </span>

            <span className="rec-premium-label">
              {category}
            </span>
          </div>
        </div>


        <div className="rec-overall">
          <span>
            Overall Match
          </span>

          <strong>
            {overall === null
              ? '—'
              : Math.round(
                  overall
                )}

            {overall !== null && (
              <small>
                /100
              </small>
            )}
          </strong>

          <span
            style={{
              display:
                'block',

              marginTop:
                5,

              fontSize:
                9,

              opacity:
                0.72,
            }}
          >
            Data Coverage:{' '}

            <b>
              {dataCoverage}%
            </b>
          </span>

          <span
            style={{
              display: 'block',
              marginTop: 4,
              fontSize: 9,
              opacity: 0.82,
            }}
          >
            Confidence:{' '}

            <b>
              {overallConfidence.label}
              {' · '}
              {Math.round(
                overallConfidence.score
              )}
              /100
            </b>
          </span>
        </div>
      </div>


      {/* ==========================================
          HISTORICAL FIT
      ========================================== */}

      <div className="rec-historical-fit">
        Historical Fit:{' '}
        <strong>
          {historicalFit.score === null
            ? historicalFit.label
            : `${historicalFit.label} · ${Math.round(
                historicalFit.score
              )}/100`}
        </strong>
      </div>


      {!rankingMeta
        .coreComplete && (
        <div
          style={{
            marginTop:
              10,

            padding:
              '9px 11px',

            border:
              '1px solid #FDE68A',

            borderRadius:
              9,

            background:
              '#FFFBEB',

            color:
              '#92400E',

            fontSize:
              10.5,

            lineHeight:
              1.45,
          }}
        >
          <strong>
            Limited confidence:
          </strong>{' '}

          this score is based on
          available verified factors.

          {' '}

          Missing core data:{' '}

          <strong>
            {rankingMeta
              .missingCoreFactors
              .join(', ')}
          </strong>.
        </div>
      )}


      {/* ==========================================
          MAIN SCORE + REASONS
      ========================================== */}

      <div className="rec-main-grid">
        <section className="rec-breakdown">
          <span className="rec-section-kicker">
            SCORE BREAKDOWN
          </span>

          <h4>
            How your match is
            calculated
          </h4>

          {PARTS.map(
            ([
              key,
              label,
              max,
            ]) => (
              <ScoreRow
                key={key}
                label={label}
                value={
                  effectiveBreakdown[
                    key
                  ]
                }
                max={max}
              />
            )
          )}
        </section>


        <section className="rec-explanation">
          <div className="rec-reason-box rec-reason-box--strong">
            <h4>
              Why this is strong
            </h4>

            {strong.length ? (
              strong
                .slice(
                  0,
                  4
                )
                .map(
                  (
                    reason,
                    index
                  ) => (
                    <p
                      key={
                        reason.code ||
                        index
                      }
                    >
                      ✓ {reason.text}
                    </p>
                  )
                )
            ) : (
              <p className="rec-muted">
                Strong factors
                will appear when
                verified data is
                available.
              </p>
            )}
          </div>


          <div className="rec-reason-box rec-reason-box--weak">
            <h4>
              What reduces the score
            </h4>

            {weak.length ? (
              weak
                .slice(
                  0,
                  4
                )
                .map(
                  (
                    reason,
                    index
                  ) => (
                    <p
                      key={
                        reason.code ||
                        index
                      }
                    >
                      – {reason.text}
                    </p>
                  )
                )
            ) : (
              <p className="rec-muted">
                No major reducing
                factor is currently
                available.
              </p>
            )}
          </div>
        </section>
      </div>


      {/* ==========================================
          REVIEW INTELLIGENCE V3
      ========================================== */}

      <ReviewIntelligencePanel
        reviewV3={
          reviewV3
        }
      />


      {/* ==========================================
          DATA POLICY
      ========================================== */}

      <div className="rec-data-note">
        Missing quality, review,
        fee or location data stays
        unknown — no artificial
        default score.
      </div>
    </article>
  );
}


/*
|--------------------------------------------------------------------------
| MAIN RECOMMENDATION SLIDE
|--------------------------------------------------------------------------
*/

export default function RecommendationSlide({
  rows = [],
  hasRecommendationAccess = false,
  isLoggedIn = false,
  onUnlock,
  onLogin,
}) {
  const rankedRows =
    useMemo(
      () =>
        [...rows]
          .filter(Boolean)
          .sort(
            comparePremiumRows
          )
          .slice(
            0,
            10
          ),
      [
        rows,
      ]
    );


  /*
  |--------------------------------------------------------------------------
  | PAYWALL
  |--------------------------------------------------------------------------
  */

  if (
    !hasRecommendationAccess
  ) {
    return (
      <LockedRecommendation
        isLoggedIn={
          isLoggedIn
        }
        onUnlock={
          onUnlock
        }
        onLogin={
          onLogin
        }
      />
    );
  }


  return (
    <section className="recommendation-slide">
      {/* ==========================================
          HERO
      ========================================== */}

      <header className="recommendation-slide__hero">
        <div>
          <span className="rec-kicker">
            YOUR PERSONALIZED
            RANKING
          </span>

          <h2>
            Top Recommendations
            For Your Profile
          </h2>

          <p>
            Ranked using admission
            fit, branch preference,
            college quality, review
            intelligence, budget and
            location.
          </p>
        </div>


        <div className="recommendation-slide__formula">
          {[
            CWREC_WEIGHTS.rank,
            CWREC_WEIGHTS.branch,
            CWREC_WEIGHTS.quality,
            CWREC_WEIGHTS.reviews,
            CWREC_WEIGHTS.budget,
            CWREC_WEIGHTS.location,
          ].map(
            (value, index) => (
              <span
                key={`${value}-${index}`}
              >
                {value}
              </span>
            )
          )}
        </div>
      </header>


      {/* ==========================================
          EMPTY
      ========================================== */}

      {!rankedRows.length ? (
        <div className="rec-empty">
          <h3>
            No recommendation
            data available yet
          </h3>

          <p>
            Generate college
            options first.
            Personalized ranking
            will appear here.
          </p>
        </div>
      ) : (
        <div className="rec-list">
          {rankedRows.map(
            (
              row,
              index
            ) => {
              const collegeId =
                row?.collegeId ||
                row?.college?.id ||
                row?.college_id ||
                'college';

              const branchName =
                row?.branch?.name ||
                row?.branch_name ||
                'branch';

              return (
                <RecommendationCard
                  key={
                    `${collegeId}-${branchName}-${index}`
                  }
                  row={row}
                  index={
                    index
                  }
                />
              );
            }
          )}
        </div>
      )}
    </section>
  );
}