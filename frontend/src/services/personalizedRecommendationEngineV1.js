/*
|--------------------------------------------------------------------------
| TRUMARG PERSONALIZED RECOMMENDATION ENGINE V1
|--------------------------------------------------------------------------
|
| Admission bucket != personalized score != evidence confidence
|
| Admission window:
| R1 opening -> last available round closing
|
| Missing data:
| never redistributed / never artificially normalized.
|
|--------------------------------------------------------------------------
*/


export const TRUMARG_WEIGHTS = Object.freeze({
  admission: 50,
  branch: 15,
  quality: 15,
  reviews: 10,
  budget: 7,
  location: 3,
});


const BUCKETS =
  new Set([
    'dream',
    'target',
    'safe',
    'backup',
  ]);


/*
|--------------------------------------------------------------------------
| BASIC HELPERS
|--------------------------------------------------------------------------
*/


function num(value) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null;
  }

  const parsed =
    Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : null;
}


function clamp(
  value,
  minimum = 0,
  maximum = 100
) {
  const number =
    num(value);

  if (number === null) {
    return null;
  }

  return Math.max(
    minimum,
    Math.min(
      maximum,
      number
    )
  );
}


function round1(value) {
  const number =
    num(value);

  if (number === null) {
    return null;
  }

  return Math.round(
    number * 10
  ) / 10;
}


function normalizeBucket(value) {
  const key =
    String(
      value || ''
    )
      .trim()
      .toLowerCase();

  return BUCKETS.has(key)
    ? key
    : null;
}


function availableFactor(
  score,
  extraAvailable = true
) {
  const value =
    clamp(score);

  return {
    score:
      value,

    available:
      Boolean(
        extraAvailable &&
        value !== null
      ),
  };
}


/*
|--------------------------------------------------------------------------
| ADMISSION WINDOW
|--------------------------------------------------------------------------
|
| Canonical model:
|
| START = Round 1 opening rank
| END   = Last available round closing rank
|
|--------------------------------------------------------------------------
*/


export function classifyAdmissionWindow({
  studentRank,
  r1OpeningRank,
  lastRoundClosingRank,
}) {
  const rank =
    num(studentRank);

  const opening =
    num(r1OpeningRank);

  const closing =
    num(lastRoundClosingRank);


  if (
    rank === null ||
    rank <= 0 ||
    opening === null ||
    opening <= 0 ||
    closing === null ||
    closing <= 0
  ) {
    return {
      available: false,

      bucket: null,

      position: null,

      score: null,

      r1OpeningRank:
        opening,

      lastRoundClosingRank:
        closing,
    };
  }


  /*
  |--------------------------------------------------------------------------
  | Defensive fallback for malformed historical ranges
  |--------------------------------------------------------------------------
  */

  if (
    closing <= opening
  ) {
    const bucket =
      rank <= opening
        ? 'backup'
        : 'dream';

    return {
      available: true,

      bucket,

      position:
        rank <= opening
          ? 0
          : 1,

      score:
        rank <= opening
          ? 100
          : 0,

      r1OpeningRank:
        opening,

      lastRoundClosingRank:
        closing,
    };
  }


  /*
  |--------------------------------------------------------------------------
  | Student is stronger than R1 opening
  |--------------------------------------------------------------------------
  */

  if (
    rank <= opening
  ) {
    return {
      available: true,

      bucket:
        'backup',

      position:
        0,

      score:
        100,

      r1OpeningRank:
        opening,

      lastRoundClosingRank:
        closing,
    };
  }


  const position =
    (
      rank -
      opening
    ) /
    (
      closing -
      opening
    );


  /*
  |--------------------------------------------------------------------------
  | Continuous admission score
  |--------------------------------------------------------------------------
  |
  | position = 0 -> 100
  | position = 1 -> 35
  |
  */

  const insideScore =
    clamp(
      100 -
      (
        position *
        65
      )
    );


  let bucket;

  if (
    position <= 0.60
  ) {
    bucket =
      'safe';
  } else if (
    rank <= closing
  ) {
    bucket =
      'target';
  } else {
    bucket =
      'dream';
  }


  /*
  |--------------------------------------------------------------------------
  | Dream score
  |--------------------------------------------------------------------------
  |
  | Once outside final close,
  | gradually reduce below 35.
  |
  */

  let score =
    insideScore;

  if (
    rank > closing
  ) {
    const overflow =
      (
        rank -
        closing
      ) /
      Math.max(
        closing,
        1
      );

    score =
      clamp(
        35 -
        (
          overflow *
          70
        )
      );
  }


  /*
  |--------------------------------------------------------------------------
  | Keep bucket score bands internally consistent
  |--------------------------------------------------------------------------
  */

  if (
    bucket === 'backup'
  ) {
    score =
      Math.max(
        85,
        score ?? 85
      );
  }

  if (
    bucket === 'safe'
  ) {
    score =
      Math.max(
        65,
        Math.min(
          84,
          score ?? 65
        )
      );
  }

  if (
    bucket === 'target'
  ) {
    score =
      Math.max(
        35,
        Math.min(
          64,
          score ?? 35
        )
      );
  }

  if (
    bucket === 'dream'
  ) {
    score =
      Math.max(
        0,
        Math.min(
          34,
          score ?? 0
        )
      );
  }


  return {
    available: true,

    bucket,

    position:
      round1(
        position
      ),

    score:
      round1(
        score
      ),

    r1OpeningRank:
      opening,

    lastRoundClosingRank:
      closing,
  };
}


