import {
  CORE_TRAITS_BY_STAGE,
} from '../../data/careerTraitDefinitions.js';


/*
|--------------------------------------------------------------------------
| TruMarg Adaptive Assessment Limits V6
|--------------------------------------------------------------------------
|
| Large question bank != every student answers every question.
|
| minimum:
|   Earliest point at which assessment may finish.
|
| typicalTarget:
|   Preferred assessment length when evidence is reasonably stable.
|
| maximum:
|   Hard upper bound.
|--------------------------------------------------------------------------
*/

export const ASSESSMENT_LIMITS = Object.freeze({
  foundation: Object.freeze({
    minimum: 20,
    typicalTarget: 26,
    maximum: 32,
  }),

  class10: Object.freeze({
    minimum: 22,
    typicalTarget: 30,
    maximum: 36,
  }),

  'senior-secondary': Object.freeze({
    minimum: 24,
    typicalTarget: 32,
    maximum: 40,
  }),

  college: Object.freeze({
    minimum: 26,
    typicalTarget: 34,
    maximum: 44,
  }),

  graduate: Object.freeze({
    minimum: 26,
    typicalTarget: 34,
    maximum: 44,
  }),
});


const DEFAULT_LIMITS =
  ASSESSMENT_LIMITS.graduate;


/*
|--------------------------------------------------------------------------
| Confidence thresholds
|--------------------------------------------------------------------------
*/

const MIN_CORE_TRAIT_COVERAGE = 0.75;

const STRONG_CORE_TRAIT_COVERAGE = 0.85;

const MIN_TOP_CAREER_SEPARATION = 8;

const STRONG_TOP_CAREER_SEPARATION = 12;


/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

export function getAssessmentLimits(stage) {
  return (
    ASSESSMENT_LIMITS[stage] ||
    DEFAULT_LIMITS
  );
}


function getCoreTraits(stage) {
  const configured =
    CORE_TRAITS_BY_STAGE[stage];

  return Array.isArray(configured)
    ? configured
    : [];
}


function evidenceCountForTrait(
  traitEvidence,
  trait
) {
  return Number(
    traitEvidence?.[trait]
      ?.evidenceCount || 0
  );
}


/*
|--------------------------------------------------------------------------
| Core trait coverage
|--------------------------------------------------------------------------
|
| A trait counts as measured after at least one valid item.
|
| We separately calculate "repeated coverage", where a trait has at least
| two independent answers.
|--------------------------------------------------------------------------
*/

function measuredCoreTraitRatio(
  stage,
  traitEvidence
) {
  const core =
    getCoreTraits(stage);

  if (!core.length) {
    return 1;
  }

  const measured =
    core.filter(
      (trait) =>
        evidenceCountForTrait(
          traitEvidence,
          trait
        ) >= 1
    ).length;

  return measured / core.length;
}


function repeatedCoreTraitRatio(
  stage,
  traitEvidence
) {
  const core =
    getCoreTraits(stage);

  if (!core.length) {
    return 1;
  }

  const repeated =
    core.filter(
      (trait) =>
        evidenceCountForTrait(
          traitEvidence,
          trait
        ) >= 2
    ).length;

  return repeated / core.length;
}


/*
|--------------------------------------------------------------------------
| Evidence depth
|--------------------------------------------------------------------------
*/

function calculateEvidenceDepth(
  traitEvidence
) {
  const entries =
    Object.values(
      traitEvidence || {}
    );

  if (!entries.length) {
    return {
      measuredTraits: 0,
      repeatedTraits: 0,
      totalEvidence: 0,
      averageEvidencePerMeasuredTrait: 0,
    };
  }

  const measured =
    entries.filter(
      (item) =>
        Number(
          item?.evidenceCount || 0
        ) > 0
    );

  const repeated =
    measured.filter(
      (item) =>
        Number(
          item?.evidenceCount || 0
        ) >= 2
    );

  const totalEvidence =
    measured.reduce(
      (sum, item) =>
        sum +
        Number(
          item?.evidenceCount || 0
        ),
      0
    );

  return {
    measuredTraits:
      measured.length,

    repeatedTraits:
      repeated.length,

    totalEvidence,

    averageEvidencePerMeasuredTrait:
      measured.length
        ? Number(
            (
              totalEvidence /
              measured.length
            ).toFixed(2)
          )
        : 0,
  };
}


