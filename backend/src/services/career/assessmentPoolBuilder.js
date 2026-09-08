import {
  getCandidateQuestions,
} from '../../repositories/careerQuestionRepository.js';

import {
  retrieveRankedQuestionCandidates,
} from './questionRetriever.js';

import {
  finalProfileQuestionScore,
} from './profileCombinationScorer.js';


const CORE_TRAITS = Object.freeze([
  'analytical',
  'quantitative',
  'verbal',
  'creativity',
  'technology',
  'hands_on',
  'scientific_curiosity',
  'social_helping',
  'leadership',
  'collaboration',
  'independence',
  'structure',
  'adaptability',
  'achievement',
  'stability',
  'entrepreneurship',
]);


const STREAM_TRAIT_BOOSTS =
  Object.freeze({
    'science pcm':
      [
        'analytical',
        'quantitative',
        'technology',
        'scientific_curiosity',
      ],

    'science pcmb':
      [
        'scientific_curiosity',
        'analytical',
        'quantitative',
        'adaptability',
      ],

    'science pcm computer science':
      [
        'technology',
        'analytical',
        'quantitative',
        'scientific_curiosity',
      ],

    'science pcb':
      [
        'scientific_curiosity',
        'analytical',
        'social_helping',
        'structure',
      ],

    'science pcb psychology':
      [
        'scientific_curiosity',
        'social_helping',
        'verbal',
        'analytical',
      ],

    'science biotechnology':
      [
        'scientific_curiosity',
        'analytical',
        'hands_on',
        'technology',
      ],

    'commerce with mathematics':
      [
        'quantitative',
        'analytical',
        'entrepreneurship',
        'achievement',
      ],

    'commerce without mathematics':
      [
        'entrepreneurship',
        'verbal',
        'leadership',
        'structure',
      ],

    'humanities arts':
      [
        'verbal',
        'social_helping',
        'analytical',
        'creativity',
      ],

    'humanities with legal studies':
      [
        'verbal',
        'analytical',
        'leadership',
        'structure',
      ],

    'humanities with psychology':
      [
        'social_helping',
        'verbal',
        'analytical',
        'scientific_curiosity',
      ],

    'fine arts visual arts':
      [
        'creativity',
        'verbal',
        'independence',
        'achievement',
      ],

    'performing arts':
      [
        'creativity',
        'verbal',
        'achievement',
        'collaboration',
      ],

    agriculture:
      [
        'scientific_curiosity',
        'hands_on',
        'analytical',
        'social_helping',
      ],

    'vocational skill based':
      [
        'hands_on',
        'technology',
        'independence',
        'adaptability',
      ],

    'sports physical education':
      [
        'achievement',
        'leadership',
        'collaboration',
        'adaptability',
      ],
  });


function normalizeLookupKey(
  value
) {
  return String(
    value ?? ''
  )
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[./(),_-]+/g, ' ')
    .replace(/\s+/g, ' ');
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


function boostedTraitsForProfile(
  profile
) {
  if (
    profile.stage ===
    'college'
  ) {
    const degreeBoosts = {
      btech: [
        'analytical',
        'technology',
        'quantitative',
        'scientific_curiosity',
      ],

      be: [
        'analytical',
        'technology',
        'quantitative',
        'hands_on',
      ],

      bsc: [
        'scientific_curiosity',
        'analytical',
        'quantitative',
        'independence',
      ],

      'bsc-hons': [
        'scientific_curiosity',
        'analytical',
        'quantitative',
        'independence',
      ],

      bcom: [
        'quantitative',
        'analytical',
        'structure',
        'entrepreneurship',
      ],

      'bcom-hons': [
        'quantitative',
        'analytical',
        'structure',
        'achievement',
      ],

      bba: [
        'leadership',
        'entrepreneurship',
        'verbal',
        'achievement',
      ],

      bdes: [
        'creativity',
        'technology',
        'independence',
        'achievement',
      ],

      ba: [
        'verbal',
        'creativity',
        'social_helping',
        'analytical',
      ],

      'ba-hons': [
        'verbal',
        'analytical',
        'social_helping',
        'independence',
      ],

      llb: [
        'verbal',
        'analytical',
        'leadership',
        'structure',
      ],
    };


    const goalBoosts = {
      placement: [
        'achievement',
        'adaptability',
        'collaboration',
        'leadership',
      ],

      job: [
        'achievement',
        'adaptability',
        'collaboration',
        'structure',
      ],

      internship: [
        'adaptability',
        'achievement',
        'collaboration',
        'independence',
      ],

      'higher studies': [
        'scientific_curiosity',
        'analytical',
        'independence',
        'structure',
      ],

      research: [
        'scientific_curiosity',
        'analytical',
        'independence',
        'quantitative',
      ],

      entrepreneurship: [
        'entrepreneurship',
        'leadership',
        'creativity',
        'adaptability',
      ],

      freelancing: [
        'independence',
        'entrepreneurship',
        'adaptability',
        'creativity',
      ],
    };


    return [
      ...new Set([
        ...(
          degreeBoosts[
            normalizeLookupKey(
              profile.degree
            )
          ] || []
        ),

        ...(
          goalBoosts[
            normalizeLookupKey(
              profile.goal
            )
          ] || []
        ),
      ]),
    ].slice(
      0,
      6
    );
  }


  return (
    STREAM_TRAIT_BOOSTS[
      normalizeLookupKey(
        profile.stream
      )
    ] ||
    []
  );
}

