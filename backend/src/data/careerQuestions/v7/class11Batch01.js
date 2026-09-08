import {
  buildAdaptiveQuestion,
} from './builders/adaptiveQuestionBuilder.js';


const CLASS_KEY =
  'class-11';


const TRAITS = Object.freeze([
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


/*
|--------------------------------------------------------------------------
| 500 questions
|--------------------------------------------------------------------------
*/

const COUNTS = Object.freeze({
  analytical: 32,
  quantitative: 32,
  verbal: 31,
  creativity: 31,
  technology: 31,
  hands_on: 31,
  scientific_curiosity: 32,
  social_helping: 31,
  leadership: 31,
  collaboration: 31,
  independence: 31,
  structure: 31,
  adaptability: 31,
  achievement: 31,
  stability: 31,
  entrepreneurship: 32,
});


/*
|--------------------------------------------------------------------------
| Class-11 contexts
|--------------------------------------------------------------------------
|
| Exact frontend-style streams are used here.
|
*/

const CONTEXTS = Object.freeze([
  {
    slug: 'advanced-mathematics',
    label: 'solving a challenging mathematics problem',
    subjects: ['mathematics'],
    interests: [
      'engineering',
      'computer-technology',
      'finance',
    ],
    streams: [
      'science-pcm',
      'science-pcmb',
      'science-pcm-computer-science',
      'commerce-with-mathematics',
      'humanities-with-mathematics',
    ],
    careers: [
      'engineering',
      'technology',
      'finance',
      'analytics',
    ],
  },

  {
    slug: 'physics-problem',
    label: 'working through a physics problem',
    subjects: ['physics'],
    interests: [
      'science',
      'engineering',
    ],
    streams: [
      'science-pcm',
      'science-pcmb',
      'science-pcm-computer-science',
    ],
    careers: [
      'engineering',
      'research',
    ],
  },

  {
    slug: 'chemistry-investigation',
    label: 'investigating a chemistry question',
    subjects: ['chemistry'],
    interests: [
      'science',
      'healthcare-medical',
      'engineering',
    ],
    streams: [
      'science-pcm',
      'science-pcb',
      'science-pcmb',
      'science-pcm-computer-science',
      'science-pcb-psychology',
      'science-biotechnology',
    ],
    careers: [
      'research',
      'healthcare',
      'engineering',
      'life-sciences',
    ],
  },

  {
    slug: 'biology-topic',
    label: 'studying a detailed biology topic',
    subjects: ['biology'],
    interests: [
      'healthcare-medical',
      'science',
    ],
    streams: [
      'science-pcb',
      'science-pcmb',
      'science-pcb-psychology',
      'science-biotechnology',
    ],
    careers: [
      'healthcare',
      'life-sciences',
      'biotechnology',
    ],
  },

  {
    slug: 'computer-programming',
    label: 'developing or debugging a computer program',
    subjects: [
      'computer-science',
      'information-technology',
    ],
    interests: [
      'computer-technology',
      'engineering',
    ],
    streams: [
      'science-pcm-computer-science',
      'science-pcm',
      'science-pcmb',
    ],
    careers: [
      'technology',
      'engineering',
      'software',
    ],
  },

  {
    slug: 'biotechnology-problem',
    label: 'exploring a biotechnology-related problem',
    subjects: [
      'biology',
      'biotechnology',
    ],
    interests: [
      'science',
      'healthcare-medical',
    ],
    streams: [
      'science-biotechnology',
      'science-pcb',
      'science-pcmb',
    ],
    careers: [
      'biotechnology',
      'life-sciences',
      'research',
    ],
  },

  {
    slug: 'psychology-case',
    label: 'understanding behaviour in a psychology-related situation',
    subjects: ['psychology'],
    interests: [
      'humanities-social-sciences',
      'healthcare-medical',
    ],
    streams: [
      'science-pcb-psychology',
      'humanities-with-psychology',
      'humanities-arts',
    ],
    careers: [
      'psychology',
      'social-sciences',
      'healthcare',
    ],
  },

  {
    slug: 'accountancy-problem',
    label: 'working through an accountancy problem',
    subjects: ['accountancy'],
    interests: [
      'commerce',
      'finance',
    ],
    streams: [
      'commerce-with-mathematics',
      'commerce-without-mathematics',
    ],
    careers: [
      'accounting',
      'finance',
      'business',
    ],
  },

  {
    slug: 'economics-analysis',
    label: 'analysing an economics-related situation',
    subjects: ['economics'],
    interests: [
      'commerce',
      'finance',
      'humanities-social-sciences',
    ],
    streams: [
      'commerce-with-mathematics',
      'commerce-without-mathematics',
      'humanities-with-mathematics',
      'humanities-arts',
    ],
    careers: [
      'economics',
      'finance',
      'policy',
    ],
  },

  {
    slug: 'business-strategy',
    label: 'examining a business or management problem',
    subjects: [
      'business-studies',
      'entrepreneurship',
    ],
    interests: [
      'business-management',
      'entrepreneurship',
      'commerce',
    ],
    streams: [
      'commerce-with-mathematics',
      'commerce-without-mathematics',
    ],
    careers: [
      'business',
      'management',
      'entrepreneurship',
    ],
  },

  {
    slug: 'history-sources',
    label: 'evaluating evidence about a historical issue',
    subjects: ['history'],
    interests: [
      'humanities-social-sciences',
      'law-governance',
    ],
    streams: [
      'humanities-arts',
      'humanities-with-legal-studies',
    ],
    careers: [
      'research',
      'law',
      'policy',
    ],
  },

  {
    slug: 'political-issue',
    label: 'analysing different viewpoints on a political or civic issue',
    subjects: ['political-science'],
    interests: [
      'law-governance',
      'humanities-social-sciences',
    ],
    streams: [
      'humanities-arts',
      'humanities-with-legal-studies',
    ],
    careers: [
      'law',
      'governance',
      'policy',
    ],
  },

  {
    slug: 'legal-case',
    label: 'examining arguments around a legal or rights-based issue',
    subjects: [
      'legal-studies',
      'political-science',
    ],
    interests: [
      'law-governance',
    ],
    streams: [
      'humanities-with-legal-studies',
      'humanities-arts',
    ],
    careers: [
      'law',
      'governance',
    ],
  },

  {
    slug: 'visual-design',
    label: 'developing a visual-art or design project',
    subjects: [
      'fine-arts',
      'graphic-design',
    ],
    interests: [
      'arts-design',
    ],
    streams: [
      'fine-arts-visual-arts',
      'humanities-arts',
    ],
    careers: [
      'design',
      'creative',
    ],
  },

  {
    slug: 'performing-arts',
    label: 'preparing for a music, dance, theatre, or performance activity',
    subjects: [
      'music',
      'dance',
      'theatre-drama',
    ],
    interests: [
      'performing-arts',
    ],
    streams: [
      'performing-arts',
      'humanities-arts',
    ],
    careers: [
      'performing-arts',
      'creative',
    ],
  },

  {
    slug: 'agriculture-problem',
    label: 'exploring a practical agriculture or environmental problem',
    subjects: [
      'biology',
      'geography',
    ],
    interests: [
      'agriculture-environment',
      'science',
    ],
    streams: [
      'agriculture',
      'science-pcb',
      'science-pcmb',
    ],
    careers: [
      'agriculture',
      'environment',
      'life-sciences',
    ],
  },

  {
    slug: 'home-science-task',
    label: 'working on a practical home-science or wellbeing task',
    subjects: [
      'home-science',
    ],
    interests: [
      'healthcare-medical',
      'vocational-practical-learning',
    ],
    streams: [
      'home-science',
    ],
    careers: [
      'nutrition',
      'wellbeing',
      'hospitality',
    ],
  },

  {
    slug: 'technical-skill',
    label: 'completing a practical technical or skill-based task',
    subjects: [
      'vocational-skill-subject',
    ],
    interests: [
      'vocational-practical-learning',
    ],
    streams: [
      'vocational-skill-based',
    ],
    careers: [
      'technical',
      'skilled-trades',
    ],
  },

  {
    slug: 'sports-performance',
    label: 'improving performance in a sports or physical-education activity',
    subjects: [
      'physical-education',
    ],
    interests: [
      'sports',
    ],
    streams: [
      'sports-physical-education',
    ],
    careers: [
      'sports',
      'fitness',
    ],
  },

  {
    slug: 'entrance-preparation',
    label: 'preparing for a competitive entrance examination',
    subjects: [],
    interests: [],
    streams: [],
    careers: [],
  },

  {
    slug: 'course-research',
    label: 'researching different degree and course options after school',
    subjects: [],
    interests: [],
    streams: [],
    careers: [],
  },

  {
    slug: 'career-comparison',
    label: 'comparing career paths that both seem interesting',
    subjects: [],
    interests: [],
    streams: [],
    careers: [],
  },

  {
    slug: 'independent-study',
    label: 'learning a difficult topic independently',
    subjects: [],
    interests: [],
    streams: [],
    careers: [],
  },

  {
    slug: 'team-project',
    label: 'working with classmates on an important team project',
    subjects: [],
    interests: [],
    streams: [],
    careers: [],
  },

  {
    slug: 'presentation',
    label: 'preparing and delivering an important presentation',
    subjects: ['english'],
    interests: [],
    streams: [],
    careers: [],
  },

  {
    slug: 'time-pressure',
    label: 'handling an important task under heavy time pressure',
    subjects: [],
    interests: [],
    streams: [],
    careers: [],
  },

  {
    slug: 'unexpected-change',
    label: 'dealing with an unexpected change in an important plan',
    subjects: [],
    interests: [],
    streams: [],
    careers: [],
  },

  {
    slug: 'community-project',
    label: 'working on a project intended to help people in the community',
    subjects: [
      'social-science',
      'sociology',
    ],
    interests: [
      'humanities-social-sciences',
    ],
    streams: [
      'humanities-arts',
    ],
    careers: [
      'social-impact',
      'social-sciences',
    ],
  },

  {
    slug: 'student-venture',
    label: 'developing an idea for a small student-led venture',
    subjects: [
      'business-studies',
      'entrepreneurship',
    ],
    interests: [
      'entrepreneurship',
      'business-management',
    ],
    streams: [
      'commerce-with-mathematics',
      'commerce-without-mathematics',
    ],
    careers: [
      'entrepreneurship',
      'business',
    ],
  },

  {
    slug: 'data-analysis',
    label: 'working with data to identify useful conclusions',
    subjects: [
      'mathematics',
      'computer-science',
      'data-science',
    ],
    interests: [
      'computer-technology',
      'finance',
      'science',
    ],
    streams: [
      'science-pcm',
      'science-pcmb',
      'science-pcm-computer-science',
      'commerce-with-mathematics',
      'humanities-with-mathematics',
    ],
    careers: [
      'analytics',
      'technology',
      'finance',
    ],
  },

  {
    slug: 'future-planning',
    label: 'planning what I may want to study or pursue after Class 12',
    subjects: [],
    interests: [],
    streams: [],
    careers: [],
  },

  {
    slug: 'decision-uncertainty',
    label: 'making an important decision without having complete information',
    subjects: [],
    interests: [],
    streams: [],
    careers: [],
  },
]);


/*
|--------------------------------------------------------------------------
| Trait wording rules
|--------------------------------------------------------------------------
*/

const BASE_RULES = Object.freeze({
  analytical: [
    'cause-analysis',
    'evidence-evaluation',
    'decision-comparison',
    'pattern-reasoning',
    'error-investigation',
    'logical-decomposition',
    'assumption-checking',
    'consequence-analysis',
  ],

  quantitative: [
    'estimation',
    'data-interpretation',
    'number-comparison',
    'measurement-reasoning',
    'resource-allocation',
    'numerical-verification',
    'rate-reasoning',
    'probability-thinking',
  ],

  verbal: [
    'concept-explanation',
    'written-expression',
    'discussion',
    'persuasive-communication',
    'information-summary',
    'presentation',
    'question-formulation',
    'audience-adaptation',
  ],

  creativity: [
    'idea-generation',
    'alternative-solutions',
    'design-expression',
    'improvement-thinking',
    'imagination',
    'open-ended-creation',
    'constraint-creativity',
    'combination-thinking',
  ],

  technology: [
    'digital-exploration',
    'technology-troubleshooting',
    'tool-learning',
    'system-curiosity',
    'digital-creation',
    'technology-application',
    'automation-thinking',
    'technology-evaluation',
  ],

  hands_on: [
    'building',
    'physical-testing',
    'repair',
    'practical-learning',
    'model-making',
    'tool-use',
    'iteration',
    'physical-observation',
  ],

  scientific_curiosity: [
    'why-questioning',
    'hypothesis-thinking',
    'evidence-seeking',
    'experiment-curiosity',
    'mechanism-curiosity',
    'independent-investigation',
    'prediction-testing',
    'variable-thinking',
  ],

  social_helping: [
    'peer-support',
    'empathy',
    'teaching-help',
    'wellbeing',
    'community-support',
    'inclusive-behaviour',
    'needs-awareness',
    'encouragement',
  ],

  leadership: [
    'direction-setting',
    'coordination',
    'decision-making',
    'responsibility',
    'team-motivation',
    'conflict-guidance',
    'delegation',
    'priority-setting',
  ],

  collaboration: [
    'shared-work',
    'idea-integration',
    'feedback',
    'team-reliability',
    'conflict-resolution',
    'role-coordination',
    'knowledge-sharing',
    'mutual-adjustment',
  ],

  independence: [
    'self-starting',
    'self-learning',
    'independent-judgement',
    'personal-responsibility',
    'autonomous-problem-solving',
    'self-directed-goals',
    'resourcefulness',
    'self-monitoring',
  ],

  structure: [
    'planning',
    'step-sequencing',
    'organisation',
    'checklist-use',
    'deadline-management',
    'procedure-following',
    'progress-tracking',
    'information-organisation',
  ],

  adaptability: [
    'plan-change',
    'method-switching',
    'new-environment',
    'unexpected-problem',
    'new-evidence',
    'role-change',
    'learning-adjustment',
    'uncertainty-tolerance',
  ],

  achievement: [
    'challenge-seeking',
    'goal-completion',
    'performance-improvement',
    'progress-tracking',
    'persistence',
    'high-standard',
    'feedback-use',
    'self-competition',
  ],

  stability: [
    'predictability',
    'routine',
    'risk-awareness',
    'clear-expectations',
    'security',
    'change-comfort',
    'consistency',
    'preparation',
  ],

  entrepreneurship: [
    'opportunity-recognition',
    'value-creation',
    'initiative',
    'customer-thinking',
    'idea-testing',
    'calculated-risk',
    'resourcefulness',
    'problem-opportunity',
  ],
});


const TEXTS = Object.freeze({
  analytical: [
    c => `When something does not go as expected while ${c}, I like identifying the most likely reasons behind it.`,
    c => `Before accepting a conclusion while ${c}, I prefer checking whether the evidence really supports it.`,
    c => `When several approaches are possible while ${c}, I like comparing their advantages and disadvantages.`,
    c => `While ${c}, I enjoy noticing patterns or relationships that may explain what is happening.`,
    c => `If a problem appears while ${c}, I prefer tracing the process to find where it started.`,
    c => `When ${c} becomes complicated, I find it useful to separate the situation into smaller logical parts.`,
    c => `While ${c}, I often check whether an important assumption may be incorrect.`,
    c => `Before deciding what to do while ${c}, I like thinking through the likely consequences of each option.`,
  ],

  quantitative: [
    c => `When ${c} involves numbers, I like estimating a reasonable result before calculating it exactly.`,
    c => `I enjoy interpreting numerical information, tables, graphs, or percentages while ${c}.`,
    c => `When several numerical values matter while ${c}, I naturally compare them to understand which differences are important.`,
    c => `I enjoy reasoning about quantities, measurements, or numerical relationships while ${c}.`,
    c => `If resources are limited while ${c}, I like calculating how they could be allocated effectively.`,
    c => `After reaching a numerical answer while ${c}, I usually check whether the result makes practical sense.`,
    c => `I enjoy thinking about ratios, rates, growth, or changing quantities while ${c}.`,
    c => `When ${c} involves uncertainty, I like thinking about which outcomes are more or less likely.`,
  ],

  verbal: [
    c => `While ${c}, I enjoy explaining important ideas in language another person can understand.`,
    c => `Writing my thoughts clearly helps me organise my understanding while ${c}.`,
    c => `I enjoy discussing different viewpoints while ${c} and responding thoughtfully to them.`,
    c => `If I believe one approach is stronger while ${c}, I enjoy explaining reasons that may persuade others.`,
    c => `After ${c}, I like summarising the most important information in my own words.`,
    c => `I feel comfortable presenting what I learned while ${c} to other people.`,
    c => `While ${c}, I often think of questions that could lead to a deeper discussion.`,
    c => `When explaining something while ${c}, I try to adjust my wording to the person listening.`,
  ],

  creativity: [
    c => `While ${c}, I enjoy generating several original ideas before settling on one.`,
    c => `If the usual method is ineffective while ${c}, I like inventing another approach.`,
    c => `I enjoy adding my own visual, design, storytelling, or presentation ideas while ${c}.`,
    c => `While ${c}, I often notice ways the existing approach could be improved.`,
    c => `I enjoy imagining possibilities that other people may not immediately notice while ${c}.`,
    c => `I prefer tasks where ${c} allows more than one good way to reach a useful result.`,
    c => `When there are strict limits while ${c}, I enjoy finding creative ways to work within them.`,
    c => `While ${c}, I like combining ideas from different areas to create something new.`,
  ],

  technology: [
    c => `I enjoy exploring how digital technology could help while ${c}.`,
    c => `If a digital system fails while ${c}, I like investigating what may have caused the problem.`,
    c => `I am comfortable learning a new digital tool when it could improve how I handle ${c}.`,
    c => `When technology is involved while ${c}, I often become curious about how the system works internally.`,
    c => `I enjoy creating something digital that could support ${c}.`,
    c => `While ${c}, I like thinking about practical ways technology could improve the outcome.`,
    c => `If part of ${c} becomes repetitive, I often wonder whether technology could automate it.`,
    c => `Before choosing a digital tool while ${c}, I like comparing whether it is really suitable for the task.`,
  ],

  hands_on: [
    c =>
      `When ${c} includes a practical component, I enjoy learning by doing rather than only reading or listening.`,

    c =>
      `If ${c} can be demonstrated through an activity, model, experiment, or real example, I prefer trying it myself.`,

    c =>
      `When a practical difficulty appears during ${c}, I enjoy working out what adjustment could improve the result.`,

    c =>
      `I understand ${c} better when I can connect the idea with something observable or practical.`,

    c =>
      `If a model, prototype, diagram, simulation, or demonstration could clarify ${c}, I would be interested in creating or testing one.`,

    c =>
      `When ${c} offers a practical activity, I am comfortable working directly with the materials, tools, or resources involved.`,

    c =>
      `If my first practical approach to ${c} does not work well, I prefer adjusting it and trying again.`,

    c =>
      `While ${c}, I pay attention to what can be observed, demonstrated, tested, or applied in practice.`,
  ],
  scientific_curiosity: [
    c => `While ${c}, I often become curious about why something happens the way it does.`,
    c => `Before testing an idea while ${c}, I enjoy predicting what may happen and why.`,
    c => `While ${c}, I prefer explanations supported by reliable evidence.`,
    c => `I enjoy testing an idea while ${c} rather than accepting it only because someone says it is correct.`,
    c => `While ${c}, I often want to understand the mechanism that produces the result.`,
    c => `If ${c} interests me, I may investigate it further even when it is not required for class.`,
    c => `I enjoy comparing what I predicted while ${c} with what actually happens.`,
    c => `When testing something while ${c}, I like thinking about which factor may be affecting the result.`,
  ],

  social_helping: [
    c => `If another student struggles while ${c}, I usually want to help if I can.`,
    c => `While ${c}, I try to understand how the situation may feel from another person's point of view.`,
    c => `I enjoy helping someone understand something connected with ${c}.`,
    c => `While ${c}, I tend to notice when someone appears stressed, uncomfortable, or excluded.`,
    c => `I especially value ${c} when the outcome could help other people.`,
    c => `During group work connected with ${c}, I try to make sure quieter people also have a chance to contribute.`,
    c => `Before suggesting a solution while ${c}, I like understanding what the people involved actually need.`,
    c => `When someone finds ${c} difficult, I prefer encouraging them instead of judging them quickly.`,
  ],

  leadership: [
    c => `When working with others while ${c}, I am comfortable helping define the main goal.`,
    c => `I would be comfortable coordinating people and responsibilities while ${c}.`,
    c => `If a group becomes stuck while ${c}, I am comfortable helping everyone move toward a decision.`,
    c => `I am willing to take responsibility for an important part of ${c}.`,
    c => `If a group loses motivation while ${c}, I often want to help everyone regain focus.`,
    c => `If disagreements appear while ${c}, I am comfortable helping the group find a workable way forward.`,
    c => `While ${c}, I can divide responsibilities according to what different people can contribute.`,
    c => `When several tasks compete for attention while ${c}, I am comfortable helping decide what should come first.`,
  ],

  collaboration: [
    c => `I enjoy working with other people when ${c} requires a shared result.`,
    c => `While ${c}, I like combining useful suggestions from different people into one stronger approach.`,
    c => `I am willing to revise my work while ${c} after receiving useful feedback from teammates.`,
    c => `If I agree to complete one part while ${c}, I try to make sure the group can depend on me.`,
    c => `When people disagree while ${c}, I prefer discussing the issue until the group finds a workable solution.`,
    c => `I like making sure different roles fit together effectively while ${c}.`,
    c => `While ${c}, I am comfortable sharing useful knowledge if it helps the group perform better.`,
    c => `If the team's needs change while ${c}, I am willing to adjust my own role.`,
  ],

  independence: [
    c => `If I know what is expected while ${c}, I can usually start without waiting for someone to remind me.`,
    c => `If I need new knowledge while ${c}, I am comfortable exploring it independently first.`,
    c => `While ${c}, I prefer forming my own opinion before copying what other people think.`,
    c => `I prefer taking responsibility for my own contribution while ${c}.`,
    c => `If I encounter a problem while ${c}, I usually try solving it myself before requesting detailed help.`,
    c => `While ${c}, I can set my own smaller goals and continue working toward them.`,
    c => `If I do not have everything I need while ${c}, I usually try finding another useful resource or method.`,
    c => `When working independently while ${c}, I regularly check my own progress.`,
  ],

  structure: [
    c => `Before ${c}, I like having a clear plan for what needs to be done.`,
    c => `I prefer dividing ${c} into an ordered sequence of smaller steps.`,
    c => `While ${c}, I like keeping my materials, notes, and information organised.`,
    c => `A checklist helps me avoid forgetting important tasks while ${c}.`,
    c => `If ${c} has a deadline, I prefer deciding beforehand when different parts should be completed.`,
    c => `If there is an established procedure while ${c}, I usually prefer understanding and following it carefully.`,
    c => `While ${c}, I like checking how much progress has been made and what still remains.`,
    c => `When ${c} involves a lot of information, I like organising it into clear categories.`,
  ],

  adaptability: [
    c => `If circumstances change while ${c}, I can revise my original plan and continue.`,
    c => `When one method fails while ${c}, I am willing to try a different approach.`,
    c => `I can become comfortable with unfamiliar conditions while ${c}.`,
    c => `If an unexpected difficulty appears while ${c}, I can adjust without becoming completely stuck.`,
    c => `If new information challenges what I believed while ${c}, I am willing to update my view.`,
    c => `If my responsibility changes while ${c}, I can adapt to the new role.`,
    c => `If my current approach is ineffective while ${c}, I can change how I learn or work.`,
    c => `I can continue making progress while ${c} even when the final outcome is uncertain.`,
  ],

  achievement: [
    c => `I find ${c} more engaging when it gives me a meaningful challenge to overcome.`,
    c => `Completing ${c} successfully gives me a strong sense of satisfaction.`,
    c => `While ${c}, I often think about how I could improve my performance.`,
    c => `I like seeing clear progress toward a goal while ${c}.`,
    c => `If ${c} becomes difficult, I usually want to keep trying before giving up.`,
    c => `I feel satisfied when I know I have handled ${c} to a high standard.`,
    c => `I like using constructive feedback to improve the next time I face something similar to ${c}.`,
    c => `While ${c}, I sometimes challenge myself to perform better than I did previously.`,
  ],

  stability: [
    c => `I feel more comfortable while ${c} when I have a reasonable idea of what to expect.`,
    c => `A regular routine makes it easier for me to stay consistent while ${c}.`,
    c => `Before making an important decision while ${c}, I like understanding the possible risks.`,
    c => `I work better while ${c} when expectations are clearly explained.`,
    c => `I generally prefer a dependable approach while ${c} rather than taking unnecessary risks.`,
    c => `I can handle changes while ${c}, but I prefer understanding what the new situation requires.`,
    c => `I prefer making steady and consistent progress while ${c} rather than changing direction repeatedly.`,
    c => `I feel more confident while ${c} when I have enough time to prepare properly.`,
  ],

  entrepreneurship: [
    c => `While ${c}, I sometimes notice opportunities that other people may overlook.`,
    c => `I enjoy thinking about how ${c} could create something useful or valuable for other people.`,
    c => `If I notice a promising idea while ${c}, I like taking an initial step instead of only discussing it.`,
    c => `When developing an idea while ${c}, I like considering what the people using it would actually need.`,
    c => `Before investing a lot of effort in an idea while ${c}, I would prefer testing a smaller version first.`,
    c => `If an idea has potential while ${c}, I am willing to take a reasonable risk after thinking it through.`,
    c => `When resources are limited while ${c}, I enjoy finding ways to create useful results with what is available.`,
    c => `When I notice a problem while ${c}, I sometimes think about whether solving it could become a useful product, service, or project.`,
  ],
});


const SECTIONS = Object.freeze([
  'strength',
  'problem-solving',
  'work-style',
  'interest',
  'decision-making',
  'preferences',
  'behaviour',
  'motivation',
]);


/*
|--------------------------------------------------------------------------
| Diversity protection
|--------------------------------------------------------------------------
*/

const DIVERSITY_SUFFIXES = Object.freeze([
  '',
  ' I tend to prefer this approach even when the topic becomes more difficult.',
  ' This is usually one of the first approaches I consider.',
  ' I would still lean toward this approach when the decision has important consequences.',
]);


function diversifyText({
  text,
  sequence,
}) {
  const cycle =
    Math.floor(
      (sequence - 1) /
      8
    );

  return (
    text +
    DIVERSITY_SUFFIXES[
      cycle %
      DIVERSITY_SUFFIXES.length
    ]
  );
}


/*
|--------------------------------------------------------------------------
| Entrance exam mapping
|--------------------------------------------------------------------------
*/

function getEntranceExams(
  context
) {
  const exams =
    new Set();


  const streams =
    context.streams ||
    [];


  if (
    streams.some(
      stream =>
        [
          'science-pcm',
          'science-pcmb',
          'science-pcm-computer-science',
        ].includes(
          stream
        )
    )
  ) {
    [
      'jee-main',
      'jee-advanced',
      'bitsat',
      'viteee',
      'srmjeee',
      'manipal-entrance',
      'mht-cet',
      'wbjee',
      'kcet',
      'keam',
      'gujcet',
      'ap-eapcet',
      'tg-eapcet',
      'ojee',
      'uptac-counselling',
    ].forEach(
      exam =>
        exams.add(
          exam
        )
    );
  }


  if (
    streams.some(
      stream =>
        [
          'science-pcb',
          'science-pcmb',
          'science-pcb-psychology',
          'science-biotechnology',
        ].includes(
          stream
        )
    )
  ) {
    [
      'neet-ug',
      'nursing-entrance',
      'paramedical-entrance',
    ].forEach(
      exam =>
        exams.add(
          exam
        )
    );
  }


  if (
    streams.includes(
      'humanities-with-legal-studies'
    )
  ) {
    [
      'clat',
      'ailet',
      'slat',
      'mh-cet-law',
    ].forEach(
      exam =>
        exams.add(
          exam
        )
    );
  }


  if (
    streams.some(
      stream =>
        [
          'fine-arts-visual-arts',
          'humanities-arts',
        ].includes(
          stream
        )
    ) &&
    context.interests?.includes(
      'arts-design'
    )
  ) {
    [
      'uceed',
      'nid-dat',
      'nift-entrance',
      'design-portfolio-entrance',
      'fine-arts-admission',
    ].forEach(
      exam =>
        exams.add(
          exam
        )
    );
  }


  if (
    streams.includes(
      'performing-arts'
    )
  ) {
    exams.add(
      'performing-arts-audition'
    );
  }


  if (
    context.careers?.includes(
      'management'
    ) ||
    context.careers?.includes(
      'business'
    )
  ) {
    [
      'ipmat',
      'jipmat',
      'npat',
      'set-symbiosis',
    ].forEach(
      exam =>
        exams.add(
          exam
        )
    );
  }


  if (
    context.careers?.includes(
      'hospitality'
    )
  ) {
    exams.add(
      'nchm-jee'
    );

    exams.add(
      'hotel-management-entrance'
    );
  }


  return [
    ...exams,
  ];
}


/*
|--------------------------------------------------------------------------
| Question builder
|--------------------------------------------------------------------------
*/

function buildClass11Question({
  trait,
  sequence,
  variant,
  context,
}) {
  const family =
    BASE_RULES[
      trait
    ][
      variant
    ];


  let questionText =
    TEXTS[
      trait
    ][
      variant
    ](
      context.label
    );


  if (
    trait ===
      'hands_on' &&
    sequence ===
      1
  ) {
    questionText =
      'When learning a practical skill, I understand it better if I can try the activity myself rather than only read or hear about it.';
  }


  if (
    trait ===
      'hands_on' &&
    sequence ===
      2
  ) {
    questionText =
      'When I want to understand how something works in practice, I prefer testing, demonstrating, or applying the idea myself.';
  }

  const base =
    buildAdaptiveQuestion({
      classKey:
        CLASS_KEY,

      sequence,

      section:
        SECTIONS[
          variant
        ],

      trait,

      text:
        diversifyText({
          text:
            questionText,

          sequence,
        }),

      scenarioFamily:
        family,

      scenario:
        `${family}-${context.slug}`,

      subjects:
        context.subjects ||
        [],

      interestClusters:
        context.interests ||
        [],

      contextScope:
        'senior-secondary',

      difficulty:
        sequence % 4 === 0
          ? 3
          : 2,

      priority:
        sequence <= 12
          ? 4
          : 3,

      tags: [
        trait,
        family,
        context.slug,
        'class-11',
        'senior-secondary',
        'v7-class11-bank',
      ],
    });


  return Object.freeze({
    ...base,

    streams:
      context.streams ||
      [],

    entranceExams:
      getEntranceExams(
        context
      ),

    goals: [
      'choose-course',
      'entrance-exams',
      'explore-careers',
    ],

    careerFamilies:
      context.careers ||
      [],
  });
}


/*
|--------------------------------------------------------------------------
| Generate
|--------------------------------------------------------------------------
*/

const HANDS_ON_CORE_CONTEXTS =
  Object.freeze([
    {
      slug:
        'practical-learning-core',

      label:
        'learning a practical skill',

      subjects: [],
      interests: [],
      streams: [],
      careers: [],
    },

    {
      slug:
        'real-world-testing-core',

      label:
        'testing how an idea works in a practical setting',

      subjects: [],
      interests: [],
      streams: [],
      careers: [],
    },
  ]);

const HANDS_ON_CONTEXTS =
  new Set([
    'physics-problem',
    'chemistry-investigation',
    'biology-topic',
    'computer-programming',
    'biotechnology-problem',
    'visual-design',
    'performing-arts',
    'agriculture-problem',
    'home-science-task',
    'technical-skill',
    'sports-performance',
    'data-analysis',
  ]);


function getContextsForTrait(
  trait
) {
  if (
    trait ===
    'hands_on'
  ) {
    return [
      ...HANDS_ON_CORE_CONTEXTS,

      ...CONTEXTS.filter(
        context =>
          HANDS_ON_CONTEXTS.has(
            context.slug
          )
      ),
    ];
  }


  return CONTEXTS;
}

const QUESTIONS =
  [];


for (
  const trait of
  TRAITS
) {
  const count =
    COUNTS[
      trait
    ];


  for (
    let index = 0;
    index < count;
    index += 1
  ) {
    const traitContexts =
      getContextsForTrait(
        trait
      );


    const context =
      traitContexts[
        index %
        traitContexts.length
      ];


    const variant =
      index %
      8;


    QUESTIONS.push(
      buildClass11Question({
        trait,

        sequence:
          index + 1,

        variant,

        context,
      })
    );
  }
}


if (
  QUESTIONS.length !==
  500
) {
  throw new Error(
    `Expected 500 Class-11 questions, generated ${QUESTIONS.length}.`
  );
}


export default QUESTIONS;








