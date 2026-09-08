import {
  getBoostedTraits,
} from '../config/traitQuotas.js';

import {
  SELECTION_WEIGHTS,
  getStageWeightMultipliers,
} from '../config/selectionWeights.js';


function intersects(
  left = [],
  right = []
) {
  if (
    !Array.isArray(left) ||
    !Array.isArray(right) ||
    left.length === 0 ||
    right.length === 0
  ) {
    return false;
  }


  const rightSet =
    new Set(
      right
    );


  return left.some(
    value =>
      rightSet.has(
        value
      )
  );
}


function includesValue(
  values,
  value
) {
  return (
    Boolean(value) &&
    Array.isArray(values) &&
    values.includes(
      value
    )
  );
}


function stableHash(
  value
) {
  let hash =
    2166136261;


  for (
    let i = 0;
    i < value.length;
    i += 1
  ) {
    hash ^=
      value.charCodeAt(
        i
      );

    hash =
      Math.imul(
        hash,
        16777619
      );
  }


  return (
    hash >>> 0
  );
}


export function scoreQuestion({
  question,
  profile,
  stageConfig,
}) {
  const multipliers =
    getStageWeightMultipliers(
      profile.stage
    );


  let score =
    Number(
      question.priority ||
      0
    ) *
    SELECTION_WEIGHTS
      .priorityMultiplier;


  /*
  |--------------------------------------------------------------------------
  | SUBJECT MATCH
  |--------------------------------------------------------------------------
  */

  if (
    intersects(
      question.subjects || [],
      profile.subjects
    )
  ) {
    score +=
      SELECTION_WEIGHTS
        .subjectMatch *
      multipliers.subject;
  }


  /*
  |--------------------------------------------------------------------------
  | INTEREST MATCH
  |--------------------------------------------------------------------------
  */

  if (
    includesValue(
      question.interestClusters ||
        [],
      profile.interestDirection
    )
  ) {
    score +=
      SELECTION_WEIGHTS
        .interestMatch *
      multipliers.interest;
  }


  /*
  |--------------------------------------------------------------------------
  | BOARD MATCH
  |--------------------------------------------------------------------------
  */

  if (
    includesValue(
      question.boards ||
        [],
      profile.board
    )
  ) {
    score +=
      SELECTION_WEIGHTS
        .boardMatch;
  }


  /*
  |--------------------------------------------------------------------------
  | STREAM MATCH
  |--------------------------------------------------------------------------
  */

  if (
    includesValue(
      question.streams ||
        [],
      profile.stream
    )
  ) {
    score +=
      SELECTION_WEIGHTS
        .streamMatch *
      multipliers.stream;
  }


  /*
  |--------------------------------------------------------------------------
  | TARGET STREAM MATCH
  |--------------------------------------------------------------------------
  */

  if (
    includesValue(
      question.streams ||
        [],
      profile.targetStream
    )
  ) {
    score +=
      SELECTION_WEIGHTS
        .targetStreamMatch *
      multipliers.stream;
  }


  /*
  |--------------------------------------------------------------------------
  | DEGREE MATCH
  |--------------------------------------------------------------------------
  */

  if (
    includesValue(
      question.degrees ||
        [],
      profile.degree
    )
  ) {
    score +=
      SELECTION_WEIGHTS
        .degreeMatch *
      multipliers.degree;
  }


  /*
  |--------------------------------------------------------------------------
  | SPECIALIZATION MATCH
  |--------------------------------------------------------------------------
  */

  if (
    includesValue(
      question.specializations ||
        [],
      profile.specialization
    )
  ) {
    score +=
      SELECTION_WEIGHTS
        .specializationMatch *
      multipliers.specialization;
  }


  /*
  |--------------------------------------------------------------------------
  | SKILLS
  |--------------------------------------------------------------------------
  */

  if (
    intersects(
      question.skills || [],
      profile.skills
    )
  ) {
    score +=
      SELECTION_WEIGHTS
        .skillMatch;
  }


  /*
  |--------------------------------------------------------------------------
  | CAREER FAMILIES
  |--------------------------------------------------------------------------
  */

  if (
    intersects(
      question.careerFamilies ||
        [],
      profile.careerFamilies
    )
  ) {
    score +=
      SELECTION_WEIGHTS
        .careerFamilyMatch *
      multipliers.career;
  }


  /*
  |--------------------------------------------------------------------------
  | GOALS
  |--------------------------------------------------------------------------
  */

  if (
    intersects(
      question.goals || [],
      profile.goals
    )
  ) {
    score +=
      SELECTION_WEIGHTS
        .goalMatch;
  }


  /*
  |--------------------------------------------------------------------------
  | TARGET COURSES
  |--------------------------------------------------------------------------
  */

  if (
    intersects(
      question.targetCourses ||
        question.courses ||
        [],
      profile.targetCourses
    )
  ) {
    score +=
      SELECTION_WEIGHTS
        .targetCourseMatch;
  }


  /*
  |--------------------------------------------------------------------------
  | ENTRANCE EXAM MATCH
  |--------------------------------------------------------------------------
  */

  if (
    intersects(
      question.entranceExams ||
        [],
      profile.entranceExams
    )
  ) {
    score +=
      SELECTION_WEIGHTS
        .entranceExamMatch;
  }

  /*
  |--------------------------------------------------------------------------
  | TRAIT BOOST
  |--------------------------------------------------------------------------
  */

  const boostedTraits =
    getBoostedTraits(
      profile
    );


  if (
    boostedTraits.includes(
      question.trait
    )
  ) {
    score +=
      SELECTION_WEIGHTS
        .boostedTrait;
  }


  /*
  |--------------------------------------------------------------------------
  | DIFFICULTY
  |--------------------------------------------------------------------------
  */

  if (
    stageConfig
      .preferredDifficulty
      .includes(
        question.difficulty
      )
  ) {
    score +=
      SELECTION_WEIGHTS
        .preferredDifficulty;
  }


  /*
  |--------------------------------------------------------------------------
  | STABLE RANDOMISATION
  |--------------------------------------------------------------------------
  */

  const tieBreaker =
    stableHash(
      profile.seed +
      '::' +
      question.id
    ) /
    4294967295;


  return {
    question,
    score,
    tieBreaker,
  };
}


export function rankQuestions({
  questions,
  profile,
  stageConfig,
}) {
  return questions
    .map(
      question =>
        scoreQuestion({
          question,
          profile,
          stageConfig,
        })
    )
    .sort(
      (a, b) =>
        (
          b.score -
          a.score
        ) ||
        (
          b.tieBreaker -
          a.tieBreaker
        )
    );
}


export default rankQuestions;

