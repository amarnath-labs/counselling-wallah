import {
  calculateCutoffSelectivityScore,
  calculateCutoffSelectivityConfidence,
} from './cutoffSelectivityScorer.js';

import {
  buildReviewIntelligenceV2,
} from './reviewEvidenceGateV2.js';


/*
|--------------------------------------------------------------------------
| TruMarg Personalized Recommendation Engine V2
|--------------------------------------------------------------------------
|
| Admission feasibility and desirability remain SEPARATE.
|
| MATCH:
|
| Branch Preference       27
| Institute Quality       20
| Student Experience      33
| Value for Money         13
| Location                 7
|
|--------------------------------------------------------------------------
*/


const MATCH_WEIGHTS = {
  branch:
    27,

  quality:
    20,

  experience:
    33,

  valueForMoney:
    13,

  location:
    7,
};


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
    Number(
      value
    );


  return Number.isFinite(
    number
  )
    ? number
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


/*
|--------------------------------------------------------------------------
| Admission bucket
|--------------------------------------------------------------------------
|
| Preserve current locked bucket thresholds.
|
|--------------------------------------------------------------------------
*/

export function calculateAdmissionBucket({
  studentRank,
  round1OpeningRank,
  lastRoundClosingRank,
}) {
  const rank =
    numberOrNull(
      studentRank
    );

  const opening =
    numberOrNull(
      round1OpeningRank
    );

  const closing =
    numberOrNull(
      lastRoundClosingRank
    );


  if (
    rank === null ||
    opening === null ||
    closing === null ||
    rank <= 0 ||
    opening <= 0 ||
    closing <= 0
  ) {
    return {
      bucket:
        null,

      ratio:
        null,

      position:
        null,
    };
  }


  const ratio =
    rank /
    closing;


  let bucket;


  if (
    ratio <=
    0.60
  ) {
    bucket =
      'backup';
  }
  else if (
    ratio <=
    0.85
  ) {
    bucket =
      'safe';
  }
  else if (
    ratio <=
    1.05
  ) {
    bucket =
      'target';
  }
  else {
    bucket =
      'dream';
  }


  let position;


  if (
    rank <= opening
  ) {
    position =
      0;
  }
  else if (
    rank >= closing
  ) {
    position =
      1;
  }
  else if (
    closing >
    opening
  ) {
    position =
      (
        rank -
        opening
      ) /
      (
        closing -
        opening
      );
  }
  else {
    position =
      null;
  }


  return {
    bucket,

    ratio:
      Number(
        ratio.toFixed(
          4
        )
      ),

    position:
      position === null
        ? null
        : Number(
            position.toFixed(
              4
            )
          ),
  };
}


/*
|--------------------------------------------------------------------------
| Institute quality + cutoff selectivity
|--------------------------------------------------------------------------
|
| Official institute quality remains dominant.
|
| Selectivity = 25% of quality only.
|
| This avoids:
| "low cutoff == automatically best college".
|
|--------------------------------------------------------------------------
*/

function buildQualityScore({
  officialQualityScore,
  closingRank,
  cohortClosingRanks,
}) {
  const official =
    numberOrNull(
      officialQualityScore
    );


  const selectivity =
    calculateCutoffSelectivityScore({
      closingRank,
      cohortClosingRanks,
    });


  const selectivityConfidence =
    calculateCutoffSelectivityConfidence({
      cohortClosingRanks,
    });


  /*
  |--------------------------------------------------------------------------
  | Both available
  |--------------------------------------------------------------------------
  */

  if (
    official !== null &&
    selectivity !== null
  ) {
    return {
      score:
        Math.round(
          clamp(
            official *
              0.75 +
            selectivity *
              0.25
          )
        ),

      official:
        Math.round(
          clamp(
            official
          )
        ),

      cutoffSelectivity:
        selectivity,

      cutoffSelectivityConfidence:
        selectivityConfidence,
    };
  }


  /*
  |--------------------------------------------------------------------------
  | Official only
  |--------------------------------------------------------------------------
  */

  if (
    official !== null
  ) {
    return {
      score:
        Math.round(
          clamp(
            official
          )
        ),

      official:
        Math.round(
          clamp(
            official
          )
        ),

      cutoffSelectivity:
        null,

      cutoffSelectivityConfidence:
        0,
    };
  }


  /*
  |--------------------------------------------------------------------------
  | Selectivity only
  |--------------------------------------------------------------------------
  |
  | Do NOT treat selectivity alone as full quality evidence.
  |
  */

  if (
    selectivity !== null
  ) {
    return {
      score:
        Math.round(
          clamp(
            selectivity
          )
        ),

      official:
        null,

      cutoffSelectivity:
        selectivity,

      cutoffSelectivityConfidence:
        selectivityConfidence,

      proxyOnly:
        true,
    };
  }


  return {
    score:
      null,

    official:
      null,

    cutoffSelectivity:
      null,

    cutoffSelectivityConfidence:
      0,
  };
}


