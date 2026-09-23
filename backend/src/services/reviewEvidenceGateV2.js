/*
|--------------------------------------------------------------------------
| TruMarg V2 - Multi Source Review + Sentiment Intelligence
|--------------------------------------------------------------------------
|
| STRICT REQUIREMENTS
|
| Per aspect:
|
| >= 50 effective evidences
| >= 3 independent sources
| no one source > 60% of effective evidence
|
| Sentiment is calculated PER SOURCE first.
| Sources are combined afterwards.
|
|--------------------------------------------------------------------------
*/


export const REVIEW_ASPECTS = [
  'placements',
  'faculty',
  'academics',
  'infrastructure',
  'hostel',
  'campus_life',
  'administration',
  'location',
  'value_for_money',
];


export const MIN_REVIEWS_PER_ASPECT =
  50;


export const MIN_SOURCES_PER_ASPECT =
  3;


export const MAX_SINGLE_SOURCE_SHARE =
  0.60;


/*
|--------------------------------------------------------------------------
| Source reliability
|--------------------------------------------------------------------------
|
| Values are evidence weights, not star ratings.
|
|--------------------------------------------------------------------------
*/

export const SOURCE_RELIABILITY = {
  official_student_survey:
    1.00,

  verified_student:
    1.00,

  verified_alumni:
    0.95,

  careers360:
    0.80,

  shiksha:
    0.80,

  collegedunia:
    0.75,

  google_reviews:
    0.65,

  reddit:
    0.55,

  quora:
    0.50,

  forum:
    0.45,

  unknown:
    0.35,
};


function clamp(
  value,
  min = 0,
  max = 100
) {
  return Math.min(
    max,
    Math.max(
      min,
      value
    )
  );
}


function numberOrNull(
  value
) {
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
}


function normalizeSource(
  value
) {
  return String(
    value ??
    'unknown'
  )
    .trim()
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      '_'
    );
}


/*
|--------------------------------------------------------------------------
| Sentiment input
|--------------------------------------------------------------------------
|
| Accepted forms:
|
| -1 ... +1
|
| OR
|
| positive / negative / neutral / mixed
|
|--------------------------------------------------------------------------
*/

function normalizeSentiment(
  evidence
) {
  const numeric =
    numberOrNull(
      evidence
        ?.sentimentScore
    );


  if (
    numeric !== null
  ) {
    return clamp(
      numeric,
      -1,
      1
    );
  }


  const label =
    String(
      evidence
        ?.sentiment ??
      ''
    )
      .trim()
      .toLowerCase();


  if (
    label ===
    'positive'
  ) {
    return 1;
  }


  if (
    label ===
    'negative'
  ) {
    return -1;
  }


  if (
    label ===
    'mixed'
  ) {
    return 0;
  }


  if (
    label ===
    'neutral'
  ) {
    return 0;
  }


  return null;
}


/*
|--------------------------------------------------------------------------
| Source-level aggregation
|--------------------------------------------------------------------------
*/

function aggregateSourceEvidence(
  evidences
) {
  let weightedSentiment = 0;
  let totalWeight = 0;
  let effectiveCount = 0;


  for (
    const evidence
    of evidences
  ) {
    /*
    | Drop known duplicates.
    */

    if (
      evidence
        ?.duplicateStatus ===
      'confirmed_duplicate'
    ) {
      continue;
    }


    const sentiment =
      normalizeSentiment(
        evidence
      );


    if (
      sentiment === null
    ) {
      continue;
    }


    const sourceKey =
      normalizeSource(
        evidence?.source
      );


    const reliability =
      SOURCE_RELIABILITY[
        sourceKey
      ] ??
      SOURCE_RELIABILITY
        .unknown;


    const evidenceWeight =
      numberOrNull(
        evidence
          ?.reliabilityWeight
      ) ??
      reliability;


    weightedSentiment +=
      sentiment *
      evidenceWeight;

    totalWeight +=
      evidenceWeight;

    effectiveCount +=
      evidenceWeight;
  }


  if (
    totalWeight <= 0
  ) {
    return null;
  }


  const meanSentiment =
    weightedSentiment /
    totalWeight;


  /*
  | Convert -1..+1 to 0..100
  */

  const score =
    (
      meanSentiment +
      1
    ) /
    2 *
    100;


  return {
    sentiment:
      Number(
        meanSentiment
          .toFixed(
            4
          )
      ),

    score:
      Math.round(
        clamp(
          score
        )
      ),

    effectiveCount:
      Number(
        effectiveCount
          .toFixed(
            2
          )
      ),
  };
}


