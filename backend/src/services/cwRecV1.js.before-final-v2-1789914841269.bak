export const CWREC_VERSION = 'CW-REC-1.0';

export const DEFAULT_MATCH_WEIGHTS = Object.freeze({
  admission: 50,
  branch: 15,
  quality: 15,
  reviews: 10,
  budget: 7,
  location: 3,
});

export const CONFIDENCE_WEIGHTS = Object.freeze({
  admission: 40,
  quality: 25,
  reviews: 15,
  budget: 10,
  branch: 5,
  location: 5,
});

export const FACTOR_STATUS = Object.freeze({
  AVAILABLE: 'AVAILABLE',
  UNAVAILABLE: 'UNAVAILABLE',
  NOT_APPLICABLE: 'NOT_APPLICABLE',
});

export function clamp(
  value,
  min = 0,
  max = 100
) {
  return Math.max(
    min,
    Math.min(max, value)
  );
}

export function toNumber(value) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null;
  }

  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}

export function median(
  values = []
) {
  const clean =
    values
      .map(Number)
      .filter(Number.isFinite)
      .sort(
        (a, b) => a - b
      );

  if (!clean.length) {
    return null;
  }

  const mid =
    Math.floor(
      clean.length / 2
    );

  return clean.length % 2
    ? clean[mid]
    : (
        clean[mid - 1] +
        clean[mid]
      ) / 2;
}

export function normalizeStatus(
  value,
  fallback =
    FACTOR_STATUS.UNAVAILABLE
) {
  if (!value) {
    return fallback;
  }

  const status =
    String(value)
      .trim()
      .toUpperCase()
      .replace(
        /[\s-]+/g,
        '_'
      );

  if (
    status === 'AVAILABLE' ||
    status === 'VERIFIED' ||
    status === 'READY'
  ) {
    return FACTOR_STATUS.AVAILABLE;
  }

  if (
    status ===
      'NOT_APPLICABLE' ||
    status === 'N/A' ||
    status === 'NA'
  ) {
    return FACTOR_STATUS
      .NOT_APPLICABLE;
  }

  return FACTOR_STATUS
    .UNAVAILABLE;
}


/* =========================================
   ADMISSION FIT
========================================= */

export function calculateHistoricalFitScore(
  relativeMargin
) {
  if (
    !Number.isFinite(
      relativeMargin
    )
  ) {
    return null;
  }

  const margin =
    relativeMargin;

  if (margin >= 0.20) {
    return 100;
  }

  if (margin >= 0.10) {
    return clamp(
      80 +
        15 *
          (
            (margin - 0.10) /
            0.10
          )
    );
  }

  if (margin >= 0) {
    return clamp(
      60 +
        20 *
          (
            margin /
            0.10
          )
    );
  }

  if (margin >= -0.05) {
    return clamp(
      40 +
        20 *
          (
            (margin + 0.05) /
            0.05
          )
    );
  }

  return clamp(
    40 +
      400 *
        (
          margin + 0.05
        )
  );
}

export function getAdmissionBucketFromFit(
  score
) {
  const value =
    toNumber(score);

  if (value === null) {
    return 'Admission data pending';
  }

  if (value >= 85) {
    return 'Backup';
  }

  if (value >= 65) {
    return 'Safe';
  }

  if (value >= 35) {
    return 'Target';
  }

  return 'Dream';
}

