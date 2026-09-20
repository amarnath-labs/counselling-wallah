/*
|--------------------------------------------------------------------------
| TruMarg Adaptive Career Assessment Question Bank V5
|--------------------------------------------------------------------------
|
| Psychometric-style career guidance item bank.
| IMPORTANT: This is NOT a clinically validated psychological instrument.
|
| 320 controlled items:
| 64 Foundation
| 64 Class 10
| 64 Senior Secondary
| 64 College
| 64 Graduate
|--------------------------------------------------------------------------
*/

const STAGES = [
  'foundation',
  'class10',
  'senior-secondary',
  'college',
  'graduate',
];

const LIKERT_OPTIONS = [
  { label: 'Strongly disagree', value: 1 },
  { label: 'Disagree', value: 2 },
  { label: 'Not sure', value: 3 },
  { label: 'Agree', value: 4 },
  { label: 'Strongly agree', value: 5 },
];

const STAGE_CONTEXT = {
  foundation: {
    label: 'Class 8–9',
    goal: ['explore-careers'],
  },

  class10: {
    label: 'Class 10',
    goal: [
      'choose-stream',
      'explore-careers',
    ],
  },

  'senior-secondary': {
    label: 'Class 11–12',
    goal: [
      'choose-course',
      'entrance-exams',
      'explore-careers',
    ],
  },

  college: {
    label: 'College',
    goal: [
      'first-job',
      'internship',
      'higher-studies',
      'career-direction',
    ],
  },

  graduate: {
    label: 'Graduate',
    goal: [
      'first-job',
      'career-switch',
      'higher-studies',
      'government-career',
      'career-direction',
    ],
  },
};


/*
|--------------------------------------------------------------------------
| TRAIT BANK
|--------------------------------------------------------------------------
|
| 16 traits × 4 items × 5 stages = 320 items.
|--------------------------------------------------------------------------
*/