/*
|--------------------------------------------------------------------------
| One aspect
|--------------------------------------------------------------------------
*/

export function buildAspectSentiment(
  evidences = []
) {
  const bySource =
    new Map();


  for (
    const evidence
    of evidences
  ) {
    const source =
      normalizeSource(
        evidence?.source
      );


    if (
      !bySource.has(
        source
      )
    ) {
      bySource.set(
        source,
        []
      );
    }


    bySource
      .get(
        source
      )
      .push(
        evidence
      );
  }


  const sources = [];


  for (
    const [
      source,
      rows,
    ]
    of bySource.entries()
  ) {
    const aggregate =
      aggregateSourceEvidence(
        rows
      );


    if (
      !aggregate
    ) {
      continue;
    }


    sources.push({
      source,
      ...aggregate,
    });
  }


  const totalEffectiveCount =
    sources.reduce(
      (
        sum,
        item
      ) =>
        sum +
        item.effectiveCount,
      0
    );


  if (
    totalEffectiveCount <
    MIN_REVIEWS_PER_ASPECT
  ) {
    return {
      available:
        false,

      score:
        null,

      sourceCount:
        sources.length,

      effectiveReviewCount:
        Number(
          totalEffectiveCount
            .toFixed(
              2
            )
        ),

      sources,

      reason:
        'MIN_50_EFFECTIVE_REVIEWS_NOT_MET',
    };
  }


  if (
    sources.length <
    MIN_SOURCES_PER_ASPECT
  ) {
    return {
      available:
        false,

      score:
        null,

      sourceCount:
        sources.length,

      effectiveReviewCount:
        Number(
          totalEffectiveCount
            .toFixed(
              2
            )
        ),

      sources,

      reason:
        'MIN_3_SOURCES_NOT_MET',
    };
  }


  const maxSourceShare =
    Math.max(
      ...sources.map(
        source =>
          source
            .effectiveCount /
          totalEffectiveCount
      )
    );


  if (
    maxSourceShare >
    MAX_SINGLE_SOURCE_SHARE
  ) {
    return {
      available:
        false,

      score:
        null,

      sourceCount:
        sources.length,

      effectiveReviewCount:
        Number(
          totalEffectiveCount
            .toFixed(
              2
            )
        ),

      maxSourceShare:
        Number(
          maxSourceShare
            .toFixed(
              4
            )
        ),

      sources,

      reason:
        'ONE_SOURCE_DOMINATES_EVIDENCE',
    };
  }


  /*
  |--------------------------------------------------------------------------
  | Cross-source sentiment
  |--------------------------------------------------------------------------
  |
  | Source means are aggregated using sqrt(count).
  |
  | This prevents 500 reviews from one source completely crushing
  | 60 + 70 reviews from two independent sources.
  |
  |--------------------------------------------------------------------------
  */

  let weightedScore = 0;
  let sourceWeightTotal = 0;


  for (
    const source
    of sources
  ) {
    const sourceWeight =
      Math.sqrt(
        source
          .effectiveCount
      );


    weightedScore +=
      source.score *
      sourceWeight;

    sourceWeightTotal +=
      sourceWeight;
  }


  const finalScore =
    weightedScore /
    sourceWeightTotal;


  /*
  |--------------------------------------------------------------------------
  | Cross-source agreement
  |--------------------------------------------------------------------------
  */

  const sourceScores =
    sources.map(
      item =>
        item.score
    );


  const mean =
    sourceScores.reduce(
      (
        sum,
        value
      ) =>
        sum +
        value,
      0
    ) /
    sourceScores.length;


  const variance =
    sourceScores.reduce(
      (
        sum,
        value
      ) =>
        sum +
        (
          value -
          mean
        ) ** 2,
      0
    ) /
    sourceScores.length;


  const standardDeviation =
    Math.sqrt(
      variance
    );


  const agreement =
    clamp(
      100 -
      standardDeviation *
      2
    );


  return {
    available:
      true,

    score:
      Math.round(
        clamp(
          finalScore
        )
      ),

    effectiveReviewCount:
      Number(
        totalEffectiveCount
          .toFixed(
            2
          )
      ),

    sourceCount:
      sources.length,

    sourceAgreement:
      Math.round(
        agreement
      ),

    maxSourceShare:
      Number(
        maxSourceShare
          .toFixed(
            4
          )
      ),

    sources,

    reason:
      null,
  };
}


