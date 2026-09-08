// backend/src/services/career/questionProfileMapper.js

const DOMAIN_RULES = Object.freeze({
  engineering: {
    keywords: [
      'engineering', 'engineer', 'technical-service', 'technical service',
      'mechanical', 'electrical', 'electronics', 'civil engineering',
      'engineering degree', 'engineering route',
    ],
    streams: [
      'science pcm', 'science pcmb', 'pcm computer science',
      'pcm + computer science',
    ],
    subjects: [
      'physics', 'mathematics', 'applied mathematics',
      'chemistry', 'computer science', 'engineering graphics',
    ],
    entranceExams: [
      'jee main', 'jee advanced', 'bitsat', 'viteee',
      'srmjeee', 'met', 'comedk', 'state cet',
    ],
    targetCourses: ['btech', 'be', 'engineering'],
    careerFamilies: ['engineering', 'technology'],
    interestClusters: [
      'technology', 'engineering', 'problem-solving',
      'quantitative', 'hands-on',
    ],
  },

  technology: {
    keywords: [
      'computer', 'software', 'technology', 'coding', 'programming',
      'digital project', 'computer-based', 'data science',
      'artificial intelligence', 'ai ', 'cyber',
    ],
    streams: [
      'science pcm', 'science pcmb', 'pcm computer science',
      'pcm + computer science',
    ],
    subjects: [
      'mathematics', 'computer science', 'information technology',
      'artificial intelligence', 'data science', 'physics',
    ],
    entranceExams: [
      'jee main', 'jee advanced', 'bitsat', 'viteee',
      'srmjeee', 'met', 'comedk', 'cuet ug',
    ],
    targetCourses: [
      'btech computer science', 'bca', 'bsc computer science',
      'bsc data science', 'btech ai', 'btech it',
    ],
    careerFamilies: [
      'technology', 'software', 'data', 'computing',
    ],
    interestClusters: [
      'technology', 'analytical', 'quantitative', 'problem-solving',
    ],
  },

  healthcare: {
    keywords: [
      'healthcare', 'medical', 'medicine', 'patient', 'clinical',
      'health-awareness', 'health awareness', 'nursing',
      'pharmacy', 'paramedical', 'biology-related',
    ],
    streams: [
      'science pcb', 'science pcmb', 'pcb psychology',
      'pcb + psychology',
    ],
    subjects: [
      'biology', 'chemistry', 'physics', 'psychology',
      'biotechnology',
    ],
    entranceExams: [
      'neet ug', 'neet', 'nursing entrance',
      'paramedical entrance', 'pharmacy entrance',
    ],
    targetCourses: [
      'mbbs', 'bds', 'bsc nursing', 'bpharm',
      'allied health', 'physiotherapy', 'paramedical',
    ],
    careerFamilies: [
      'healthcare', 'medicine', 'life sciences',
    ],
    interestClusters: [
      'healthcare', 'science', 'helping', 'research',
    ],
  },

  research_science: {
    keywords: [
      'research', 'scientific', 'science or research',
      'laboratory', 'experiment', 'evidence-based',
      'evidence based', 'investigate', 'mechanism',
    ],
    streams: [
      'science pcm', 'science pcb', 'science pcmb',
      'biotechnology',
    ],
    subjects: [
      'physics', 'chemistry', 'biology', 'mathematics',
      'biotechnology',
    ],
    entranceExams: [
      'iiser iat', 'iat', 'nest', 'cuet ug',
    ],
    targetCourses: [
      'bsc', 'bs-ms', 'integrated msc', 'research degree',
    ],
    careerFamilies: [
      'research', 'science', 'academia',
    ],
    interestClusters: [
      'science', 'research', 'analytical', 'scientific curiosity',
    ],
  },

  commerce_finance: {
    keywords: [
      'commerce', 'finance', 'accounting', 'accountancy',
      'financial', 'economics', 'money', 'budget',
      'professional commerce',
    ],
    streams: [
      'commerce with mathematics', 'commerce without mathematics',
      'commerce', 'commerce with maths',
    ],
    subjects: [
      'accountancy', 'economics', 'business studies',
      'mathematics', 'applied mathematics', 'entrepreneurship',
    ],
    entranceExams: [
      'cuet ug', 'ca foundation', 'cseet', 'cma foundation',
    ],
    targetCourses: [
      'bcom', 'bcom hons', 'ca', 'cs', 'cma',
      'economics', 'finance',
    ],
    careerFamilies: [
      'finance', 'commerce', 'accounting', 'economics',
    ],
    interestClusters: [
      'business', 'finance', 'quantitative', 'economics',
    ],
  },

  management_business: {
    keywords: [
      'management', 'business', 'entrepreneur', 'venture',
      'startup', 'product or service', 'organisation',
      'organization', 'market', 'customer',
    ],
    streams: [
      'commerce with mathematics', 'commerce without mathematics',
      'commerce', 'humanities', 'science pcm', 'science pcb',
    ],
    subjects: [
      'business studies', 'economics', 'entrepreneurship',
      'mathematics', 'accountancy',
    ],
    entranceExams: [
      'ipmat', 'jipmat', 'np at', 'npat', 'set', 'cuet ug',
    ],
    targetCourses: [
      'bba', 'bms', 'ipm', 'management', 'business',
    ],
    careerFamilies: [
      'management', 'business', 'entrepreneurship',
    ],
    interestClusters: [
      'business', 'leadership', 'entrepreneurship',
      'management',
    ],
  },

  law_governance: {
    keywords: [
      'law degree', 'legal', 'law route', 'governance',
      'court', 'policy', 'constitution',
    ],
    streams: [
      'humanities', 'arts', 'commerce with mathematics',
      'commerce without mathematics', 'science pcm', 'science pcb',
    ],
    subjects: [
      'legal studies', 'political science', 'history',
      'sociology', 'economics', 'english',
    ],
    entranceExams: [
      'clat', 'ailet', 'slat', 'mh cet law',
    ],
    targetCourses: [
      'ba llb', 'bba llb', 'bcom llb', 'llb', 'law',
    ],
    careerFamilies: [
      'law', 'governance', 'public policy',
    ],
    interestClusters: [
      'law', 'communication', 'governance', 'social sciences',
    ],
  },

  design_architecture: {
    keywords: [
      'design', 'architecture', 'visual-arts', 'visual arts',
      'visual or design', 'creative assignment', 'poster',
      'layout', 'prototype',
    ],
    streams: [
      'fine arts', 'humanities', 'science pcm',
      'science pcmb', 'commerce',
    ],
    subjects: [
      'fine arts', 'design', 'engineering graphics',
      'mathematics', 'visual arts',
    ],
    entranceExams: [
      'nata', 'jee paper 2', 'uceed', 'nid dat', 'nift',
    ],
    targetCourses: [
      'barch', 'bdes', 'design', 'architecture',
      'fashion design',
    ],
    careerFamilies: [
      'design', 'architecture', 'creative arts',
    ],
    interestClusters: [
      'creativity', 'design', 'visual', 'spatial',
    ],
  },

  arts_performance: {
    keywords: [
      'music', 'dance', 'theatre', 'theater',
      'performance', 'performing arts',
    ],
    streams: [
      'performing arts', 'fine arts', 'humanities', 'arts',
    ],
    subjects: [
      'music', 'dance', 'theatre', 'fine arts',
    ],
    entranceExams: [
      'performance audition', 'music entrance', 'dance entrance',
    ],
    targetCourses: [
      'performing arts', 'music', 'dance', 'theatre',
    ],
    careerFamilies: [
      'performing arts', 'creative arts', 'entertainment',
    ],
    interestClusters: [
      'creativity', 'performance', 'communication',
    ],
  },

  agriculture_environment: {
    keywords: [
      'agriculture', 'environment', 'environmental',
      'farming', 'agricultural',
    ],
    streams: [
      'agriculture', 'science pcb', 'science pcmb',
    ],
    subjects: [
      'agriculture', 'biology', 'chemistry',
      'environmental science',
    ],
    entranceExams: [
      'icar', 'cuet ug', 'agriculture entrance',
    ],
    targetCourses: [
      'bsc agriculture', 'agriculture', 'environmental science',
    ],
    careerFamilies: [
      'agriculture', 'environment', 'sustainability',
    ],
    interestClusters: [
      'environment', 'outdoor', 'science', 'practical',
    ],
  },

  hospitality: {
    keywords: [
      'hotel management', 'hospitality', 'hotel',
      'tourism',
    ],
    streams: [
      'commerce', 'humanities', 'science pcm', 'science pcb',
    ],
    subjects: [
      'business studies', 'english', 'home science',
    ],
    entranceExams: [
      'nchm jee', 'hotel management entrance',
    ],
    targetCourses: [
      'hotel management', 'hospitality', 'bsc hospitality',
    ],
    careerFamilies: [
      'hospitality', 'tourism', 'service management',
    ],
    interestClusters: [
      'hospitality', 'people', 'management', 'service',
    ],
  },

  defence: {
    keywords: [
      'defence', 'defense', 'technical-service',
      'technical service', 'military',
    ],
    streams: [
      'science pcm', 'science pcmb', 'humanities',
    ],
    subjects: [
      'physics', 'mathematics', 'physical education',
    ],
    entranceExams: [
      'nda', 'na', '10+2 technical entry',
    ],
    targetCourses: [
      'defence', 'military', 'technical entry',
    ],
    careerFamilies: [
      'defence', 'public service', 'technical services',
    ],
    interestClusters: [
      'leadership', 'discipline', 'physical', 'public service',
    ],
  },

  maritime: {
    keywords: [
      'maritime', 'merchant-navy', 'merchant navy',
      'marine study', 'marine',
    ],
    streams: [
      'science pcm', 'science pcmb',
    ],
    subjects: [
      'physics', 'mathematics', 'chemistry',
    ],
    entranceExams: [
      'imu cet',
    ],
    targetCourses: [
      'marine engineering', 'nautical science', 'maritime',
    ],
    careerFamilies: [
      'maritime', 'marine', 'transport',
    ],
    interestClusters: [
      'technical', 'outdoor', 'practical', 'engineering',
    ],
  },

  teaching_education: {
    keywords: [
      'teacher-education', 'teacher education',
      'teaching', 'education programme',
    ],
    streams: [
      'humanities', 'arts', 'science pcm',
      'science pcb', 'commerce',
    ],
    subjects: [
      'psychology', 'english', 'history',
      'mathematics', 'science',
    ],
    entranceExams: [
      'cuet ug', 'ncte entrance',
    ],
    targetCourses: [
      'integrated teacher education', 'b.ed', 'education',
    ],
    careerFamilies: [
      'education', 'teaching', 'academia',
    ],
    interestClusters: [
      'helping', 'communication', 'education',
    ],
  },

  media_communication: {
    keywords: [
      'media', 'journalism', 'mass communication',
      'presentation', 'video', 'communication',
    ],
    streams: [
      'humanities', 'arts', 'commerce', 'science pcm', 'science pcb',
    ],
    subjects: [
      'mass media', 'english', 'political science',
      'sociology', 'psychology',
    ],
    entranceExams: [
      'journalism entrance', 'cuet ug',
    ],
    targetCourses: [
      'journalism', 'mass communication', 'media studies',
    ],
    careerFamilies: [
      'media', 'communication', 'journalism',
    ],
    interestClusters: [
      'communication', 'verbal', 'creative',
    ],
  },
});