/*
|--------------------------------------------------------------------------
| Contradiction detection
|--------------------------------------------------------------------------
|
| Current V5 bank has no reverse-scored items yet.
|
| This therefore detects very large disagreement between multiple items
| measuring the SAME trait.
|
| Example:
| evidence scores:
| 0 and 100
|
| spread = 100
|--------------------------------------------------------------------------
*/

function contradictionCount(
  traitEvidence
) {
  let contradictions = 0;

  for (
    const item
    of Object.values(
      traitEvidence || {}
    )
  ) {
    const evidence =
      Array.isArray(
        item?.evidence
      )
        ? item.evidence
        : [];

    if (
      evidence.length < 2
    ) {
      continue;
    }

    const scores =
      evidence
        .map(
          (entry) =>
            Number(
              entry?.score
            )
        )
        .filter(
          Number.isFinite
        );

    if (
      scores.length < 2
    ) {
      continue;
    }

    const spread =
      Math.max(...scores) -
      Math.min(...scores);

    if (
      spread >= 75
    ) {
      contradictions += 1;
    }
  }

  return contradictions;
}


/*
|--------------------------------------------------------------------------
| Career separation
|--------------------------------------------------------------------------
*/

function calculateCareerSeparation(
  careerMatches
) {
  const first =
    Number(
      careerMatches?.[0]
        ?.score || 0
    );

  const second =
    Number(
      careerMatches?.[1]
        ?.score || 0
    );

  return Math.max(
    0,
    first - second
  );
}


/*
|--------------------------------------------------------------------------
| Assessment state
|--------------------------------------------------------------------------
*/