const V7_STAGES =
  new Set([
    'foundation',
    'class10',
    'senior-secondary',
    'college',
    'graduate',
  ]);


const STAGE_POOL_CONFIG =
  Object.freeze({
    foundation: {
      total: 42,
      core: 32,
      personalised: 10,
    },

    class10: {
      total: 42,
      core: 32,
      personalised: 10,
    },

    'senior-secondary': {
      total: 42,
      core: 32,
      personalised: 10,
    },

    college: {
      total: 44,
      core: 32,
      personalised: 12,
    },

    graduate: {
      total: 44,
      core: 32,
      personalised: 12,
    },
  });


function hasArrayValues(
  value
) {
  return (
    Array.isArray(value) &&
    value.length > 0
  );
}


function isCoreNeutralQuestion(
  question
) {
  return !(
    hasArrayValues(
      question.streams
    ) ||
    hasArrayValues(
      question.subjects
    ) ||
    hasArrayValues(
      question.interestClusters
    ) ||
    hasArrayValues(
      question.careerFamilies
    ) ||
    hasArrayValues(
      question.entranceExams
    ) ||
    hasArrayValues(
      question.targetCourses
    ) ||
    hasArrayValues(
      question.boards
    )
  );
}


function questionOrder(
  a,
  b,
  profile
) {
  const priorityDifference =
    Number(
      b.priority || 0
    ) -
    Number(
      a.priority || 0
    );


  if (
    priorityDifference !==
    0
  ) {
    return priorityDifference;
  }


  const aProfileScore =
    finalProfileQuestionScore(
      a,
      profile
    );


  const bProfileScore =
    finalProfileQuestionScore(
      b,
      profile
    );


  const profileDifference =
    bProfileScore -
    aProfileScore;


  if (
    Math.abs(
      profileDifference
    ) >
    0.000001
  ) {
    return profileDifference;
  }


  return String(
    a.id
  ).localeCompare(
    String(
      b.id
    )
  );
}


