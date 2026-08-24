/*
|--------------------------------------------------------------------------
| Counselling Wallah
| Premium Recommendation Engine
|--------------------------------------------------------------------------
|
| FINAL PREMIUM WEIGHTS
|
| Rank / Admission Feasibility   50%
| Branch Preference              15%
| College Quality                15%
| Student Reviews                10%
| Budget                          7%
| Location                        3%
|
| TOTAL                          100%
|
| IMPORTANT:
| Premium Match is NOT admission probability.
|
|--------------------------------------------------------------------------
*/

export const WEIGHTS = {
  rank: 0.50,
  branch: 0.15,
  quality: 0.15,
  reviews: 0.10,
  budget: 0.07,
  location: 0.03,
};

/* ==========================================================================
   BASIC HELPERS
========================================================================== */

function clamp(value, min = 0, max = 100) {
  const n = Number(value);

  if (!Number.isFinite(n)) {
    return null;
  }

  return Math.max(
    min,
    Math.min(max, n)
  );
}

function parseNumber(value) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null;
  }

  const cleaned = String(value)
    .replace(/,/g, '')
    .replace(/₹/g, '')
    .replace(/\s+/g, '')
    .trim();

  const number = Number(cleaned);

  return Number.isFinite(number)
    ? number
    : null;
}

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/* ==========================================================================
   RANK HELPERS
========================================================================== */

function getStudentRank(row, profile) {
  return (
    parseNumber(profile?.rank) ??
    parseNumber(profile?.studentRank) ??
    parseNumber(profile?.userRank) ??
    parseNumber(row?.rank) ??
    null
  );
}

function getOpeningRank(row) {
  return (
    parseNumber(row?.openingRank) ??
    parseNumber(row?.opening_rank) ??
    parseNumber(
      row?.cutoff?.openingRank
    ) ??
    parseNumber(
      row?.cutoff?.opening_rank
    ) ??
    null
  );
}

function getClosingRank(row) {
  return (
    parseNumber(row?.closingRank) ??
    parseNumber(row?.closing_rank) ??
    parseNumber(
      row?.cutoff?.closingRank
    ) ??
    parseNumber(
      row?.cutoff?.closing_rank
    ) ??
    null
  );
}

/* ==========================================================================
   BRANCH HELPERS
========================================================================== */

function getBranchName(row) {
  return (
    row?.branch?.name ||
    row?.branch?.branch_name ||
    row?.branch_name ||
    row?.branchName ||
    row?.program ||
    row?.course ||
    ''
  );
}

function normalizeBranch(value) {
  const text = normalizeText(value);

  if (
    text.includes('computer science') ||
    text.includes('computer science engineering') ||
    text === 'cse'
  ) {
    return 'cse';
  }

  if (
    text === 'it' ||
    text.includes('information technology')
  ) {
    return 'it';
  }

  if (
    text.includes('electronics') &&
    text.includes('communication')
  ) {
    return 'ece';
  }

  if (
    text.includes('electronics')
  ) {
    return 'ece';
  }

  if (
    text.includes('electrical')
  ) {
    return 'electrical';
  }

  if (
    text.includes('mechanical') ||
    text.includes('mechatronics')
  ) {
    return 'mechanical';
  }

  if (
    text.includes('civil')
  ) {
    return 'civil';
  }

  return text;
}

function getPreferredBranches(profile) {
  const branches =
    profile?.preferredBranches ??
    profile?.branches ??
    profile?.preferredBranch ??
    [];

  if (Array.isArray(branches)) {
    return branches
      .map(normalizeBranch)
      .filter(Boolean);
  }

  if (branches) {
    return [
      normalizeBranch(branches),
    ];
  }

  return [];
}

/* ==========================================================================
   1. RANK / ADMISSION FEASIBILITY — 50%
========================================================================== */

/*
|--------------------------------------------------------------------------
| Rank Ratio
|--------------------------------------------------------------------------
|
| Final architecture:
|
| rankRatio =
| studentRank / historicalOpeningRank
|
| Lower ratio = stronger historical fit.
|
|--------------------------------------------------------------------------
*/

