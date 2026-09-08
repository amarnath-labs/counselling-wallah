import {
  buildV7Question,
  V7_CANONICAL_TRAITS,
} from '../shared.js';


const PREFIX = Object.freeze({
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


const SLUG =
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/;


function requireText(
  value,
  field
) {
  if (
    typeof value !== 'string' ||
    !value.trim()
  ) {
    throw new Error(
      `Missing ${field}`
    );
  }
}


function requireSlug(
  value,
  field
) {
  requireText(
    value,
    field
  );

  if (
    !SLUG.test(value)
  ) {
    throw new Error(
      `Invalid ${field}: ${value}`
    );
  }
}


export function buildAdaptiveQuestion({
  classKey,
  sequence,
  section,
  trait,
  text,

  scenarioFamily,
  scenario,

  purpose = 'measurement',

  subjects = [],
  streams = [],
  skills = [],
  boards = [],
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
}) {
  const prefix =
    PREFIX[classKey];


  if (!prefix) {
    throw new Error(
      `Unsupported classKey ${classKey}`
    );
  }


  if (
    !V7_CANONICAL_TRAITS.includes(
      trait
    )
  ) {
    throw new Error(
      `Unsupported trait ${trait}`
    );
  }


  if (
    !Number.isInteger(sequence) ||
    sequence < 1
  ) {
    throw new Error(
      `Invalid sequence ${sequence}`
    );
  }


  requireText(
    section,
    'section'
  );

  requireText(
    text,
    'text'
  );

  requireSlug(
    scenarioFamily,
    'scenarioFamily'
  );

  requireSlug(
    scenario,
    'scenario'
  );


  const suffix =
    String(sequence)
      .padStart(
        3,
        '0'
      );


  return buildV7Question({
    id:
      `v7_${prefix}_${trait}_${suffix}`,

    classKey,

    section,
    trait,
    text,
    purpose,

    scenarioFamily,
    scenario,

    subjects,
    streams,
    skills,
    boards,
    degrees,
    branches,

    interestClusters,
    careerFamilies,

    goals:
      goals ||
      DEFAULT_GOALS[classKey] ||
      [],

    tags,

    contextScope,

    discriminatorGroup,

    difficulty,
    priority,
    weight,
  });
}
