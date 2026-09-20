/*
|--------------------------------------------------------------------------
| TruMarg Adaptive Career Assessment Question Bank V6
|--------------------------------------------------------------------------
|
| Class-specific pilot bank.
|
| Purpose:
| - prove Class 8 / 9 / 10 / 11 / 12 separation
| - test board, subject and interest metadata
| - keep deterministic trait scoring
|
| This is a psychometric-style career guidance bank.
| It is NOT a clinically validated psychological instrument.
|--------------------------------------------------------------------------
*/

const LIKERT_OPTIONS = [
  {
    label: 'Strongly disagree',
    value: 1,
  },
  {
    label: 'Disagree',
    value: 2,
  },
  {
    label: 'Not sure',
    value: 3,
  },
  {
    label: 'Agree',
    value: 4,
  },
  {
    label: 'Strongly agree',
    value: 5,
  },
];


const CLASS_CONFIG = {
  'class-8': {
    stage: 'foundation',

    numericClass: 8,

    goals: [
      'explore-careers',
    ],
  },

  'class-9': {
    stage: 'foundation',

    numericClass: 9,

    goals: [
      'explore-careers',
    ],
  },

  'class-10': {
    stage: 'class10',

    numericClass: 10,

    goals: [
      'choose-stream',
      'explore-careers',
    ],
  },

  'class-11': {
    stage:
      'senior-secondary',

    numericClass: 11,

    goals: [
      'choose-course',
      'entrance-exams',
      'explore-careers',
    ],
  },

  'class-12': {
    stage:
      'senior-secondary',

    numericClass: 12,

    goals: [
      'choose-course',
      'entrance-exams',
      'explore-careers',
    ],
  },
};


/*
|--------------------------------------------------------------------------
| Pilot items
|--------------------------------------------------------------------------
|
| Each class gets genuinely different wording.
|--------------------------------------------------------------------------
*/

