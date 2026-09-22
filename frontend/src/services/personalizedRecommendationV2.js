/*
|--------------------------------------------------------------------------
| TRUMARG PERSONALIZED RECOMMENDATION V2 — SHADOW ENGINE
|--------------------------------------------------------------------------
|
| Production-safe first integration.
|
| Existing premium.score / ranking is NOT overwritten yet.
|
| New result:
|
| row.personalizedV2
|
| Formula:
|
| Branch Preference             24%
| Institute Quality             18%
| High Demand                   10%
| Multi-source Review Sentiment 30%
| Value for Money               11%
| Location                       7%
|
|--------------------------------------------------------------------------
*/


export const PERSONALIZED_V2_WEIGHTS = {
  branch: 24,
  quality: 18,
  demand: 10,
  reviews: 30,
  valueForMoney: 11,
  location: 7,
};


const REVIEW_MIN_EFFECTIVE =
  50;

const REVIEW_MIN_SOURCES =
  3;


/*
|--------------------------------------------------------------------------
| REQUIRED REVIEW ASPECTS
|--------------------------------------------------------------------------
|
| Missing aspect is evidence missing.
| It must NEVER disappear from the denominator.
|
|--------------------------------------------------------------------------
*/

const REQUIRED_REVIEW_ASPECTS = [
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


/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/


function num(
  value
) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null;
  }


  const parsed =
    Number(
      value
    );


  return Number.isFinite(
    parsed
  )
    ? parsed
    : null;
}


function clamp(
  value,
  minimum = 0,
  maximum = 100
) {
  return Math.min(
    maximum,
    Math.max(
      minimum,
      value
    )
  );
}


function pct(
  value
) {
  const parsed =
    num(
      value
    );

  return parsed === null
    ? null
    : clamp(
        parsed
      );
}


function normalize(
  value
) {
  return String(
    value ?? ''
  )
    .trim()
    .toLowerCase();
}


/*
|--------------------------------------------------------------------------
| OLD PREMIUM COMPONENT -> 0..100
|--------------------------------------------------------------------------
|
| Prefer componentScores because they are already raw percentages.
|
| Otherwise convert old weighted contribution:
|
| branch  15
| quality 15
| reviews 10
| budget   7
| location 3
|
|--------------------------------------------------------------------------
*/


function rawComponent(
  row,
  key,
  oldMaximum
) {
  const premium =
    row?.premium || {};


  const direct =
    pct(
      premium
        ?.componentScores
        ?.[key]
    );


  if (
    direct !== null
  ) {
    return direct;
  }


  const contribution =
    num(
      premium
        ?.breakdown
        ?.[key]
    );


  if (
    contribution === null ||
    !oldMaximum
  ) {
    return null;
  }


  return clamp(
    (
      contribution /
      oldMaximum
    ) *
    100
  );
}


/*
|--------------------------------------------------------------------------
| CUTOFF HELPERS
|--------------------------------------------------------------------------
*/


function closingRank(
  row
) {
  return (
    num(
      row
        ?.lastRoundClosingRank
    ) ??
    num(
      row
        ?.last_round_closing_rank
    ) ??
    num(
      row
        ?.admission
        ?.lastRoundClosingRank
    ) ??
    num(
      row
        ?.historicalFit
        ?.closingRank
    ) ??
    num(
      row
        ?.branch
        ?.closingRank
    ) ??
    num(
      row
        ?.closingRank
    ) ??
    num(
      row
        ?.closing_rank
    )
  );
}


function cohortKey(
  row,
  profile
) {
  return [
    normalize(
      row?.examId ??
      row?.exam_id ??
      profile?.examId
    ),

    normalize(
      row?.year ??
      profile?.year
    ),

    normalize(
      row?.category ??
      row?.branch?.category ??
      profile?.category
    ),

    normalize(
      row?.quota ??
      row?.branch?.quota ??
      profile?.quota
    ),

    normalize(
      row?.gender ??
      row?.branch?.gender ??
      profile?.gender
    ),
  ].join(
    '|'
  );
}


/*
|--------------------------------------------------------------------------
| SELECTIVITY
|--------------------------------------------------------------------------
|
| Lower numerical closing rank
| = stronger selectivity within comparable cohort.
|
| This is NOT admission probability.
|
|--------------------------------------------------------------------------
*/