/*
|--------------------------------------------------------------------------
| BRANCH SCORE
|--------------------------------------------------------------------------
*/


function normalizeBranchText(value) {
  return String(
    value || ''
  )
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      ' '
    )
    .replace(
      /\s+/g,
      ' '
    )
    .trim();
}


function branchFamily(text) {
  const value =
    normalizeBranchText(
      text
    );

  if (!value) {
    return 'unknown';
  }


  if (
    /\bcomputer science\b|\bcse\b/.test(
      value
    )
  ) {
    return 'cse';
  }


  if (
    /\bartificial intelligence\b|\bmachine learning\b|\bai\b|\bdata science\b/.test(
      value
    )
  ) {
    return 'ai';
  }


  if (
    /\binformation technology\b|\bit\b/.test(
      value
    )
  ) {
    return 'it';
  }


  if (
    /\bmathematics and computing\b|\bmathematics computing\b|\bcomputational\b/.test(
      value
    )
  ) {
    return 'mnc';
  }


  if (
    /\belectronics\b|\bcommunication\b|\bece\b|\bvlsi\b/.test(
      value
    )
  ) {
    return 'ece';
  }


  if (
    /\belectrical\b|\beee\b/.test(
      value
    )
  ) {
    return 'electrical';
  }


  if (
    /\bmechanical\b/.test(
      value
    )
  ) {
    return 'mechanical';
  }


  if (
    /\bcivil\b/.test(
      value
    )
  ) {
    return 'civil';
  }


  if (
    /\barchitecture\b|\bplanning\b/.test(
      value
    )
  ) {
    return 'architecture';
  }


  return 'other';
}


const BRANCH_RELATIONS = {
  cse: {
    cse: 100,
    ai: 92,
    it: 90,
    mnc: 75,
    ece: 55,
    electrical: 40,
    mechanical: 25,
    civil: 20,
    architecture: 10,
    other: 35,
  },

  ai: {
    ai: 100,
    cse: 95,
    it: 88,
    mnc: 82,
    ece: 55,
    electrical: 40,
    mechanical: 25,
    civil: 20,
    architecture: 10,
    other: 35,
  },

  it: {
    it: 100,
    cse: 95,
    ai: 90,
    mnc: 75,
    ece: 55,
    electrical: 40,
    mechanical: 25,
    civil: 20,
    architecture: 10,
    other: 35,
  },

  mnc: {
    mnc: 100,
    cse: 85,
    ai: 85,
    it: 78,
    ece: 55,
    electrical: 45,
    mechanical: 30,
    civil: 25,
    architecture: 10,
    other: 40,
  },
};


