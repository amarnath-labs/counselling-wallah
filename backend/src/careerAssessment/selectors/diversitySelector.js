import {
  CORE_TRAITS,
} from '../config/traitQuotas.js';


function keyForFamily(
  question
) {
  return (
    question.trait +
    '::' +
    question.scenarioFamily
  );
}


function hasProfileMetadata(
  question
) {
  return (
    (question.streams?.length || 0) > 0 ||
    (question.entranceExams?.length || 0) > 0 ||
    (question.subjects?.length || 0) > 0 ||
    (question.careerFamilies?.length || 0) > 0 ||
    (question.interestClusters?.length || 0) > 0
  );
}


function matchesProfile(
  question,
  profile
) {
  const intersects =
    (
      left = [],
      right = []
    ) => {
      const set =
        new Set(
          right
        );

      return left.some(
        value =>
          set.has(
            value
          )
      );
    };


  return (
    question.streams?.includes(
      profile.stream
    ) ||

    question.streams?.includes(
      profile.targetStream
    ) ||

    intersects(
      question.subjects || [],
      profile.subjects || []
    ) ||

    intersects(
      question.entranceExams || [],
      profile.entranceExams || []
    ) ||

    intersects(
      question.careerFamilies || [],
      profile.careerFamilies || []
    ) ||

    (
      profile.interestDirection &&
      question.interestClusters?.includes(
        profile.interestDirection
      )
    )
  );
}


export function selectBalancedQuestions({
  ranked,
  stageConfig,
  profile,
}) {
  if (
    !profile ||
    typeof profile !==
      'object'
  ) {
    throw new Error(
      'Normalized student profile is required by the diversity selector.'
    );
  }


  const target =
    stageConfig.assessmentSize;


  /*
  |--------------------------------------------------------------------------
  | Assessment composition
  |--------------------------------------------------------------------------
  |
  | For 42 questions:
  |
  | 32 core
  | 10 personalised
  |
  */

  const minimumCore =
    CORE_TRAITS.length *
    stageConfig.minQuestionsPerTrait;


  const personalisedTarget =
    Math.max(
      0,
      target -
      minimumCore
    );


  const selected =
    [];

  const selectedIds =
    new Set();

  const traitCounts =
    new Map();

  const familyCounts =
    new Map();


  function traitCount(
    trait
  ) {
    return (
      traitCounts.get(
        trait
      ) ||
      0
    );
  }


  function familyCount(
    question
  ) {
    return (
      familyCounts.get(
        keyForFamily(
          question
        )
      ) ||
      0
    );
  }


  function add(
    question
  ) {
    if (
      !question ||
      selectedIds.has(
        question.id
      )
    ) {
      return false;
    }


    selected.push(
      question
    );


    selectedIds.add(
      question.id
    );


    traitCounts.set(
      question.trait,
      traitCount(
        question.trait
      ) + 1
    );


    const familyKey =
      keyForFamily(
        question
      );


    familyCounts.set(
      familyKey,
      (
        familyCounts.get(
          familyKey
        ) ||
        0
      ) + 1
    );


    return true;
  }


  /*
  |--------------------------------------------------------------------------
  | PHASE 1 — CORE PSYCHOMETRIC COVERAGE
  |--------------------------------------------------------------------------
  |
  | Prefer questions that are NOT tightly tied to one stream/exam.
  |
  */

  for (
    const trait of
    CORE_TRAITS
  ) {
    while (
      traitCount(
        trait
      ) <
      stageConfig.minQuestionsPerTrait
    ) {

      /*
      | First preference:
      | profile-neutral question + unused family.
      */

      let candidate =
        ranked.find(
          item =>
            item.question.trait ===
              trait &&
            !selectedIds.has(
              item.question.id
            ) &&
            !hasProfileMetadata(
              item.question
            ) &&
            familyCount(
              item.question
            ) === 0
        );


      /*
      | Second preference:
      | broadly relevant question that does NOT
      | specifically match the student's profile.
      */

      candidate =
        candidate ||
        ranked.find(
          item =>
            item.question.trait ===
              trait &&
            !selectedIds.has(
              item.question.id
            ) &&
            !matchesProfile(
              item.question,
              profile
            ) &&
            familyCount(
              item.question
            ) === 0
        );


      /*
      | Final fallback:
      | any unused-family item for that trait.
      */

      candidate =
        candidate ||
        ranked.find(
          item =>
            item.question.trait ===
              trait &&
            !selectedIds.has(
              item.question.id
            ) &&
            familyCount(
              item.question
            ) === 0
        );


      /*
      | Last-resort fallback.
      */

      candidate =
        candidate ||
        ranked.find(
          item =>
            item.question.trait ===
              trait &&
            !selectedIds.has(
              item.question.id
            )
        );


      if (!candidate) {
        break;
      }


      add(
        candidate.question
      );
    }
  }


  /*
  |--------------------------------------------------------------------------
  | PHASE 2 — PERSONALISED QUESTIONS
  |--------------------------------------------------------------------------
  */

  let personalisedAdded =
    0;


  for (
    const item of
    ranked
  ) {
    if (
      personalisedAdded >=
      personalisedTarget ||
      selected.length >=
      target
    ) {
      break;
    }


    const question =
      item.question;


    if (
      selectedIds.has(
        question.id
      )
    ) {
      continue;
    }


    if (
      !matchesProfile(
        question,
        profile
      )
    ) {
      continue;
    }


    if (
      traitCount(
        question.trait
      ) >=
      stageConfig.maxQuestionsPerTrait
    ) {
      continue;
    }


    if (
      familyCount(
        question
      ) > 0
    ) {
      continue;
    }


    if (
      add(
        question
      )
    ) {
      personalisedAdded +=
        1;
    }
  }


  /*
  |--------------------------------------------------------------------------
  | PHASE 3 — DIVERSITY FILL
  |--------------------------------------------------------------------------
  */

  for (
    const item of
    ranked
  ) {
    if (
      selected.length >=
      target
    ) {
      break;
    }


    const question =
      item.question;


    if (
      selectedIds.has(
        question.id
      )
    ) {
      continue;
    }


    if (
      traitCount(
        question.trait
      ) >=
      stageConfig.maxQuestionsPerTrait
    ) {
      continue;
    }


    if (
      familyCount(
        question
      ) > 0
    ) {
      continue;
    }


    add(
      question
    );
  }


  /*
  |--------------------------------------------------------------------------
  | PHASE 4 — CONTROLLED LAST RESORT
  |--------------------------------------------------------------------------
  */

  for (
    const item of
    ranked
  ) {
    if (
      selected.length >=
      target
    ) {
      break;
    }


    const question =
      item.question;


    if (
      selectedIds.has(
        question.id
      )
    ) {
      continue;
    }


    if (
      traitCount(
        question.trait
      ) >=
      stageConfig.maxQuestionsPerTrait
    ) {
      continue;
    }


    add(
      question
    );
  }


  return {
    questions:
      selected,

    traitCounts:
      Object.fromEntries(
        traitCounts
      ),

    selectedCount:
      selected.length,

    targetCount:
      target,

    coreTarget:
      minimumCore,

    personalisedTarget,

    personalisedSelected:
      selected.filter(
        question =>
          matchesProfile(
            question,
            profile
          )
      ).length,

    complete:
      selected.length ===
      target,
  };
}


export default selectBalancedQuestions;

