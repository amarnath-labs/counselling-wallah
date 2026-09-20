import {
  CORE_TRAITS_BY_STAGE,
} from '../../data/careerTraitDefinitions.js';


function normalize(value) {
  return String(
    value ?? ''
  )
    .trim()
    .toLowerCase();
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
*/

function profileRelevance(
  question,
  profile
) {
  let points = 0;
  let possible = 0;


  const checks = [
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
  ];


  for (
    const [
      value,
      candidates,
    ]
    of checks
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


  if (
    question.skills?.length
  ) {
    possible += 1;

    if (
      listOverlap(
        profile.skills || [],
        question.skills
      )
    ) {
      points += 1;
    }
  }


  if (
    question.subjects?.length
  ) {
    possible += 1;

    if (
      listOverlap(
        profile.subjects || [],
        question.subjects
      )
    ) {
      points += 1;
    }
  }


  /*
  |--------------------------------------------------------------------------
  | Generic questions
  |--------------------------------------------------------------------------
  |
  | A question with no restrictive metadata should remain strongly usable.
  |--------------------------------------------------------------------------
  */

  if (!possible) {
    return 0.75;
  }


  return points / possible;
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
| Broad core coverage
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
    /*
    | Specialized/discriminator trait.
    | Useful later, but should not dominate initial broad measurement.
    */
    return 0.25;
  }


  const count =
    evidenceCount(
      question.trait,
      traitEvidence
    );


  /*
  |--------------------------------------------------------------------------
  | Highest priority:
  | completely unseen core trait
  |--------------------------------------------------------------------------
  */

  if (count === 0) {
    return 1;
  }


  /*
  |--------------------------------------------------------------------------
  | Second evidence:
  | useful, but not before unseen traits unless other signals justify it
  |--------------------------------------------------------------------------
  */

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
| Discrimination
|--------------------------------------------------------------------------
*/

function discrimination(
  question,
  careerMatches
) {
  const isDiscriminator =
    question.purpose ===
      'discriminator';


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
  | Discriminator questions are most useful when top careers are close.
  |--------------------------------------------------------------------------
  */

  if (isDiscriminator) {
    if (gap <= 3) {
      return 1;
    }

    if (gap <= 7) {
      return 0.9;
    }

    if (gap <= 12) {
      return 0.72;
    }

    return 0.5;
  }


  if (gap <= 3) {
    return 0.72;
  }

  if (gap <= 7) {
    return 0.62;
  }

  if (gap <= 12) {
    return 0.5;
  }

  return 0.35;
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
  if (
    !recentTraits.length
  ) {
    return 0.6;
  }


  /*
  |--------------------------------------------------------------------------
  | Do not immediately ask same trait again.
  |--------------------------------------------------------------------------
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
      (question) =>
        question.section
    );


  const recentTraits =
    recent.map(
      (question) =>
        question.trait
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
| IMPORTANT FIX:
|
| Database/question bank semantics:
|
| 5 = highest priority
| 1 = lowest priority
|
| Previous implementation accidentally reversed this.
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
  | Phase 1:
  | Measure each broad trait at least once.
  |--------------------------------------------------------------------------
  */

  if (
    unseenCount > 0
  ) {
    return 'coverage';
  }


  /*
  |--------------------------------------------------------------------------
  | Phase 2:
  | Build second evidence for broad traits.
  |--------------------------------------------------------------------------
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
  | Phase 3:
  | Adaptive uncertainty + career discrimination.
  |--------------------------------------------------------------------------
  */

  return 'adaptive';
}


/*
|--------------------------------------------------------------------------
| Ranking
|--------------------------------------------------------------------------
*/

export function rankQuestionCandidates({
  candidates = [],
  profile,
  traitEvidence = {},
  careerMatches = [],
  askedQuestions = [],
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
            careerMatches
          );


        const previousScore =
          previousAnswerRelevance(
            question,
            recentTraits
          );


        const stageScore =
          question.stage ===
            profile.stage
            ? 1
            : 0;


        const diversityScore =
          diversity(
            question,
            askedQuestions
          );


        const priority =
          priorityScore(
            question
          );


        let score;


        /*
        |--------------------------------------------------------------------------
        | Phase-specific weighting
        |--------------------------------------------------------------------------
        */

        if (
          phase ===
          'coverage'
        ) {
          /*
          | First objective:
          | measure broad unseen traits.
          */

          score =
            coverageScore * 0.34 +
            profileScore * 0.18 +
            uncertaintyScore * 0.16 +
            diversityScore * 0.12 +
            previousScore * 0.07 +
            discriminationScore * 0.05 +
            stageScore * 0.04 +
            priority * 0.04;
        } else if (
          phase ===
          'depth'
        ) {
          /*
          | Second objective:
          | build multiple observations across important traits.
          */

          score =
            uncertaintyScore * 0.25 +
            coverageScore * 0.20 +
            profileScore * 0.18 +
            diversityScore * 0.10 +
            discriminationScore * 0.10 +
            previousScore * 0.07 +
            priority * 0.06 +
            stageScore * 0.04;
        } else {
          /*
          | Final adaptive phase:
          | uncertainty + career discrimination.
          */

          score =
            discriminationScore * 0.25 +
            uncertaintyScore * 0.24 +
            profileScore * 0.20 +
            diversityScore * 0.09 +
            previousScore * 0.07 +
            coverageScore * 0.06 +
            priority * 0.05 +
            stageScore * 0.04;
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


        /*
        |--------------------------------------------------------------------------
        | Stable tie-breaker
        |--------------------------------------------------------------------------
        */

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
