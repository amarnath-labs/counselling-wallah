import {
  buildV7Question,
} from './shared.js';


const CLASS_KEY = 'class-8';


/*
|--------------------------------------------------------------------------
| CLASS 8 SCENARIO TAXONOMY
|--------------------------------------------------------------------------
|
| Every V7 question measures the trait through a distinct situation.
|
| IMPORTANT:
| - Scenario IDs describe the actual situation being measured.
| - They are NOT artificial question-number aliases.
| - Same trait + same scenario is not allowed.
|
*/

const CLASS8_SCENARIOS = Object.freeze({

  // ANALYTICAL
  analytical_001:
    'maths-step-error-investigation',

  analytical_002:
    'conflicting-explanations-evidence-comparison',

  analytical_003:
    'multiple-options-pros-cons-comparison',

  analytical_004:
    'hidden-pattern-rule-discovery',

  analytical_005:
    'broken-system-cause-troubleshooting',

  analytical_006:
    'concept-why-before-memorisation',


  // QUANTITATIVE
  quantitative_001:
    'everyday-numerical-information-comparison',

  quantitative_002:
    'calculation-based-problem-preference',

  quantitative_003:
    'fixed-budget-resource-allocation',

  quantitative_004:
    'graph-table-information-interpretation',

  quantitative_005:
    'numerical-career-task-attraction',

  quantitative_006:
    'numerical-answer-reasonableness-check',


  // VERBAL
  verbal_001:
    'classmate-concept-explanation',

  verbal_002:
    'language-discussion-activity-interest',

  verbal_003:
    'disagreement-reasoned-explanation',

  verbal_004:
    'own-words-learning-explanation',

  verbal_005:
    'communication-centred-career-interest',

  verbal_006:
    'group-project-presentation',


  // CREATIVITY
  creativity_001:
    'open-ended-school-task-ideas',

  creativity_002:
    'everyday-object-idea-improvement',

  creativity_003:
    'creative-media-project-expression',

  creativity_004:
    'unusual-alternative-solution',

  creativity_005:
    'creative-career-attraction',

  creativity_006:
    'personal-ideas-in-assignment',


  // TECHNOLOGY
  technology_001:
    'digital-system-inner-workings-curiosity',

  technology_002:
    'device-app-troubleshooting',

  technology_003:
    'technology-based-digital-creation',

  technology_004:
    'new-digital-tool-exploration',

  technology_005:
    'technology-career-exploration',

  technology_006:
    'emerging-technology-problem-use-analysis',


  // HANDS ON
  hands_on_001:
    'physical-building-assembly-repair',

  hands_on_002:
    'learning-by-doing',

  hands_on_003:
    'science-experiment-participation',

  hands_on_004:
    'physical-model-adjustment-testing',

  hands_on_005:
    'practical-field-career-interest',

  hands_on_006:
    'making-testing-over-writing-preference',


  // SCIENTIFIC CURIOSITY
  scientific_curiosity_001:
    'everyday-phenomena-why-curiosity',

  scientific_curiosity_002:
    'surprising-science-fact-exploration',

  scientific_curiosity_003:
    'unexpected-experiment-result-investigation',

  scientific_curiosity_004:
    'scientific-claim-evidence-seeking',

  scientific_curiosity_005:
    'research-discovery-career-interest',

  scientific_curiosity_006:
    'independent-science-topic-exploration',


  // SOCIAL HELPING
  social_helping_001:
    'helping-someone-learn-without-reward',

  social_helping_002:
    'struggling-classmate-group-inclusion',

  social_helping_003:
    'people-wellbeing-impact-interest',

  social_helping_004:
    'understanding-person-before-judgement',

  social_helping_005:
    'people-helping-career-interest',

  social_helping_006:
    'social-benefit-activity-choice',


  // LEADERSHIP
  leadership_001:
    'uncertain-group-start-direction',

  leadership_002:
    'class-activity-organisation-responsibility',

  leadership_003:
    'group-multiple-ideas-decision',

  leadership_004:
    'quiet-member-participation-encouragement',

  leadership_005:
    'team-guidance-career-interest',

  leadership_006:
    'team-setback-plan-reorganisation',


  // COLLABORATION
  collaboration_001:
    'different-skills-shared-project',

  collaboration_002:
    'listening-to-different-group-ideas',

  collaboration_003:
    'group-disagreement-common-solution',

  collaboration_004:
    'team-dependency-task-responsibility',

  collaboration_005:
    'cross-specialty-team-career-interest',

  collaboration_006:
    'teammate-feedback-work-revision',


  // INDEPENDENCE
  independence_001:
    'assignment-self-attempt-before-guidance',

  independence_002:
    'self-directed-topic-exploration',

  independence_003:
    'forming-opinion-before-peer-choice',

  independence_004:
    'problem-self-attempt-before-help',

  independence_005:
    'autonomous-work-career-preference',

  independence_006:
    'personal-goal-without-reminders',


  // STRUCTURE
  structure_001:
    'clear-task-deadline-preference',

  structure_002:
    'large-task-step-breakdown',

  structure_003:
    'study-material-task-organisation',

  structure_004:
    'complicated-activity-basic-planning',

  structure_005:
    'defined-procedure-work-preference',

  structure_006:
    'checklist-sequence-error-prevention',


  // ADAPTABILITY
  adaptability_001:
    'sudden-plan-change-adjustment',

  adaptability_002:
    'switching-learning-method',

  adaptability_003:
    'different-classmate-work-style',

  adaptability_004:
    'new-evidence-changing-approach',

  adaptability_005:
    'changing-tools-responsibilities-career',

  adaptability_006:
    'unfamiliar-topic-under-uncertainty',


  // ACHIEVEMENT
  achievement_001:
    'difficult-goal-completion-satisfaction',

  achievement_002:
    'extra-effort-for-performance-improvement',

  achievement_003:
    'voluntary-challenging-task-choice',

  achievement_004:
    'measurable-progress-motivation',

  achievement_005:
    'career-skill-responsibility-progression',

  achievement_006:
    'long-goal-persistence',


  // STABILITY
  stability_001:
    'predictability-before-important-task',

  stability_002:
    'predictable-future-option-preference',

  stability_003:
    'regular-routine-consistency',

  stability_004:
    'major-choice-risk-understanding',

  stability_005:
    'career-long-term-security',

  stability_006:
    'unexpected-change-discomfort',


  // ENTREPRENEURSHIP
  entrepreneurship_001:
    'useful-product-service-idea-generation',

  entrepreneurship_002:
    'everyday-problem-solution-opportunity',

  entrepreneurship_003:
    'customer-choice-curiosity',

  entrepreneurship_004:
    'own-idea-small-project-creation',

  entrepreneurship_005:
    'future-own-venture-interest',

  entrepreneurship_006:
    'promising-idea-under-uncertainty',

});