function calculateRankScore(
  row,
  profile
) {
  const studentRank =
    getStudentRank(
      row,
      profile
    );

  const openingRank =
    getOpeningRank(row);

  const closingRank =
    getClosingRank(row);

  /*
   * Opening rank is preferred.
   * Closing rank is fallback only.
   */

  const historicalRank =
    openingRank ??
    closingRank;

  if (
    !studentRank ||
    !historicalRank
  ) {
    return {
      score: null,
      rankRatio: null,
      openingRank,
      closingRank,
      label:
        'Historical rank data unavailable',
      reason:
        'Historical opening/closing rank data is unavailable for this option.',
    };
  }

  const rankRatio =
    studentRank /
    historicalRank;

  /*
  |--------------------------------------------------------------------------
  | Smooth rank score
  |--------------------------------------------------------------------------
  |
  | <= 0.60 = very strong
  | <= 0.85 = strong
  | <= 1.05 = competitive
  | > 1.05  = aspirational
  |
  */

  let score;
  let label;

  if (rankRatio <= 0.60) {
    /*
     * 0.00 → 100
     * 0.60 → 90
     */
    score =
      100 -
      (rankRatio / 0.60) * 10;

    label =
      'Very strong historical rank fit';
  } else if (rankRatio <= 0.85) {
    /*
     * 0.60 → 90
     * 0.85 → 80
     */
    score =
      90 -
      ((rankRatio - 0.60) / 0.25) * 10;

    label =
      'Strong historical rank fit';
  } else if (rankRatio <= 1.05) {
    /*
     * 0.85 → 80
     * 1.05 → 70
     */
    score =
      80 -
      ((rankRatio - 0.85) / 0.20) * 10;

    label =
      'Competitive historical rank fit';
  } else {
    /*
     * Above historical opening rank.
     * Score decreases gradually.
     */

    score = Math.max(
      20,
      70 -
        (rankRatio - 1.05) * 35
    );

    label =
      'Aspirational historical rank fit';
  }

  score =
    Math.round(
      clamp(score)
    );

  return {
    score,
    rankRatio,
    studentRank,
    openingRank,
    closingRank,
    label,
    reason:
      `Your rank ${studentRank.toLocaleString(
        'en-IN'
      )} is compared with the historical ${
        openingRank
          ? 'opening'
          : 'closing'
      } rank ${historicalRank.toLocaleString(
        'en-IN'
      )}.`,
  };
}

/* ==========================================================================
   2. BRANCH PREFERENCE — 15%
========================================================================== */

function calculateBranchScore(
  row,
  profile
) {
  const branch =
    normalizeBranch(
      getBranchName(row)
    );

  const preferred =
    getPreferredBranches(
      profile
    );

  if (
    !branch ||
    preferred.length === 0
  ) {
    return {
      score: null,
      reason:
        'Branch preference data is unavailable.',
    };
  }

  /*
   * Exact branch preference.
   */

  if (
    preferred.includes(branch)
  ) {
    return {
      score: 100,
      reason:
        'This branch directly matches your preferred branch choices.',
    };
  }

  /*
   * Closely related branches.
   */

  const related = {
    cse: ['it'],
    it: ['cse'],
    ece: ['electrical'],
    electrical: ['ece'],
    mechanical: [],
    civil: [],
  };

  const relatedBranches =
    related[branch] || [];

  if (
    preferred.some(
      (preferredBranch) =>
        relatedBranches.includes(
          preferredBranch
        )
    )
  ) {
    return {
      score: 70,
      reason:
        'This branch is related to one of your preferred branches.',
    };
  }

  /*
   * Different branch.
   */

  return {
    score: 30,
    reason:
      'This branch does not match your preferred branch choices.',
  };
}

/* ==========================================================================
   3. COLLEGE QUALITY — 15%
========================================================================== */

function calculateQualityScore(row) {
  const college =
    row?.college || {};

  const possibleValues = [
    row?.qualityScore,
    row?.quality_score,
    college?.qualityScore,
    college?.quality_score,
  ];

  const supplied =
    possibleValues
      .map(parseNumber)
      .find(
        (value) =>
          value !== null
      );

  if (
    supplied !== undefined
  ) {
    return {
      score: clamp(
        supplied
      ),
      reason:
        'College quality data is available.',
    };
  }

  /*
   * IMPORTANT:
   * Do NOT use 50 when data is missing.
   */

  return {
    score: null,
    reason:
      'College quality data is not available yet.',
  };
}

