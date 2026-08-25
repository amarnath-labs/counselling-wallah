function toNumber(value) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}

function clamp(value, min = 0, max = 100) {
  return Math.max(
    min,
    Math.min(max, value)
  );
}

function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

function calculateRankRatio(
  studentRank,
  closingRank
) {
  const rank =
    toNumber(studentRank);

  const closing =
    toNumber(closingRank);

  if (
    rank === null ||
    closing === null ||
    closing <= 0
  ) {
    return null;
  }

  return rank / closing;
}

function calculateAdmissionBucket(
  ratio
) {
  if (
    ratio === null ||
    !Number.isFinite(ratio)
  ) {
    return null;
  }

  if (ratio <= 0.60) {
    return 'backup';
  }

  if (ratio <= 0.85) {
    return 'safe';
  }

  if (ratio <= 1.05) {
    return 'target';
  }

  return 'dream';
}

function calculateRankScore(
  ratio
) {
  if (
    ratio === null ||
    !Number.isFinite(ratio)
  ) {
    return null;
  }

  if (ratio <= 0) {
    return 100;
  }

  if (ratio <= 0.60) {
    return Math.round(
      clamp(
        100 -
          (ratio / 0.60) * 10
      )
    );
  }

  if (ratio <= 1.05) {
    return Math.round(
      clamp(
        90 -
          (
            (ratio - 0.60) /
            0.45
          ) *
            90
      )
    );
  }

  return 0;
}

function calculateWindowPosition(
  studentRank,
  openingRank,
  closingRank
) {
  const student =
    toNumber(studentRank);

  const opening =
    toNumber(openingRank);

  const closing =
    toNumber(closingRank);

  if (
    student === null ||
    opening === null ||
    closing === null ||
    closing <= opening
  ) {
    return null;
  }

  if (student <= opening) {
    return 0;
  }

  if (student >= closing) {
    return 1;
  }

  return (
    (student - opening) /
    (closing - opening)
  );
}

function getHistoricalFit(
  position
) {
  if (
    position === null ||
    !Number.isFinite(position)
  ) {
    return null;
  }

  if (position <= 0.10) {
    return {
      label:
        'Very Strong Historical Fit',
      level:
        'very-strong',
    };
  }

  if (position <= 0.40) {
    return {
      label:
        'Strong Historical Fit',
      level:
        'strong',
    };
  }

  if (position <= 0.80) {
    return {
      label:
        'Within Historical Range',
      level:
        'moderate',
    };
  }

  return {
    label:
      'Near Historical Cutoff',
    level:
      'near-cutoff',
  };
}

function branchMatches(
  actualBranch,
  preferredBranch
) {
  const actual =
    normalizeText(actualBranch);

  const preferred =
    normalizeText(preferredBranch);

  if (
    !actual ||
    !preferred
  ) {
    return false;
  }

  if (
    actual === preferred ||
    actual.includes(preferred) ||
    preferred.includes(actual)
  ) {
    return true;
  }

  const aliases = {
    cse: [
      'computer science',
      'computer science and engineering',
      'computer engineering',
    ],

    it: [
      'information technology',
    ],

    ece: [
      'electronics and communication',
      'electronics & communication',
    ],

    ee: [
      'electrical engineering',
    ],
  };

  const list =
    aliases[preferred];

  if (!list) {
    return false;
  }

  return list.some(
    (alias) =>
      actual.includes(alias)
  );
}

function calculateBranchScore(
  branchName,
  preferredBranches
) {
  if (
    !Array.isArray(
      preferredBranches
    ) ||
    preferredBranches.length === 0
  ) {
    return null;
  }

  const index =
    preferredBranches.findIndex(
      (preferred) =>
        branchMatches(
          branchName,
          preferred
        )
    );

  if (index === -1) {
    return 0;
  }

  const scores = [
    100,
    90,
    80,
    70,
  ];

  return scores[index] ?? 60;
}

