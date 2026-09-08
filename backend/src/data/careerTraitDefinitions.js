/*
|--------------------------------------------------------------------------
| TruMarg Career Trait Definitions V6
|--------------------------------------------------------------------------
|
| This file intentionally keeps:
|
| 1. New V5 psychometric-style assessment traits
| 2. Legacy/professional-signal traits used by existing career profiles
|
| Do NOT delete legacy professional signals yet because College/Graduate
| discriminator questions and career profiles may still depend on them.
|--------------------------------------------------------------------------
*/

export const TRAIT_DEFINITIONS = {

  /*
  |--------------------------------------------------------------------------
  | V5 CONTROLLED ASSESSMENT TRAITS
  |--------------------------------------------------------------------------
  */

  analytical: {
    label: 'Analytical Thinking',
    group: 'strength',
  },

  quantitative: {
    label: 'Quantitative Reasoning',
    group: 'strength',
  },

  verbal: {
    label: 'Verbal Communication',
    group: 'strength',
  },

  creativity: {
    label: 'Creativity',
    group: 'interest',
  },

  technology: {
    label: 'Technology Interest',
    group: 'interest',
  },

  hands_on: {
    label: 'Hands-On Orientation',
    group: 'work-style',
  },

  scientific_curiosity: {
    label: 'Scientific Curiosity',
    group: 'interest',
  },

  social_helping: {
    label: 'Helping & Social Orientation',
    group: 'interest',
  },

  leadership: {
    label: 'Leadership',
    group: 'work-style',
  },

  collaboration: {
    label: 'Collaboration',
    group: 'work-style',
  },

  independence: {
    label: 'Independent Work',
    group: 'work-style',
  },

  structure: {
    label: 'Structured Work',
    group: 'work-style',
  },

  adaptability: {
    label: 'Adaptability',
    group: 'work-style',
  },

  achievement: {
    label: 'Achievement & Growth',
    group: 'career-value',
  },

  stability: {
    label: 'Stability & Security',
    group: 'career-value',
  },

  entrepreneurship: {
    label: 'Entrepreneurship',
    group: 'career-value',
  },


  /*
  |--------------------------------------------------------------------------
  | LEGACY / SPECIALIZED INTEREST TRAITS
  |--------------------------------------------------------------------------
  |
  | Preserve these while older questions, career profiles and specialized
  | discriminators still reference them.
  |--------------------------------------------------------------------------
  */

  healthcare: {
    label: 'Healthcare',
    group: 'interest',
  },

  business: {
    label: 'Business',
    group: 'interest',
  },

  creative: {
    label: 'Creative',
    group: 'legacy-interest',
  },

  law: {
    label: 'Law',
    group: 'interest',
  },

  research: {
    label: 'Research',
    group: 'interest',
  },

  publicService: {
    label: 'Public Service',
    group: 'interest',
  },


  /*
  |--------------------------------------------------------------------------
  | LEGACY STRENGTH TRAITS
  |--------------------------------------------------------------------------
  */

  numerical: {
    label: 'Numerical Ability',
    group: 'legacy-strength',
  },

  communication: {
    label: 'Communication',
    group: 'legacy-strength',
  },

  technical: {
    label: 'Technical Problem Solving',
    group: 'strength',
  },

  organization: {
    label: 'Organization',
    group: 'legacy-strength',
  },

  spatial: {
    label: 'Spatial Thinking',
    group: 'strength',
  },


  /*
  |--------------------------------------------------------------------------
  | LEGACY WORK STYLE TRAITS
  |--------------------------------------------------------------------------
  */

  people: {
    label: 'People-Oriented Work',
    group: 'legacy-work-style',
  },

  independent: {
    label: 'Independent Work',
    group: 'legacy-work-style',
  },

  structured: {
    label: 'Structured Work',
    group: 'legacy-work-style',
  },

  dynamic: {
    label: 'Dynamic Work',
    group: 'work-style',
  },

  fieldWork: {
    label: 'Field Work',
    group: 'work-style',
  },

  deskWork: {
    label: 'Desk Work',
    group: 'work-style',
  },

  handsOn: {
    label: 'Hands-On Work',
    group: 'legacy-work-style',
  },


  /*
  |--------------------------------------------------------------------------
  | LEGACY CAREER VALUES
  |--------------------------------------------------------------------------
  */

  income: {
    label: 'Income',
    group: 'career-value',
  },

  impact: {
    label: 'Impact',
    group: 'career-value',
  },

  creativityValue: {
    label: 'Creativity Value',
    group: 'career-value',
  },

  autonomy: {
    label: 'Autonomy',
    group: 'career-value',
  },

  workLifeBalance: {
    label: 'Work-Life Balance',
    group: 'career-value',
  },


  /*
  |--------------------------------------------------------------------------
  | PROFESSIONAL SIGNALS
  |--------------------------------------------------------------------------
  |
  | Especially important for College and Graduate adaptive discrimination.
  |--------------------------------------------------------------------------
  */

  software: {
    label: 'Software',
    group: 'professional-signal',
  },

  data: {
    label: 'Data',
    group: 'professional-signal',
  },

  ai: {
    label: 'AI / Machine Learning',
    group: 'professional-signal',
  },

  electronics: {
    label: 'Electronics',
    group: 'professional-signal',
  },

  embedded: {
    label: 'Embedded / IoT',
    group: 'professional-signal',
  },

  vlsi: {
    label: 'VLSI / Semiconductors',
    group: 'professional-signal',
  },

  coreEngineering: {
    label: 'Core Engineering',
    group: 'professional-signal',
  },

  management: {
    label: 'Management',
    group: 'professional-signal',
  },

  finance: {
    label: 'Finance',
    group: 'professional-signal',
  },

  marketing: {
    label: 'Marketing',
    group: 'professional-signal',
  },

  design: {
    label: 'Design',
    group: 'professional-signal',
  },
};


/*
|--------------------------------------------------------------------------
| CORE TRAITS BY STAGE
|--------------------------------------------------------------------------
|
| V6 aligns these EXACTLY with V5 question-bank trait names.
|
| All five stages currently use the 16 broad assessment traits.
|
| Why?
|
| First adaptive phase:
|   Build broad evidence across interests, strengths, work style and values.
|
| Later adaptive phase:
|   Repeat uncertain traits and introduce stage/profile-specific
|   discriminator/professional-signal questions.
|--------------------------------------------------------------------------
*/

const BROAD_CORE_TRAITS = Object.freeze([
  'analytical',
  'quantitative',
  'verbal',
  'creativity',

  'technology',
  'scientific_curiosity',
  'social_helping',

  'hands_on',
  'leadership',
  'collaboration',
  'independence',
  'structure',
  'adaptability',

  'achievement',
  'stability',
  'entrepreneurship',
]);


export const CORE_TRAITS_BY_STAGE = Object.freeze({
  foundation: BROAD_CORE_TRAITS,

  class10: BROAD_CORE_TRAITS,

  'senior-secondary': BROAD_CORE_TRAITS,

  college: BROAD_CORE_TRAITS,

  graduate: BROAD_CORE_TRAITS,
});


export const BROAD_ASSESSMENT_TRAITS =
  BROAD_CORE_TRAITS;


export default TRAIT_DEFINITIONS;