/* ==========================================================================
   4. STUDENT REVIEWS — 10%
========================================================================== */

function calculateReviewScore(row) {
  const college =
    row?.college || {};

  const rating =
    parseNumber(
      row?.rating ??
      row?.reviewRating ??
      row?.review_rating ??
      college?.rating ??
      college?.reviewRating ??
      college?.review_rating
    );

  const reviewCount =
    parseNumber(
      row?.reviewCount ??
      row?.review_count ??
      college?.reviewCount ??
      college?.review_count
    ) ?? 0;

  if (
    rating === null ||
    rating <= 0
  ) {
    return {
      score: null,
      rating: null,
      reviewCount,
      reason:
        'Student review data is not available yet.',
    };
  }

  /*
   * Convert 5-star rating → 100.
   */

  let score =
    (rating / 5) * 100;

  /*
   * Confidence adjustment for
   * very small review samples.
   */

  if (
    reviewCount > 0 &&
    reviewCount < 20
  ) {
    score *= 0.85;
  } else if (
    reviewCount >= 20 &&
    reviewCount < 100
  ) {
    score *= 0.93;
  }

  score =
    Math.round(
      clamp(score)
    );

  return {
    score,
    rating,
    reviewCount,
    reason:
      reviewCount > 0
        ? `Student rating is ${rating.toFixed(
            1
          )}/5 from ${reviewCount.toLocaleString(
            'en-IN'
          )} reviews.`
        : `Student rating is ${rating.toFixed(
            1
          )}/5.`,
  };
}

/* ==========================================================================
   5. BUDGET — 7%
========================================================================== */

function getFees(row) {
  const college =
    row?.college || {};

  return (
    parseNumber(
      row?.totalFees
    ) ??
    parseNumber(
      row?.total_fees
    ) ??
    parseNumber(
      row?.fees
    ) ??
    parseNumber(
      row?.fee
    ) ??
    parseNumber(
      college?.totalFees
    ) ??
    parseNumber(
      college?.total_fees
    ) ??
    parseNumber(
      college?.fees
    ) ??
    null
  );
}

function getBudgetLimit(profile) {
  const value =
    profile?.maximumBudget ??
    profile?.maxBudget ??
    profile?.budget ??
    profile?.budgetRange ??
    null;

  if (
    typeof value === 'number'
  ) {
    return value;
  }

  if (!value) {
    return null;
  }

  const text =
    normalizeText(value);

  /*
   * Common UI values.
   */

  if (
    text.includes('10') &&
    text.includes('lakh')
  ) {
    return 1000000;
  }

  if (
    text.includes('15') &&
    text.includes('lakh')
  ) {
    return 1500000;
  }

  if (
    text.includes('20') &&
    text.includes('lakh')
  ) {
    return 2000000;
  }

  if (
    text.includes('5') &&
    text.includes('lakh')
  ) {
    return 500000;
  }

  /*
   * Try extracting a number.
   */

  const number =
    parseNumber(value);

  if (
    number !== null
  ) {
    /*
     * If user supplied lakh-style
     * number such as 10, convert.
     */

    if (
      number < 100
    ) {
      return number * 100000;
    }

    return number;
  }

  return null;
}

function calculateBudgetScore(
  row,
  profile
) {
  const fees =
    getFees(row);

  const budget =
    getBudgetLimit(
      profile
    );

  if (
    fees === null ||
    budget === null ||
    budget <= 0
  ) {
    return {
      score: null,
      fees,
      budget,
      reason:
        'Budget or fee data is not available for a precise comparison.',
    };
  }

  if (
    fees <= budget * 0.60
  ) {
    return {
      score: 100,
      fees,
      budget,
      reason:
        'The estimated college cost is comfortably within your budget.',
    };
  }

  if (
    fees <= budget
  ) {
    return {
      score: 85,
      fees,
      budget,
      reason:
        'The estimated college cost fits within your budget.',
    };
  }

  if (
    fees <= budget * 1.15
  ) {
    return {
      score: 60,
      fees,
      budget,
      reason:
        'The estimated college cost is slightly above your budget.',
    };
  }

  return {
    score: 30,
    fees,
    budget,
    reason:
      'The estimated college cost is significantly above your budget.',
  };
}