function calculateBudgetScore(
  fees,
  budget
) {
  const fee =
    toNumber(fees);

  const maxBudget =
    toNumber(budget);

  if (
    fee === null ||
    fee <= 0 ||
    maxBudget === null ||
    maxBudget <= 0
  ) {
    return null;
  }

  const ratio =
    fee / maxBudget;

  if (ratio <= 0.80) {
    return 100;
  }

  if (ratio <= 1) {
    return Math.round(
      clamp(
        100 -
          (
            (ratio - 0.80) /
            0.20
          ) *
            40
      )
    );
  }

  return 0;
}

function calculateLocationScore(
  collegeState,
  preferredState,
  homeState
) {
  const college =
    normalizeText(collegeState);

  const preferred =
    normalizeText(preferredState);

  const home =
    normalizeText(homeState);

  if (!college) {
    return null;
  }

  if (
    preferred &&
    preferred !== 'any'
  ) {
    return college === preferred
      ? 100
      : 30;
  }

  if (home) {
    return college === home
      ? 80
      : 40;
  }

  return null;
}

function calculateQualityScore(
  row
) {
  const placement =
    toNumber(
      row?.branch?.placement
    );

  const median =
    toNumber(
      row?.branch?.median
    );

  const values = [];

  if (
    placement !== null &&
    placement > 0
  ) {
    values.push(
      clamp(placement)
    );
  }

  if (
    median !== null &&
    median > 0
  ) {
    values.push(
      clamp(
        (median / 2000000) *
          100
      )
    );
  }

  if (!values.length) {
    return null;
  }

  return Math.round(
    values.reduce(
      (sum, value) =>
        sum + value,
      0
    ) /
      values.length
  );
}

function calculateReviewScore(
  row
) {
  const rating =
    toNumber(
      row?.review_rating ??
      row?.rating
    );

  const reviewCount =
    toNumber(
      row?.review_count
    );

  if (
    rating === null ||
    reviewCount === null ||
    reviewCount <= 0
  ) {
    return null;
  }

  const C = 3.8;
  const m = 50;

  const adjusted =
    (
      reviewCount /
      (reviewCount + m)
    ) *
      rating +
    (
      m /
      (reviewCount + m)
    ) *
      C;

  return Math.round(
    clamp(
      (adjusted / 5) *
        100
    )
  );
}

function calculateWeightedScore(
  scores
) {
  const components = [
    {
      value: scores.rank,
      weight: 50,
    },
    {
      value: scores.branch,
      weight: 15,
    },
    {
      value: scores.quality,
      weight: 15,
    },
    {
      value: scores.reviews,
      weight: 10,
    },
    {
      value: scores.budget,
      weight: 7,
    },
    {
      value: scores.location,
      weight: 3,
    },
  ].filter(
    (item) =>
      Number.isFinite(
        item.value
      )
  );

  if (!components.length) {
    return null;
  }

  const availableWeight =
    components.reduce(
      (sum, item) =>
        sum + item.weight,
      0
    );

  const weightedTotal =
    components.reduce(
      (sum, item) =>
        sum +
        item.value *
          item.weight,
      0
    );

  return Math.round(
    weightedTotal /
      availableWeight
  );
}

function getPremiumCategory(
  score
) {
  if (
    !Number.isFinite(score)
  ) {
    return null;
  }

  if (score >= 90) {
    return {
      key: 'excellent',
      emoji: '💎',
      label:
        'Excellent Match',
    };
  }

  if (score >= 80) {
    return {
      key: 'great',
      emoji: '⭐',
      label:
        'Great Match',
    };
  }

  if (score >= 70) {
    return {
      key: 'good',
      emoji: '👍',
      label:
        'Good Match',
    };
  }

  return {
    key: 'consider',
    emoji: '➕',
    label:
      'Consider',
  };
}