/*
|--------------------------------------------------------------------------
| SCENARIO FAMILY ARCHITECTURE
|--------------------------------------------------------------------------
|
| Specific scenario = exact assessment situation.
| Scenario family = broader behavioural/context family.
|
| These families deliberately repeat across related situations.
| This lets large-bank QA detect over-production from one concept.
|
*/

const CLASS8_SCENARIO_FAMILIES =
  Object.freeze({

    analytical: [
      'error-investigation',
      'evidence-evaluation',
      'decision-comparison',
      'pattern-reasoning',
      'root-cause-analysis',
      'conceptual-reasoning',
    ],

    quantitative: [
      'number-comparison',
      'numerical-problem-solving',
      'budget-allocation',
      'data-interpretation',
      'quantitative-career-interest',
      'numerical-verification',
    ],

    verbal: [
      'concept-explanation',
      'language-expression',
      'reasoned-discussion',
      'written-expression',
      'communication-career-interest',
      'public-presentation',
    ],

    creativity: [
      'open-ended-ideation',
      'improvement-invention',
      'creative-production',
      'alternative-solutions',
      'creative-career-interest',
      'personal-expression',
    ],

    technology: [
      'technology-curiosity',
      'digital-troubleshooting',
      'digital-creation',
      'tool-exploration',
      'technology-career-interest',
      'technology-impact-analysis',
    ],

    hands_on: [
      'physical-making',
      'experiential-learning',
      'laboratory-experimentation',
      'prototype-testing',
      'practical-career-interest',
      'making-versus-theory',
    ],

    scientific_curiosity: [
      'phenomena-explanation',
      'science-discovery',
      'experimental-investigation',
      'scientific-evidence',
      'research-career-interest',
      'independent-science-exploration',
    ],

    social_helping: [
      'peer-learning-support',
      'social-inclusion',
      'wellbeing-impact',
      'empathy-perspective',
      'helping-career-interest',
      'prosocial-values',
    ],

    leadership: [
      'group-direction',
      'organisation-responsibility',
      'team-decision-making',
      'member-encouragement',
      'leadership-career-interest',
      'setback-reorganisation',
    ],

    collaboration: [
      'complementary-teamwork',
      'idea-listening',
      'conflict-resolution',
      'team-reliability',
      'collaborative-career-interest',
      'feedback-integration',
    ],

    independence: [
      'self-directed-task',
      'self-directed-learning',
      'independent-judgement',
      'independent-problem-solving',
      'autonomous-career-preference',
      'self-management',
    ],

    structure: [
      'task-clarity',
      'work-breakdown',
      'organisation-system',
      'planning-process',
      'structured-career-preference',
      'checklist-process',
    ],

    adaptability: [
      'plan-change',
      'learning-method-change',
      'social-workstyle-change',
      'evidence-based-revision',
      'dynamic-career-preference',
      'uncertainty-exploration',
    ],

    achievement: [
      'goal-attainment',
      'performance-improvement',
      'challenge-seeking',
      'progress-feedback',
      'career-progression',
      'goal-persistence',
    ],

    stability: [
      'predictability-preference',
      'future-certainty',
      'routine-preference',
      'risk-awareness',
      'career-security',
      'change-tolerance',
    ],

    entrepreneurship: [
      'opportunity-ideation',
      'problem-opportunity',
      'customer-behaviour',
      'idea-execution',
      'venture-career-interest',
      'risk-opportunity',
    ],
  });