const GENERAL_TRAIT_MAP = Object.freeze({
  analytical: {
    skills: ['analytical reasoning', 'problem-solving'],
    interestClusters: ['analytical', 'problem-solving'],
  },
  quantitative: {
    skills: ['quantitative reasoning', 'numerical analysis'],
    interestClusters: ['quantitative', 'mathematics'],
  },
  verbal: {
    skills: ['communication', 'verbal reasoning'],
    interestClusters: ['communication', 'verbal'],
  },
  creativity: {
    skills: ['creative thinking', 'ideation'],
    interestClusters: ['creativity', 'design'],
  },
  hands_on: {
    skills: ['practical problem-solving', 'making'],
    interestClusters: ['hands-on', 'practical'],
  },
  scientific_curiosity: {
    skills: ['scientific reasoning', 'investigation'],
    interestClusters: ['science', 'research'],
  },
  leadership: {
    skills: ['leadership', 'coordination'],
    interestClusters: ['leadership', 'management'],
  },
  collaboration: {
    skills: ['teamwork', 'collaboration'],
    interestClusters: ['teamwork', 'people'],
  },
  entrepreneurship: {
    skills: ['initiative', 'opportunity recognition'],
    interestClusters: ['business', 'entrepreneurship'],
  },
  social_helping: {
    skills: ['empathy', 'helping'],
    interestClusters: ['helping', 'social impact'],
  },
  adaptability: {
    skills: ['adaptability', 'learning agility'],
    interestClusters: ['adaptability'],
  },
  achievement: {
    skills: ['goal orientation', 'persistence'],
    interestClusters: ['achievement'],
  },
  independence: {
    skills: ['self-management', 'independence'],
    interestClusters: ['independence'],
  },
  structure: {
    skills: ['planning', 'organization'],
    interestClusters: ['structure'],
  },
  stability: {
    skills: ['risk awareness'],
    interestClusters: ['stability'],
  },
});