function selectCoreQuestions(
  candidates,
  profile
) {
  const selected =
    [];


  const selectedIds =
    new Set();


  for (
    const trait of
    CORE_TRAITS
  ) {
    const traitCandidates =
      candidates
        .filter(
          question =>
            question.trait ===
              trait &&
            isCoreNeutralQuestion(
              question
            )
        )
        .sort(
          (a, b) =>
            questionOrder(
              a,
              b,
              profile
            )
        );


    /*
    |--------------------------------------------------------------------------
    | Prefer different scenario families
    |--------------------------------------------------------------------------
    */

    const usedFamilies =
      new Set();


    for (
      const question of
      traitCandidates
    ) {
      if (
        selectedIds.has(
          question.id
        )
      ) {
        continue;
      }


      const family =
        question.scenarioFamily ||
        question.scenario ||
        question.id;


      if (
        usedFamilies.has(
          family
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

      usedFamilies.add(
        family
      );


      const traitCount =
        selected.filter(
          item =>
            item.trait ===
            trait
        ).length;


      if (
        traitCount >=
        2
      ) {
        break;
      }
    }


    /*
    |--------------------------------------------------------------------------
    | Controlled fallback
    |--------------------------------------------------------------------------
    */

    let traitCount =
      selected.filter(
        item =>
          item.trait ===
          trait
      ).length;


    if (
      traitCount <
      2
    ) {
      const fallback =
        candidates
          .filter(
            question =>
              question.trait ===
                trait &&
              !selectedIds.has(
                question.id
              )
          )
          .sort(
            (a, b) =>
              questionOrder(
                a,
                b,
                profile
              )
          );


      for (
        const question of
        fallback
      ) {
        selected.push(
          question
        );

        selectedIds.add(
          question.id
        );

        traitCount +=
          1;


        if (
          traitCount >=
          2
        ) {
          break;
        }
      }
    }
  }


  return selected;
}


export async function buildAssessmentQuestionPool({
  profile,
}) {
  if (
    !V7_STAGES.has(
      profile.stage
    )
  ) {
    return null;
  }


  const stageConfig =
    STAGE_POOL_CONFIG[
      profile.stage
    ];


  const candidates =
    await getCandidateQuestions({
      stage:
        questionBankStage(
          profile
        ),

      excludeIds: [],

      limit:
        2000,

      version:
        7,

      currentClass:
        normalizeCurrentClass(
          profile.currentClass
        ),
    });


  const core =
    selectCoreQuestions(
      candidates,
      profile
    );


  if (
      core.length !==
      32
    ) {
      const traitCounts =
        candidates.reduce(
          (counts, question) => {
            counts[question.trait] =
              (counts[question.trait] || 0) + 1;

            return counts;
          },
          {}
        );

      throw new Error(
        [
          `Expected 32 V7 core questions for ${profile.stage}, found ${core.length}.`,
          `candidates=${candidates.length}`,
          `profileStage=${profile.stage}`,
          `currentClass=${profile.currentClass ?? 'null'}`,
          `normalizedCurrentClass=${normalizeCurrentClass(profile.currentClass) ?? 'null'}`,
          `questionBankStage=${questionBankStage(profile)}`,
          `traitCounts=${JSON.stringify(traitCounts)}`,
        ].join(' ')
      );
    }


  const coreIds =
    new Set(
      core.map(
        question =>
          question.id
      )
    );


  /*
  |--------------------------------------------------------------------------
  | Existing ranking engine chooses personalized candidates
  |--------------------------------------------------------------------------
  */

  const ranked =
    await retrieveRankedQuestionCandidates({
      profile,

      answers: [],

      traitEvidence: {},

      careerMatches: [],

      limit:
        50,
    });


  const boostedTraits =
    boostedTraitsForProfile(
      profile
    );


  const personalised =
    [];


  const personalisedIds =
    new Set();


  const usedTraitCounts =
    new Map();


  /*
  |--------------------------------------------------------------------------
  | Phase 1: prioritise boosted traits
  |--------------------------------------------------------------------------
  */

  for (
    const trait of
    boostedTraits
  ) {
    for (
      const question of
      ranked
    ) {
      if (
        question.trait !==
        trait
      ) {
        continue;
      }


      if (
        coreIds.has(
          question.id
        ) ||
        personalisedIds.has(
          question.id
        )
      ) {
        continue;
      }


      const currentTraitCount =
        usedTraitCounts.get(
          question.trait
        ) || 0;


      if (
        currentTraitCount >=
        2
      ) {
        continue;
      }


      personalised.push(
        question
      );

      personalisedIds.add(
        question.id
      );

      usedTraitCounts.set(
        question.trait,
        currentTraitCount +
          1
      );


      if (
        personalised.length >=
        8
      ) {
        break;
      }
    }


    if (
      personalised.length >=
      8
    ) {
      break;
    }
  }


  /*
  |--------------------------------------------------------------------------
  | Phase 2: fill remaining personalised slots from ranking
  |--------------------------------------------------------------------------
  */
  for (
    const question of
    ranked
  ) {
    if (
      coreIds.has(
        question.id
      )
    ) {
      continue;
    }


    if (
      personalisedIds.has(
        question.id
      )
    ) {
      continue;
    }


    const currentTraitCount =
      usedTraitCounts.get(
        question.trait
      ) || 0;


    /*
    |--------------------------------------------------------------------------
    | Avoid all 10 personalised questions collapsing into one trait
    |--------------------------------------------------------------------------
    */

    if (
      currentTraitCount >=
      2
    ) {
      continue;
    }


    personalised.push(
      question
    );

    personalisedIds.add(
      question.id
    );

    usedTraitCounts.set(
      question.trait,
      currentTraitCount +
        1
    );


    if (
      personalised.length === stageConfig.personalised
    ) {
      break;
    }
  }


  /*
  |--------------------------------------------------------------------------
  | Fallback if trait cap prevented 10
  |--------------------------------------------------------------------------
  */

  if (
    personalised.length < stageConfig.personalised
  ) {
    for (
      const question of
      ranked
    ) {
      if (
        coreIds.has(
          question.id
        ) ||
        personalisedIds.has(
          question.id
        )
      ) {
        continue;
      }


      personalised.push(
        question
      );

      personalisedIds.add(
        question.id
      );


      if (
        personalised.length === stageConfig.personalised
      ) {
        break;
      }
    }
  }


  if (
    personalised.length !== stageConfig.personalised
  ) {
    throw new Error(
      `Expected ${stageConfig.personalised} personalised V7 questions for ${profile.stage}, found ${personalised.length}.`
    );
  }


  const questions = [
    ...core,
    ...personalised,
  ];


  const ids =
    questions.map(
      question =>
        question.id
    );


  if (
    new Set(ids).size !== stageConfig.total
  ) {
    throw new Error(
      `V7 assessment pool contains duplicate question IDs for ${profile.stage}.`
    );
  }


  return {
    stage:
      profile.stage,

    questions,

    ids,

    coreIds:
      core.map(
        question =>
          question.id
      ),

    personalisedIds:
      personalised.map(
        question =>
          question.id
      ),

    coreCount:
      core.length,

    personalisedCount:
      personalised.length,

    total:
      ids.length,
  };
}