function getScenarioFamily(
  id,
  trait
) {
  const parts =
    String(id).split('_');

  const itemNumber =
    Number(
      parts.at(-1)
    );


  const families =
    CLASS8_SCENARIO_FAMILIES[
      trait
    ];


  if (
    !families ||
    !Number.isInteger(
      itemNumber
    ) ||
    itemNumber < 1 ||
    itemNumber >
      families.length
  ) {
    throw new Error(
      `Missing scenario family for ${id}`
    );
  }


  return families[
    itemNumber - 1
  ];
}


function q({
  id,
  section,
  trait,
  text,
  purpose = 'measurement',
  subjects = [],
  goals = ['explore-careers'],
  boards = [],
  interestClusters = [],
  careerFamilies = [],
  skills = [],
  contextScope = 'class',
  discriminatorGroup = null,
  difficulty = 2,
  priority = 4,
  tags = [],
}) {
  const scenario =
    CLASS8_SCENARIOS[id];


  const scenarioFamily =
    getScenarioFamily(
      id,
      trait
    );


  if (!scenario) {
    throw new Error(
      `Missing Class-8 scenario metadata for ${id}`
    );
  }


  return buildV7Question({
    id: `v7_class8_${id}`,
    classKey: CLASS_KEY,
    section,
    trait,
    text,
    scenario,
    scenarioFamily,
    purpose,
    subjects,
    goals,
    boards,
    interestClusters,
    careerFamilies,
    skills,
    contextScope,
    discriminatorGroup,
    difficulty,
    priority,
    tags,
  });
}