function normalize(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[_/]+/g, ' ')
    .replace(/\s+/g, ' ');
}


function unique(values = []) {
  return [
    ...new Set(
      values
        .filter(Boolean)
        .map(normalize)
        .filter(Boolean)
    ),
  ];
}


function mergedQuestionText(question = {}) {
  return [
    question.text,
    question.trait,
    question.section,
    ...(question.streams || []),
    ...(question.subjects || []),
    ...(question.entranceExams || question.entrance_exams || []),
    ...(question.targetCourses || question.target_courses || []),
    ...(question.interestClusters || question.interest_clusters || []),
    ...(question.careerFamilies || question.career_families || []),
    ...(question.goals || []),
    ...(question.skills || []),
    ...(question.degrees || []),
    ...(question.branches || []),
    ...(question.tags || []),
  ]
    .map(normalize)
    .join(' ');
}


function scoreDomain(rule, haystack) {
  let score = 0;

  for (const keyword of rule.keywords || []) {
    const token = normalize(keyword);

    if (
      token &&
      haystack.includes(token)
    ) {
      score += token.length >= 12
        ? 4
        : token.length >= 7
          ? 3
          : 2;
    }
  }

  return score;
}


export function inferQuestionDomains(
  question = {}
) {
  const haystack =
    mergedQuestionText(
      question
    );

  const scored =
    Object.entries(
      DOMAIN_RULES
    )
      .map(
        ([domain, rule]) => ({
          domain,
          score:
            scoreDomain(
              rule,
              haystack
            ),
        })
      )
      .filter(
        item =>
          item.score > 0
      )
      .sort(
        (a, b) =>
          b.score - a.score
      );


  if (!scored.length) {
    return [
      'general',
    ];
  }


  const best =
    scored[0].score;


  return scored
    .filter(
      item =>
        item.score >=
        Math.max(
          2,
          best - 2
        )
    )
    .slice(
      0,
      3
    )
    .map(
      item =>
        item.domain
    );
}