/* ==========================================================================
   6. LOCATION — 3%
========================================================================== */

function getPreferredState(
  profile
) {
  return (
    profile?.preferredState ??
    profile?.state ??
    ''
  );
}

function getCollegeState(row) {
  return (
    row?.college?.state ??
    row?.state ??
    row?.college_state ??
    ''
  );
}

function calculateLocationScore(
  row,
  profile
) {
  const preferredState =
    getPreferredState(
      profile
    );

  const collegeState =
    getCollegeState(
      row
    );

  if (
    !preferredState ||
    normalizeText(
      preferredState
    ) === 'any'
  ) {
    return {
      score: 70,
      reason:
        'No specific state preference was selected.',
    };
  }

  if (
    !collegeState
  ) {
    return {
      score: null,
      reason:
        'College state data is not available.',
    };
  }

  if (
    normalizeText(
      preferredState
    ) ===
    normalizeText(
      collegeState
    )
  ) {
    return {
      score: 100,
      reason:
        'The college is in your preferred state.',
    };
  }

  return {
    score: 40,
    reason:
      'The college is outside your preferred state.',
  };
}

/* ==========================================================================
   PREMIUM CATEGORY
========================================================================== */

export function getPremiumCategory(
  score
) {
  if (
    score >= 90
  ) {
    return {
      label:
        'Excellent Match',
      icon: '💎',
      key: 'excellent',
    };
  }

  if (
    score >= 80
  ) {
    return {
      label:
        'Great Match',
      icon: '⭐',
      key: 'great',
    };
  }

  if (
    score >= 70
  ) {
    return {
      label:
        'Good Match',
      icon: '👍',
      key: 'good',
    };
  }

  return {
    label:
      'Consider',
    icon: '➕',
    key: 'consider',
  };
}

/* ==========================================================================
   WEIGHTED SCORE WITH MISSING-DATA RENORMALIZATION
========================================================================== */

function calculateWeightedScore(
  components
) {
  let weightedTotal = 0;
  let availableWeight = 0;

  Object.entries(
    WEIGHTS
  ).forEach(
    ([key, weight]) => {
      const score =
        components[key]?.score;

      /*
       * Missing data does NOT become 50.
       *
       * Instead, its weight is removed
       * and the remaining weights are
       * normalized back to 100%.
       */

      if (
        score === null ||
        score === undefined ||
        !Number.isFinite(
          Number(score)
        )
      ) {
        return;
      }

      weightedTotal +=
        Number(score) *
        weight;

      availableWeight +=
        weight;
    }
  );

  if (
    availableWeight <= 0
  ) {
    return {
      score: 0,
      availableWeight: 0,
    };
  }

  const normalizedScore =
    weightedTotal /
    availableWeight;

  return {
    score: Math.round(
      clamp(
        normalizedScore
      )
    ),
    availableWeight,
  };
}

/* ==========================================================================
   HIGH / LOW REASONS
========================================================================== */