export function calculateBranchPreferenceScore({
  branchName,
  preferredBranches = [],
  backendScore = null,
}) {
  const candidates =
    Array.isArray(
      preferredBranches
    )
      ? preferredBranches
          .map(
            normalizeBranchText
          )
          .filter(Boolean)
      : [];


  /*
  |--------------------------------------------------------------------------
  | If explicit preferences unavailable,
  | keep verified backend score.
  |--------------------------------------------------------------------------
  */

  if (!candidates.length) {
    return availableFactor(
      backendScore
    );
  }


  const candidateFamily =
    branchFamily(
      branchName
    );


  let best =
    0;


  for (
    const preferred
    of candidates
  ) {
    const preferredFamily =
      branchFamily(
        preferred
      );


    if (
      normalizeBranchText(
        branchName
      ) ===
      preferred
    ) {
      best =
        Math.max(
          best,
          100
        );

      continue;
    }


    const familyScores =
      BRANCH_RELATIONS[
        preferredFamily
      ];


    const score =
      familyScores?.[
        candidateFamily
      ] ??
      (
        preferredFamily ===
        candidateFamily
          ? 100
          : 40
      );


    best =
      Math.max(
        best,
        score
      );
  }


  return availableFactor(
    best
  );
}


/*
|--------------------------------------------------------------------------
| QUALITY
|--------------------------------------------------------------------------
*/


function getQualityScore(row) {
  return availableFactor(
    row?.quality?.score ??
    row?.collegeQualityScore ??
    row?.qualityScore
  );
}


/*
|--------------------------------------------------------------------------
| REVIEW
|--------------------------------------------------------------------------
*/


function getReviewScore(row) {
  return availableFactor(
    row?.reviews?.score ??
    row?.reviewIntelligenceV3?.score ??
    row?.reviewScore
  );
}


/*
|--------------------------------------------------------------------------
| BUDGET
|--------------------------------------------------------------------------
*/


function calculateBudgetFactor({
  row,
  annualBudget,
}) {
  const existingScore =
    num(
      row?.budget?.score ??
      row?.budgetScore
    );


  const budget =
    num(
      annualBudget
    );


  const cost =
    num(
      row?.annualFee ??
      row?.annualFees ??
      row?.estimatedAnnualCost ??
      row?.fee?.annual ??
      row?.fees?.annual
    );


  /*
  |--------------------------------------------------------------------------
  | Prefer calculation from actual fee + user budget
  |--------------------------------------------------------------------------
  */

  if (
    budget !== null &&
    budget > 0 &&
    cost !== null &&
    cost >= 0
  ) {
    const ratio =
      cost /
      budget;


    let score;

    if (
      ratio <= 0.80
    ) {
      score =
        100;
    } else if (
      ratio <= 1
    ) {
      score =
        100 -
        (
          (
            ratio -
            0.80
          ) /
          0.20
        ) *
        10;
    } else if (
      ratio <= 1.20
    ) {
      score =
        90 -
        (
          (
            ratio -
            1
          ) /
          0.20
        ) *
        30;
    } else if (
      ratio <= 1.50
    ) {
      score =
        60 -
        (
          (
            ratio -
            1.20
          ) /
          0.30
        ) *
        40;
    } else {
      score =
        Math.max(
          0,
          20 -
          (
            (
              ratio -
              1.50
            ) *
            20
          )
        );
    }


    return availableFactor(
      round1(
        score
      )
    );
  }


  return availableFactor(
    existingScore
  );
}


/*
|--------------------------------------------------------------------------
| LOCATION
|--------------------------------------------------------------------------
*/