export function calculateHistoricalFit({
  studentRank,
  closingRanks = [],
}) {
  const rank =
    toNumber(studentRank);

  const cleanClosingRanks =
    closingRanks
      .map(Number)
      .filter(Number.isFinite)
      .filter(
        (value) =>
          value > 0
      );

  if (
    rank === null ||
    rank <= 0 ||
    !cleanClosingRanks.length
  ) {
    return {
      historicalFitScore:
        null,

      bucket:
        'Admission data pending',

      medianClosingRank:
        null,

      relativeMargin:
        null,

      yearsUsed:
        cleanClosingRanks.length,

      status:
        FACTOR_STATUS.UNAVAILABLE,
    };
  }

  const medianClosingRank =
    median(
      cleanClosingRanks
    );

  if (
    medianClosingRank ===
      null ||
    medianClosingRank <= 0
  ) {
    return {
      historicalFitScore:
        null,

      bucket:
        'Admission data pending',

      medianClosingRank:
        null,

      relativeMargin:
        null,

      yearsUsed:
        cleanClosingRanks.length,

      status:
        FACTOR_STATUS.UNAVAILABLE,
    };
  }

  const relativeMargin =
    (
      medianClosingRank -
      rank
    ) /
    medianClosingRank;

  const historicalFitScore =
    calculateHistoricalFitScore(
      relativeMargin
    );

  return {
    historicalFitScore,

    bucket:
      getAdmissionBucketFromFit(
        historicalFitScore
      ),

    medianClosingRank,

    relativeMargin,

    yearsUsed:
      cleanClosingRanks.length,

    status:
      FACTOR_STATUS.AVAILABLE,
  };
}


/* =========================================
   ADMISSION CONFIDENCE
========================================= */

export function calculateYearCoverageScore(
  rows = []
) {
  const years =
    new Set(
      rows
        .map(
          (row) =>
            Number(
              row?.year ??
              row?.academicYear
            )
        )
        .filter(
          Number.isFinite
        )
    );

  if (years.size >= 3) {
    return 100;
  }

  if (years.size === 2) {
    return 75;
  }

  if (years.size === 1) {
    return 50;
  }

  return 0;
}

export function calculateCutoffStabilityScore(
  rows = []
) {
  const values =
    rows
      .map(
        (row) =>
          Number(
            row?.closingRank ??
            row?.closing_rank ??
            row?.closing
          )
      )
      .filter(
        Number.isFinite
      )
      .filter(
        (value) =>
          value > 0
      );

  if (!values.length) {
    return 0;
  }

  if (values.length === 1) {
    return 50;
  }

  const mean =
    values.reduce(
      (sum, value) =>
        sum + value,
      0
    ) /
    values.length;

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
    ) /
    values.length;

  const sigma =
    Math.sqrt(variance);

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