/*
|--------------------------------------------------------------------------
| Renormalized weighted score
|--------------------------------------------------------------------------
|
| Missing factors are excluded.
|
| Example:
|
| No review data:
| review weight does NOT become zero score.
|
| Remaining available factors are re-normalized.
|
|--------------------------------------------------------------------------
*/

function weightedAvailableScore(
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
      MATCH_WEIGHTS
    )
  ) {
    const score =
      numberOrNull(
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
    availableWeight <= 0
  ) {
    return {
      score:
        null,

      coverage:
        0,
    };
  }


  return {
    score:
      Math.round(
        clamp(
          earned /
          availableWeight
        )
      ),

    coverage:
      Math.round(
        (
          availableWeight /
          100
        ) *
        100
      ),
  };
}


/*
|--------------------------------------------------------------------------
| Main personalization
|--------------------------------------------------------------------------
*/

export function buildPersonalizedRecommendationV2({
  row,
  studentRank,
  branchScore,
  officialQualityScore,
  valueForMoneyScore,
  locationScore,
  reviewAspectMap,
  cohortClosingRanks = [],
}) {
  const round1OpeningRank =
    numberOrNull(
      row
        ?.round1_opening_rank ??
      row
        ?.round1OpeningRank ??
      row
        ?.opening_rank
    );


  const lastRoundClosingRank =
    numberOrNull(
      row
        ?.last_round_closing_rank ??
      row
        ?.lastRoundClosingRank ??
      row
        ?.closing_rank
    );


  const admission =
    calculateAdmissionBucket({
      studentRank,
      round1OpeningRank,
      lastRoundClosingRank,
    });


  const reviews =
    buildReviewIntelligenceV2(
      reviewAspectMap
    );


  const quality =
    buildQualityScore({
      officialQualityScore,

      closingRank:
        lastRoundClosingRank,

      cohortClosingRanks,
    });


  const components = {
    branch:
      numberOrNull(
        branchScore
      ),

    quality:
      numberOrNull(
        quality.score
      ),

    experience:
      reviews.available
        ? reviews.score
        : null,

    valueForMoney:
      numberOrNull(
        valueForMoneyScore
      ),

    location:
      numberOrNull(
        locationScore
      ),
  };


  const match =
    weightedAvailableScore(
      components
    );


  /*
  |--------------------------------------------------------------------------
  | Confidence
  |--------------------------------------------------------------------------
  */

  let confidence = 0;


  if (
    components.branch !==
    null
  ) {
    confidence +=
      MATCH_WEIGHTS.branch;
  }


  if (
    components.quality !==
    null
  ) {
    confidence +=
      MATCH_WEIGHTS.quality;
  }


  if (
    components.experience !==
    null
  ) {
    confidence +=
      MATCH_WEIGHTS.experience;
  }


  if (
    components.valueForMoney !==
    null
  ) {
    confidence +=
      MATCH_WEIGHTS.valueForMoney;
  }


  if (
    components.location !==
    null
  ) {
    confidence +=
      MATCH_WEIGHTS.location;
  }


  const confidenceLabel =
    confidence >= 85
      ? 'high'
      : confidence >= 65
        ? 'moderate'
        : confidence >= 45
          ? 'limited'
          : 'low';


  return {
    /*
    |--------------------------------------------------------------------------
    | Single canonical admission object
    |--------------------------------------------------------------------------
    */

    admission: {
      bucket:
        admission.bucket,

      ratio:
        admission.ratio,

      historicalPosition:
        admission.position,

      round1OpeningRank,

      lastRoundClosingRank,

      source:
        'round1-opening-to-last-round-closing',
    },


    /*
    |--------------------------------------------------------------------------
    | Personalised desirability
    |--------------------------------------------------------------------------
    */

    personalization: {
      score:
        match.score,

      coverage:
        match.coverage,

      confidence:
        confidence,

      confidenceLabel,

      components,

      weights:
        MATCH_WEIGHTS,

      instituteQuality:
        quality,

      reviewIntelligence:
        reviews,
    },
  };
}