export const QUESTIONS = [

  /*
  |--------------------------------------------------------------------------
  | 1. ANALYTICAL
  |--------------------------------------------------------------------------
  */

  q({
    id: 'analytical_001',
    section: 'strength',
    trait: 'analytical',
    text:
      'When a maths answer seems wrong, I like checking each step to find where the mistake happened.',
    subjects: ['mathematics'],
    contextScope: 'subject',
    difficulty: 2,
    tags: ['error-checking', 'reasoning'],
  }),

  q({
    id: 'analytical_002',
    section: 'problem-solving',
    trait: 'analytical',
    text:
      'If two explanations for the same event are different, I try to compare the evidence behind both.',
    subjects: ['science', 'social-science'],
    contextScope: 'subject',
    difficulty: 3,
    tags: ['evidence', 'comparison'],
  }),

  q({
    id: 'analytical_003',
    section: 'work-style',
    trait: 'analytical',
    text:
      'Before choosing between several options, I usually compare their advantages and disadvantages.',
    contextScope: 'class',
    difficulty: 2,
    tags: ['decision-making'],
  }),

  q({
    id: 'analytical_004',
    section: 'interest',
    trait: 'analytical',
    text:
      'I enjoy puzzles where I have to discover a hidden rule or pattern rather than remember a fact.',
    interestClusters: ['technology', 'science'],
    contextScope: 'interest',
    difficulty: 2,
    tags: ['patterns', 'puzzles'],
  }),

  q({
    id: 'analytical_005',
    section: 'problem-solving',
    trait: 'analytical',
    text:
      'When something stops working, I prefer thinking about possible causes before trying random solutions.',
    careerFamilies: [
      'technology-computing',
      'engineering-applied-technology',
    ],
    contextScope: 'career-discriminator',
    discriminatorGroup: 'analytical-troubleshooting',
    difficulty: 3,
    tags: ['troubleshooting'],
  }),

  q({
    id: 'analytical_006',
    section: 'academic-habits',
    trait: 'analytical',
    text:
      'When I learn a new idea, I try to understand why it works instead of only memorising the final rule.',
    contextScope: 'class',
    difficulty: 2,
    tags: ['conceptual-learning'],
  }),


  /*
  |--------------------------------------------------------------------------
  | 2. QUANTITATIVE
  |--------------------------------------------------------------------------
  */

  q({
    id: 'quantitative_001',
    section: 'strength',
    trait: 'quantitative',
    text:
      'I feel comfortable comparing numbers, percentages, marks, prices, or other numerical information.',
    subjects: ['mathematics'],
    contextScope: 'subject',
    tags: ['numbers'],
  }),

  q({
    id: 'quantitative_002',
    section: 'interest',
    trait: 'quantitative',
    text:
      'I enjoy questions where I have to calculate something rather than only write an explanation.',
    subjects: ['mathematics', 'science'],
    contextScope: 'subject',
    tags: ['calculation'],
  }),

  q({
    id: 'quantitative_003',
    section: 'real-life',
    trait: 'quantitative',
    text:
      'If I have a fixed amount of money to spend, I like working out how to use it efficiently.',
    contextScope: 'class',
    tags: ['budgeting'],
  }),

  q({
    id: 'quantitative_004',
    section: 'problem-solving',
    trait: 'quantitative',
    text:
      'Graphs and tables usually help me understand information faster than long written descriptions.',
    subjects: ['mathematics', 'science', 'social-science'],
    contextScope: 'subject',
    tags: ['graphs', 'data'],
  }),

  q({
    id: 'quantitative_005',
    section: 'career-exploration',
    trait: 'quantitative',
    text:
      'Careers involving data, calculations, measurements, or numerical analysis sound interesting to me.',
    interestClusters: ['technology', 'engineering', 'finance', 'science'],
    careerFamilies: [
      'technology-computing',
      'engineering-applied-technology',
      'finance-economics',
      'science-research',
    ],
    contextScope: 'career-discriminator',
    discriminatorGroup: 'quantitative-career',
    difficulty: 3,
  }),

  q({
    id: 'quantitative_006',
    section: 'academic-habits',
    trait: 'quantitative',
    text:
      'When solving a numerical problem, I like checking whether my final answer is reasonable.',
    subjects: ['mathematics', 'science'],
    contextScope: 'subject',
    tags: ['estimation', 'verification'],
  }),


  /*
  |--------------------------------------------------------------------------
  | 3. VERBAL
  |--------------------------------------------------------------------------
  */

  q({
    id: 'verbal_001',
    section: 'strength',
    trait: 'verbal',
    text:
      'I can usually explain an idea clearly when a classmate does not understand it.',
    subjects: ['english', 'hindi'],
    contextScope: 'class',
    tags: ['explanation'],
  }),

  q({
    id: 'verbal_002',
    section: 'interest',
    trait: 'verbal',
    text:
      'I enjoy activities involving stories, articles, speeches, debates, or discussions.',
    subjects: ['english', 'hindi', 'social-science'],
    contextScope: 'subject',
    tags: ['reading', 'speaking'],
  }),

  q({
    id: 'verbal_003',
    section: 'communication',
    trait: 'verbal',
    text:
      'When I disagree with someone, I try to explain my reasons instead of only saying they are wrong.',
    contextScope: 'class',
    difficulty: 3,
    tags: ['argument', 'communication'],
  }),

  q({
    id: 'verbal_004',
    section: 'academic-habits',
    trait: 'verbal',
    text:
      'Writing an answer in my own words helps me understand a topic better.',
    subjects: ['english', 'social-science', 'science'],
    contextScope: 'subject',
    tags: ['writing'],
  }),

  q({
    id: 'verbal_005',
    section: 'career-exploration',
    trait: 'verbal',
    text:
      'I can imagine enjoying a future where communicating ideas is an important part of the work.',
    interestClusters: [
      'media-communication',
      'law-policy',
      'education-social-impact',
    ],
    careerFamilies: [
      'media-communication',
      'law-policy-governance',
      'education-social-impact',
    ],
    contextScope: 'career-discriminator',
    discriminatorGroup: 'verbal-career',
  }),

  q({
    id: 'verbal_006',
    section: 'work-style',
    trait: 'verbal',
    text:
      'In a group project, I am comfortable presenting our work or explaining it to others.',
    contextScope: 'class',
    tags: ['presentation'],
  }),


  /*
  |--------------------------------------------------------------------------
  | 4. CREATIVITY
  |--------------------------------------------------------------------------
  */

  q({
    id: 'creativity_001',
    section: 'interest',
    trait: 'creativity',
    text:
      'I enjoy thinking of more than one way to complete an open-ended school activity.',
    contextScope: 'class',
    tags: ['ideas'],
  }),

  q({
    id: 'creativity_002',
    section: 'strength',
    trait: 'creativity',
    text:
      'I often imagine improvements to objects, games, projects, stories, or things I see around me.',
    contextScope: 'class',
    tags: ['imagination', 'improvement'],
  }),

  q({
    id: 'creativity_003',
    section: 'expression',
    trait: 'creativity',
    text:
      'Creating a poster, story, model, design, video, or presentation sounds enjoyable to me.',
    subjects: ['fine-arts', 'english', 'computer-science'],
    interestClusters: ['design-creative', 'media-communication'],
    contextScope: 'interest',
  }),

  q({
    id: 'creativity_004',
    section: 'problem-solving',
    trait: 'creativity',
    text:
      'If the usual solution does not work, I enjoy trying an unusual approach.',
    contextScope: 'class',
    difficulty: 3,
    tags: ['alternative-solutions'],
  }),

  q({
    id: 'creativity_005',
    section: 'career-exploration',
    trait: 'creativity',
    text:
      'A career where I regularly create, design, invent, or develop new ideas sounds attractive to me.',
    interestClusters: [
      'design-creative',
      'technology',
      'media-communication',
    ],
    careerFamilies: [
      'design-creative-fields',
      'technology-computing',
      'media-communication',
    ],
    contextScope: 'career-discriminator',
    discriminatorGroup: 'creative-career',
  }),

  q({
    id: 'creativity_006',
    section: 'work-style',
    trait: 'creativity',
    text:
      'I prefer assignments that allow some personal ideas instead of requiring everyone to make exactly the same thing.',
    contextScope: 'class',
  }),


  /*
  |--------------------------------------------------------------------------
  | 5. TECHNOLOGY
  |--------------------------------------------------------------------------
  */

  q({
    id: 'technology_001',
    section: 'interest',
    trait: 'technology',
    text:
      'I am curious about how apps, websites, computers, or digital devices work behind the screen.',
    subjects: ['computer-science', 'information-technology'],
    interestClusters: ['technology'],
    contextScope: 'interest',
  }),

  q({
    id: 'technology_002',
    section: 'problem-solving',
    trait: 'technology',
    text:
      'When a device or app has a problem, I like exploring settings or possible fixes before giving up.',
    contextScope: 'class',
    tags: ['digital-troubleshooting'],
  }),

  q({
    id: 'technology_003',
    section: 'creation',
    trait: 'technology',
    text:
      'Using technology to build something, such as a small program, presentation, animation, or digital project, interests me.',
    subjects: ['computer-science', 'information-technology'],
    interestClusters: ['technology', 'design-creative'],
    contextScope: 'subject',
  }),

  q({
    id: 'technology_004',
    section: 'learning',
    trait: 'technology',
    text:
      'I enjoy discovering new digital tools and figuring out what they can do.',
    contextScope: 'class',
  }),

  q({
    id: 'technology_005',
    section: 'career-exploration',
    trait: 'technology',
    text:
      'I would like to explore careers where computers, software, electronics, or emerging technologies are central to the work.',
    interestClusters: ['technology', 'engineering'],
    careerFamilies: [
      'technology-computing',
      'engineering-applied-technology',
    ],
    contextScope: 'career-discriminator',
    discriminatorGroup: 'technology-career',
  }),

  q({
    id: 'technology_006',
    section: 'future-orientation',
    trait: 'technology',
    text:
      'When I hear about a new technology, I usually want to understand what problem it solves and how people might use it.',
    contextScope: 'class',
    difficulty: 3,
  }),


  /*
  |--------------------------------------------------------------------------
  | 6. HANDS ON
  |--------------------------------------------------------------------------
  */

  q({
    id: 'hands_on_001',
    section: 'interest',
    trait: 'hands_on',
    text:
      'I enjoy activities where I can build, assemble, repair, experiment with, or physically make something.',
    interestClusters: ['engineering', 'science'],
    contextScope: 'interest',
  }),

  q({
    id: 'hands_on_002',
    section: 'learning',
    trait: 'hands_on',
    text:
      'I understand some ideas better after trying them myself instead of only reading about them.',
    contextScope: 'class',
  }),

  q({
    id: 'hands_on_003',
    section: 'science',
    trait: 'hands_on',
    text:
      'Doing an experiment feels more interesting to me than only reading the experiment procedure.',
    subjects: ['science'],
    contextScope: 'subject',
  }),

  q({
    id: 'hands_on_004',
    section: 'problem-solving',
    trait: 'hands_on',
    text:
      'When making a model or project, I enjoy adjusting the actual parts until it works properly.',
    contextScope: 'class',
  }),

  q({
    id: 'hands_on_005',
    section: 'career-exploration',
    trait: 'hands_on',
    text:
      'A future career involving machines, laboratories, equipment, construction, fieldwork, or physical systems interests me.',
    interestClusters: ['engineering', 'science'],
    careerFamilies: [
      'engineering-applied-technology',
      'science-research',
    ],
    contextScope: 'career-discriminator',
    discriminatorGroup: 'hands-on-career',
  }),

  q({
    id: 'hands_on_006',
    section: 'work-style',
    trait: 'hands_on',
    text:
      'I would rather spend part of a project making or testing something than spend the entire time writing about it.',
    contextScope: 'class',
  }),


  /*
  |--------------------------------------------------------------------------
  | 7. SCIENTIFIC CURIOSITY
  |--------------------------------------------------------------------------
  */

  q({
    id: 'scientific_curiosity_001',
    section: 'interest',
    trait: 'scientific_curiosity',
    text:
      'I often wonder why natural events, machines, the human body, or everyday phenomena work the way they do.',
    subjects: ['science'],
    interestClusters: ['science'],
    contextScope: 'interest',
  }),

  q({
    id: 'scientific_curiosity_002',
    section: 'learning',
    trait: 'scientific_curiosity',
    text:
      'A surprising science fact usually makes me want to learn the explanation behind it.',
    subjects: ['science'],
    contextScope: 'subject',
  }),

  q({
    id: 'scientific_curiosity_003',
    section: 'problem-solving',
    trait: 'scientific_curiosity',
    text:
      'If an experiment gives an unexpected result, I become curious about what may have caused it.',
    subjects: ['science'],
    contextScope: 'subject',
    difficulty: 3,
  }),

  q({
    id: 'scientific_curiosity_004',
    section: 'evidence',
    trait: 'scientific_curiosity',
    text:
      'I like knowing what evidence supports a scientific explanation instead of accepting it only because someone said it.',
    subjects: ['science'],
    contextScope: 'subject',
    difficulty: 3,
  }),

  q({
    id: 'scientific_curiosity_005',
    section: 'career-exploration',
    trait: 'scientific_curiosity',
    text:
      'I would enjoy learning more about careers where people investigate unanswered questions or discover how things work.',
    interestClusters: ['science', 'medicine-health'],
    careerFamilies: [
      'science-research',
      'medicine-health',
    ],
    contextScope: 'career-discriminator',
    discriminatorGroup: 'science-career',
  }),

  q({
    id: 'scientific_curiosity_006',
    section: 'independent-exploration',
    trait: 'scientific_curiosity',
    text:
      'Sometimes I search for more information about a science topic even after the class lesson is finished.',
    subjects: ['science'],
    contextScope: 'subject',
  }),


  /*
  |--------------------------------------------------------------------------
  | 8. SOCIAL HELPING
  |--------------------------------------------------------------------------
  */

  q({
    id: 'social_helping_001',
    section: 'values',
    trait: 'social_helping',
    text:
      'Helping someone understand something gives me satisfaction even when I do not receive a reward.',
    contextScope: 'class',
  }),

  q({
    id: 'social_helping_002',
    section: 'social-style',
    trait: 'social_helping',
    text:
      'If a classmate is struggling in a group activity, I usually want to help them participate.',
    contextScope: 'class',
  }),

  q({
    id: 'social_helping_003',
    section: 'interest',
    trait: 'social_helping',
    text:
      'Activities that improve peopleÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢s health, learning, safety, or quality of life seem meaningful to me.',
    interestClusters: [
      'medicine-health',
      'education-social-impact',
    ],
    contextScope: 'interest',
  }),

  q({
    id: 'social_helping_004',
    section: 'perspective',
    trait: 'social_helping',
    text:
      'Before judging someoneÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢s problem, I try to understand what they may be experiencing.',
    contextScope: 'class',
    difficulty: 3,
  }),

  q({
    id: 'social_helping_005',
    section: 'career-exploration',
    trait: 'social_helping',
    text:
      'A career where my work directly helps, teaches, supports, protects, or cares for people sounds attractive to me.',
    interestClusters: [
      'medicine-health',
      'education-social-impact',
      'law-policy',
    ],
    careerFamilies: [
      'medicine-health',
      'education-social-impact',
      'law-policy-governance',
    ],
    contextScope: 'career-discriminator',
    discriminatorGroup: 'helping-career',
  }),

  q({
    id: 'social_helping_006',
    section: 'values',
    trait: 'social_helping',
    text:
      'When choosing an activity, its benefit to other people can matter to me as much as whether I personally enjoy it.',
    contextScope: 'class',
    difficulty: 3,
  }),


  /*
  |--------------------------------------------------------------------------
  | 9. LEADERSHIP
  |--------------------------------------------------------------------------
  */

  q({
    id: 'leadership_001',
    section: 'social-style',
    trait: 'leadership',
    text:
      'When a group is unsure how to begin, I am comfortable suggesting what we should do first.',
    contextScope: 'class',
  }),

  q({
    id: 'leadership_002',
    section: 'responsibility',
    trait: 'leadership',
    text:
      'I am willing to take responsibility for organising part of a class activity or project.',
    contextScope: 'class',
  }),

  q({
    id: 'leadership_003',
    section: 'decision-making',
    trait: 'leadership',
    text:
      'If a group has several ideas, I can help everyone move toward a decision.',
    contextScope: 'class',
    difficulty: 3,
  }),

  q({
    id: 'leadership_004',
    section: 'influence',
    trait: 'leadership',
    text:
      'I feel comfortable encouraging others to contribute when some group members are staying quiet.',
    contextScope: 'class',
    difficulty: 3,
  }),

  q({
    id: 'leadership_005',
    section: 'career-exploration',
    trait: 'leadership',
    text:
      'A future role where I coordinate people, make decisions, or guide a team sounds interesting to me.',
    interestClusters: ['business', 'law-policy'],
    careerFamilies: [
      'business-entrepreneurship',
      'law-policy-governance',
    ],
    contextScope: 'career-discriminator',
    discriminatorGroup: 'leadership-career',
  }),

  q({
    id: 'leadership_006',
    section: 'challenge',
    trait: 'leadership',
    text:
      'When a team faces a setback, I am willing to help reorganise the plan instead of waiting for someone else.',
    contextScope: 'class',
    difficulty: 3,
  }),


  /*
  |--------------------------------------------------------------------------
  | 10. COLLABORATION
  |--------------------------------------------------------------------------
  */

  q({
    id: 'collaboration_001',
    section: 'work-style',
    trait: 'collaboration',
    text:
      'I enjoy projects where different people contribute different skills to reach one result.',
    contextScope: 'class',
  }),

  q({
    id: 'collaboration_002',
    section: 'social-style',
    trait: 'collaboration',
    text:
      'During group work, I listen to other ideas even when my own idea is different.',
    contextScope: 'class',
  }),

  q({
    id: 'collaboration_003',
    section: 'conflict',
    trait: 'collaboration',
    text:
      'If group members disagree, I prefer finding a solution everyone can work with instead of proving one person right.',
    contextScope: 'class',
    difficulty: 3,
  }),

  q({
    id: 'collaboration_004',
    section: 'responsibility',
    trait: 'collaboration',
    text:
      'I try to complete my assigned part on time because other team members may depend on it.',
    contextScope: 'class',
  }),

  q({
    id: 'collaboration_005',
    section: 'career-exploration',
    trait: 'collaboration',
    text:
      'I can imagine enjoying work where people from different specialties regularly solve problems together.',
    careerFamilies: [
      'engineering-applied-technology',
      'medicine-health',
      'technology-computing',
      'business-entrepreneurship',
    ],
    contextScope: 'career-discriminator',
    discriminatorGroup: 'team-career',
  }),

  q({
    id: 'collaboration_006',
    section: 'feedback',
    trait: 'collaboration',
    text:
      'I am comfortable changing part of my work when useful feedback from teammates improves the final result.',
    contextScope: 'class',
    difficulty: 3,
  }),


  /*
  |--------------------------------------------------------------------------
  | 11. INDEPENDENCE
  |--------------------------------------------------------------------------
  */

  q({
    id: 'independence_001',
    section: 'work-style',
    trait: 'independence',
    text:
      'Once I understand an assignment, I usually prefer trying it myself before asking someone to guide every step.',
    contextScope: 'class',
  }),

  q({
    id: 'independence_002',
    section: 'learning',
    trait: 'independence',
    text:
      'If I become interested in a topic, I can explore it on my own without a teacher assigning it.',
    contextScope: 'class',
  }),

  q({
    id: 'independence_003',
    section: 'decision-making',
    trait: 'independence',
    text:
      'I like forming my own opinion before hearing what everyone else has chosen.',
    contextScope: 'class',
    difficulty: 3,
  }),

  q({
    id: 'independence_004',
    section: 'problem-solving',
    trait: 'independence',
    text:
      'When I face a manageable problem, I prefer attempting a solution before immediately asking someone else.',
    contextScope: 'class',
  }),

  q({
    id: 'independence_005',
    section: 'career-exploration',
    trait: 'independence',
    text:
      'I would be comfortable in future work where I am trusted to manage some tasks without constant supervision.',
    contextScope: 'career-discriminator',
    discriminatorGroup: 'independent-work',
  }),

  q({
    id: 'independence_006',
    section: 'responsibility',
    trait: 'independence',
    text:
      'I can usually keep working toward a personal goal even when nobody is reminding me.',
    contextScope: 'class',
    difficulty: 3,
  }),


  /*
  |--------------------------------------------------------------------------
  | 12. STRUCTURE
  |--------------------------------------------------------------------------
  */

  q({
    id: 'structure_001',
    section: 'work-style',
    trait: 'structure',
    text:
      'I work better when I know clearly what needs to be done and when it should be finished.',
    contextScope: 'class',
  }),

  q({
    id: 'structure_002',
    section: 'academic-habits',
    trait: 'structure',
    text:
      'For a large school task, I prefer dividing the work into smaller steps.',
    contextScope: 'class',
  }),

  q({
    id: 'structure_003',
    section: 'organisation',
    trait: 'structure',
    text:
      'Keeping notes, files, materials, or tasks organised makes it easier for me to work.',
    contextScope: 'class',
  }),

  q({
    id: 'structure_004',
    section: 'planning',
    trait: 'structure',
    text:
      'Before starting a complicated activity, I like having at least a basic plan.',
    contextScope: 'class',
  }),

  q({
    id: 'structure_005',
    section: 'career-exploration',
    trait: 'structure',
    text:
      'I would be comfortable in work where procedures, responsibilities, and expected results are clearly defined.',
    contextScope: 'career-discriminator',
    discriminatorGroup: 'structured-work',
  }),

  q({
    id: 'structure_006',
    section: 'quality',
    trait: 'structure',
    text:
      'I often use a checklist, sequence, or method to avoid missing important parts of a task.',
    contextScope: 'class',
    difficulty: 3,
  }),


  /*
  |--------------------------------------------------------------------------
  | 13. ADAPTABILITY
  |--------------------------------------------------------------------------
  */

  q({
    id: 'adaptability_001',
    section: 'work-style',
    trait: 'adaptability',
    text:
      'If the plan for an activity suddenly changes, I can usually adjust and continue.',
    contextScope: 'class',
  }),

  q({
    id: 'adaptability_002',
    section: 'learning',
    trait: 'adaptability',
    text:
      'When one way of learning a difficult topic does not work, I am willing to try another method.',
    contextScope: 'class',
  }),

  q({
    id: 'adaptability_003',
    section: 'social-style',
    trait: 'adaptability',
    text:
      'I can work with classmates whose way of doing things is different from mine.',
    contextScope: 'class',
  }),

  q({
    id: 'adaptability_004',
    section: 'problem-solving',
    trait: 'adaptability',
    text:
      'If new information shows that my original idea was weak, I am willing to change my approach.',
    contextScope: 'class',
    difficulty: 3,
  }),

  q({
    id: 'adaptability_005',
    section: 'career-exploration',
    trait: 'adaptability',
    text:
      'A future where I keep learning new tools, methods, or responsibilities would be acceptable to me.',
    contextScope: 'career-discriminator',
    discriminatorGroup: 'dynamic-work',
  }),

  q({
    id: 'adaptability_006',
    section: 'uncertainty',
    trait: 'adaptability',
    text:
      'I can start exploring an unfamiliar topic even when I do not yet know exactly how difficult it will be.',
    contextScope: 'class',
    difficulty: 3,
  }),


  /*
  |--------------------------------------------------------------------------
  | 14. ACHIEVEMENT
  |--------------------------------------------------------------------------
  */

  q({
    id: 'achievement_001',
    section: 'motivation',
    trait: 'achievement',
    text:
      'Reaching a difficult goal feels especially satisfying to me.',
    contextScope: 'class',
  }),

  q({
    id: 'achievement_002',
    section: 'academic-habits',
    trait: 'achievement',
    text:
      'If I know I can improve my performance, I am willing to put in extra effort.',
    contextScope: 'class',
  }),

  q({
    id: 'achievement_003',
    section: 'challenge',
    trait: 'achievement',
    text:
      'I sometimes choose a challenging task because completing it would help me improve.',
    contextScope: 'class',
    difficulty: 3,
  }),

  q({
    id: 'achievement_004',
    section: 'feedback',
    trait: 'achievement',
    text:
      'Seeing measurable improvement in my skills or results motivates me to continue.',
    contextScope: 'class',
  }),

  q({
    id: 'achievement_005',
    section: 'career-exploration',
    trait: 'achievement',
    text:
      'I would like a future where I can keep progressing toward higher levels of skill or responsibility.',
    contextScope: 'career-discriminator',
    discriminatorGroup: 'achievement-career',
  }),

  q({
    id: 'achievement_006',
    section: 'persistence',
    trait: 'achievement',
    text:
      'When an important goal takes longer than expected, I usually want to keep working until I make progress.',
    contextScope: 'class',
    difficulty: 3,
  }),


  /*
  |--------------------------------------------------------------------------
  | 15. STABILITY
  |--------------------------------------------------------------------------
  */

  q({
    id: 'stability_001',
    section: 'career-values',
    trait: 'stability',
    text:
      'Knowing what to expect usually makes me more comfortable when beginning an important task.',
    contextScope: 'class',
  }),

  q({
    id: 'stability_002',
    section: 'career-values',
    trait: 'stability',
    text:
      'If two future options seem equally interesting, I may prefer the one with more predictable outcomes.',
    contextScope: 'career-discriminator',
    discriminatorGroup: 'stability-risk',
    difficulty: 3,
  }),

  q({
    id: 'stability_003',
    section: 'work-style',
    trait: 'stability',
    text:
      'I am comfortable following a regular routine when it helps me stay consistent.',
    contextScope: 'class',
  }),

  q({
    id: 'stability_004',
    section: 'decision-making',
    trait: 'stability',
    text:
      'Before making a major choice, I like understanding the possible risks.',
    contextScope: 'class',
    difficulty: 3,
  }),

  q({
    id: 'stability_005',
    section: 'career-exploration',
    trait: 'stability',
    text:
      'Long-term security would be an important factor for me when comparing future careers.',
    contextScope: 'career-discriminator',
    discriminatorGroup: 'career-security',
  }),

  q({
    id: 'stability_006',
    section: 'preferences',
    trait: 'stability',
    text:
      'Constant unexpected change would make an activity less attractive to me even if the activity itself was interesting.',
    contextScope: 'class',
    difficulty: 3,
  }),


  /*
  |--------------------------------------------------------------------------
  | 16. ENTREPRENEURSHIP
  |--------------------------------------------------------------------------
  */

  q({
    id: 'entrepreneurship_001',
    section: 'interest',
    trait: 'entrepreneurship',
    text:
      'I enjoy thinking about new products, services, projects, or ideas that people might find useful.',
    interestClusters: ['business'],
    contextScope: 'interest',
  }),

  q({
    id: 'entrepreneurship_002',
    section: 'initiative',
    trait: 'entrepreneurship',
    text:
      'If I notice a small problem around me, I sometimes think about how someone could create a better solution.',
    contextScope: 'class',
  }),

  q({
    id: 'entrepreneurship_003',
    section: 'decision-making',
    trait: 'entrepreneurship',
    text:
      'I find it interesting to think about why people choose one product, service, or idea over another.',
    subjects: ['economics', 'business-studies'],
    interestClusters: ['business'],
    contextScope: 'interest',
    difficulty: 3,
  }),

  q({
    id: 'entrepreneurship_004',
    section: 'initiative',
    trait: 'entrepreneurship',
    text:
      'I like opportunities where I can turn my own idea into a small project instead of only following an existing example.',
    contextScope: 'class',
  }),

  q({
    id: 'entrepreneurship_005',
    section: 'career-exploration',
    trait: 'entrepreneurship',
    text:
      'The possibility of someday creating or leading my own project, organisation, or business interests me.',
    interestClusters: ['business'],
    careerFamilies: [
      'business-entrepreneurship',
    ],
    contextScope: 'career-discriminator',
    discriminatorGroup: 'entrepreneurship-career',
  }),

  q({
    id: 'entrepreneurship_006',
    section: 'risk-and-opportunity',
    trait: 'entrepreneurship',
    text:
      'I am interested in exploring a promising idea even when there is some uncertainty about whether it will succeed.',
    contextScope: 'career-discriminator',
    discriminatorGroup: 'opportunity-risk',
    difficulty: 3,
  }),
];


export default QUESTIONS;
