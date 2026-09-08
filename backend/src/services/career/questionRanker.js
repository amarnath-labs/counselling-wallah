import {
  CORE_TRAITS_BY_STAGE,
} from '../../data/careerTraitDefinitions.js';


function normalize(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[./(),_-]+/g, ' ')
    .replace(/\s+/g, ' ');
}


function fuzzyMatch(
  value,
  candidates = []
) {
  const target =
    normalize(value);

  if (
    !target ||
    !candidates?.length
  ) {
    return false;
  }

  return candidates.some(
    (item) => {
      const candidate =
        normalize(item);

      return (
        candidate === target ||
        candidate.includes(target) ||
        target.includes(candidate)
      );
    }
  );
}


function listOverlap(
  values = [],
  candidates = []
) {
  if (
    !Array.isArray(values) ||
    !values.length ||
    !candidates?.length
  ) {
    return false;
  }

  return values.some(
    (value) =>
      fuzzyMatch(
        value,
        candidates
      )
  );
}


/*
|--------------------------------------------------------------------------
| Profile relevance
|--------------------------------------------------------------------------
|
| Board, subjects and interests influence ranking, but remain SOFT signals.
|
| This prevents the assessment from simply confirming what the student
| selected before answering any assessment questions.
|
|--------------------------------------------------------------------------
*/

function profileRelevance(
  question,
  profile
) {
  let points = 0;
  let possible = 0;


  const scalarChecks = [
    [
      profile.degree,
      question.degrees,
    ],

    [
      profile.branch ||
        profile.specialization,
      question.branches,
    ],

    [
      profile.stream,
      question.streams,
    ],

    [
      profile.goal,
      question.goals,
    ],

    [
      profile.board,
      question.boards,
    ],
  ];


  for (
    const [
      value,
      candidates,
    ]
    of scalarChecks
  ) {
    if (
      candidates?.length
    ) {
      possible += 1;

      if (
        fuzzyMatch(
          value,
          candidates
        )
      ) {
        points += 1;
      }
    }
  }


  const arrayChecks = [
    [
      profile.skills || [],
      question.skills,
    ],

    [
      profile.subjects || [],
      question.subjects,
    ],

    [
      [
        ...(profile.careerInterests || []),
        ...(profile.interestClusters || []),
      ],
      question.interestClusters,
    ],

    [
      profile.careerFamilies || [],
      question.careerFamilies,
    ],

    [
      profile.entranceExams ||
        profile.targetExams ||
        [],
      question.entranceExams,
    ],

    [
      profile.targetCourses || [],
      question.targetCourses,
    ],
  ];


  for (
    const [
      values,
      candidates,
    ]
    of arrayChecks
  ) {
    if (
      candidates?.length
    ) {
      possible += 1;

      if (
        listOverlap(
          values,
          candidates
        )
      ) {
        points += 1;
      }
    }
  }


  /*
  |--------------------------------------------------------------------------
  | Generic V5 question
  |--------------------------------------------------------------------------
  |
  | Still useful as fallback, but no longer receives maximum contextual
  | preference simply because it has no metadata restrictions.
  |
  */

  if (!possible) {
    return 0.75;
  }


  return points / possible;
}


/*
|--------------------------------------------------------------------------
| Context specificity
|--------------------------------------------------------------------------
|
| Populated by questionRetriever.js.
|
| Typical values:
|
| universal V5          -> ~0.20
| weak contextual       -> ~0.25-0.55
| matching contextual   -> ~0.70-0.95
|
|--------------------------------------------------------------------------
*/

function contextScore(
  question
) {
  const value =
    Number(
      question.contextSpecificity
    );

  if (
    !Number.isFinite(value)
  ) {
    return 0.2;
  }

  return Math.max(
    0,
    Math.min(
      1,
      value
    )
  );
}


/*
|--------------------------------------------------------------------------
| Class specificity
|--------------------------------------------------------------------------
|
| Hard safety is already handled in questionRetriever.js.
|
| Therefore a value of 1 means:
| exact/current-class targeted question.
|
| Generic legacy V5 questions remain usable at lower specificity.
|
|--------------------------------------------------------------------------
*/

function classScore(
  question
) {
  const value =
    Number(
      question.classSpecificity
    );

  if (
    !Number.isFinite(value)
  ) {
    return 0.3;
  }

  return Math.max(
    0,
    Math.min(
      1,
      value
    )
  );
}


/*
|--------------------------------------------------------------------------
| Trait evidence helpers
|--------------------------------------------------------------------------
*/