function selectivityScore(
  row,
  rows,
  profile
) {
  const target =
    closingRank(
      row
    );


  if (
    target === null ||
    target <= 0
  ) {
    return null;
  }


  const key =
    cohortKey(
      row,
      profile
    );


  const cohort =
    rows
      .filter(
        candidate =>
          cohortKey(
            candidate,
            profile
          ) === key
      )
      .map(
        closingRank
      )
      .filter(
        value =>
          value !== null &&
          value > 0
      )
      .sort(
        (
          left,
          right
        ) =>
          left - right
      );


  if (
    cohort.length <
    20
  ) {
    return null;
  }


  const position =
    cohort.filter(
      value =>
        value <= target
    ).length;


  const percentile =
    position /
    cohort.length;


  return Math.round(
    clamp(
      (
        1 -
        percentile
      ) *
      100
    )
  );
}


/*
|--------------------------------------------------------------------------
| INSTITUTE QUALITY
|--------------------------------------------------------------------------
|
| Existing official/data-backed quality remains dominant.
|
| 75% current quality
| 25% cutoff selectivity
|
|--------------------------------------------------------------------------
*/


function qualityV2(
  row,
  rows,
  profile
) {
  const base =
    rawComponent(
      row,
      'quality',
      15
    );


  const selectivity =
    selectivityScore(
      row,
      rows,
      profile
    );


  if (
    base === null
  ) {
    return {
      score:
        null,

      base:
        null,

      cutoffSelectivity:
        selectivity,

      reason:
        'OFFICIAL_QUALITY_UNAVAILABLE',
    };
  }


  if (
    selectivity === null
  ) {
    return {
      score:
        Math.round(
          base
        ),

      base:
        Math.round(
          base
        ),

      cutoffSelectivity:
        null,

      reason:
        null,
    };
  }


  return {
    score:
      Math.round(
        clamp(
          base *
            0.75 +
          selectivity *
            0.25
        )
      ),

    base:
      Math.round(
        base
      ),

    cutoffSelectivity:
      selectivity,

    reason:
      null,
  };
}


/*
|--------------------------------------------------------------------------
| STRICT REVIEW V3 GATE
|--------------------------------------------------------------------------
|
| Existing backend Review V3 is authoritative evidence.
|
| Requirement:
|
| EVERY aspect:
|   >= 50 effective/review evidences
|   >= 3 independent sources
|
| We do NOT fake source concentration.
|
| Current frontend V3 payload does not expose per-source evidence counts
| for every aspect, therefore the <=60% single-source dominance rule is
| explicitly marked "not verifiable" instead of fabricated.
|
|--------------------------------------------------------------------------
*/


function strictReviewV3(
  row
) {
  const v3 =
    row
      ?.reviewIntelligenceV3;


  if (
    !v3 ||
    !v3.aspects ||
    typeof v3.aspects !==
      'object'
  ) {
    return {
      available:
        false,

      score:
        null,

      reason:
        'REVIEW_V3_UNAVAILABLE',

      readyAspects:
        0,

      requiredAspects:
        0,

      aspectChecks:
        {},
    };
  }


  const aspectChecks = {};


  let readyAspects =
    0;


  for (
    const aspect
    of REQUIRED_REVIEW_ASPECTS
  ) {
    const data =
      v3.aspects?.[aspect] ??
      null;
    const score =
      pct(
        data?.score
      );


    const effectiveCount =
      Math.max(
        0,
        num(
          data
            ?.effectiveReviewCount
        ) ??
        num(
          data
            ?.reviewCount
        ) ??
        0
      );


    const sourceCount =
      Math.max(
        0,
        num(
          data
            ?.effectiveSourceCount
        ) ??
        num(
          data
            ?.sourceCount
        ) ??
        0
      );


    const countPass =
      effectiveCount >=
      REVIEW_MIN_EFFECTIVE;


    const sourcesPass =
      sourceCount >=
      REVIEW_MIN_SOURCES;


    const scorePass =
      score !== null;


    const maxSourceShare =
      num(
        data
          ?.maxSourceShare
      );


    const sourceDominanceVerified =
      typeof data
        ?.sourceDominancePass ===
        'boolean' &&
      maxSourceShare !==
        null;


    const sourceDominancePass =
      sourceDominanceVerified &&
      data
        .sourceDominancePass ===
        true &&
      maxSourceShare <=
        0.60;


    const ready =
      countPass &&
      sourcesPass &&
      scorePass &&
      sourceDominancePass;


    if (
      ready
    ) {
      readyAspects +=
        1;
    }


    aspectChecks[
      aspect
    ] = {
      ready,

      score,

      effectiveReviewCount:
        effectiveCount,

      sourceCount,

      minimumEffectiveReviews:
        REVIEW_MIN_EFFECTIVE,

      minimumSources:
        REVIEW_MIN_SOURCES,

      maxSourceShare,

      maximumAllowedSourceShare:
        0.60,

      sourceDominanceVerified,

      sourceDominancePass,

      sourceDistribution:
        Array.isArray(
          data
            ?.sourceDistribution
        )
          ? data
              .sourceDistribution
          : [],
    };
  }


  const allReady =
    readyAspects ===
    REQUIRED_REVIEW_ASPECTS.length;


  /*
  |--------------------------------------------------------------------------
  | Use backend V3 score only after ALL aspect gates pass.
  |--------------------------------------------------------------------------
  */


  const score =
    allReady
      ? pct(
          v3.score
        )
      : null;


  return {
    available:
      allReady &&
      score !== null,

    score,

    readyAspects,

    requiredAspects:
      REQUIRED_REVIEW_ASPECTS.length,

    minimumEffectiveReviewsPerAspect:
      REVIEW_MIN_EFFECTIVE,

    minimumSourcesPerAspect:
      REVIEW_MIN_SOURCES,

    sourceDominanceRule:
      'MAX_SINGLE_SOURCE_SHARE_60_PERCENT',

    aspectChecks,

    reason:
      allReady
        ? null
        : 'STRICT_ASPECT_EVIDENCE_GATE_NOT_MET',
  };
}