const CLASS_ITEMS = {
  'class-8': [
    {
      trait: 'analytical',

      section: 'strength',

      text:
        'When you see a difficult puzzle or school problem, I enjoy figuring out the steps instead of immediately asking for the answer.',

      subjects: [
        'mathematics',
      ],

      interestClusters: [
        'technology',
        'engineering',
      ],

      contextScope:
        'subject',
    },

    {
      trait: 'quantitative',

      section: 'strength',

      text:
        'Patterns in numbers, scores or simple graphs usually make me curious about what they mean.',

      subjects: [
        'mathematics',
      ],

      interestClusters: [
        'technology',
        'science',
        'finance',
      ],

      contextScope:
        'subject',
    },

    {
      trait:
        'scientific_curiosity',

      section: 'interest',

      text:
        'When I learn why something happens in nature or science, I often want to know more about the reason behind it.',

      subjects: [
        'science',
      ],

      interestClusters: [
        'science',
        'healthcare',
        'engineering',
      ],

      contextScope:
        'subject',
    },

    {
      trait: 'technology',

      section: 'interest',

      text:
        'I enjoy exploring how apps, computers, devices or digital tools work.',

      subjects: [
        'computer',
      ],

      interestClusters: [
        'technology',
      ],

      contextScope:
        'interest',
    },

    {
      trait: 'creativity',

      section: 'interest',

      text:
        'I like thinking of new ways to make a school project, drawing, model or presentation more interesting.',

      interestClusters: [
        'design',
        'media',
      ],

      contextScope:
        'interest',
    },

    {
      trait:
        'social_helping',

      section: 'interest',

      text:
        'I feel good when I can help a classmate understand something they were struggling with.',

      interestClusters: [
        'education',
        'healthcare',
        'social-impact',
      ],

      contextScope:
        'interest',
    },
  ],


  'class-9': [
    {
      trait: 'analytical',

      section: 'strength',

      text:
        'When a school problem has several possible solutions, I like comparing them before deciding which approach makes most sense.',

      subjects: [
        'mathematics',
        'science',
      ],

      interestClusters: [
        'technology',
        'engineering',
        'science',
      ],

      contextScope:
        'subject',
    },

    {
      trait: 'quantitative',

      section: 'strength',

      text:
        'I am comfortable using calculations, graphs or numerical comparisons when solving school problems.',

      subjects: [
        'mathematics',
      ],

      interestClusters: [
        'engineering',
        'finance',
        'science',
      ],

      contextScope:
        'subject',
    },

    {
      trait:
        'scientific_curiosity',

      section: 'interest',

      text:
        'I enjoy connecting scientific ideas from class with things I observe in everyday life.',

      subjects: [
        'science',
      ],

      interestClusters: [
        'science',
        'healthcare',
        'engineering',
      ],

      contextScope:
        'subject',
    },

    {
      trait: 'technology',

      section: 'interest',

      text:
        'Learning how software, electronics or digital systems solve real problems sounds interesting to me.',

      interestClusters: [
        'technology',
        'engineering',
      ],

      contextScope:
        'interest',
    },

    {
      trait: 'leadership',

      section: 'work-style',

      text:
        'During a group project, I am comfortable helping the group decide what needs to be done first.',

      interestClusters: [
        'business',
        'government',
        'social-impact',
      ],

      contextScope:
        'interest',
    },

    {
      trait: 'entrepreneurship',

      section:
        'career-values',

      text:
        'I sometimes think about how an idea could become a useful product, service or small project of my own.',

      interestClusters: [
        'business',
        'technology',
      ],

      contextScope:
        'interest',
    },
  ],


  'class-10': [
    {
      trait: 'quantitative',

      section: 'strength',

      text:
        'I would be comfortable choosing a stream where mathematics requires regular practice and multi-step problem solving.',

      subjects: [
        'mathematics',
      ],

      interestClusters: [
        'engineering',
        'technology',
        'finance',
      ],

      contextScope:
        'class',
    },

    {
      trait:
        'scientific_curiosity',

      section: 'interest',

      text:
        'Studying Physics, Chemistry or Biology in greater depth for the next two years sounds appealing to me.',

      subjects: [
        'science',
      ],

      interestClusters: [
        'science',
        'engineering',
        'healthcare',
      ],

      contextScope:
        'class',
    },

    {
      trait: 'verbal',

      section: 'strength',

      text:
        'A stream involving significant reading, writing, argument or interpretation would suit the way I like to learn.',

      subjects: [
        'english',
        'social-science',
      ],

      interestClusters: [
        'law',
        'media',
        'humanities',
      ],

      contextScope:
        'class',
    },

    {
      trait: 'technology',

      section: 'interest',

      text:
        'I would like my Class 11–12 studies to keep open strong options in computing, engineering or technology.',

      interestClusters: [
        'technology',
        'engineering',
      ],

      contextScope:
        'career-discriminator',

      discriminatorGroup:
        'stream-technology',
    },

    {
      trait:
        'social_helping',

      section: 'interest',

      text:
        'I am attracted to future paths where understanding and helping people is more important than working mainly with machines or numbers.',

      interestClusters: [
        'healthcare',
        'education',
        'social-impact',
      ],

      contextScope:
        'career-discriminator',

      discriminatorGroup:
        'people-vs-technical',
    },

    {
      trait:
        'entrepreneurship',

      section:
        'career-values',

      text:
        'Business, commerce or entrepreneurship feels interesting enough that I would seriously consider keeping those options open after Class 10.',

      interestClusters: [
        'business',
        'finance',
      ],

      contextScope:
        'career-discriminator',

      discriminatorGroup:
        'commerce-business',
    },
  ],


  'class-11': [
    {
      trait: 'analytical',

      section: 'strength',

      text:
        'I enjoy subjects where I must combine several concepts before reaching the final solution.',

      subjects: [
        'mathematics',
        'physics',
        'chemistry',
      ],

      contextScope:
        'subject',
    },

    {
      trait: 'technology',

      section: 'interest',

      text:
        'I would enjoy learning programming, computing or technical systems beyond what is required for school examinations.',

      interestClusters: [
        'technology',
        'engineering',
      ],

      contextScope:
        'interest',
    },

    {
      trait:
        'scientific_curiosity',

      section: 'interest',

      text:
        'Understanding a scientific topic deeply matters to me even when it is not directly required for marks.',

      subjects: [
        'physics',
        'chemistry',
        'biology',
      ],

      interestClusters: [
        'science',
        'healthcare',
      ],

      contextScope:
        'subject',
    },

    {
      trait: 'achievement',

      section:
        'career-values',

      text:
        'I am willing to build stronger academic skills now if they improve my chances of entering a demanding course later.',

      goals: [
        'choose-course',
        'entrance-exams',
      ],

      contextScope:
        'academic-context',
    },

    {
      trait: 'structure',

      section: 'work-style',

      text:
        'For a major entrance or board examination, I prefer having a structured preparation plan rather than studying without a schedule.',

      goals: [
        'entrance-exams',
      ],

      contextScope:
        'academic-context',
    },

    {
      trait: 'adaptability',

      section: 'work-style',

      text:
        'If my preferred career path becomes less suitable after learning more about it, I can seriously consider alternative courses.',

      goals: [
        'explore-careers',
        'choose-course',
      ],

      contextScope:
        'career-discriminator',
    },
  ],


  'class-12': [
    {
      trait: 'analytical',

      section: 'strength',

      text:
        'When comparing degree options, I naturally evaluate differences such as curriculum, difficulty, career outcomes and entry requirements.',

      goals: [
        'choose-course',
      ],

      contextScope:
        'academic-context',
    },

    {
      trait: 'quantitative',

      section: 'strength',

      text:
        'I would prefer a university course where mathematics, data or quantitative reasoning remains an important part of the curriculum.',

      subjects: [
        'mathematics',
      ],

      interestClusters: [
        'technology',
        'engineering',
        'finance',
        'science',
      ],

      contextScope:
        'career-discriminator',

      discriminatorGroup:
        'quant-heavy-course',
    },

    {
      trait:
        'scientific_curiosity',

      section: 'interest',

      text:
        'A degree involving laboratory work, research or scientific investigation would be interesting to me.',

      subjects: [
        'physics',
        'chemistry',
        'biology',
      ],

      interestClusters: [
        'science',
        'healthcare',
      ],

      contextScope:
        'career-discriminator',

      discriminatorGroup:
        'research-science',
    },

    {
      trait: 'technology',

      section: 'interest',

      text:
        'I would enjoy a college course where I regularly build software, systems, devices or technical projects.',

      interestClusters: [
        'technology',
        'engineering',
      ],

      contextScope:
        'career-discriminator',

      discriminatorGroup:
        'technology-course',
    },

    {
      trait: 'stability',

      section:
        'career-values',

      text:
        'When choosing a degree, reliable career demand and long-term employability matter strongly to me.',

      goals: [
        'choose-course',
      ],

      contextScope:
        'career-discriminator',
    },

    {
      trait:
        'entrepreneurship',

      section:
        'career-values',

      text:
        'I would seriously consider a course that could eventually help me build a business, product or venture.',

      interestClusters: [
        'business',
        'technology',
      ],

      contextScope:
        'career-discriminator',

      discriminatorGroup:
        'entrepreneurial-path',
    },
  ],
};