function contribution(
  score,
  maxWeight
) {
  if (
    !Number.isFinite(score)
  ) {
    return null;
  }

  return Number(
    (
      score *
      maxWeight /
      100
    ).toFixed(1)
  );
}

function buildReasons(
  scores
) {
  const strong = [];
  const weak = [];

  if (
    Number.isFinite(
      scores.rank
    )
  ) {
    if (scores.rank >= 90) {
      strong.push(
        'Your rank is very strong compared with the historical cutoff.'
      );
    } else if (
      scores.rank >= 70
    ) {
      strong.push(
        'Your rank is within a competitive historical range.'
      );
    } else if (
      scores.rank < 50
    ) {
      weak.push(
        'The historical cutoff is competitive for your current rank.'
      );
    }
  }

  if (
    Number.isFinite(
      scores.branch
    )
  ) {
    if (scores.branch >= 90) {
      strong.push(
        'This matches one of your top preferred branches.'
      );
    } else if (
      scores.branch <= 60
    ) {
      weak.push(
        'This branch is lower than your selected preferences.'
      );
    }
  }

  if (
    Number.isFinite(
      scores.budget
    )
  ) {
    if (scores.budget >= 90) {
      strong.push(
        'Estimated fees fit comfortably within your budget.'
      );
    } else if (
      scores.budget === 0
    ) {
      weak.push(
        'Estimated fees exceed your selected budget.'
      );
    }
  }

  if (
    Number.isFinite(
      scores.location
    )
  ) {
    if (scores.location >= 80) {
      strong.push(
        'The college location matches your preference.'
      );
    } else if (
      scores.location <= 40
    ) {
      weak.push(
        'The college is outside your preferred location.'
      );
    }
  }

  return {
    strong,
    weak,
  };
}

export function calculatePremiumRecommendation(
  row,
  profile
) {
  const studentRank =
    toNumber(
      profile?.rank
    );

  const openingRank =
    toNumber(
      row?.branch?.openingRank
    );

  const closingRank =
    toNumber(
      row?.branch?.closingRank
    );

  const rankRatio =
    calculateRankRatio(
      studentRank,
      closingRank
    );

  const rankScore =
    calculateRankScore(
      rankRatio
    );

  const branchScore =
    calculateBranchScore(
      row?.branch?.name,
      profile?.branches
    );

  const qualityScore =
    calculateQualityScore(
      row
    );

  const reviewScore =
    calculateReviewScore(
      row
    );

  const budgetScore =
    calculateBudgetScore(
      row?.branch?.fees,
      profile?.budget
    );

  const locationScore =
    calculateLocationScore(
      row?.college?.state,
      profile?.prefState,
      profile?.homeState
    );

  const componentScores = {
    rank:
      rankScore,

    branch:
      branchScore,

    quality:
      qualityScore,

    reviews:
      reviewScore,

    budget:
      budgetScore,

    location:
      locationScore,
  };

  const finalScore =
    calculateWeightedScore(
      componentScores
    );

  const windowPosition =
    calculateWindowPosition(
      studentRank,
      openingRank,
      closingRank
    );

  return {
    score:
      finalScore,

    category:
      getPremiumCategory(
        finalScore
      ),

    admissionBucket:
      calculateAdmissionBucket(
        rankRatio
      ),

    rankRatio,

    windowPosition,

    historicalFit:
      getHistoricalFit(
        windowPosition
      ),

    componentScores,

    breakdown: {
      rank:
        contribution(
          rankScore,
          50
        ),

      branch:
        contribution(
          branchScore,
          15
        ),

      quality:
        contribution(
          qualityScore,
          15
        ),

      reviews:
        contribution(
          reviewScore,
          10
        ),

      budget:
        contribution(
          budgetScore,
          7
        ),

      location:
        contribution(
          locationScore,
          3
        ),
    },

    reasons:
      buildReasons(
        componentScores
      ),
  };
}
