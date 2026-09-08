export const SELECTION_WEIGHTS =
  Object.freeze({

    /*
    |--------------------------------------------------------------------------
    | Base metadata
    |--------------------------------------------------------------------------
    */

    priorityMultiplier: 4,

    preferredDifficulty: 5,


    /*
    |--------------------------------------------------------------------------
    | Student profile personalization
    |--------------------------------------------------------------------------
    */

    subjectMatch: 24,

    interestMatch: 24,

    boardMatch: 4,

    streamMatch: 26,

    targetStreamMatch: 24,

    degreeMatch: 28,

    specializationMatch: 26,

    skillMatch: 18,

    goalMatch: 18,

    careerFamilyMatch: 24,

    targetCourseMatch: 22,

    entranceExamMatch: 24,


    /*
    |--------------------------------------------------------------------------
    | Trait relevance
    |--------------------------------------------------------------------------
    */

    boostedTrait: 12,


    /*
    |--------------------------------------------------------------------------
    | Diversity
    |--------------------------------------------------------------------------
    */

    unusedScenarioFamily: 8,

    repeatedScenarioFamilyPenalty: -14,

  });


export const STAGE_WEIGHT_MULTIPLIERS =
  Object.freeze({

    'class-8': {
      interest: 1.00,
      subject: 0.85,
      stream: 0,
      degree: 0,
      specialization: 0,
      career: 0.60,
    },


    'class-9': {
      interest: 1.00,
      subject: 0.90,
      stream: 0,
      degree: 0,
      specialization: 0,
      career: 0.70,
    },


    'class-10': {
      interest: 1.00,
      subject: 1.00,
      stream: 1.20,
      degree: 0,
      specialization: 0,
      career: 0.85,
    },


    'class-11': {
      interest: 1.00,
      subject: 1.15,
      stream: 1.20,
      degree: 0.70,
      specialization: 0,
      career: 1.10,
    },


    'class-12': {
      interest: 1.00,
      subject: 1.15,
      stream: 1.15,
      degree: 1.00,
      specialization: 0.50,
      career: 1.20,
    },


    college: {
      interest: 0.85,
      subject: 0.70,
      stream: 0,
      degree: 1.20,
      specialization: 1.25,
      career: 1.30,
    },


    graduate: {
      interest: 0.80,
      subject: 0.50,
      stream: 0,
      degree: 1.10,
      specialization: 1.20,
      career: 1.40,
    },

  });


export function getStageWeightMultipliers(
  stage
) {
  return (
    STAGE_WEIGHT_MULTIPLIERS[
      stage
    ] ||
    {
      interest: 1,
      subject: 1,
      stream: 1,
      degree: 1,
      specialization: 1,
      career: 1,
    }
  );
}


export default SELECTION_WEIGHTS;