const TRAIT_ITEM_SETS = {
  analytical: {
    section: 'strength',

    tags: [
      'logic',
      'problem-solving',
      'analysis',
    ],

    items: [
      'I enjoy breaking a difficult problem into smaller parts before deciding what to do.',

      'I like comparing evidence and checking whether a conclusion actually makes sense.',

      'When something goes wrong, I naturally look for the underlying cause rather than guessing.',

      'I feel comfortable working through problems that require several logical steps.',
    ],
  },


  quantitative: {
    section: 'strength',

    tags: [
      'numbers',
      'mathematics',
      'data',
    ],

    items: [
      'I am comfortable using numbers, patterns or calculations to understand a situation.',

      'I enjoy questions where data can help me reach a clearer answer.',

      'Graphs, tables or numerical comparisons usually help me think more clearly.',

      'I would be willing to practise mathematics or quantitative skills when a goal requires it.',
    ],
  },


  verbal: {
    section: 'strength',

    tags: [
      'language',
      'communication',
      'writing',
    ],

    items: [
      'I can usually explain an idea clearly in words when I understand it well.',

      'I enjoy reading, writing, discussing or presenting ideas.',

      'I notice differences in wording and how language can change meaning.',

      'I am comfortable organising my thoughts into a clear written or spoken explanation.',
    ],
  },


  creativity: {
    section: 'interest',

    tags: [
      'creativity',
      'design',
      'ideas',
    ],

    items: [
      'I enjoy generating several different ideas instead of using only the obvious approach.',

      'I like creating, designing or improving something so it feels original or useful.',

      'I often imagine alternative ways a product, system, story or experience could work.',

      'Open-ended tasks where there is more than one good answer appeal to me.',
    ],
  },


  technology: {
    section: 'interest',

    tags: [
      'technology',
      'computers',
      'digital',
    ],

    items: [
      'I am curious about how software, digital tools, computers or modern technology work.',

      'I enjoy learning a new app, tool or technical system by exploring how it behaves.',

      'I would like to build, configure or improve something using technology.',

      'Technical problems usually make me curious rather than immediately bored.',
    ],
  },


  hands_on: {
    section: 'work-style',

    tags: [
      'practical',
      'hands-on',
      'building',
    ],

    items: [
      'I learn well when I can build, test, repair, operate or physically try something.',

      'I prefer some practical activity rather than spending all my time only reading or discussing.',

      'I enjoy seeing a concrete result from the work I do.',

      'Using tools, equipment, prototypes or real-world materials can keep me engaged.',
    ],
  },


  scientific_curiosity: {
    section: 'interest',

    tags: [
      'science',
      'research',
      'curiosity',
    ],

    items: [
      'I like asking why something happens and looking for an evidence-based explanation.',

      'I enjoy learning how natural, biological or physical systems work.',

      'Experiments, investigation or research questions can hold my attention for a long time.',

      'I am interested in testing an idea instead of accepting it only because someone said it.',
    ],
  },


  social_helping: {
    section: 'interest',

    tags: [
      'people',
      'helping',
      'service',
    ],

    items: [
      'I feel motivated when my work can directly help another person.',

      'I am willing to listen carefully when someone needs support or guidance.',

      'I would value a career where improving people’s lives is an important part of the work.',

      'I can stay patient when another person needs time to understand or solve a problem.',
    ],
  },


  leadership: {
    section: 'work-style',

    tags: [
      'leadership',
      'initiative',
      'coordination',
    ],

    items: [
      'I am comfortable taking responsibility when a group needs direction.',

      'I often notice what needs to be organised before others ask me to do it.',

      'I can make a decision even when not everyone in a group has the same opinion.',

      'I would like opportunities to influence priorities, plans or team decisions.',
    ],
  },


  collaboration: {
    section: 'work-style',

    tags: [
      'teamwork',
      'collaboration',
      'people',
    ],

    items: [
      'I can work productively with people whose ideas or working styles differ from mine.',

      'I like sharing information and combining strengths with other people to finish a task.',

      'I am willing to adjust my approach when a team has a better idea.',

      'I can contribute to a group without needing to control every decision.',
    ],
  },


  independence: {
    section: 'work-style',

    tags: [
      'independence',
      'autonomy',
      'self-direction',
    ],

    items: [
      'I can keep working toward a goal even when nobody is closely supervising me.',

      'I like having some freedom to decide how I will complete my work.',

      'I am comfortable learning something on my own when instructions are limited.',

      'I can organise my tasks without needing frequent reminders from someone else.',
    ],
  },


  structure: {
    section: 'work-style',

    tags: [
      'structure',
      'planning',
      'organisation',
    ],

    items: [
      'I work better when goals, expectations and deadlines are reasonably clear.',

      'I usually prefer planning important tasks instead of relying completely on last-minute effort.',

      'I like organising information, steps or resources so work becomes easier to manage.',

      'I am comfortable following a reliable process when accuracy matters.',
    ],
  },


  adaptability: {
    section: 'work-style',

    tags: [
      'adaptability',
      'change',
      'learning',
    ],

    items: [
      'I can adjust my approach when circumstances change unexpectedly.',

      'Learning a new method is manageable for me even when I was comfortable with the old one.',

      'I recover reasonably quickly when a plan does not work the first time.',

      'I can function in situations where every detail is not known in advance.',
    ],
  },


  achievement: {
    section: 'career-values',

    tags: [
      'achievement',
      'growth',
      'challenge',
    ],

    items: [
      'I feel satisfied when I can see that my ability has improved through difficult work.',

      'Challenging goals can motivate me when they feel meaningful and achievable.',

      'I would like a career where I can keep increasing my level of responsibility or expertise.',

      'Doing work to a high standard matters to me even when a minimum effort would be accepted.',
    ],
  },


  stability: {
    section: 'career-values',

    tags: [
      'stability',
      'security',
      'predictability',
    ],

    items: [
      'Long-term job security is an important factor in the career choices I make.',

      'I value a career path where income and responsibilities are reasonably predictable.',

      'I would usually prefer a stable opportunity over a much riskier option with uncertain rewards.',

      'Knowing that a career has dependable demand would make it more attractive to me.',
    ],
  },


  entrepreneurship: {
    section: 'career-values',

    tags: [
      'entrepreneurship',
      'business',
      'risk',
      'initiative',
    ],

    items: [
      'I am interested in turning an idea into a product, service, project or venture.',

      'I can imagine taking calculated risks when the possible opportunity is meaningful.',

      'I like thinking about how value is created for customers, users or organisations.',

      'The idea of building something of my own is appealing even if it involves uncertainty.',
    ],
  },
};