function evidenceCount(
  trait,
  traitEvidence
) {
  return Number(
    traitEvidence?.[trait]
      ?.evidenceCount || 0
  );
}


function traitConfidence(
  trait,
  traitEvidence
) {
  const confidence =
    Number(
      traitEvidence?.[trait]
        ?.confidence
    );

  return Number.isFinite(
    confidence
  )
    ? confidence
    : 0;
}


/*
|--------------------------------------------------------------------------
| Broad 16-trait coverage
|--------------------------------------------------------------------------
|
| Coverage remains the dominant early-assessment objective.
|
| Context/class metadata should choose the BEST question for an unseen
| trait, but must not prevent the system from measuring other traits.
|
|--------------------------------------------------------------------------
*/

function broadCoverageScore(
  question,
  profile,
  traitEvidence
) {
  const coreTraits =
    CORE_TRAITS_BY_STAGE[
      profile.stage
    ] || [];


  if (
    !coreTraits.includes(
      question.trait
    )
  ) {
    return 0.25;
  }


  const count =
    evidenceCount(
      question.trait,
      traitEvidence
    );


  if (count === 0) {
    return 1;
  }

  if (count === 1) {
    return 0.42;
  }

  if (count === 2) {
    return 0.22;
  }

  return 0.08;
}


/*
|--------------------------------------------------------------------------
| Uncertainty
|--------------------------------------------------------------------------
*/

function uncertainty(
  question,
  traitEvidence
) {
  const count =
    evidenceCount(
      question.trait,
      traitEvidence
    );


  if (count === 0) {
    return 1;
  }


  const confidence =
    traitConfidence(
      question.trait,
      traitEvidence
    );


  if (count === 1) {
    return 0.72;
  }

  if (count === 2) {
    return Math.max(
      0.35,
      1 - confidence
    );
  }

  return Math.max(
    0.1,
    1 - confidence
  );
}


/*
|--------------------------------------------------------------------------
| Career discrimination
|--------------------------------------------------------------------------
*/

function discrimination(
  question,
  careerMatches,
  responseRoutingEnabled = false
) {
  const isDiscriminator =
    question.purpose ===
      'discriminator' ||
    question.contextScope ===
      'career-discriminator';


  /*
  |--------------------------------------------------------------------------
  | No career evidence
  |--------------------------------------------------------------------------
  */

  if (
    !careerMatches?.length ||
    careerMatches.length < 2
  ) {
    return isDiscriminator
      ? 0.7
      : 0.45;
  }


  const first =
    Number(
      careerMatches[0]
        ?.score || 0
    );

  const second =
    Number(
      careerMatches[1]
        ?.score || 0
    );


  const gap =
    Math.abs(
      first - second
    );


  /*
  |--------------------------------------------------------------------------
  | Existing global discrimination baseline
  |--------------------------------------------------------------------------
  |
  | Preserve the previous ranking behaviour as the baseline.
  |
  */

  let baseScore;


  if (isDiscriminator) {
    if (gap <= 3) {
      baseScore = 1;
    }

    else if (gap <= 7) {
      baseScore = 0.9;
    }

    else if (gap <= 12) {
      baseScore = 0.72;
    }

    else {
      baseScore = 0.5;
    }
  }

  else if (gap <= 3) {
    baseScore = 0.72;
  }

  else if (gap <= 7) {
    baseScore = 0.62;
  }

  else if (gap <= 12) {
    baseScore = 0.5;
  }

  else {
    baseScore = 0.35;
  }


  /*
  |--------------------------------------------------------------------------
  | Anchor safety
  |--------------------------------------------------------------------------
  |
  | The anchor phase must remain comparable between students.
  |
  | Therefore answer-driven career routing is disabled during anchor
  | questions and the old discrimination score is returned unchanged.
  |
  */

  if (!responseRoutingEnabled) {
    return baseScore;
  }


  /*
  |--------------------------------------------------------------------------
  | Question-specific career relevance
  |--------------------------------------------------------------------------
  |
  | rankCareers() exposes strongestTraits for the leading career
  | hypotheses.
  |
  | A candidate question receives stronger discrimination value when
  | its trait can help confirm or challenge those hypotheses.
  |
  */

  const candidateTrait =
    String(
      question.trait || ''
    );


  if (!candidateTrait) {
    return baseScore;
  }


  let traitRelevance = 0;


  careerMatches
    .slice(0, 3)
    .forEach(
      (
        career,
        careerIndex
      ) => {
        const strongestTraits =
          Array.isArray(
            career?.strongestTraits
          )
            ? career.strongestTraits
            : [];


        strongestTraits.forEach(
          (
            item,
            traitIndex
          ) => {
            if (
              item?.trait !==
              candidateTrait
            ) {
              return;
            }


            /*
            | Higher career rank and stronger trait position
            | produce greater adaptive relevance.
            */

            const careerWeight =
              careerIndex === 0
                ? 1
                : careerIndex === 1
                  ? 0.82
                  : 0.66;


            const traitWeight =
              traitIndex === 0
                ? 1
                : traitIndex === 1
                  ? 0.88
                  : traitIndex === 2
                    ? 0.76
                    : 0.66;


            traitRelevance =
              Math.max(
                traitRelevance,
                careerWeight *
                  traitWeight
              );
          }
        );
      }
    );


  /*
  |--------------------------------------------------------------------------
  | Preserve broad measurement
  |--------------------------------------------------------------------------
  |
  | Questions unrelated to the current top career hypotheses remain
  | available because coverage, uncertainty and diversity may still
  | make them useful.
  |
  */

  if (traitRelevance === 0) {
    traitRelevance = 0.2;
  }


  const discriminatorBonus =
    isDiscriminator
      ? 0.05
      : 0;


  /*
  |--------------------------------------------------------------------------
  | Final question-specific discrimination signal
  |--------------------------------------------------------------------------
  */

  return Math.max(
    0,
    Math.min(
      1,
      baseScore * 0.35 +
        traitRelevance * 0.65 +
        discriminatorBonus
    )
  );
}


