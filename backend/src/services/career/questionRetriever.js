import {
  getCandidateQuestions,
  getQuestionByIds,
} from '../../repositories/careerQuestionRepository.js';

import {
  rankQuestionCandidates,
} from './questionRanker.js';

import {
  finalProfileQuestionScore,
} from './profileCombinationScorer.js';

import {
  buildQuestionProfileMap,
} from './questionProfileMapper.js';

import {
  psychometricBlueprintScore,
  psychometricPhase,
  isNeutralAnchorQuestion,
  traitQuotaMultiplier,
} from './psychometricBlueprint.js';


function normalize(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[./(),_-]+/g, ' ')
    .replace(/\s+/g, ' ');
}


function normalizeList(values = []) {
  return (
    Array.isArray(values)
      ? values
      : [values]
  )
    .map(normalize)
    .filter(Boolean);
}


function normalizeClass(value) {
  const normalized =
    normalize(value);

  if (!normalized) {
    return '';
  }

  const match =
    normalized.match(
      /(?:class\s*)?(\d{1,2})/
    );

  if (!match) {
    return normalized;
  }

  return `class ${Number(match[1])}`;
}


function classNumber(value) {
  const normalized =
    normalizeClass(value);

  const match =
    normalized.match(
      /class\s+(\d{1,2})/
    );

  return match
    ? Number(match[1])
    : null;
}