/*
|--------------------------------------------------------------------------
| HIGH DEMAND
|--------------------------------------------------------------------------
|
| Demand uses independent demand signals.
|
| It does NOT use cutoff selectivity again.
|
|--------------------------------------------------------------------------
*/


function highDemand(
  row
) {
  const applicantPressure =
    (() => {
      const ratio =
        num(
          row
            ?.demand
            ?.applicantsPerSeat ??
          row
            ?.applicantsPerSeat ??
          row
            ?.applicants_per_seat
        );


      if (
        ratio === null ||
        ratio <= 0
      ) {
        return null;
      }


      return clamp(
        (
          Math.log1p(
            ratio
          ) /
          Math.log1p(
            20
          )
        ) *
        100
      );
    })();


  const seatFill =
    (() => {
      const round =
        num(
          row
            ?.demand
            ?.roundFilled ??
          row
            ?.roundFilled ??
          row
            ?.round_filled
        );


      if (
        round === null ||
        round <= 0
      ) {
        return null;
      }


      if (round <= 1) return 100;
      if (round <= 2) return 90;
      if (round <= 3) return 75;
      if (round <= 4) return 60;
      if (round <= 5) return 45;

      return 30;
    })();


  const trend =
    (() => {
      const value =
        num(
          row
            ?.demand
            ?.trendPercent ??
          row
            ?.demandTrendPercent ??
          row
            ?.demand_trend_percent
        );


      if (
        value === null
      ) {
        return null;
      }


      return clamp(
        50 +
        value *
          2
      );
    })();


  const preference =
    pct(
      row
        ?.demand
        ?.preferenceIntensity ??
      row
        ?.preferenceIntensity ??
      row
        ?.preference_intensity
    );


  const factors = {
    applicantPressure,
    seatFill,
    trend,
    preferenceIntensity:
      preference,
  };


  const weights = {
    applicantPressure:
      40,

    seatFill:
      25,

    trend:
      15,

    preferenceIntensity:
      20,
  };


  let earned = 0;
  let availableWeight = 0;
  let availableFactors = 0;


  for (
    const [
      key,
      weight,
    ]
    of Object.entries(
      weights
    )
  ) {
    const value =
      factors[
        key
      ];


    if (
      value === null
    ) {
      continue;
    }


    earned +=
      value *
      weight;

    availableWeight +=
      weight;

    availableFactors +=
      1;
  }


  /*
  | Demand is unavailable unless at least
  | TWO independent signals exist.
  */


  if (
    availableFactors <
      2 ||
    availableWeight <=
      0
  ) {
    return {
      available:
        false,

      score:
        null,

      factors,

      availableFactors,

      reason:
        'INSUFFICIENT_DEMAND_EVIDENCE',
    };
  }


  return {
    available:
      true,

    score:
      Math.round(
        clamp(
          earned /
          availableWeight
        )
      ),

    factors,

    availableFactors,

    reason:
      null,
  };
}