/*
|--------------------------------------------------------------------------
| Overall Student Experience
|--------------------------------------------------------------------------
*/

export function buildReviewIntelligenceV2(
  evidences = []
) {
  const grouped =
    new Map();


  for (
    const aspect
    of REVIEW_ASPECTS
  ) {
    grouped.set(
      aspect,
      []
    );
  }


  for (
    const evidence
    of evidences
  ) {
    const aspect =
      String(
        evidence
          ?.aspect ??
        ''
      )
        .trim()
        .toLowerCase();


    if (
      !grouped.has(
        aspect
      )
    ) {
      continue;
    }


    grouped
      .get(
        aspect
      )
      .push(
        evidence
      );
  }


  const aspects = {};


  for (
    const aspect
    of REVIEW_ASPECTS
  ) {
    aspects[
      aspect
    ] =
      buildAspectSentiment(
        grouped.get(
          aspect
        )
      );
  }


  const readyAspects =
    REVIEW_ASPECTS
      .filter(
        aspect =>
          aspects[
            aspect
          ].available
      );


  /*
  | Strict rule:
  | every aspect must pass.
  */

  if (
    readyAspects.length !==
    REVIEW_ASPECTS.length
  ) {
    return {
      available:
        false,

      score:
        null,

      readyAspects:
        readyAspects.length,

      requiredAspects:
        REVIEW_ASPECTS.length,

      minimumReviewsPerAspect:
        MIN_REVIEWS_PER_ASPECT,

      minimumSourcesPerAspect:
        MIN_SOURCES_PER_ASPECT,

      aspects,

      reason:
        'REVIEW_EVIDENCE_INCOMPLETE',
    };
  }


  const weights = {
    placements:
      0.22,

    faculty:
      0.11,

    academics:
      0.11,

    infrastructure:
      0.10,

    hostel:
      0.08,

    campus_life:
      0.10,

    administration:
      0.08,

    location:
      0.07,

    value_for_money:
      0.13,
  };


  let score = 0;


  for (
    const [
      aspect,
      weight,
    ]
    of Object.entries(
      weights
    )
  ) {
    score +=
      aspects[
        aspect
      ].score *
      weight;
  }


  const averageAgreement =
    REVIEW_ASPECTS
      .reduce(
        (
          sum,
          aspect
        ) =>
          sum +
          aspects[
            aspect
          ]
            .sourceAgreement,
        0
      ) /
      REVIEW_ASPECTS.length;


  return {
    available:
      true,

    score:
      Math.round(
        clamp(
          score
        )
      ),

    sourceAgreement:
      Math.round(
        averageAgreement
      ),

    readyAspects:
      REVIEW_ASPECTS.length,

    requiredAspects:
      REVIEW_ASPECTS.length,

    minimumReviewsPerAspect:
      MIN_REVIEWS_PER_ASPECT,

    minimumSourcesPerAspect:
      MIN_SOURCES_PER_ASPECT,

    aspects,

    reason:
      null,
  };
}