function fuzzyMatch(
  value,
  allowed = []
) {
  if (!allowed?.length) {
    return true;
  }

  const target =
    normalize(value);

  if (!target) {
    return false;
  }

  return allowed.some(
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
  allowed = []
) {
  if (!allowed?.length) {
    return true;
  }

  const normalizedValues =
    normalizeList(values);

  if (!normalizedValues.length) {
    return false;
  }

  return normalizedValues.some(
    (value) =>
      fuzzyMatch(
        value,
        allowed
      )
  );
}


function hasClassRestriction(
  question
) {
  return Boolean(
    question.classes?.length ||
    question.minClass != null ||
    question.maxClass != null
  );
}


function validForClass(
  question,
  profile
) {
  if (
    !hasClassRestriction(question)
  ) {
    return true;
  }

  const profileClass =
    normalizeClass(
      profile.currentClass
    );

  const numericClass =
    classNumber(
      profile.currentClass
    );

  if (
    !profileClass &&
    numericClass == null
  ) {
    return false;
  }

  if (
    question.classes?.length
  ) {
    const allowedClasses =
      question.classes.map(
        normalizeClass
      );

    if (
      !allowedClasses.includes(
        profileClass
      )
    ) {
      return false;
    }
  }

  if (
    question.minClass != null
  ) {
    if (
      numericClass == null ||
      numericClass <
        Number(question.minClass)
    ) {
      return false;
    }
  }

  if (
    question.maxClass != null
  ) {
    if (
      numericClass == null ||
      numericClass >
        Number(question.maxClass)
    ) {
      return false;
    }
  }

  return true;
}


function questionBankStage(
  profile = {}
) {
  if (
    profile.stage ===
    'foundation'
  ) {
    return 'foundation';
  }


  if (
    profile.stage ===
    'class10'
  ) {
    return 'class10';
  }


  if (
    profile.stage ===
    'senior-secondary'
  ) {
    return 'senior-secondary';
  }


  if (
    profile.stage ===
    'college'
  ) {
    return 'college';
  }


  if (
    profile.stage ===
    'graduate'
  ) {
    return 'graduate';
  }


  return profile.stage;
}


function normalizeCurrentClass(
  value
) {
  const text =
    String(
      value ?? ''
    )
      .trim()
      .toLowerCase()
      .replace(
        /[_\s]+/g,
        '-'
      );


  if (
    text === '8' ||
    text === 'class-8'
  ) {
    return 'class-8';
  }


  if (
    text === '9' ||
    text === 'class-9'
  ) {
    return 'class-9';
  }


  if (
    text === '10' ||
    text === 'class-10'
  ) {
    return 'class-10';
  }


  if (
    text === '11' ||
    text === 'class-11'
  ) {
    return 'class-11';
  }


  if (
    text === '12' ||
    text === 'class-12'
  ) {
    return 'class-12';
  }


  return text || null;
}


function hardEligible(
  question,
  profile
) {
  if (
    question.stage !==
    questionBankStage(
      profile
    )
  ) {
    return false;
  }

  if (
    !validForClass(
      question,
      profile
    )
  ) {
    return false;
  }

  if (
    question.degrees?.length &&
    !fuzzyMatch(
      profile.degree,
      question.degrees
    )
  ) {
    return false;
  }

  if (
    question.branches?.length &&
    !fuzzyMatch(
      profile.branch ||
        profile.specialization,
      question.branches
    )
  ) {
    return false;
  }

  if (
    question.streams?.length &&
    !fuzzyMatch(
      profile.stream,
      question.streams
    )
  ) {
    return false;
  }

  return true;
}


function contextSignals(
  question,
  profile
) {
  const boardRestricted =
    Boolean(
      question.boards?.length
    );

  const subjectRestricted =
    Boolean(
      question.subjects?.length
    );

  const interestRestricted =
    Boolean(
      question.interestClusters
        ?.length
    );

  const goalRestricted =
    Boolean(
      question.goals?.length
    );

  const familyRestricted =
    Boolean(
      question.careerFamilies
        ?.length
    );

  const skillRestricted =
    Boolean(
      question.skills?.length
    );


  const boardMatch =
    !boardRestricted ||
    fuzzyMatch(
      profile.board,
      question.boards
    );

  const subjectMatch =
    !subjectRestricted ||
    listOverlap(
      profile.subjects || [],
      question.subjects
    );

  const profileInterests = [
    ...(profile.careerInterests || []),
    ...(profile.interestClusters || []),
  ];

  const interestMatch =
    !interestRestricted ||
    listOverlap(
      profileInterests,
      question.interestClusters
    );

  const goalMatch =
    !goalRestricted ||
    fuzzyMatch(
      profile.goal,
      question.goals
    );

  const familyMatch =
    !familyRestricted ||
    listOverlap(
      profile.careerFamilies || [],
      question.careerFamilies
    );

  const skillMatch =
    !skillRestricted ||
    listOverlap(
      profile.skills || [],
      question.skills
    );


  return {
    boardRestricted,
    subjectRestricted,
    interestRestricted,
    goalRestricted,
    familyRestricted,
    skillRestricted,

    boardMatch,
    subjectMatch,
    interestMatch,
    goalMatch,
    familyMatch,
    skillMatch,
  };
}


function contextSpecificity(
  signals
) {
  const pairs = [
    [
      signals.boardRestricted,
      signals.boardMatch,
    ],
    [
      signals.subjectRestricted,
      signals.subjectMatch,
    ],
    [
      signals.interestRestricted,
      signals.interestMatch,
    ],
    [
      signals.goalRestricted,
      signals.goalMatch,
    ],
    [
      signals.familyRestricted,
      signals.familyMatch,
    ],
    [
      signals.skillRestricted,
      signals.skillMatch,
    ],
  ];

  const restricted =
    pairs.filter(
      ([isRestricted]) =>
        isRestricted
    );

  if (!restricted.length) {
    return 0.2;
  }

  const matched =
    restricted.filter(
      ([
        ,
        isMatch,
      ]) =>
        isMatch
    ).length;

  const ratio =
    matched /
    restricted.length;

  if (matched === 0) {
    return 0.1;
  }

  if (
    matched ===
    restricted.length
  ) {
    if (matched >= 3) {
      return 0.95;
    }

    if (matched === 2) {
      return 0.85;
    }

    return 0.7;
  }

  return Math.max(
    0.25,
    Math.min(
      0.75,
      0.25 + ratio * 0.5
    )
  );
}


function classSpecificity(
  question,
  profile
) {
  if (
    !hasClassRestriction(
      question
    )
  ) {
    return 0.3;
  }

  if (
    !validForClass(
      question,
      profile
    )
  ) {
    return 0;
  }

  const profileClass =
    normalizeClass(
      profile.currentClass
    );

  if (
    question.classes?.length
  ) {
    const classes =
      question.classes.map(
        normalizeClass
      );

    if (
      classes.includes(
        profileClass
      )
    ) {
      return 1;
    }
  }

  const numericClass =
    classNumber(
      profile.currentClass
    );

  if (
    numericClass != null &&
    question.minClass != null &&
    question.maxClass != null &&
    Number(question.minClass) ===
      numericClass &&
    Number(question.maxClass) ===
      numericClass
  ) {
    return 1;
  }

  return 0.75;
}


function retrievalTier(
  signals
) {
  const restrictedCount = [
    signals.boardRestricted,
    signals.subjectRestricted,
    signals.interestRestricted,
    signals.goalRestricted,
    signals.familyRestricted,
    signals.skillRestricted,
  ].filter(Boolean).length;

  const matchedCount = [
    signals.boardRestricted &&
      signals.boardMatch,

    signals.subjectRestricted &&
      signals.subjectMatch,

    signals.interestRestricted &&
      signals.interestMatch,

    signals.goalRestricted &&
      signals.goalMatch,

    signals.familyRestricted &&
      signals.familyMatch,

    signals.skillRestricted &&
      signals.skillMatch,
  ].filter(Boolean).length;


  if (!restrictedCount) {
    return 4;
  }

  if (
    matchedCount ===
    restrictedCount
  ) {
    return 0;
  }

  const ratio =
    matchedCount /
    restrictedCount;

  if (ratio >= 0.75) {
    return 1;
  }

  if (ratio >= 0.5) {
    return 2;
  }

  if (matchedCount > 0) {
    return 3;
  }

  return 4;
}


function buildAnchorPool(
  candidates,
  profile,
  requiredNeutralCount = 1
) {
  /*
  |--------------------------------------------------------------------------
  | True psychometric anchor pool
  |--------------------------------------------------------------------------
  |
  | Repository has already enforced:
  | - V7
  | - stage
  | - exact class where applicable
  |
  | We intentionally DO NOT call hardEligible() here.
  |
  | Therefore anchors are not restricted by:
  | - stream
  | - subject
  | - entrance exam
  | - course
  | - career family
  | - interest cluster
  |
  | This creates cross-profile psychometric linkage.
  */

  const prepared =
    candidates.map(
      question => {
        /*
        | Anchor neutrality must be evaluated
        | AFTER question-profile/domain mapping.
        */

        const profileMap =
          buildQuestionProfileMap(
            question
          );


        const mappedQuestion = {
          ...question,

          profileMap,

          inferredDomains:
            profileMap.domains,

          metadataTier: 0,

          classSpecificity:
            classSpecificity(
              question,
              profile
            ),
        };


        return {
          ...mappedQuestion,

          contextSpecificity:
            isNeutralAnchorQuestion(
              mappedQuestion
            )
              ? 1
              : 0.05,
        };
      }
    );


  const neutral =
    prepared.filter(
      question =>
        isNeutralAnchorQuestion(
          question
        )
    );


  /*
  | If the bank has enough truly neutral anchors,
  | use only those.
  |
  | Otherwise gracefully fall back to the full
  | stage/class pool instead of failing retrieval.
  */

  return neutral.length >=
    requiredNeutralCount
    ? neutral
    : prepared;
}


function buildAdaptivePool(
  candidates,
  profile
) {
  return candidates
    .filter(
      (question) =>
        hardEligible(
          question,
          profile
        )
    )
    .map(
      (question) => {
        const signals =
          contextSignals(
            question,
            profile
          );

        return {
          ...question,

          metadataTier:
            retrievalTier(
              signals
            ),

          contextSpecificity:
            contextSpecificity(
              signals
            ),

          classSpecificity:
            classSpecificity(
              question,
              profile
            ),
        };
      }
    );
}


export async function retrieveRankedQuestionCandidates({
  profile,
  answers = [],
  traitEvidence = {},
  careerMatches = [],
  limit = 10,
}) {
  const askedIds =
    answers
      .map(
        (answer) =>
          answer.questionId
      )
      .filter(Boolean);


  const [
    candidates,
    askedQuestions,
  ] =
    await Promise.all([
      getCandidateQuestions({
        stage:
          questionBankStage(
            profile
          ),

        excludeIds:
          askedIds,

        limit:
          2000,

        version:
          7,

        currentClass:
          normalizeCurrentClass(
            profile.currentClass
          ),
      }),

      getQuestionByIds(
        askedIds
      ),
    ]);


  const expectedBankStage =
    questionBankStage(
      profile
    );


  const sameStage =
    candidates.filter(
      (question) =>
        question.stage ===
        expectedBankStage
    );


  const currentPsychometricPhase =
    psychometricPhase({
      profile,
      answers,
    });


  const safeLimit =
    Math.max(
      1,
      Math.min(
        50,
        Number(limit) || 10
      )
    );


  const pool =
    currentPsychometricPhase ===
    'anchor'
      ? buildAnchorPool(
          sameStage,
          profile,
          safeLimit
        )
      : buildAdaptivePool(
          sameStage,
          profile
        );


  if (!pool.length) {
    return [];
  }


  const profileMappedPool =
    pool.map(
      question => {
        const profileMap =
          buildQuestionProfileMap(
            question
          );

        return {
          ...question,

          profileMap,

          inferredDomains:
            profileMap.domains,

          streams:
            profileMap.streams,

          subjects:
            profileMap.subjects,

          entranceExams:
            profileMap.entranceExams,

          targetCourses:
            profileMap.targetCourses,

          interestClusters:
            profileMap.interestClusters,

          careerFamilies:
            profileMap.careerFamilies,

          goals:
            profileMap.goals,

          skills:
            profileMap.skills,

          degrees:
            profileMap.degrees,

          branches:
            profileMap.branches,
        };
      }
    );


  /*
  |--------------------------------------------------------------------------
  | Ranking context
  |--------------------------------------------------------------------------
  |
  | Anchor questions are ranked only against stage/class context.
  | Profile-specific metadata must not influence anchor identity.
  |
  */

  const rankingProfile =
    currentPsychometricPhase ===
    'anchor'
      ? {
          stage:
            profile.stage,

          currentClass:
            profile.currentClass,
        }
      : profile;


  const rankingCareerMatches =
    currentPsychometricPhase ===
    'anchor'
      ? []
      : careerMatches;


  const adaptiveRanked =
    rankQuestionCandidates({
      candidates:
        profileMappedPool,

      profile:
        rankingProfile,

      traitEvidence,

      careerMatches:
        rankingCareerMatches,

      askedQuestions,

      /*
      |--------------------------------------------------------------------------
      | Response-sensitive routing
      |--------------------------------------------------------------------------
      |
      | Anchor questions remain population-comparable.
      |
      | Profile and adaptive phases may use the student's evolving
      | career hypotheses when ranking the next question.
      |
      */

      responseRoutingEnabled:
        currentPsychometricPhase !==
        'anchor',
    });


  const answeredTraitHistory =
    askedQuestions.map(
      question => ({
        trait:
          question.trait,
      })
    );


  const ranked =
    adaptiveRanked
      .map(
        (
          question,
          index
        ) => {
          const adaptiveScore =
            adaptiveRanked.length <= 1
              ? 1
              : (
                  1 -
                  (
                    index /
                    (
                      adaptiveRanked.length -
                      1
                    )
                  )
                );


          const combinationScore =
            currentPsychometricPhase ===
            'anchor'
              ? 0.50
              : finalProfileQuestionScore(
                  question,
                  profile
                );


          const blueprintScore =
            psychometricBlueprintScore({
              question,
              profile,
              answers,
            });


          
          /*
          |--------------------------------------------------------------------------
          | Phase-aware score blend
          |--------------------------------------------------------------------------
          |
          | Anchor:
          |   Keep cross-profile psychometric comparability high.
          |
          | Profile:
          |   Preserve the proven profile-combination influence.
          |
          | Adaptive:
          |   Preserve strong answer-history influence.
          |
          */

          let baseScore;


          if (
            currentPsychometricPhase ===
            'anchor'
          ) {
            baseScore =
              adaptiveScore *
                0.88 +
              combinationScore *
                0.12;
          }

          else if (
            currentPsychometricPhase ===
            'profile'
          ) {
            baseScore =
              adaptiveScore *
                0.58 +
              combinationScore *
                0.42;
          }

          else {
            baseScore =
              adaptiveScore *
                0.68 +
              combinationScore *
                0.32;
          }


          const quotaMultiplier =
            traitQuotaMultiplier({
              question,
              answers:
                answeredTraitHistory,
              maxPerTrait: 4,
            });


          const finalScore =
            baseScore *
            (
              0.90 +
              blueprintScore *
                0.10
            ) *
            quotaMultiplier;


          return {
            question,

            finalScore,
          };
        }
      )
      .sort(
        (left, right) =>
          right.finalScore -
          left.finalScore
      )
      .map(
        item =>
          item.question
      );


  /*
  |--------------------------------------------------------------------------
  | Anchor trait diversity
  |--------------------------------------------------------------------------
  |
  | traitQuotaMultiplier() uses previously answered trait history.
  | It cannot prevent one trait from dominating the current candidate batch.
  |
  | During the anchor phase, enforce a hard per-batch trait cap while
  | preserving the existing ranking order.
  |
  */

  if (
    currentPsychometricPhase ===
    'anchor'
  ) {
    const maxAnchorPerTrait = 4;

    const selected = [];

    const selectedTraitCounts =
      new Map();


    for (
      const question
      of ranked
    ) {
      if (
        selected.length >=
        safeLimit
      ) {
        break;
      }


      const trait =
        question.trait ||
        '__unknown__';

      const count =
        selectedTraitCounts.get(
          trait
        ) || 0;


      if (
        count >=
        maxAnchorPerTrait
      ) {
        continue;
      }


      selected.push(
        question
      );

      selectedTraitCounts.set(
        trait,
        count + 1
      );
    }


    /*
    | If the available neutral anchor pool does not contain
    | enough trait diversity to fill the requested limit,
    | gracefully fill the remaining positions from ranked
    | candidates instead of returning fewer questions.
    */

    if (
      selected.length <
      safeLimit
    ) {
      const selectedIds =
        new Set(
          selected.map(
            question =>
              question.id
          )
        );


      for (
        const question
        of ranked
      ) {
        if (
          selected.length >=
          safeLimit
        ) {
          break;
        }


        if (
          selectedIds.has(
            question.id
          )
        ) {
          continue;
        }


        selected.push(
          question
        );

        selectedIds.add(
          question.id
        );
      }
    }


    return selected;
  }


  return ranked.slice(
    0,
    safeLimit
  );
}


export async function retrieveNextQuestion({
  profile,
  answers = [],
  traitEvidence = {},
  careerMatches = [],
}) {
  const ranked =
    await retrieveRankedQuestionCandidates({
      profile,
      answers,
      traitEvidence,
      careerMatches,
      limit: 1,
    });

  return ranked[0] || null;
}




