/*
|--------------------------------------------------------------------------
| VALUE FOR MONEY
|--------------------------------------------------------------------------
|
| Until a dedicated VFM service becomes authoritative:
|
| current Budget Fit is used only as a TRANSPARENT proxy.
|
|--------------------------------------------------------------------------
*/


function valueForMoney(
  row
) {
  const direct =
    pct(
      row
        ?.valueForMoneyScore ??
      row
        ?.value_for_money_score ??
      row
        ?.premium
        ?.componentScores
        ?.valueForMoney
    );


  if (
    direct !== null
  ) {
    return {
      score:
        direct,

      source:
        'DIRECT_VFM',
    };
  }


  const budgetProxy =
    rawComponent(
      row,
      'budget',
      7
    );


  return {
    score:
      budgetProxy,

    source:
      budgetProxy === null
        ? null
        : 'BUDGET_FIT_PROXY',
  };
}


/*
|--------------------------------------------------------------------------
| WEIGHTED MATCH WITH MISSING-DATA RENORMALIZATION
|--------------------------------------------------------------------------
*/


function weightedScore(
  components
) {
  let earned = 0;
  let availableWeight = 0;


  for (
    const [
      key,
      weight,
    ]
    of Object.entries(
      PERSONALIZED_V2_WEIGHTS
    )
  ) {
    const score =
      pct(
        components[
          key
        ]
      );


    if (
      score === null
    ) {
      continue;
    }


    earned +=
      score *
      weight;

    availableWeight +=
      weight;
  }


  if (
    availableWeight <=
    0
  ) {
    return {
      score:
        null,

      availableWeight:
        0,

      coverage:
        0,
    };
  }


  const rawScore =
    Math.round(
      clamp(
        earned /
        availableWeight
      )
    );


  const coverage =
    Math.round(
      availableWeight
    );


  const coverageRatio =
    clamp(
      coverage,
      0,
      100
    ) /
    100;


  const evidenceFactor =
    0.65 +
    (
      0.35 *
      coverageRatio
    );


  const rankingScore =
    Math.round(
      clamp(
        rawScore *
        evidenceFactor
      )
    );


  return {
    score:
      rawScore,

    rankingScore,

    evidenceFactor:
      Number(
        evidenceFactor.toFixed(
          4
        )
      ),

    availableWeight,

    coverage,
  };
}


/*
|--------------------------------------------------------------------------
| ONE ROW
|--------------------------------------------------------------------------
*/


function personalizeRow(
  row,
  rows,
  profile
) {
  const branch =
    rawComponent(
      row,
      'branch',
      15
    );


  const quality =
    qualityV2(
      row,
      rows,
      profile
    );


  const reviews =
    strictReviewV3(
      row
    );


  const demand =
    highDemand(
      row
    );


  const vfm =
    valueForMoney(
      row
    );


  const location =
    rawComponent(
      row,
      'location',
      3
    );


  const components = {
    branch,

    quality:
      quality.score,

    demand:
      demand.available
        ? demand.score
        : null,

    reviews:
      reviews.available
        ? reviews.score
        : null,

    valueForMoney:
      vfm.score,

    location,
  };


  const weighted =
    weightedScore(
      components
    );


  return {
    ...row,

    personalizedV2: {
      version:
        '2-shadow',

      score:
        weighted.score,

      rankingScore:
        weighted.rankingScore,

      evidenceFactor:
        weighted.evidenceFactor,

      coverage:
        weighted.coverage,

      availableWeight:
        weighted
          .availableWeight,

      weights:
        PERSONALIZED_V2_WEIGHTS,

      components,

      instituteQuality:
        quality,

      highDemand:
        demand,

      reviewSentiment:
        reviews,

      valueForMoneyMeta:
        vfm,

      cutoffSelectivity:
        quality
          .cutoffSelectivity,

      legacyScore:
        num(
          row
            ?.premium
            ?.score ??
          row
            ?.premium
            ?.finalScore
        ),

      shadowOnly:
        true,
    },
  };
}


/*
|--------------------------------------------------------------------------
| PUBLIC
|--------------------------------------------------------------------------
*/


export function applyPersonalizedV2Shadow(
  rows = [],
  profile = {}
) {
  if (
    !Array.isArray(
      rows
    )
  ) {
    return [];
  }


  return rows.map(
    row =>
      personalizeRow(
        row,
        rows,
        profile
      )
  );
}