export function calculateFreshnessScore(
  rows = [],
  currentYear =
    new Date()
      .getFullYear()
) {
  const years =
    rows
      .map(
        (row) =>
          Number(
            row?.year ??
            row?.academicYear
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

  const age =
    Math.max(
      0,
      Number(currentYear) -
        latestYear
    );

  if (age === 0) return 100;
  if (age === 1) return 90;
  if (age === 2) return 75;
  if (age === 3) return 55;

  return 30;
}

export function getConfidenceLabel(
  score
) {
  const value =
    toNumber(score);

  if (value === null) {
    return 'Limited Confidence';
  }

  if (value >= 85) {
    return 'High Confidence';
  }

  if (value >= 65) {
    return 'Moderate Confidence';
  }

  return 'Limited Confidence';
}

export function calculateAdmissionConfidence({
  historicalRows = [],
  contextScore = 60,
  currentYear =
    new Date()
      .getFullYear(),
}) {
  const yearCoverage =
    calculateYearCoverageScore(
      historicalRows
    );

  const stability =
    calculateCutoffStabilityScore(
      historicalRows
    );

  const freshness =
    calculateFreshnessScore(
      historicalRows,
      currentYear
    );

  const exactContext =
    clamp(
      toNumber(
        contextScore
      ) ?? 60
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
  };
}


/* =========================================
   BRANCH FIT
========================================= */

export function calculateBranchFit({
  preferenceRank = null,
  familyMatchScore = null,
}) {
  const preference =
    toNumber(
      preferenceRank
    );

  if (preference !== null) {
    if (preference === 1) {
      return 100;
    }

    if (preference === 2) {
      return 85;
    }

    if (preference === 3) {
      return 70;
    }

    if (preference === 4) {
      return 60;
    }
  }

  const family =
    toNumber(
      familyMatchScore
    );

  return family !== null
    ? clamp(family)
    : null;
}


/* =========================================
   QUALITY
========================================= */

export function weightedAvailableScore(
  parts = []
) {
  let weighted = 0;
  let totalWeight = 0;

  for (
    const part of parts
  ) {
    const score =
      toNumber(
        part?.score
      );

    const weight =
      toNumber(
        part?.weight
      );

    if (
      score === null ||
      weight === null ||
      weight <= 0
    ) {
      continue;
    }

    weighted +=
      clamp(score) *
      weight;

    totalWeight +=
      weight;
  }

  if (
    totalWeight <= 0
  ) {
    return null;
  }

  return clamp(
    weighted /
    totalWeight
  );
}

export function calculateQualityScore({
  nirfScore = null,
  placementScore = null,
  medianPackageScore = null,
}) {
  return weightedAvailableScore([
    {
      score: nirfScore,
      weight: 0.60,
    },
    {
      score: placementScore,
      weight: 0.20,
    },
    {
      score:
        medianPackageScore,
      weight: 0.20,
    },
  ]);
}


/* =========================================
   BUDGET
========================================= */

export function calculateBudgetScore({
  annualCost,
  annualBudget,
}) {
  const cost =
    toNumber(
      annualCost
    );

  const budget =
    toNumber(
      annualBudget
    );

  if (
    cost === null ||
    budget === null ||
    cost < 0 ||
    budget <= 0
  ) {
    return null;
  }

  const ratio =
    cost / budget;

  if (ratio <= 1) {
    return 100;
  }

  if (ratio <= 1.10) {
    return clamp(
      100 -
        10 *
          (
            (ratio - 1) /
            0.10
          )
    );
  }

  if (ratio <= 1.25) {
    return clamp(
      90 -
        20 *
          (
            (ratio - 1.10) /
            0.15
          )
    );
  }

  if (ratio <= 1.50) {
    return clamp(
      70 -
        40 *
          (
            (ratio - 1.25) /
            0.25
          )
    );
  }

  if (ratio <= 2) {
    return clamp(
      30 -
        30 *
          (
            (ratio - 1.50) /
            0.50
          )
    );
  }

  return 0;
}


/* =========================================
   MATCH SCORE
========================================= */

export function calculateMatchScore(
  factors,
  weights =
    DEFAULT_MATCH_WEIGHTS
) {
  let weightedTotal = 0;
  let availableWeight = 0;

  for (
    const [
      key,
      weight,
    ] of Object.entries(
      weights
    )
  ) {
    const factor =
      factors?.[key] ??
      {};

    const status =
      normalizeStatus(
        factor?.status,
        factor?.score ===
            null ||
          factor?.score ===
            undefined
          ? FACTOR_STATUS
              .UNAVAILABLE
          : FACTOR_STATUS
              .AVAILABLE
      );

    if (
      status !==
      FACTOR_STATUS.AVAILABLE
    ) {
      continue;
    }

    const score =
      toNumber(
        factor?.score
      );

    if (score === null) {
      continue;
    }

    weightedTotal +=
      clamp(score) *
      weight;

    availableWeight +=
      weight;
  }

  if (
    availableWeight <= 0
  ) {
    return {
      score: null,
      availableWeight: 0,
    };
  }

  return {
    score:
      clamp(
        weightedTotal /
        availableWeight
      ),

    availableWeight,
  };
}

export function getMatchCategory(
  score
) {
  const value =
    toNumber(score);

  if (value === null) {
    return 'Data Pending';
  }

  if (value >= 90) {
    return 'Excellent Match';
  }

  if (value >= 80) {
    return 'Great Match';
  }

  if (value >= 70) {
    return 'Good Match';
  }

  return 'Consider';
}


/* =========================================
   OVERALL CONFIDENCE
========================================= */

export function calculateOverallConfidence(
  factors,
  weights =
    CONFIDENCE_WEIGHTS
) {
  let weightedTotal = 0;
  let applicableWeight = 0;

  for (
    const [
      key,
      weight,
    ] of Object.entries(
      weights
    )
  ) {
    const factor =
      factors?.[key] ??
      {};

    const status =
      normalizeStatus(
        factor?.status,
        FACTOR_STATUS
          .UNAVAILABLE
      );

    if (
      status ===
      FACTOR_STATUS
        .NOT_APPLICABLE
    ) {
      continue;
    }

    applicableWeight +=
      weight;

    const confidence =
      status ===
      FACTOR_STATUS.AVAILABLE
        ? clamp(
            toNumber(
              factor
                ?.confidence
            ) ?? 0
          )
        : 0;

    weightedTotal +=
      confidence *
      weight;
  }

  if (
    applicableWeight <= 0
  ) {
    return {
      score: 0,

      label:
        'Limited Confidence',

      applicableWeight: 0,
    };
  }

  const score =
    clamp(
      weightedTotal /
      applicableWeight
    );

  return {
    score,

    label:
      getConfidenceLabel(
        score
      ),

    applicableWeight,
  };
}


/* =========================================
   FINAL RECOMMENDATION
========================================= */

export function buildRecommendation({
  admission,
  branch,
  quality,
  reviews,
  budget,
  location,
  weights =
    DEFAULT_MATCH_WEIGHTS,
}) {
  const factors = {
    admission,
    branch,
    quality,
    reviews,
    budget,
    location,
  };

  const match =
    calculateMatchScore(
      factors,
      weights
    );

  const confidence =
    calculateOverallConfidence({
      admission: {
        status:
          admission?.status ??
          FACTOR_STATUS
            .UNAVAILABLE,

        confidence:
          admission?.confidence ??
          0,
      },

      branch: {
        status:
          branch?.status ??
          FACTOR_STATUS
            .UNAVAILABLE,

        confidence:
          branch?.confidence ??
          0,
      },

      quality: {
        status:
          quality?.status ??
          FACTOR_STATUS
            .UNAVAILABLE,

        confidence:
          quality?.confidence ??
          0,
      },

      reviews: {
        status:
          reviews?.status ??
          FACTOR_STATUS
            .UNAVAILABLE,

        confidence:
          reviews?.confidence ??
          0,
      },

      budget: {
        status:
          budget?.status ??
          FACTOR_STATUS
            .UNAVAILABLE,

        confidence:
          budget?.confidence ??
          0,
      },

      location: {
        status:
          location?.status ??
          FACTOR_STATUS
            .UNAVAILABLE,

        confidence:
          location?.confidence ??
          0,
      },
    });

  return {
    scoringVersion:
      CWREC_VERSION,

    matchScore:
      match.score,

    matchCategory:
      getMatchCategory(
        match.score
      ),

    confidenceScore:
      confidence.score,

    confidenceLabel:
      confidence.label,

    dataCoverage:
      match.availableWeight,

    factors,
  };
}


/* =========================================
   BUCKET-AWARE RANKING
========================================= */

export function getBucketPriority(
  bucket
) {
  const normalized =
    String(
      bucket ?? ''
    )
      .trim()
      .toLowerCase();

  return (
    {
      target: 0,
      safe: 1,
      backup: 2,
      dream: 3,
    }[normalized] ?? 4
  );
}

export function compareRecommendations(
  a,
  b
) {
  const bucketA =
    getBucketPriority(
      a?.admission?.bucket ??
      a?.bucket
    );

  const bucketB =
    getBucketPriority(
      b?.admission?.bucket ??
      b?.bucket
    );

  if (
    bucketA !==
    bucketB
  ) {
    return (
      bucketA -
      bucketB
    );
  }

  const scoreA =
    toNumber(
      a?.matchScore
    ) ?? -1;

  const scoreB =
    toNumber(
      b?.matchScore
    ) ?? -1;

  if (
    scoreB !==
    scoreA
  ) {
    return (
      scoreB -
      scoreA
    );
  }

  const confidenceA =
    toNumber(
      a?.confidenceScore
    ) ?? -1;

  const confidenceB =
    toNumber(
      b?.confidenceScore
    ) ?? -1;

  if (
    confidenceB !==
    confidenceA
  ) {
    return (
      confidenceB -
      confidenceA
    );
  }

  const qualityA =
    toNumber(
      a?.quality?.score
    ) ?? -1;

  const qualityB =
    toNumber(
      b?.quality?.score
    ) ?? -1;

  if (
    qualityB !==
    qualityA
  ) {
    return (
      qualityB -
      qualityA
    );
  }

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

  return collegeA
    .localeCompare(
      collegeB,
      'en',
      {
        sensitivity:
          'base',
      }
    );
}