function calculateLocationFactor({
  row,
  preferredStates = [],
  homeState = null,
}) {
  const backendStatus =
    String(
      row?.location?.status ||
      ''
    )
      .trim()
      .toUpperCase();


  const backendScore =
    num(
      row?.location?.score ??
      row?.locationScore
    );


  const states =
    Array.isArray(
      preferredStates
    )
      ? preferredStates
          .map(
            (
              item
            ) =>
              String(
                item || ''
              )
                .trim()
                .toLowerCase()
          )
          .filter(Boolean)
      : [];


  const rowState =
    String(
      row?.state ??
      row?.college?.state ??
      ''
    )
      .trim()
      .toLowerCase();


  const normalizedHome =
    String(
      homeState || ''
    )
      .trim()
      .toLowerCase();


  /*
  |--------------------------------------------------------------------------
  | Explicit preferred state
  |--------------------------------------------------------------------------
  */

  if (
    rowState &&
    states.length
  ) {
    if (
      states.includes(
        rowState
      )
    ) {
      return availableFactor(
        100
      );
    }

    return availableFactor(
      50
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Home state can be soft location preference
  |--------------------------------------------------------------------------
  */

  if (
    rowState &&
    normalizedHome
  ) {
    return availableFactor(
      rowState ===
      normalizedHome
        ? 100
        : 50
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Existing verified backend location score
  |--------------------------------------------------------------------------
  */

  if (
    backendStatus ===
      'AVAILABLE' &&
    backendScore !== null
  ) {
    return availableFactor(
      backendScore
    );
  }


  /*
  |--------------------------------------------------------------------------
  | UNKNOWN != WEAK
  |--------------------------------------------------------------------------
  */

  return {
    score: null,
    available: false,
  };
}


/*
|--------------------------------------------------------------------------
| RAW WEIGHTED SCORE
|--------------------------------------------------------------------------
*/


function weightedContribution(
  factor,
  weight
) {
  if (
    !factor?.available ||
    factor?.score === null
  ) {
    return {
      contribution: 0,
      coveredWeight: 0,
    };
  }


  return {
    contribution:
      (
        factor.score /
        100
      ) *
      weight,

    coveredWeight:
      weight,
  };
}


function confidenceFromCoverage(
  coverage
) {
  const value =
    num(
      coverage
    ) ?? 0;


  if (
    value >= 90
  ) {
    return 'High';
  }


  if (
    value >= 75
  ) {
    return 'Good';
  }


  if (
    value >= 60
  ) {
    return 'Medium';
  }


  return 'Low';
}


function matchLabel(
  score
) {
  const value =
    num(
      score
    ) ?? 0;


  if (
    value >= 90
  ) {
    return 'Excellent Match';
  }


  if (
    value >= 80
  ) {
    return 'Great Match';
  }


  if (
    value >= 70
  ) {
    return 'Good Match';
  }


  if (
    value >= 55
  ) {
    return 'Consider';
  }


  return 'Weak Match';
}


/*
|--------------------------------------------------------------------------
| EXPLANATIONS
|--------------------------------------------------------------------------
*/


function buildReasons({
  admission,
  branch,
  quality,
  reviews,
  budget,
  location,
}) {
  const factors = [
    [
      'Admission Fit',
      admission,
    ],

    [
      'Branch Match',
      branch,
    ],

    [
      'College Quality',
      quality,
    ],

    [
      'Student Reviews',
      reviews,
    ],

    [
      'Budget',
      budget,
    ],

    [
      'Location',
      location,
    ],
  ];


  const strong = [];
  const weak = [];
  const missing = [];


  for (
    const [
      label,
      factor,
    ]
    of factors
  ) {
    if (
      !factor?.available ||
      factor?.score === null
    ) {
      missing.push(
        `${label}: verified data unavailable`
      );

      continue;
    }


    const score =
      Math.round(
        factor.score
      );


    if (
      score >= 75
    ) {
      strong.push(
        `${label}: ${score}/100`
      );
    } else if (
      score < 70
    ) {
      weak.push(
        `${label}: ${score}/100`
      );
    }
  }


  return {
    strong:
      strong.slice(
        0,
        4
      ),

    weak:
      weak.slice(
        0,
        4
      ),

    missing:
      missing.slice(
        0,
        6
      ),
  };
}


/*
|--------------------------------------------------------------------------
| EVIDENCE TRANSPARENCY
|--------------------------------------------------------------------------
*/


function buildEvidence({
  admission,
  branch,
  quality,
  reviews,
  budget,
  location,
}) {
  const entries = [
    [
      'Admission data',
      admission,
    ],

    [
      'Branch preference',
      branch,
    ],

    [
      'College quality',
      quality,
    ],

    [
      'Review intelligence',
      reviews,
    ],

    [
      'Budget / fee fit',
      budget,
    ],

    [
      'Location fit',
      location,
    ],
  ];


  const known = [];
  const missing = [];


  for (
    const [
      label,
      factor,
    ]
    of entries
  ) {
    if (
      factor?.available
    ) {
      known.push(
        label
      );
    } else {
      missing.push(
        label
      );
    }
  }


  return {
    known,
    missing,
  };
}


/*
|--------------------------------------------------------------------------
| ONE ROW
|--------------------------------------------------------------------------
*/


export function buildPersonalizedRecommendationV1(
  row,
  profile = {}
) {
  const studentRank =
    num(
      profile?.rank ??
      profile?.studentRank ??
      row?.studentRank ??
      row?.adaptedInput
        ?.studentRank
    );


  const r1OpeningRank =
    num(
      row?.r1OpeningRank ??
      row?.admission
        ?.r1OpeningRank ??
      row?.historicalFit
        ?.r1OpeningRank ??
      row?.openingRank ??
      row?.branch
        ?.openingRank
    );


  const lastRoundClosingRank =
    num(
      row?.lastRoundClosingRank ??
      row?.admission
        ?.lastRoundClosingRank ??
      row?.historicalFit
        ?.lastRoundClosingRank ??
      row?.closingRank ??
      row?.branch
        ?.closingRank
    );


  const admission =
    classifyAdmissionWindow({
      studentRank,
      r1OpeningRank,
      lastRoundClosingRank,
    });


  /*
  |--------------------------------------------------------------------------
  | If historical window unavailable,
  | use backend admission score without inventing a bucket.
  |--------------------------------------------------------------------------
  */

  if (
    !admission.available
  ) {
    const fallbackScore =
      num(
        row?.admission?.score
      );

    const fallbackBucket =
      normalizeBucket(
        row?.bucket ??
        row?.admission?.bucket
      );


    admission.score =
      clamp(
        fallbackScore
      );

    admission.bucket =
      fallbackBucket;

    admission.available =
      admission.score !== null;
  }


  const preferredBranches =
    profile?.preferredBranches ??
    profile?.branchPreferences ??
    profile?.branches ??
    [];


  const branch =
    calculateBranchPreferenceScore({
      branchName:
        row?.branchName ??
        row?.branch?.name,

      preferredBranches,

      backendScore:
        row?.branchFit?.score ??
        row?.branchPreferenceMatch
          ?.score,
    });


  const quality =
    getQualityScore(
      row
    );


  const reviews =
    getReviewScore(
      row
    );


  const budget =
    calculateBudgetFactor({
      row,

      annualBudget:
        profile?.annualBudget ??
        profile?.maximumAnnualBudget ??
        profile?.maxAnnualBudget,
    });


  const location =
    calculateLocationFactor({
      row,

      preferredStates:
        profile?.preferredStates ??
        profile?.states ??
        [],

      homeState:
        profile?.homeState,
    });


  const parts = {
    admission:
      weightedContribution(
        admission,
        TRUMARG_WEIGHTS
          .admission
      ),

    branch:
      weightedContribution(
        branch,
        TRUMARG_WEIGHTS
          .branch
      ),

    quality:
      weightedContribution(
        quality,
        TRUMARG_WEIGHTS
          .quality
      ),

    reviews:
      weightedContribution(
        reviews,
        TRUMARG_WEIGHTS
          .reviews
      ),

    budget:
      weightedContribution(
        budget,
        TRUMARG_WEIGHTS
          .budget
      ),

    location:
      weightedContribution(
        location,
        TRUMARG_WEIGHTS
          .location
      ),
  };


  const rawScore =
    Object.values(
      parts
    )
      .reduce(
        (
          total,
          item
        ) =>
          total +
          item.contribution,
        0
      );


  const coveredWeight =
    Object.values(
      parts
    )
      .reduce(
        (
          total,
          item
        ) =>
          total +
          item.coveredWeight,
        0
      );


  const score =
    round1(
      rawScore
    );


  const coverage =
    Math.round(
      coveredWeight
    );


  const confidence =
    confidenceFromCoverage(
      coverage
    );


  const reasons =
    buildReasons({
      admission,
      branch,
      quality,
      reviews,
      budget,
      location,
    });


  const evidence =
    buildEvidence({
      admission,
      branch,
      quality,
      reviews,
      budget,
      location,
    });


  const bucket =
    admission.bucket ??
    normalizeBucket(
      row?.bucket ??
      row?.admission?.bucket
    ) ??
    'dream';


  /*
  |--------------------------------------------------------------------------
  | UI-compatible weighted parts
  |--------------------------------------------------------------------------
  */

  const breakdown = {
    rank:
      round1(
        parts.admission
          .contribution
      ),

    branch:
      round1(
        parts.branch
          .contribution
      ),

    quality:
      quality.available
        ? round1(
            parts.quality
              .contribution
          )
        : null,

    reviews:
      reviews.available
        ? round1(
            parts.reviews
              .contribution
          )
        : null,

    budget:
      budget.available
        ? round1(
            parts.budget
              .contribution
          )
        : null,

    location:
      location.available
        ? round1(
            parts.location
              .contribution
          )
        : null,
  };


  return {
    ...row,


    /*
    |--------------------------------------------------------------------------
    | Canonical admission display
    |--------------------------------------------------------------------------
    */

    openingRank:
      r1OpeningRank ??
      row?.openingRank,

    closingRank:
      lastRoundClosingRank ??
      row?.closingRank,

    r1OpeningRank:
      r1OpeningRank,

    lastRoundClosingRank:
      lastRoundClosingRank,

    bucket,


    admission: {
      ...row?.admission,

      score:
        admission.score,

      bucket,

      r1OpeningRank:
        r1OpeningRank,

      lastRoundClosingRank:
        lastRoundClosingRank,

      position:
        admission.position,

      model:
        'R1_OPENING_TO_LAST_ROUND_CLOSING',
    },


    /*
    |--------------------------------------------------------------------------
    | Canonical factors
    |--------------------------------------------------------------------------
    */

    factors: {
      admission,
      branch,
      quality,
      reviews,
      budget,
      location,
    },


    /*
    |--------------------------------------------------------------------------
    | Overall
    |--------------------------------------------------------------------------
    */

    overall:
      score,

    matchScore:
      score,

    matchCategory:
      matchLabel(
        score
      ),

    confidenceLabel:
      confidence,

    confidenceScore:
      coverage,

    dataCoverage:
      coverage,


    /*
    |--------------------------------------------------------------------------
    | Evidence
    |--------------------------------------------------------------------------
    */

    evidenceTransparency:
      evidence,


    /*
    |--------------------------------------------------------------------------
    | Premium UI contract
    |--------------------------------------------------------------------------
    */

    premium: {
      ...row?.premium,

      score,

      finalScore:
        score,

      matchCategory:
        matchLabel(
          score
        ),

      confidenceScore:
        coverage,

      confidenceLabel:
        confidence,

      dataCoverage:
        coverage,

      admissionBucket: {
        key:
          bucket,

        label:
          bucket,
      },

      breakdown,

      reasons,

      evidenceTransparency:
        evidence,

      historicalFit: {
        ...row?.premium
          ?.historicalFit,

        label:
          lastRoundClosingRank
            ? `R1 opening ${Number(
                r1OpeningRank
              ).toLocaleString(
                'en-IN'
              )} to final closing ${Number(
                lastRoundClosingRank
              ).toLocaleString(
                'en-IN'
              )}.`
            : null,

        studentRank,

        r1OpeningRank,

        lastRoundClosingRank,

        position:
          admission.position,

        bucket,
      },
    },
  };
}


/*
|--------------------------------------------------------------------------
| RANK ALL
|--------------------------------------------------------------------------
*/


export function rankPersonalizedRecommendationsV1(
  rows = [],
  profile = {}
) {
  const enriched =
    rows
      .filter(Boolean)
      .map(
        (
          row
        ) =>
          buildPersonalizedRecommendationV1(
            row,
            profile
          )
      );


  /*
  |--------------------------------------------------------------------------
  | Global rank
  |--------------------------------------------------------------------------
  |
  | Score DESC
  | Coverage DESC
  | Admission score DESC
  |
  */

  const globallyRanked =
    [...enriched]
      .sort(
        (
          a,
          b
        ) => {
          const scoreDiff =
            (
              num(
                b?.matchScore
              ) ?? -1
            ) -
            (
              num(
                a?.matchScore
              ) ?? -1
            );

          if (
            scoreDiff !== 0
          ) {
            return scoreDiff;
          }


          const coverageDiff =
            (
              num(
                b?.dataCoverage
              ) ?? 0
            ) -
            (
              num(
                a?.dataCoverage
              ) ?? 0
            );

          if (
            coverageDiff !== 0
          ) {
            return coverageDiff;
          }


          return (
            num(
              b?.admission?.score
            ) ?? 0
          ) -
          (
            num(
              a?.admission?.score
            ) ?? 0
          );
        }
      )
      .map(
        (
          row,
          index
        ) => ({
          ...row,

          ranking: {
            ...row?.ranking,

            globalRank:
              index + 1,
          },
        })
      );


  /*
  |--------------------------------------------------------------------------
  | Bucket rank
  |--------------------------------------------------------------------------
  */

  const counters = {
    dream: 0,
    target: 0,
    safe: 0,
    backup: 0,
  };


  return globallyRanked.map(
    (
      row
    ) => {
      const bucket =
        normalizeBucket(
          row?.bucket
        ) ??
        'dream';


      counters[
        bucket
      ] += 1;


      return {
        ...row,

        ranking: {
          ...row?.ranking,

          bucketRank:
            counters[
              bucket
            ],

          bucket,
        },

        premium: {
          ...row?.premium,

          ranking: {
            globalRank:
              row?.ranking
                ?.globalRank,

            bucketRank:
              counters[
                bucket
              ],

            bucket,
          },
        },
      };
    }
  );
}


/*
|--------------------------------------------------------------------------
| SORT ONE BUCKET
|--------------------------------------------------------------------------
*/


export function sortPersonalizedBucketV1(
  rows = []
) {
  return [...rows]
    .sort(
      (
        a,
        b
      ) => {
        const scoreDiff =
          (
            num(
              b?.matchScore ??
              b?.premium?.score
            ) ?? -1
          ) -
          (
            num(
              a?.matchScore ??
              a?.premium?.score
            ) ?? -1
          );

        if (
          scoreDiff !== 0
        ) {
          return scoreDiff;
        }


        return (
          num(
            b?.dataCoverage ??
            b?.premium
              ?.dataCoverage
          ) ?? 0
        ) -
        (
          num(
            a?.dataCoverage ??
            a?.premium
              ?.dataCoverage
          ) ?? 0
        );
      }
    );
}
