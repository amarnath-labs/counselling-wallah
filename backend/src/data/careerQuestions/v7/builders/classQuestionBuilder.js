import {
  buildV7Question,
  V7_CANONICAL_TRAITS,
} from '../shared.js';


const CLASS_PREFIX = Object.freeze({
  'class-8': 'class8',
  'class-9': 'class9',
  'class-10': 'class10',
  'class-11': 'class11',
  'class-12': 'class12',
  college: 'college',
  graduate: 'graduate',
});


const DEFAULT_GOALS = Object.freeze({
  'class-8': [
    'explore-careers',
  ],

  'class-9': [
    'explore-careers',
  ],

  'class-10': [
    'choose-stream',
    'explore-careers',
  ],

  'class-11': [
    'choose-course',
    'entrance-exams',
    'explore-careers',
  ],

  'class-12': [
    'choose-course',
    'entrance-exams',
    'explore-careers',
  ],

  college: [
    'first-job',
    'internship',
    'higher-studies',
    'career-direction',
  ],

  graduate: [
    'first-job',
    'career-switch',
    'higher-studies',
    'government-career',
    'career-direction',
  ],
});


const SLUG_PATTERN =
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/;


function assertNonEmptyString(
  value,
  name
) {
  if (
    typeof value !== 'string' ||
    !value.trim()
  ) {
    throw new Error(
      `Missing ${name}`
    );
  }
}


function assertSlug(
  value,
  name
) {
  assertNonEmptyString(
    value,
    name
  );

  if (
    !SLUG_PATTERN.test(
      value
    )
  ) {
    throw new Error(
      `Invalid ${name} slug: ${value}`
    );
  }
}


function normalizeSequence(
  value
) {
  const number =
    Number(value);

  if (
    !Number.isInteger(number) ||
    number < 1
  ) {
    throw new Error(
      `Invalid question sequence: ${value}`
    );
  }

  return String(
    number
  ).padStart(
    3,
    '0'
  );
}


export function buildClassQuestion({
  classKey,
  sequence,
  section,
  trait,
  text,

  scenarioFamily,
  scenario,

  purpose = 'measurement',

  subjects = [],
  skills = [],
  boards = [],
  streams = [],
  degrees = [],
  branches = [],

  interestClusters = [],
  careerFamilies = [],

  goals = null,
  tags = [],

  contextScope = 'class',

  discriminatorGroup = null,

  difficulty = 2,
  priority = 4,
  weight = 1,

  active = true,
}) {
  const prefix =
    CLASS_PREFIX[
      classKey
    ];

  if (!prefix) {
    throw new Error(
      `Unsupported V7 classKey: ${classKey}`
    );
  }


  if (
    !V7_CANONICAL_TRAITS.includes(
      trait
    )
  ) {
    throw new Error(
      `Invalid canonical trait: ${trait}`
    );
  }


  assertNonEmptyString(
    section,
    'section'
  );

  assertNonEmptyString(
    text,
    'question text'
  );

  assertSlug(
    scenarioFamily,
    'scenarioFamily'
  );

  assertSlug(
    scenario,
    'scenario'
  );


  const number =
    normalizeSequence(
      sequence
    );


  return buildV7Question({
    id:
      `v7_${prefix}_${trait}_${number}`,

    classKey,

    section,
    trait,
    text,
    purpose,

    scenarioFamily,
    scenario,

    subjects,
    skills,
    boards,
    streams,
    degrees,
    branches,

    interestClusters,
    careerFamilies,

    goals:
      goals ||
      DEFAULT_GOALS[
        classKey
      ] ||
      [],

    tags,

    contextScope,

    discriminatorGroup,

    difficulty,
    priority,
    weight,
    active,
  });
}


export function buildQuestionBatch({
  classKey,
  questions,
}) {
  if (
    !Array.isArray(
      questions
    )
  ) {
    throw new Error(
      'questions must be an array'
    );
  }


  const ids =
    new Set();

  const scenarios =
    new Set();


  return questions.map(
    (item) => {
      const question =
        buildClassQuestion({
          ...item,
          classKey,
        });


      if (
        ids.has(
          question.id
        )
      ) {
        throw new Error(
          `Duplicate batch id: ${question.id}`
        );
      }


      /*
      | Same class + trait + semantic scenario
      | must not be repeated.
      */

      const scenarioKey =
        `${question.trait}::${question.scenario}`;


      if (
        scenarios.has(
          scenarioKey
        )
      ) {
        throw new Error(
          `Duplicate batch scenario: ${scenarioKey}`
        );
      }


      ids.add(
        question.id
      );

      scenarios.add(
        scenarioKey
      );


      return question;
    }
  );
}


export {
  CLASS_PREFIX,
  DEFAULT_GOALS,
};