function mergeFromDomains(
  domains,
  key
) {
  return unique(
    domains.flatMap(
      domain =>
        DOMAIN_RULES[domain]?.[key] ||
        []
    )
  );
}


function classKey(
  question = {}
) {
  const classes =
    unique(
      question.classes ||
      []
    );

  if (classes.length) {
    return classes;
  }

  if (
    question.stage ===
    'class10'
  ) {
    return [
      'class-10',
    ];
  }

  return [];
}


export function buildQuestionProfileMap(
  question = {}
) {
  const domains =
    inferQuestionDomains(
      question
    );

  const trait =
    normalize(
      question.trait
    );

  const traitMap =
    GENERAL_TRAIT_MAP[
      trait
    ] || {};


  const existing = {
    streams:
      question.streams || [],

    subjects:
      question.subjects || [],

    entranceExams:
      question.entranceExams ||
      question.entrance_exams ||
      [],

    targetCourses:
      question.targetCourses ||
      question.target_courses ||
      [],

    careerFamilies:
      question.careerFamilies ||
      question.career_families ||
      [],

    interestClusters:
      question.interestClusters ||
      question.interest_clusters ||
      [],

    goals:
      question.goals || [],

    skills:
      question.skills || [],

    degrees:
      question.degrees || [],

    branches:
      question.branches || [],

    boards:
      question.boards || [],
  };


  return {
    questionId:
      question.id,

    stage:
      question.stage,

    classes:
      classKey(
        question
      ),

    trait,

    section:
      normalize(
        question.section
      ),

    domains,

    boards:
      unique(
        existing.boards
      ),

    streams:
      unique([
        ...existing.streams,
        ...mergeFromDomains(
          domains,
          'streams'
        ),
      ]),

    subjects:
      unique([
        ...existing.subjects,
        ...mergeFromDomains(
          domains,
          'subjects'
        ),
      ]),

    entranceExams:
      unique([
        ...existing.entranceExams,
        ...mergeFromDomains(
          domains,
          'entranceExams'
        ),
      ]),

    targetCourses:
      unique([
        ...existing.targetCourses,
        ...mergeFromDomains(
          domains,
          'targetCourses'
        ),
      ]),

    careerFamilies:
      unique([
        ...existing.careerFamilies,
        ...mergeFromDomains(
          domains,
          'careerFamilies'
        ),
      ]),

    interestClusters:
      unique([
        ...existing.interestClusters,
        ...(traitMap.interestClusters || []),
        ...mergeFromDomains(
          domains,
          'interestClusters'
        ),
      ]),

    goals:
      unique(
        existing.goals
      ),

    skills:
      unique([
        ...existing.skills,
        ...(traitMap.skills || []),
      ]),

    degrees:
      unique(
        existing.degrees
      ),

    branches:
      unique(
        existing.branches
      ),
  };
}


