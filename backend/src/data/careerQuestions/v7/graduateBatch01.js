import {
  buildAdaptiveQuestion,
} from './builders/adaptiveQuestionBuilder.js';


const CLASS_KEY =
  'graduate';


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


const CORE_CONTEXTS =
  Object.freeze([
    {
      slug:
        'professional-decision-core',

      label:
        'making an important decision about my professional direction',

      degrees: [],
      specializations: [],
      statuses: [],
      experiences: [],
      goals: [],
      skills: [],
      careers: [],
    },

    {
      slug:
        'career-problem-core',

      label:
        'working through an unfamiliar professional or career-related problem',

      degrees: [],
      specializations: [],
      statuses: [],
      experiences: [],
      goals: [],
      skills: [],
      careers: [],
    },
  ]);


const CONTEXTS =
  Object.freeze([
    {
      slug:
        'first-job-search',

      label:
        'searching for my first full-time job after graduation',

      degrees: [],

      specializations: [],

      statuses: [
        'student',
        'recent graduate',
        'fresher',
        'unemployed',
      ],

      experiences: [
        'none',
        'fresher',
        '0 1 years',
      ],

      goals: [
        'get first job',
        'job',
        'placement',
      ],

      skills: [
        'communication',
        'problem solving',
        'teamwork',
        'interview preparation',
      ],

      careers: [],
    },

    {
      slug:
        'better-job',

      label:
        'evaluating opportunities for a better job or stronger role',

      degrees: [],

      specializations: [],

      statuses: [
        'working',
        'employed',
      ],

      experiences: [
        '1 3 years',
        '3 5 years',
        '5 plus years',
      ],

      goals: [
        'get a better job',
        'job switch',
        'career growth',
      ],

      skills: [
        'communication',
        'leadership',
        'project management',
      ],

      careers: [],
    },

    {
      slug:
        'career-switch',

      label:
        'considering a career switch into a different professional field',

      degrees: [],

      specializations: [],

      statuses: [
        'working',
        'employed',
        'unemployed',
      ],

      experiences: [],

      goals: [
        'switch career',
        'career switch',
        'explore career options',
      ],

      skills: [],

      careers: [],
    },

    {
      slug:
        'government-job',

      label:
        'preparing for a government-sector career opportunity',

      degrees: [],

      specializations: [],

      statuses: [],

      experiences: [],

      goals: [
        'government job',
        'government exams',
      ],

      skills: [
        'reasoning',
        'quantitative aptitude',
        'current affairs',
      ],

      careers: [
        'government',
        'public service',
      ],
    },

    {
      slug:
        'civil-services',

      label:
        'preparing for civil services or public-administration roles',

      degrees: [],

      specializations: [],

      statuses: [],

      experiences: [],

      goals: [
        'civil services',
        'upsc',
      ],

      skills: [
        'writing',
        'current affairs',
        'analysis',
        'public speaking',
      ],

      careers: [
        'civil services',
        'governance',
        'public policy',
      ],
    },

    {
      slug:
        'defence-career',

      label:
        'considering a defence-services career after graduation',

      degrees: [],

      specializations: [],

      statuses: [],

      experiences: [],

      goals: [
        'defence career',
        'defence',
      ],

      skills: [
        'leadership',
        'teamwork',
        'discipline',
        'physical fitness',
      ],

      careers: [
        'defence',
        'public service',
      ],
    },

    {
      slug:
        'mba-preparation',

      label:
        'preparing for MBA admission and management careers',

      degrees: [],

      specializations: [],

      statuses: [],

      experiences: [],

      goals: [
        'mba',
        'management studies',
      ],

      skills: [
        'quantitative aptitude',
        'communication',
        'leadership',
        'business analysis',
      ],

      careers: [
        'management',
        'business',
      ],
    },

    {
      slug:
        'mtech-gate',

      label:
        'preparing for GATE, M.Tech, or advanced engineering studies',

      degrees: [
        'btech',
        'be',
      ],

      specializations: [],

      statuses: [],

      experiences: [],

      goals: [
        'm tech',
        'mtech',
        'gate',
        'higher studies',
      ],

      skills: [
        'technical knowledge',
        'problem solving',
        'mathematics',
        'research',
      ],

      careers: [
        'engineering',
        'technology',
        'research',
      ],
    },

    {
      slug:
        'ms-msc',

      label:
        'comparing MS, MSc, or other advanced academic programmes',

      degrees: [
        'bsc',
        'bsc-hons',
        'bs',
        'btech',
        'be',
      ],

      specializations: [],

      statuses: [],

      experiences: [],

      goals: [
        'ms',
        'msc',
        'higher studies',
      ],

      skills: [
        'research',
        'statistics',
        'academic writing',
      ],

      careers: [
        'research',
        'science',
        'technology',
      ],
    },

    {
      slug:
        'study-abroad',

      label:
        'evaluating opportunities to study abroad after graduation',

      degrees: [],

      specializations: [],

      statuses: [],

      experiences: [],

      goals: [
        'study abroad',
        'higher studies abroad',
      ],

      skills: [
        'communication',
        'research',
        'planning',
      ],

      careers: [],
    },

    {
      slug:
        'research-career',

      label:
        'exploring research as a long-term academic or professional direction',

      degrees: [],

      specializations: [],

      statuses: [],

      experiences: [],

      goals: [
        'research',
        'phd',
        'higher studies',
      ],

      skills: [
        'research',
        'statistics',
        'data analysis',
        'academic writing',
      ],

      careers: [
        'research',
        'academia',
      ],
    },

    {
      slug:
        'startup',

      label:
        'developing a startup or independent business idea',

      degrees: [],

      specializations: [],

      statuses: [],

      experiences: [],

      goals: [
        'start a business',
        'entrepreneurship',
        'startup',
      ],

      skills: [
        'leadership',
        'sales',
        'marketing',
        'finance',
        'product development',
      ],

      careers: [
        'entrepreneurship',
        'business',
      ],
    },

    {
      slug:
        'freelancing',

      label:
        'building a sustainable freelance or independent professional career',

      degrees: [],

      specializations: [],

      statuses: [],

      experiences: [],

      goals: [
        'freelance career',
        'freelancing',
      ],

      skills: [
        'communication',
        'project management',
        'client management',
      ],

      careers: [],
    },

    {
      slug:
        'professional-certification',

      label:
        'choosing a professional certification that could strengthen my career',

      degrees: [],

      specializations: [],

      statuses: [],

      experiences: [],

      goals: [
        'professional qualification',
        'certification',
        'upskill',
      ],

      skills: [],

      careers: [],
    },

    {
      slug:
        'reskilling',

      label:
        'learning new skills to improve my employability or change direction',

      degrees: [],

      specializations: [],

      statuses: [],

      experiences: [],

      goals: [
        'skill development',
        'reskilling',
        'upskill',
        'switch career',
      ],

      skills: [],

      careers: [],
    },

    {
      slug:
        'interview-preparation',

      label:
        'preparing for an important professional interview',

      degrees: [],

      specializations: [],

      statuses: [],

      experiences: [],

      goals: [
        'get first job',
        'get a better job',
        'job',
      ],

      skills: [
        'communication',
        'interview preparation',
        'public speaking',
      ],

      careers: [],
    },

    {
      slug:
        'workplace-growth',

      label:
        'improving my performance and growth in a professional workplace',

      degrees: [],

      specializations: [],

      statuses: [
        'working',
        'employed',
      ],

      experiences: [
        '1 3 years',
        '3 5 years',
        '5 plus years',
      ],

      goals: [
        'career growth',
        'get a better job',
      ],

      skills: [
        'leadership',
        'communication',
        'teamwork',
        'project management',
      ],

      careers: [],
    },

    {
      slug:
        'engineering-career',

      label:
        'evaluating engineering and technical career opportunities',

      degrees: [
        'btech',
        'be',
      ],

      specializations: [],

      statuses: [],

      experiences: [],

      goals: [
        'job',
        'get first job',
        'get a better job',
      ],

      skills: [
        'technical knowledge',
        'problem solving',
        'engineering design',
      ],

      careers: [
        'engineering',
        'technology',
      ],
    },

    {
      slug:
        'software-career',

      label:
        'building a career in software, data, or digital technology',

      degrees: [
        'btech',
        'be',
        'bca',
        'bsc',
        'bsc-hons',
      ],

      specializations: [
        'computer science',
        'information technology',
        'software engineering',
        'artificial intelligence',
        'data science',
      ],

      statuses: [],

      experiences: [],

      goals: [
        'job',
        'get first job',
        'get a better job',
        'switch career',
      ],

      skills: [
        'programming',
        'web development',
        'data analysis',
        'ai machine learning',
        'cloud computing',
      ],

      careers: [
        'software',
        'technology',
      ],
    },

    {
      slug:
        'finance-career',

      label:
        'evaluating finance, accounting, or banking career opportunities',

      degrees: [
        'bcom',
        'bcom-hons',
        'bba',
        'bbm',
        'bms',
      ],

      specializations: [
        'finance',
        'accounting',
        'commerce',
      ],

      statuses: [],

      experiences: [],

      goals: [
        'job',
        'professional qualification',
        'get a better job',
      ],

      skills: [
        'accounting',
        'finance',
        'data analysis',
      ],

      careers: [
        'finance',
        'accounting',
        'banking',
      ],
    },

    {
      slug:
        'management-career',

      label:
        'evaluating management, operations, or business-development roles',

      degrees: [
        'bba',
        'bbm',
        'bms',
        'integrated-bba-mba',
      ],

      specializations: [
        'management',
        'marketing',
        'finance',
        'human resources',
      ],

      statuses: [],

      experiences: [],

      goals: [
        'job',
        'mba',
        'get a better job',
        'start a business',
      ],

      skills: [
        'leadership',
        'marketing',
        'sales',
        'project management',
      ],

      careers: [
        'management',
        'business',
      ],
    },

    {
      slug:
        'law-career',

      label:
        'evaluating legal, policy, or governance career opportunities',

      degrees: [
        'llb',
        'ba-llb',
        'bba-llb',
        'bcom-llb',
      ],

      specializations: [
        'law',
      ],

      statuses: [],

      experiences: [],

      goals: [
        'job',
        'civil services',
        'higher studies',
      ],

      skills: [
        'writing',
        'research',
        'public speaking',
        'debating',
      ],

      careers: [
        'law',
        'policy',
        'governance',
      ],
    },

    {
      slug:
        'psychology-career',

      label:
        'evaluating psychology, counselling, or behavioural-science careers',

      degrees: [
        'ba',
        'ba-hons',
        'bsc',
        'bsc-hons',
      ],

      specializations: [
        'psychology',
      ],

      statuses: [],

      experiences: [],

      goals: [
        'job',
        'higher studies',
        'research',
      ],

      skills: [
        'communication',
        'research',
        'counselling helping',
      ],

      careers: [
        'psychology',
        'social impact',
      ],
    },

    {
      slug:
        'creative-career',

      label:
        'building a professional career in design, media, or creative work',

      degrees: [
        'bdes',
        'bfa',
        'bva',
        'ba',
      ],

      specializations: [
        'graphic design',
        'ui ux design',
        'visual communication',
        'media studies',
      ],

      statuses: [],

      experiences: [],

      goals: [
        'job',
        'freelance career',
        'start a business',
      ],

      skills: [
        'graphic design',
        'ui ux design',
        'content creation',
        'video editing',
      ],

      careers: [
        'design',
        'creative',
        'media',
      ],
    },

    {
      slug:
        'education-career',

      label:
        'evaluating teaching, education, or academic career opportunities',

      degrees: [
        'bed',
        'ba',
        'bsc',
      ],

      specializations: [
        'education',
      ],

      statuses: [],

      experiences: [],

      goals: [
        'job',
        'government job',
        'higher studies',
      ],

      skills: [
        'teaching',
        'communication',
        'public speaking',
      ],

      careers: [
        'education',
        'teaching',
      ],
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
      c => `I enjoy adding my own design, presentation, or communication ideas while ${c}.`,
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
      c => `If ${c} can be demonstrated through a real activity, model, simulation, or practical example, I prefer trying it myself.`,
      c => `When I encounter a practical difficulty while ${c}, I enjoy working out what adjustment could improve the result.`,
      c => `I understand ${c} better when I can connect the idea with something observable or practical.`,
      c => `If a model, prototype, simulation, or demonstration would help with ${c}, I would be interested in creating or testing one.`,
      c => `If ${c} involves practical work, I am comfortable using the relevant tools, systems, or resources.`,
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
    'career-decision',
    'work-style',
    'professional-communication',
    'career-transition',
    'problem-solving',
    'professional-behaviour',
    'motivation',
  ]);


const DIVERSITY_SUFFIXES =
  Object.freeze([
    '',
    ' I tend to prefer this approach even when the professional decision becomes more difficult.',
    ' This is usually one of the first approaches I consider in an important career situation.',
    ' I would still lean toward this approach when the decision could significantly affect my future.',
  ]);


function getContextsForTrait(
  trait
) {
  if (
    trait ===
    'hands_on'
  ) {
    return [
      {
        ...CORE_CONTEXTS[0],

        slug:
          'practical-professional-skill-core',

        label:
          'learning a practical professional skill',
      },

      {
        ...CORE_CONTEXTS[1],

        slug:
          'real-world-professional-application-core',

        label:
          'testing how an idea works in a real professional or practical setting',
      },

      ...CONTEXTS,
    ];
  }


  return [
    ...CORE_CONTEXTS,
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


function buildGraduateQuestion({
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
      'When I want to understand how something works in a professional setting, I prefer testing, demonstrating, or applying the idea myself.';
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
        'professional',

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
        'graduate',
        'professional-transition',
        'v7-graduate-bank',
      ],
    });


  return Object.freeze({
    ...base,

    degrees:
      context.degrees ||
      [],

    branches:
      context.specializations ||
      [],

    specializations:
      context.specializations ||
      [],

    currentStatuses:
      context.statuses ||
      [],

    experiences:
      context.experiences ||
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


  for (
    let index = 0;
    index < count;
    index += 1
  ) {
    const variant =
      index %
      8;


    /*
    |--------------------------------------------------------------------------
    | First 2 questions per trait are neutral core
    |--------------------------------------------------------------------------
    */

    let context;


    if (
      index === 0
    ) {
      context =
        trait === 'hands_on'
          ? {
              ...CORE_CONTEXTS[0],
              slug:
                'practical-professional-skill-core',
              label:
                'learning a practical professional skill',
            }
          : CORE_CONTEXTS[0];
    } else if (
      index === 1
    ) {
      context =
        trait === 'hands_on'
          ? {
              ...CORE_CONTEXTS[1],
              slug:
                'real-world-professional-application-core',
              label:
                'testing how an idea works in a real professional or practical setting',
            }
          : CORE_CONTEXTS[1];
    } else {
      /*
      |--------------------------------------------------------------------------
      | Spread remaining questions across the complete Graduate context bank
      |--------------------------------------------------------------------------
      |
      | Multiplying by 7 distributes 29-30 personalised items widely across
      | the context list instead of repeatedly using only its first section.
      |
      */

      const contextIndex =
        (
          (index - 2) *
          7
        ) %
        CONTEXTS.length;


      context =
        CONTEXTS[
          contextIndex
        ];
    }


    QUESTIONS.push(
      buildGraduateQuestion({
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
    `Expected 500 Graduate questions, generated ${QUESTIONS.length}.`
  );
}


export default QUESTIONS;