/*
|--------------------------------------------------------------------------
| Recent-answer relevance
|--------------------------------------------------------------------------
*/

function previousAnswerRelevance(
  question,
  recentTraits
) {
  if (!recentTraits.length) {
    return 0.6;
  }


  /*
  | Avoid asking the exact same trait immediately again.
  */

  if (
    recentTraits.includes(
      question.trait
    )
  ) {
    return 0.2;
  }


  const tags =
    (question.tags || [])
      .map(normalize);


  const related =
    recentTraits.some(
      (trait) =>
        tags.includes(
          normalize(trait)
        )
    );


  return related
    ? 0.8
    : 0.6;
}


/*
|--------------------------------------------------------------------------
| Diversity
|--------------------------------------------------------------------------
*/

function diversity(
  question,
  askedQuestions
) {
  const recent =
    askedQuestions.slice(-4);


  const recentSections =
    recent.map(
      (item) =>
        item.section
    );


  const recentTraits =
    recent.map(
      (item) =>
        item.trait
    );


  if (
    recentTraits.includes(
      question.trait
    )
  ) {
    return 0.15;
  }


  if (
    recentSections.includes(
      question.section
    )
  ) {
    return 0.65;
  }


  return 1;
}


/*
|--------------------------------------------------------------------------
| Priority
|--------------------------------------------------------------------------
|
| 5 = highest
| 1 = lowest
|
|--------------------------------------------------------------------------
*/

function priorityScore(
  question
) {
  const priority =
    Number(
      question.priority ?? 3
    );


  if (
    !Number.isFinite(
      priority
    )
  ) {
    return 0.6;
  }


  const bounded =
    Math.max(
      1,
      Math.min(
        5,
        priority
      )
    );


  return bounded / 5;
}


/*
|--------------------------------------------------------------------------
| Assessment phase
|--------------------------------------------------------------------------
*/

function determinePhase({
  profile,
  traitEvidence,
}) {
  const coreTraits =
    CORE_TRAITS_BY_STAGE[
      profile.stage
    ] || [];


  if (!coreTraits.length) {
    return 'adaptive';
  }


  const unseenCount =
    coreTraits.filter(
      (trait) =>
        evidenceCount(
          trait,
          traitEvidence
        ) === 0
    ).length;


  const repeatedCount =
    coreTraits.filter(
      (trait) =>
        evidenceCount(
          trait,
          traitEvidence
        ) >= 2
    ).length;


  /*
  |--------------------------------------------------------------------------
  | Phase 1
  |--------------------------------------------------------------------------
  |
  | Every canonical trait should receive initial evidence.
  |
  */

  if (unseenCount > 0) {
    return 'coverage';
  }


  /*
  |--------------------------------------------------------------------------
  | Phase 2
  |--------------------------------------------------------------------------
  |
  | Build second evidence for at least half of the canonical traits.
  |
  */

  if (
    repeatedCount <
    Math.ceil(
      coreTraits.length * 0.5
    )
  ) {
    return 'depth';
  }


  /*
  |--------------------------------------------------------------------------
  | Phase 3
  |--------------------------------------------------------------------------
  |
  | Resolve uncertainty and discriminate between close careers.
  |
  */

  return 'adaptive';
}


