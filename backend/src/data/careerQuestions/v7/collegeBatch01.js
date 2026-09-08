import {
  buildAdaptiveQuestion,
} from './builders/adaptiveQuestionBuilder.js';


const CLASS_KEY =
  'college';


const TRAITS =
  Object.freeze([
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


const COUNTS =
  Object.freeze({
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


const CONTEXTS =
  Object.freeze([
    {
      slug:
        'engineering-project',

      label:
        'working on an engineering or technical college project',

      degrees: [
        'btech',
        'be',
      ],

      branches: [],

      collegeYears: [],

      goals: [
        'job',
        'placement',
        'internship',
        'skill-development',
      ],

      skills: [
        'programming',
        'electronics',
        'electrical-systems',
        'mechanical-design',
        'problem-solving',
      ],

      careers: [
        'engineering',
        'technology',
      ],
    },

    {
      slug:
        'software-development',

      label:
        'developing or debugging a software project',

      degrees: [
        'btech',
        'be',
        'bca',
        'bsc',
        'bs',
      ],

      branches: [
        'computer-science',
        'information-technology',
        'software-engineering',
        'artificial-intelligence',
        'data-science',
      ],

      collegeYears: [],

      goals: [
        'job',
        'placement',
        'internship',
        'skill-development',
        'freelancing',
      ],

      skills: [
        'programming',
        'web-development',
        'app-development',
        'cloud-computing',
        'cybersecurity',
      ],

      careers: [
        'technology',
        'software',
      ],
    },

    {
      slug:
        'data-analysis',

      label:
        'analysing data for a college assignment or project',

      degrees: [
        'btech',
        'be',
        'bsc',
        'bs',
        'bca',
        'bcom',
        'bba',
      ],

      branches: [],

      collegeYears: [],

      goals: [
        'job',
        'research',
        'skill-development',
        'higher-studies',
      ],

      skills: [
        'data-analysis',
        'statistics',
        'mathematics',
        'ai-machine-learning',
      ],

      careers: [
        'analytics',
        'technology',
        'research',
      ],
    },

    {
      slug:
        'electronics-lab',

      label:
        'working on an electronics or electrical laboratory task',

      degrees: [
        'btech',
        'be',
        'bsc',
      ],

      branches: [
        'electronics',
        'electronics-and-communication',
        'electrical-engineering',
        'instrumentation',
      ],

      collegeYears: [],

      goals: [
        'job',
        'internship',
        'research',
        'higher-studies',
      ],

      skills: [
        'electronics',
        'electrical-systems',
        'laboratory-work',
        'problem-solving',
      ],

      careers: [
        'engineering',
        'electronics',
      ],
    },

    {
      slug:
        'mechanical-design',

      label:
        'working on a mechanical design or manufacturing problem',

      degrees: [
        'btech',
        'be',
      ],

      branches: [
        'mechanical-engineering',
        'production-engineering',
        'automobile-engineering',
      ],

      collegeYears: [],

      goals: [
        'job',
        'internship',
        'skill-development',
      ],

      skills: [
        'mechanical-design',
        'cad-engineering-design',
        'mechanical-hands-on-work',
      ],

      careers: [
        'engineering',
        'manufacturing',
      ],
    },

    {
      slug:
        'civil-design',

      label:
        'working on a civil, construction, or infrastructure problem',

      degrees: [
        'btech',
        'be',
        'barch',
        'bplan',
      ],

      branches: [
        'civil-engineering',
        'architecture',
        'planning',
      ],

      collegeYears: [],

      goals: [
        'job',
        'internship',
        'higher-studies',
      ],

      skills: [
        'civil-construction-knowledge',
        'cad-engineering-design',
        'project-management',
      ],

      careers: [
        'civil-engineering',
        'architecture',
        'infrastructure',
      ],
    },

    {
      slug:
        'architecture-design',

      label:
        'developing an architecture or planning concept',

      degrees: [
        'barch',
        'bplan',
      ],

      branches: [
        'architecture',
        'planning',
      ],

      collegeYears: [],

      goals: [
        'job',
        'internship',
        'higher-studies',
        'freelancing',
      ],

      skills: [
        'cad-engineering-design',
        'drawing-illustration',
        'graphic-design',
        'project-management',
      ],

      careers: [
        'architecture',
        'planning',
        'design',
      ],
    },

    {
      slug:
        'visual-design',

      label:
        'developing a visual, graphic, or user-experience design project',

      degrees: [
        'bdes',
        'bfa',
        'bva',
      ],

      branches: [
        'graphic-design',
        'ui-ux-design',
        'visual-communication',
      ],

      collegeYears: [],

      goals: [
        'job',
        'internship',
        'freelancing',
        'portfolio-building',
      ],

      skills: [
        'graphic-design',
        'ui-ux-design',
        'drawing-illustration',
        'photography',
      ],

      careers: [
        'design',
        'creative',
      ],
    },

    {
      slug:
        'science-research',

      label:
        'investigating a scientific question in college',

      degrees: [
        'bsc',
        'bsc-hons',
        'bs',
        'bs-ms',
      ],

      branches: [],

      collegeYears: [],

      goals: [
        'research',
        'higher-studies',
        'skill-development',
      ],

      skills: [
        'research',
        'laboratory-work',
        'mathematics',
        'statistics',
      ],

      careers: [
        'science',
        'research',
      ],
    },

    {
      slug:
        'commerce-analysis',

      label:
        'analysing an accounting, finance, or commerce problem',

      degrees: [
        'bcom',
        'bcom-hons',
      ],

      branches: [
        'accounting',
        'finance',
        'commerce',
      ],

      collegeYears: [],

      goals: [
        'job',
        'professional-qualification',
        'higher-studies',
      ],

      skills: [
        'accounting',
        'finance',
        'data-analysis',
      ],

      careers: [
        'finance',
        'accounting',
        'commerce',
      ],
    },

    {
      slug:
        'business-strategy',

      label:
        'working through a business or management case',

      degrees: [
        'bba',
        'bbm',
        'bms',
        'integrated-bba-mba',
      ],

      branches: [
        'management',
        'marketing',
        'finance',
        'human-resources',
      ],

      collegeYears: [],

      goals: [
        'job',
        'entrepreneurship',
        'higher-studies',
        'internship',
      ],

      skills: [
        'leadership',
        'marketing',
        'sales',
        'finance',
        'project-management',
      ],

      careers: [
        'business',
        'management',
        'entrepreneurship',
      ],
    },

    {
      slug:
        'law-case',

      label:
        'analysing a legal case or policy question',

      degrees: [
        'llb',
        'ba-llb',
        'bba-llb',
        'bcom-llb',
      ],

      branches: [
        'law',
      ],

      collegeYears: [],

      goals: [
        'job',
        'higher-studies',
        'government-exams',
      ],

      skills: [
        'writing',
        'debating',
        'public-speaking',
        'research',
      ],

      careers: [
        'law',
        'policy',
        'governance',
      ],
    },

    {
      slug:
        'media-project',

      label:
        'creating or analysing media and communication content',

      degrees: [
        'ba',
        'bmm',
        'bjmc',
      ],

      branches: [
        'journalism',
        'mass-communication',
        'media-studies',
      ],

      collegeYears: [],

      goals: [
        'job',
        'internship',
        'freelancing',
        'portfolio-building',
      ],

      skills: [
        'writing',
        'communication',
        'video-editing',
        'content-creation',
        'social-media',
      ],

      careers: [
        'media',
        'journalism',
        'communication',
      ],
    },

    {
      slug:
        'psychology-helping',

      label:
        'thinking through a psychology, counselling, or human-behaviour case',

      degrees: [
        'ba',
        'ba-hons',
        'bsc',
      ],

      branches: [
        'psychology',
      ],

      collegeYears: [],

      goals: [
        'higher-studies',
        'research',
        'job',
      ],

      skills: [
        'counselling-helping',
        'communication',
        'research',
      ],

      careers: [
        'psychology',
        'social-impact',
      ],
    },

    {
      slug:
        'education-teaching',

      label:
        'planning how to explain or teach a difficult concept',

      degrees: [
        'bed',
        'ba',
        'bsc',
      ],

      branches: [
        'education',
      ],

      collegeYears: [],

      goals: [
        'job',
        'higher-studies',
        'government-exams',
      ],

      skills: [
        'teaching',
        'communication',
        'public-speaking',
      ],

      careers: [
        'education',
        'teaching',
      ],
    },

    {
      slug:
        'hospitality-management',

      label:
        'handling a hospitality, tourism, or service-management situation',

      degrees: [
        'hotel-management',
        'bhm',
        'bba',
      ],

      branches: [
        'hospitality',
        'tourism',
      ],

      collegeYears: [],

      goals: [
        'job',
        'internship',
        'entrepreneurship',
      ],

      skills: [
        'hospitality',
        'travel-planning',
        'event-management',
        'communication',
      ],

      careers: [
        'hospitality',
        'tourism',
      ],
    },

    {
      slug:
        'agriculture-field',

      label:
        'working on an agriculture or field-based college problem',

      degrees: [
        'bsc-agriculture',
        'bsc',
      ],

      branches: [
        'agriculture',
      ],

      collegeYears: [],

      goals: [
        'job',
        'research',
        'government-exams',
        'entrepreneurship',
      ],

      skills: [
        'agriculture',
        'research',
        'laboratory-work',
      ],

      careers: [
        'agriculture',
        'environment',
      ],
    },

    {
      slug:
        'internship-search',

      label:
        'searching for and evaluating internship opportunities',

      degrees: [],

      branches: [],

      collegeYears: [
        '1st-year',
        '2nd-year',
        '3rd-year',
        '4th-year',
        '5th-year',
        'final-year',
      ],

      goals: [
        'internship',
        'skill-development',
      ],

      skills: [],

      careers: [],
    },

    {
      slug:
        'placement-preparation',

      label:
        'preparing for placements and entry-level job opportunities',

      degrees: [],

      branches: [],

      collegeYears: [
        '3rd-year',
        '4th-year',
        '5th-year',
        'final-year',
        'internship-training-year',
      ],

      goals: [
        'job',
        'placement',
      ],

      skills: [
        'communication',
        'problem-solving',
        'teamwork',
      ],

      careers: [],
    },

    {
      slug:
        'higher-studies',

      label:
        'comparing higher-study options after my current degree',

      degrees: [],

      branches: [],

      collegeYears: [
        '3rd-year',
        '4th-year',
        '5th-year',
        'final-year',
      ],

      goals: [
        'higher-studies',
      ],

      skills: [
        'research',
      ],

      careers: [],
    },

    {
      slug:
        'competitive-exam-plan',

      label:
        'preparing for a competitive or professional examination alongside college',

      degrees: [],

      branches: [],

      collegeYears: [],

      goals: [
        'government-exams',
        'professional-qualification',
        'higher-studies',
      ],

      skills: [],

      careers: [],
    },

    {
      slug:
        'career-switch',

      label:
        'exploring a career direction different from my degree specialization',

      degrees: [],

      branches: [],

      collegeYears: [],

      goals: [
        'career-switch',
        'explore-careers',
      ],

      skills: [],

      careers: [],
    },

    {
      slug:
        'skill-development',

      label:
        'deciding which professional skill to develop next',

      degrees: [],

      branches: [],

      collegeYears: [],

      goals: [
        'skill-development',
      ],

      skills: [],

      careers: [],
    },

    {
      slug:
        'entrepreneurship-project',

      label:
        'considering a student business, startup, or independent project',

      degrees: [],

      branches: [],

      collegeYears: [],

      goals: [
        'entrepreneurship',
      ],

      skills: [
        'entrepreneurship',
        'sales',
        'marketing',
        'leadership',
      ],

      careers: [
        'entrepreneurship',
        'business',
      ],
    },

    {
      slug:
        'freelancing-project',

      label:
        'taking on a freelance or independent client project',

      degrees: [],

      branches: [],

      collegeYears: [],

      goals: [
        'freelancing',
      ],

      skills: [
        'communication',
        'project-management',
        'content-creation',
        'web-development',
        'graphic-design',
      ],

      careers: [],
    },

    {
      slug:
        'research-project',

      label:
        'working on a research project with incomplete information',

      degrees: [],

      branches: [],

      collegeYears: [],

      goals: [
        'research',
        'higher-studies',
      ],

      skills: [
        'research',
        'data-analysis',
        'statistics',
      ],

      careers: [
        'research',
      ],
    },

    {
      slug:
        'team-project',

      label:
        'working with classmates on an important team project',

      degrees: [],

      branches: [],

      collegeYears: [],

      goals: [],

      skills: [
        'teamwork',
        'communication',
        'leadership',
      ],

      careers: [],
    },

    {
      slug:
        'presentation',

      label:
        'preparing and delivering an important college presentation',

      degrees: [],

      branches: [],

      collegeYears: [],

      goals: [],

      skills: [
        'public-speaking',
        'communication',
        'writing',
      ],

      careers: [],
    },

    {
      slug:
        'deadline-pressure',

      label:
        'handling several important academic deadlines at the same time',

      degrees: [],

      branches: [],

      collegeYears: [],

      goals: [],

      skills: [],

      careers: [],
    },

    {
      slug:
        'uncertain-career',

      label:
        'thinking about my future when I am not yet certain which career path suits me',

      degrees: [],

      branches: [],

      collegeYears: [],

      goals: [
        'explore-careers',
        'undecided',
      ],

      skills: [],

      careers: [],
    },

    {
      slug:
        'professional-networking',

      label:
        'meeting professionals or alumni who work in areas I may consider',

      degrees: [],

      branches: [],

      collegeYears: [],

      goals: [
        'job',
        'internship',
        'explore-careers',
      ],

      skills: [
        'communication',
      ],

      careers: [],
    },

    {
      slug:
        'portfolio-building',

      label:
        'building a portfolio that demonstrates my work and skills',

      degrees: [],

      branches: [],

      collegeYears: [],

      goals: [
        'portfolio-building',
        'job',
        'internship',
        'freelancing',
      ],

      skills: [],

      careers: [],
    },

    {
      slug:
        'independent-learning',

      label:
        'learning an important topic independently outside regular classes',

      degrees: [],

      branches: [],

      collegeYears: [],

      goals: [
        'skill-development',
      ],

      skills: [],

      careers: [],
    },

    {
      slug:
        'career-decision',

      label:
        'comparing two professional directions that both seem interesting',

      degrees: [],

      branches: [],

      collegeYears: [],

      goals: [
        'explore-careers',
        'job',
        'higher-studies',
      ],

      skills: [],

      careers: [],
    },
  ]);


const FAMILIES =
  Object.freeze({
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
      'practical-learning',
      'physical-testing',
      'applied-adjustment',
      'real-world-application',
      'model-prototype',
      'tool-use',
      'iteration',
      'observation-testing',
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


const TEXTS =
  Object.freeze({
    analytical: [
      c => `When something does not go as expected while ${c}, I like identifying the most likely reasons behind it.`,
      c => `Before accepting a conclusion while ${c}, I prefer checking whether the evidence really supports it.`,
      c => `When several approaches are possible while ${c}, I like comparing their advantages and disadvantages.`,
      c => `While ${c}, I enjoy noticing patterns or relationships that may explain what is happening.`,
      c => `If a problem appears while ${c}, I prefer tracing the process to understand where it started.`,
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
      c => `I prefer situations where ${c} allows more than one good way to reach a useful result.`,
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
      c => `When ${c} includes a practical component, I understand it better if I can try the activity myself.`,
      c => `If ${c} can be demonstrated through a model, activity, experiment, or real example, I prefer trying it myself.`,
      c => `When I encounter a practical difficulty while ${c}, I enjoy working out what adjustment could improve the result.`,
      c => `I understand ${c} better when I can connect the idea with something observable or practical.`,
      c => `If a model, prototype, simulation, or demonstration would help me understand ${c}, I would be interested in creating or testing one.`,
      c => `If ${c} involves practical work, I am comfortable using the relevant tools, materials, or resources.`,
      c => `If my first practical approach while ${c} does not work well, I prefer adjusting it and trying again.`,
      c => `While ${c}, I pay attention to what can be observed, demonstrated, tested, or applied in practice.`,
    ],

    scientific_curiosity: [
      c => `While ${c}, I often become curious about why something happens the way it does.`,
      c => `Before testing an idea while ${c}, I enjoy predicting what may happen and why.`,
      c => `While ${c}, I prefer explanations supported by reliable evidence.`,
      c => `I enjoy testing an idea while ${c} rather than accepting it only because someone says it is correct.`,
      c => `While ${c}, I often want to understand the mechanism that produces the result.`,
      c => `If ${c} interests me, I may investigate it further even when it is not required.`,
      c => `I enjoy comparing what I predicted while ${c} with what actually happens.`,
      c => `When testing something while ${c}, I like thinking about which factor may be affecting the result.`,
    ],

    social_helping: [
      c => `If another person struggles while ${c}, I usually want to help if I can.`,
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
      c => `I am willing to revise my work while ${c} after receiving useful feedback from others.`,
      c => `If I agree to complete one part while ${c}, I try to make sure other people can depend on me.`,
      c => `When people disagree while ${c}, I prefer discussing the issue until a workable solution is found.`,
      c => `I like making sure different roles fit together effectively while ${c}.`,
      c => `While ${c}, I am comfortable sharing useful knowledge if it helps the group perform better.`,
      c => `If the group's needs change while ${c}, I am willing to adjust my own role.`,
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
      c => `While ${c}, I like keeping my information, notes, and tasks organised.`,
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
      c => `Successfully completing an important part of ${c} gives me a strong sense of satisfaction.`,
      c => `While ${c}, I often think about how I could improve my performance.`,
      c => `I like seeing clear progress toward a goal while ${c}.`,
      c => `If ${c} becomes difficult, I usually want to keep trying before giving up.`,
      c => `I feel satisfied when I know I have handled ${c} to a high standard.`,
      c => `I like using constructive feedback to improve how I handle situations similar to ${c}.`,
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


const SECTIONS =
  Object.freeze([
    'professional-strength',
    'problem-solving',
    'communication',
    'work-style',
    'career-interest',
    'decision-making',
    'professional-behaviour',
    'motivation',
  ]);


const DIVERSITY_SUFFIXES =
  Object.freeze([
    '',
    ' I tend to prefer this approach even when the task becomes more difficult.',
    ' This is usually one of the first approaches I consider.',
    ' I would still lean toward this approach when the decision could affect my future career.',
  ]);


const COLLEGE_CORE_CONTEXTS =
  Object.freeze([
    {
      slug:
        'general-college-task-core',

      label:
        'working through an unfamiliar but important college task',

      degrees: [],
      branches: [],
      collegeYears: [],
      goals: [],
      skills: [],
      careers: [],
    },

    {
      slug:
        'professional-direction-core',

      label:
        'making an important decision about my academic or professional direction',

      degrees: [],
      branches: [],
      collegeYears: [],
      goals: [],
      skills: [],
      careers: [],
    },
  ]);

const HANDS_ON_CORE_CONTEXTS =
  Object.freeze([
    {
      slug:
        'practical-learning-core',

      label:
        'learning a practical professional skill',

      degrees: [],
      branches: [],
      collegeYears: [],
      goals: [],
      skills: [],
      careers: [],
    },

    {
      slug:
        'real-world-application-core',

      label:
        'testing how an idea works in a real or practical setting',

      degrees: [],
      branches: [],
      collegeYears: [],
      goals: [],
      skills: [],
      careers: [],
    },
  ]);


const HANDS_ON_CONTEXTS =
  new Set([
    'engineering-project',
    'software-development',
    'electronics-lab',
    'mechanical-design',
    'civil-design',
    'architecture-design',
    'visual-design',
    'science-research',
    'hospitality-management',
    'agriculture-field',
    'research-project',
    'portfolio-building',
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


  return [
    ...COLLEGE_CORE_CONTEXTS,
    ...CONTEXTS,
  ];
}


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


function buildCollegeQuestion({
  trait,
  sequence,
  variant,
  context,
}) {
  const family =
    FAMILIES[
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
      'When learning a practical professional skill, I understand it better if I can try the activity myself rather than only read or hear about it.';
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

      skills:
        context.skills ||
        [],

      contextScope:
        'college',

      difficulty:
        sequence % 3 ===
        0
          ? 4
          : 3,

      priority:
        sequence <=
        12
          ? 4
          : 3,

      tags: [
        trait,
        family,
        context.slug,
        'college',
        'professional-direction',
        'v7-college-bank',
      ],
    });


  return Object.freeze({
    ...base,

    degrees:
      context.degrees ||
      [],

    branches:
      context.branches ||
      [],

    collegeYears:
      context.collegeYears ||
      [],

    goals:
      context.goals ||
      [],

    skills:
      context.skills ||
      [],

    careerFamilies:
      context.careers ||
      [],
  });
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


  const traitContexts =
    getContextsForTrait(
      trait
    );


  for (
    let index = 0;
    index < count;
    index += 1
  ) {
    const variant =
      index %
      8;


    const contextIndex =
      trait ===
        'hands_on'
        ? (
            variant +
            Math.floor(
              index /
              8
            ) *
              3
          ) %
          traitContexts.length
        : index %
          traitContexts.length;


    const context =
      traitContexts[
        contextIndex
      ];


    QUESTIONS.push(
      buildCollegeQuestion({
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
    `Expected 500 College questions, generated ${QUESTIONS.length}.`
  );
}


export default QUESTIONS;