export function evaluateAssessmentState({
  stage,
  answers = [],
  traitEvidence = {},
  careerMatches = [],
}) {
  const limits =
    getAssessmentLimits(stage);

  const answered =
    Array.isArray(answers)
      ? answers.length
      : 0;

  const coverage =
    measuredCoreTraitRatio(
      stage,
      traitEvidence
    );

  const repeatedCoverage =
    repeatedCoreTraitRatio(
      stage,
      traitEvidence
    );

  const evidenceDepth =
    calculateEvidenceDepth(
      traitEvidence
    );

  const contradictions =
    contradictionCount(
      traitEvidence
    );

  const separation =
    calculateCareerSeparation(
      careerMatches
    );


  /*
  |--------------------------------------------------------------------------
  | Completion gates
  |--------------------------------------------------------------------------
  */

  const enoughMinimum =
    answered >=
    limits.minimum;

  const reachedTypicalTarget =
    answered >=
    limits.typicalTarget;

  const reachedMaximum =
    answered >=
    limits.maximum;

  const acceptableCoverage =
    coverage >=
    MIN_CORE_TRAIT_COVERAGE;

  const strongCoverage =
    coverage >=
    STRONG_CORE_TRAIT_COVERAGE;

  const hasRepeatedEvidence =
    repeatedCoverage >= 0.5;

  const usefulSeparation =
    separation >=
    MIN_TOP_CAREER_SEPARATION;

  const strongSeparation =
    separation >=
    STRONG_TOP_CAREER_SEPARATION;

  const contradictionFree =
    contradictions === 0;


  /*
  |--------------------------------------------------------------------------
  | Adaptive stopping
  |--------------------------------------------------------------------------
  |
  | EARLY STABLE:
  | Student crossed minimum AND evidence is unusually strong.
  |
  | TYPICAL STABLE:
  | Student crossed normal target and evidence is sufficiently reliable.
  |
  | HARD STOP:
  | Never exceed stage maximum.
  |--------------------------------------------------------------------------
  */

  const earlyStable =
    enoughMinimum &&
    strongCoverage &&
    hasRepeatedEvidence &&
    contradictionFree &&
    strongSeparation;

  const typicalStable =
    reachedTypicalTarget &&
    acceptableCoverage &&
    hasRepeatedEvidence &&
    contradictions <= 1 &&
    usefulSeparation;

  const completed =
    reachedMaximum ||
    earlyStable ||
    typicalStable;


  /*
  |--------------------------------------------------------------------------
  | Confidence score
  |--------------------------------------------------------------------------
  |
  | This is assessment evidence confidence.
  |
  | It is NOT:
  | - IQ
  | - aptitude percentile
  | - personality percentile
  | - clinical psychometric validity score
  |--------------------------------------------------------------------------
  */

  const questionProgress =
    Math.min(
      1,
      answered /
        limits.typicalTarget
    );

  const repetitionQuality =
    Math.min(
      1,
      repeatedCoverage
    );

  const separationQuality =
    Math.min(
      1,
      separation / 15
    );

  const contradictionPenalty =
    Math.min(
      25,
      contradictions * 7
    );

  let score =
    questionProgress * 30 +
    coverage * 30 +
    repetitionQuality * 20 +
    separationQuality * 20 -
    contradictionPenalty;

  score =
    Math.round(
      Math.max(
        0,
        Math.min(
          100,
          score
        )
      )
    );


  let label =
    'Developing';

  if (
    score >= 85
  ) {
    label = 'High';
  } else if (
    score >= 70
  ) {
    label = 'Good';
  } else if (
    score >= 50
  ) {
    label = 'Moderate';
  }


  /*
  |--------------------------------------------------------------------------
  | Why assessment continues
  |--------------------------------------------------------------------------
  */

  const reasons = [];

  if (
    !enoughMinimum
  ) {
    reasons.push(
      `At least ${limits.minimum} answers are required for this assessment stage.`
    );
  }

  if (
    coverage <
    MIN_CORE_TRAIT_COVERAGE
  ) {
    reasons.push(
      'More core career traits need to be measured.'
    );
  }

  if (
    repeatedCoverage < 0.5
  ) {
    reasons.push(
      'More repeated evidence is needed across important traits.'
    );
  }

  if (
    contradictions > 0
  ) {
    reasons.push(
      'Some trait responses are inconsistent, so additional evidence may improve stability.'
    );
  }

  if (
    separation <
    MIN_TOP_CAREER_SEPARATION
  ) {
    reasons.push(
      'Top career directions are still too close to separate confidently.'
    );
  }


  return {
    completed,

    score,

    label,

    answered,

    minimum:
      limits.minimum,

    typicalTarget:
      limits.typicalTarget,

    maximum:
      limits.maximum,

    coreTraitCoverage:
      Number(
        coverage.toFixed(2)
      ),

    repeatedCoreTraitCoverage:
      Number(
        repeatedCoverage
          .toFixed(2)
      ),

    topCareerSeparation:
      Number(
        separation.toFixed(2)
      ),

    contradictions,

    measuredTraits:
      evidenceDepth
        .measuredTraits,

    repeatedTraits:
      evidenceDepth
        .repeatedTraits,

    totalEvidence:
      evidenceDepth
        .totalEvidence,

    averageEvidencePerMeasuredTrait:
      evidenceDepth
        .averageEvidencePerMeasuredTrait,

    reachedMinimum:
      enoughMinimum,

    reachedTypicalTarget,

    reachedMaximum,

    completionReason:
      reachedMaximum
        ? 'maximum-reached'
        : earlyStable
          ? 'high-confidence-early-stop'
          : typicalStable
            ? 'stable-after-typical-target'
            : null,

    continueReasons:
      completed
        ? []
        : reasons,
  };
}