function pairKeys(
  prefixA,
  valuesA,
  prefixB,
  valuesB,
  maxPerSide = 4
) {
  const left =
    valuesA.slice(
      0,
      maxPerSide
    );

  const right =
    valuesB.slice(
      0,
      maxPerSide
    );

  const out = [];

  for (const a of left) {
    for (const b of right) {
      out.push(
        `${prefixA}:${a}|${prefixB}:${b}`
      );
    }
  }

  return out;
}


export function buildMeaningfulCombinationKeys(
  profileMap
) {
  const keys = [];


  for (
    const domain of
    profileMap.domains
  ) {
    keys.push(
      `domain:${domain}`
    );
  }


  for (
    const stream of
    profileMap.streams.slice(
      0,
      6
    )
  ) {
    keys.push(
      `stream:${stream}`
    );
  }


  for (
    const exam of
    profileMap.entranceExams.slice(
      0,
      8
    )
  ) {
    keys.push(
      `exam:${exam}`
    );
  }


  keys.push(
    ...pairKeys(
      'stream',
      profileMap.streams,
      'subject',
      profileMap.subjects
    )
  );


  keys.push(
    ...pairKeys(
      'stream',
      profileMap.streams,
      'exam',
      profileMap.entranceExams
    )
  );


  keys.push(
    ...pairKeys(
      'exam',
      profileMap.entranceExams,
      'course',
      profileMap.targetCourses
    )
  );


  keys.push(
    ...pairKeys(
      'domain',
      profileMap.domains,
      'trait',
      profileMap.trait
        ? [profileMap.trait]
        : []
    )
  );


  return unique(
    keys
  ).slice(
    0,
    120
  );
}


export {
  DOMAIN_RULES,
};