function buildReasons(
  components
) {
  const items = [
    {
      key: 'rank',
      name:
        'Rank / Admission Fit',
      component:
        components.rank,
    },
    {
      key: 'branch',
      name:
        'Branch Preference',
      component:
        components.branch,
    },
    {
      key: 'quality',
      name:
        'College Quality',
      component:
        components.quality,
    },
    {
      key: 'reviews',
      name:
        'Student Reviews',
      component:
        components.reviews,
    },
    {
      key: 'budget',
      name:
        'Budget',
      component:
        components.budget,
    },
    {
      key: 'location',
      name:
        'Location',
      component:
        components.location,
    },
  ];

  /*
   * Strong factors.
   */

  const high =
    items
      .filter(
        (item) =>
          item.component?.score !==
            null &&
          item.component?.score !==
            undefined &&
          item.component.score >= 75
      )
      .sort(
        (a, b) =>
          b.component.score -
          a.component.score
      )
      .slice(0, 3)
      .map(
        (item) =>
          `${item.name}: ${item.component.reason}`
      );

  /*
   * Weak factors.
   */

  const low =
    items
      .filter(
        (item) =>
          item.component?.score !==
            null &&
          item.component?.score !==
            undefined &&
          item.component.score < 70
      )
      .sort(
        (a, b) =>
          a.component.score -
          b.component.score
      )
      .slice(0, 3)
      .map(
        (item) =>
          `${item.name}: ${item.component.reason}`
      );

  /*
   * Missing-data reasons.
   *
   * We show these separately so that
   * missing data is not falsely described
   * as a weakness.
   */

  const missing =
    items
      .filter(
        (item) =>
          item.component?.score ===
            null ||
          item.component?.score ===
            undefined
      )
      .map(
        (item) =>
          `${item.name}: ${item.component.reason}`
      )
      .slice(0, 3);

  return {
    high,
    low,
    missing,
  };
}

/* ==========================================================================
   MAIN PREMIUM CALCULATION
========================================================================== */

export function calculatePremiumRecommendation(
  row,
  profile
) {
  const rank =
    calculateRankScore(
      row,
      profile
    );

  const branch =
    calculateBranchScore(
      row,
      profile
    );

  const quality =
    calculateQualityScore(
      row
    );

  const reviews =
    calculateReviewScore(
      row
    );

  const budget =
    calculateBudgetScore(
      row,
      profile
    );

  const location =
    calculateLocationScore(
      row,
      profile
    );

  const components = {
    rank,
    branch,
    quality,
    reviews,
    budget,
    location,
  };

  /*
   * Calculate weighted score.
   */

  const weighted =
    calculateWeightedScore(
      components
    );

  const finalScore =
    weighted.score;

  const category =
    getPremiumCategory(
      finalScore
    );

  const reasons =
    buildReasons(
      components
    );

  /*
   * Historical rank fit.
   */

  let historicalLabel =
    'Historical rank fit unavailable.';

  if (
    rank.rankRatio !== null
  ) {
    if (
      rank.rankRatio <= 0.60
    ) {
      historicalLabel =
        'Very strong historical rank position.';
    } else if (
      rank.rankRatio <= 0.85
    ) {
      historicalLabel =
        'Strong historical rank position.';
    } else if (
      rank.rankRatio <= 1.05
    ) {
      historicalLabel =
        'Competitive historical rank position.';
    } else {
      historicalLabel =
        'Aspirational historical rank position.';
    }
  }

  return {
    ...row,

    premium: {
      finalScore,

      premiumCategory:
        category,

      collegeName:
        row?.college?.name ||
        row?.college_name ||
        row?.collegeName ||
        'College',

      branchName:
        getBranchName(row),

      components,

      reasons,

      historicalFit: {
        label:
          historicalLabel,

        rankRatio:
          rank.rankRatio,

        studentRank:
          rank.studentRank,

        openingRank:
          rank.openingRank,

        closingRank:
          rank.closingRank,
      },

      /*
       * Original weights.
       */

      weights: {
        rank: 50,
        branch: 15,
        quality: 15,
        reviews: 10,
        budget: 7,
        location: 3,
      },

      /*
       * How much actual data was
       * available for this score.
       */

      dataCoverage:
        Math.round(
          weighted.availableWeight *
            100
        ),
    },
  };
}

/* ==========================================================================
   ADD PREMIUM SCORES
========================================================================== */

export function addPremiumScores(
  rows,
  profile
) {
  if (
    !Array.isArray(rows)
  ) {
    return [];
  }

  return rows.map(
    (row) =>
      calculatePremiumRecommendation(
        row,
        profile
      )
  );
}

/* ==========================================================================
   SORT BY PREMIUM SCORE
========================================================================== */

export function sortByPremiumScore(
  rows
) {
  if (
    !Array.isArray(rows)
  ) {
    return [];
  }

  return [...rows].sort(
    (a, b) =>
      Number(
        b?.premium?.finalScore || 0
      ) -
      Number(
        a?.premium?.finalScore || 0
      )
  );
}