/*
|--------------------------------------------------------------------------
| Board metadata
|--------------------------------------------------------------------------
|
| These pilot items are board-neutral unless specifically overridden.
|
| Later 2,100-item bank will include academic-context items for:
| CBSE, ICSE, State Boards, IB, Cambridge, Other.
|--------------------------------------------------------------------------
*/

const DEFAULT_BOARDS = [];


/*
|--------------------------------------------------------------------------
| Builder
|--------------------------------------------------------------------------
*/

function buildQuestion(
  classKey,
  item,
  index
) {
  const config =
    CLASS_CONFIG[
      classKey
    ];

  if (!config) {
    throw new Error(
      `Unknown class config: ${classKey}`
    );
  }

  const trait =
    item.trait;

  return {
    id:
      `v6_${classKey}_` +
      `${trait}_` +
      `${String(
        index + 1
      ).padStart(
        3,
        '0'
      )}`,

    stage:
      config.stage,

    classes: [
      classKey,
    ],

    boards:
      item.boards ||
      DEFAULT_BOARDS,

    section:
      item.section,

    trait,

    purpose:
      item.purpose ||
      'measurement',

    text:
      item.text,

    options:
      LIKERT_OPTIONS,

    degrees: [],

    branches: [],

    streams: [],

    subjects:
      item.subjects || [],

    skills:
      item.skills || [],

    goals:
      item.goals ||
      config.goals,

    tags: [
      'controlled-bank-v6',
      classKey,
      trait,
      ...(item.tags || []),
    ],

    interestClusters:
      item.interestClusters ||
      [],

    careerFamilies:
      item.careerFamilies ||
      [],

    difficulty:
      item.difficulty ||
      2,

    discriminatorGroup:
      item.discriminatorGroup ||
      null,

    contextScope:
      item.contextScope ||
      'class',

    minClass:
      config.numericClass,

    maxClass:
      config.numericClass,

    responseFormat:
      'likert-5',

    priority:
      item.priority ||
      4,

    weight:
      item.weight ||
      1,

    active: true,

    version: 6,
  };
}


/*
|--------------------------------------------------------------------------
| Complete V6 pilot bank
|--------------------------------------------------------------------------
*/

export const CAREER_QUESTION_BANK_V6 =
  Object.entries(
    CLASS_ITEMS
  )
    .flatMap(
      ([
        classKey,
        items,
      ]) =>
        items.map(
          (
            item,
            index
          ) =>
            buildQuestion(
              classKey,
              item,
              index
            )
        )
    );


export const CAREER_QUESTION_BANK_V6_STATS =
  Object.freeze({
    total:
      CAREER_QUESTION_BANK_V6
        .length,

    byClass:
      Object.fromEntries(
        Object.keys(
          CLASS_CONFIG
        )
          .map(
            (classKey) => [
              classKey,

              CAREER_QUESTION_BANK_V6
                .filter(
                  (question) =>
                    question.classes
                      .includes(
                        classKey
                      )
                )
                .length,
            ]
          )
      ),
  });


export default
  CAREER_QUESTION_BANK_V6;