/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function slug(value = '') {
  return String(value)
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      '_'
    )
    .replace(
      /^_+|_+$/g,
      ''
    );
}


function stageQuestionText(
  stage,
  baseText
) {
  if (
    stage ===
      'foundation'
  ) {
    return baseText
      .replace(
        /career/gi,
        'future work'
      )
      .replace(
        /job security/gi,
        'future stability'
      )
      .replace(
        /income/gi,
        'future income'
      );
  }


  if (
    stage ===
      'class10'
  ) {
    return baseText.replace(
      /career choices/gi,
      'stream and career choices'
    );
  }


  return baseText;
}


/*
|--------------------------------------------------------------------------
| BUILD QUESTION
|--------------------------------------------------------------------------
*/

function buildCoreQuestion({
  stage,
  trait,
  spec,
  itemText,
  index,
}) {
  const context =
    STAGE_CONTEXT[
      stage
    ];


  return {
    id:
      `${stage}_` +
      `${slug(trait)}_` +
      `${String(
        index + 1
      ).padStart(
        2,
        '0'
      )}`,

    stage,

    section:
      spec.section,

    trait,

    purpose:
      index === 0
        ? 'core'
        : 'measurement',

    text:
      stageQuestionText(
        stage,
        itemText
      ),

    options:
      LIKERT_OPTIONS,

    degrees: [],

    branches: [],

    streams: [],

    subjects: [],

    skills: [],

    goals: [
      ...context.goal,
    ],

    tags: [
      ...spec.tags,

      'controlled-bank-v5',

      context.label
        .toLowerCase(),
    ],

    priority:
      index === 0
        ? 5
        : index === 1
          ? 4
          : 3,

    weight: 1,

    active: true,

    version: 5,
  };
}


/*
|--------------------------------------------------------------------------
| BUILD STAGE BANK
|--------------------------------------------------------------------------
*/

function buildStageBank(
  stage
) {
  const questions =
    [];


  for (
    const [
      trait,
      spec,
    ]
    of Object.entries(
      TRAIT_ITEM_SETS
    )
  ) {
    spec.items.forEach(
      (
        itemText,
        index
      ) => {
        questions.push(
          buildCoreQuestion({
            stage,
            trait,
            spec,
            itemText,
            index,
          })
        );
      }
    );
  }


  return questions;
}


/*
|--------------------------------------------------------------------------
| COMPLETE BANK
|--------------------------------------------------------------------------
*/

export const CAREER_QUESTION_BANK =
  STAGES.flatMap(
    buildStageBank
  );


/*
|--------------------------------------------------------------------------
| BANK STATS
|--------------------------------------------------------------------------
*/

export const CAREER_QUESTION_BANK_STATS =
  Object.freeze({
    total:
      CAREER_QUESTION_BANK
        .length,

    byStage:
      Object.fromEntries(
        STAGES.map(
          (stage) => [
            stage,

            CAREER_QUESTION_BANK
              .filter(
                (question) =>
                  question.stage ===
                  stage
              )
              .length,
          ]
        )
      ),

    traitCount:
      Object.keys(
        TRAIT_ITEM_SETS
      ).length,

    itemsPerTraitPerStage:
      4,
  });


/*
|--------------------------------------------------------------------------
| ADAPTIVE ASSESSMENT TARGETS
|--------------------------------------------------------------------------
*/

export const CAREER_ASSESSMENT_TARGETS =
  Object.freeze({
    foundation: {
      minimum: 20,
      typicalTarget: 26,
      maximum: 32,
    },

    class10: {
      minimum: 22,
      typicalTarget: 30,
      maximum: 36,
    },

    'senior-secondary': {
      minimum: 24,
      typicalTarget: 32,
      maximum: 40,
    },

    college: {
      minimum: 26,
      typicalTarget: 34,
      maximum: 44,
    },

    graduate: {
      minimum: 26,
      typicalTarget: 34,
      maximum: 44,
    },
  });


export default
  CAREER_QUESTION_BANK;
