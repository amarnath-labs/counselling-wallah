export const STAGE_CONFIGS =
  Object.freeze({

    'class-8': {
      key:
        'class-8',

      assessmentSize:
        40,

      minQuestionsPerTrait:
        2,

      maxQuestionsPerTrait:
        4,

      preferredDifficulty:
        [2, 3],

      purpose:
        'foundation-career-exploration',
    },


    'class-9': {
      key:
        'class-9',

      assessmentSize:
        40,

      minQuestionsPerTrait:
        2,

      maxQuestionsPerTrait:
        4,

      preferredDifficulty:
        [2, 3],

      purpose:
        'interest-and-subject-exploration',
    },


    'class-10': {
      key:
        'class-10',

      assessmentSize:
        42,

      minQuestionsPerTrait:
        2,

      maxQuestionsPerTrait:
        4,

      preferredDifficulty:
        [2, 3],

      purpose:
        'stream-and-career-direction',
    },


    'class-11': {
      key:
        'class-11',

      assessmentSize:
        42,

      minQuestionsPerTrait:
        2,

      maxQuestionsPerTrait:
        4,

      preferredDifficulty:
        [2, 3],

      purpose:
        'course-and-career-direction',
    },


    'class-12': {
      key:
        'class-12',

      assessmentSize:
        42,

      minQuestionsPerTrait:
        2,

      maxQuestionsPerTrait:
        4,

      preferredDifficulty:
        [2, 3, 4],

      purpose:
        'degree-entrance-and-career-direction',
    },


    college: {
      key:
        'college',

      assessmentSize:
        44,

      minQuestionsPerTrait:
        2,

      maxQuestionsPerTrait:
        4,

      preferredDifficulty:
        [3, 4],

      purpose:
        'specialisation-employability-and-career-fit',
    },


    graduate: {
      key:
        'graduate',

      assessmentSize:
        44,

      minQuestionsPerTrait:
        2,

      maxQuestionsPerTrait:
        4,

      preferredDifficulty:
        [3, 4],

      purpose:
        'career-transition-and-professional-fit',
    },

  });


export function getStageConfig(
  stage
) {
  const config =
    STAGE_CONFIGS[
      stage
    ];


  if (!config) {
    throw new Error(
      `Unsupported assessment stage: ${stage}`
    );
  }


  return config;
}


export default STAGE_CONFIGS;
