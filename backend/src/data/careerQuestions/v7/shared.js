export const V7_CANONICAL_TRAITS = [
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
];

export const V7_CLASS_CONFIG = {
  'class-8': {
    stage: 'foundation',
    classNumber: 8,
    minimumTarget: 3000,
  },

  'class-9': {
    stage: 'foundation',
    classNumber: 9,
    minimumTarget: 3000,
  },

  'class-10': {
    stage: 'class10',
    classNumber: 10,
    minimumTarget: 3500,
  },

  'class-11': {
    stage: 'senior-secondary',
    classNumber: 11,
    minimumTarget: 3000,
  },

  'class-12': {
    stage: 'senior-secondary',
    classNumber: 12,
    minimumTarget: 3000,
  },

  college: {
    stage: 'college',
    classNumber: null,
    minimumTarget: 2750,
  },

  graduate: {
    stage: 'graduate',
    classNumber: null,
    minimumTarget: 2750,
  },
};

export const V7_BOARDS = [
  'cbse',
  'icse',
  'isc',
  'state-board',
  'ib',
  'cambridge',
  'other',
];

export const V7_SUBJECTS = [
  'mathematics',
  'science',
  'physics',
  'chemistry',
  'biology',
  'computer-science',
  'information-technology',
  'english',
  'hindi',
  'social-science',
  'history',
  'geography',
  'economics',
  'accountancy',
  'business-studies',
  'political-science',
  'psychology',
  'sociology',
  'fine-arts',
  'physical-education',
];

export const V7_INTEREST_CLUSTERS = [
  'technology',
  'engineering',
  'science',
  'medicine-health',
  'business',
  'finance',
  'design-creative',
  'law-policy',
  'education-social-impact',
  'media-communication',
];

export const V7_CAREER_FAMILIES = [
  'technology-computing',
  'engineering-applied-technology',
  'science-research',
  'medicine-health',
  'business-entrepreneurship',
  'finance-economics',
  'design-creative-fields',
  'law-policy-governance',
  'education-social-impact',
  'media-communication',
];

export const V7_CONTEXT_SCOPES = [
  'universal',
  'class',
  'board',
  'subject',
  'interest',
  'career-discriminator',
  'academic-context',
];

export const V7_RESPONSE_FORMATS = [
  'likert-5',
];

export const V7_LIKERT_5 = [
  {
    value: 1,
    label: 'Strongly disagree',
  },
  {
    value: 2,
    label: 'Disagree',
  },
  {
    value: 3,
    label: 'Not sure',
  },
  {
    value: 4,
    label: 'Agree',
  },
  {
    value: 5,
    label: 'Strongly agree',
  },
];

export function buildV7Question({
  id,
  classKey,
  section,
  trait,
  text,

  purpose = 'measurement',
  options = V7_LIKERT_5,

  degrees = [],
  branches = [],
  streams = [],
  subjects = [],
  skills = [],
  goals = [],
  tags = [],

  boards = [],
  interestClusters = [],
  careerFamilies = [],

  difficulty = 2,
  discriminatorGroup = null,

  // Distinct real-world situation measured by this item.
  // Example: travel-route-comparison
  scenario = null,

  // Broader semantic family for duplicate-control
  // at large question-bank scale.
  //
  // Example:
  // scenarioFamily: 'decision-comparison'
  // scenario: 'travel-route-time-cost-comparison'
  //
  scenarioFamily = null,

  contextScope = 'universal',
  responseFormat = 'likert-5',

  priority = 3,
  weight = 1,
  active = true,
}) {
  const config =
    V7_CLASS_CONFIG[
      classKey
    ];

  if (!config) {
    throw new Error(
      `Unknown V7 classKey: ${classKey}`
    );
  }

  const classes =
    config.classNumber != null
      ? [classKey]
      : [];

  return {
    id,

    stage:
      config.stage,

    section,
    trait,
    purpose,
    text,

    options,

    degrees,
    branches,
    streams,
    subjects,
    skills,
    goals,
    tags: [
      'career-bank-v7',
      classKey,
      trait,
      ...tags,
    ],

    classes,
    boards,
    interestClusters,
    careerFamilies,

    difficulty,
    discriminatorGroup,
    scenario,
    scenarioFamily,
    contextScope,

    minClass:
      config.classNumber,

    maxClass:
      config.classNumber,

    responseFormat,

    priority,
    weight,
    active,

    version: 7,
  };
}