/*
|--------------------------------------------------------------------------
| Candidate ranking
|--------------------------------------------------------------------------
*/

export function rankQuestionCandidates({
  candidates = [],
  profile,
  traitEvidence = {},
  careerMatches = [],
  askedQuestions = [],
  responseRoutingEnabled = false,
}) {
  const recentTraits =
    askedQuestions
      .slice(-4)
      .map(
        (question) =>
          question.trait
      );


  const phase =
    determinePhase({
      profile,
      traitEvidence,
    });


  return candidates
    .map(
      (question) => {
        const profileScore =
          profileRelevance(
            question,
            profile
          );


        const coverageScore =
          broadCoverageScore(
            question,
            profile,
            traitEvidence
          );


        const uncertaintyScore =
          uncertainty(
            question,
            traitEvidence
          );


        const discriminationScore =
          discrimination(
            question,
            careerMatches,
            responseRoutingEnabled
          );


        const previousScore =
          previousAnswerRelevance(
            question,
            recentTraits
          );


        const diversityScore =
          diversity(
            question,
            askedQuestions
          );


        const priority =
          priorityScore(
            question
          );


        const context =
          contextScore(
            question
          );


        const exactClass =
          classScore(
            question
          );


        const stageScore =
          question.stage ===
            profile.stage
            ? 1
            : 0;


        let score;


        /*
        |--------------------------------------------------------------------------
        | COVERAGE PHASE
        |--------------------------------------------------------------------------
        |
        | Broad trait discovery stays strongest.
        |
        | Exact-class and contextual metadata are strong enough to prefer V6/V7
        | over an equivalent generic V5 question, but not strong enough to
        | destroy 16-trait coverage.
        |
        */

        if (
          phase ===
          'coverage'
        ) {
          score =
            coverageScore * 0.30 +
            uncertaintyScore * 0.14 +
            profileScore * 0.14 +
            exactClass * 0.12 +
            context * 0.10 +
            diversityScore * 0.07 +
            previousScore * 0.05 +
            discriminationScore * 0.03 +
            priority * 0.03 +
            stageScore * 0.02;
        }


        /*
        |--------------------------------------------------------------------------
        | DEPTH PHASE
        |--------------------------------------------------------------------------
        */

        else if (
          phase ===
          'depth'
        ) {
          score =
            uncertaintyScore * 0.22 +
            coverageScore * 0.18 +
            profileScore * 0.13 +
            exactClass * 0.11 +
            context * 0.10 +
            discriminationScore * 0.09 +
            diversityScore * 0.07 +
            previousScore * 0.04 +
            priority * 0.03 +
            stageScore * 0.03;
        }


        /*
        |--------------------------------------------------------------------------
        | ADAPTIVE PHASE
        |--------------------------------------------------------------------------
        */

        else {
          score =
            discriminationScore * 0.21 +
            uncertaintyScore * 0.20 +
            profileScore * 0.14 +
            context * 0.12 +
            exactClass * 0.10 +
            diversityScore * 0.07 +
            coverageScore * 0.06 +
            previousScore * 0.04 +
            priority * 0.03 +
            stageScore * 0.03;
        }


        return {
          ...question,

          retrievalScore:
            Number(
              score.toFixed(4)
            ),

          rankingPhase:
            phase,

          rankingSignals: {
            profile:
              Number(
                profileScore
                  .toFixed(3)
              ),

            coverage:
              Number(
                coverageScore
                  .toFixed(3)
              ),

            uncertainty:
              Number(
                uncertaintyScore
                  .toFixed(3)
              ),

            discrimination:
              Number(
                discriminationScore
                  .toFixed(3)
              ),

            diversity:
              Number(
                diversityScore
                  .toFixed(3)
              ),

            priority:
              Number(
                priority
                  .toFixed(3)
              ),

            contextSpecificity:
              Number(
                context
                  .toFixed(3)
              ),

            classSpecificity:
              Number(
                exactClass
                  .toFixed(3)
              ),

            metadataTier:
              Number(
                question.metadataTier ?? 4
              ),
          },
        };
      }
    )
    .sort(
      (a, b) => {
        if (
          b.retrievalScore !==
          a.retrievalScore
        ) {
          return (
            b.retrievalScore -
            a.retrievalScore
          );
        }


        return String(
          a.id
        ).localeCompare(
          String(
            b.id
          )
        );
      }
    );
}


