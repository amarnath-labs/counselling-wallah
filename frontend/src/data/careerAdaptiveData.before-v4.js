/*
|--------------------------------------------------------------------------
| TruMarg Career Discovery V3
|--------------------------------------------------------------------------
|
| Adaptive India-focused career guidance data.
|
| IMPORTANT:
| This is career-guidance data.
| It must not be presented as a clinical or validated psychometric diagnosis.
|
*/


/*
|--------------------------------------------------------------------------
| LIKERT SCALE
|--------------------------------------------------------------------------
*/

export const SCORE_OPTIONS = [
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


/*
|--------------------------------------------------------------------------
| CURRENT CLASS / STAGE
|--------------------------------------------------------------------------
*/

export const CLASS_OPTIONS = [
  {
    value: 'class-8',
    label: 'Class 8',
    stage: 'foundation',
  },
  {
    value: 'class-9',
    label: 'Class 9',
    stage: 'foundation',
  },
  {
    value: 'class-10',
    label: 'Class 10',
    stage: 'class10',
  },
  {
    value: 'class-11',
    label: 'Class 11',
    stage: 'senior-secondary',
  },
  {
    value: 'class-12',
    label: 'Class 12',
    stage: 'senior-secondary',
  },
  {
    value: 'college',
    label: 'College',
    stage: 'college',
  },
  {
    value: 'graduate',
    label: 'Graduate',
    stage: 'graduate',
  },
];


/*
|--------------------------------------------------------------------------
| BOARD OPTIONS
|--------------------------------------------------------------------------
*/

export const BOARD_OPTIONS = [
  'CBSE',
  'CISCE - ICSE / ISC',
  'State Board',
  'NIOS',
  'IB',
  'Cambridge / IGCSE',
  'Other',
];


/*
|--------------------------------------------------------------------------
| SCHOOL STREAM OPTIONS
|--------------------------------------------------------------------------
*/

export const STREAM_OPTIONS = {
  foundation: [
    'Not decided yet',
    'Interested in Science',
    'Interested in Commerce',
    'Interested in Humanities / Social Sciences',
    'Interested in Arts / Design',
    'Interested in Sports',
    'Interested in Vocational / Practical learning',
    'Not sure',
  ],

  class10: [
    'Not decided yet',
    'Science - PCM',
    'Science - PCB',
    'Science - PCMB',
    'Commerce with Mathematics',
    'Commerce without Mathematics',
    'Humanities / Arts',
    'Fine Arts / Visual Arts',
    'Performing Arts',
    'Computer / IT focused',
    'Agriculture',
    'Home Science',
    'Sports / Physical Education',
    'Vocational / Skill-based',
    'Hotel / Tourism interest',
    'Not sure',
    'Other',
  ],

  'senior-secondary': [
    'Science - PCM',
    'Science - PCB',
    'Science - PCMB',
    'Science - PCM + Computer Science',
    'Science - PCB + Psychology',
    'Commerce with Mathematics',
    'Commerce without Mathematics',
    'Humanities / Arts',
    'Humanities with Mathematics',
    'Fine Arts / Visual Arts',
    'Performing Arts',
    'Agriculture',
    'Home Science',
    'Vocational / Skill-based',
    'Sports / Physical Education',
    'Other',
  ],
};


/*
|--------------------------------------------------------------------------
| SCHOOL SUBJECTS
|--------------------------------------------------------------------------
*/

export const SCHOOL_SUBJECT_OPTIONS = [
  'Mathematics',
  'Applied Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Biotechnology',
  'Computer Science',
  'Information Technology',
  'Artificial Intelligence',
  'English',
  'Hindi',
  'Economics',
  'Accountancy',
  'Business Studies',
  'Entrepreneurship',
  'Political Science',
  'History',
  'Geography',
  'Psychology',
  'Sociology',
  'Legal Studies',
  'Fine Arts',
  'Graphic Design',
  'Music',
  'Dance',
  'Theatre / Drama',
  'Mass Media',
  'Home Science',
  'Agriculture',
  'Physical Education',
  'Engineering Graphics',
  'Vocational / Skill Subject',
];


/*
|--------------------------------------------------------------------------
| COLLEGE DEGREE OPTIONS
|--------------------------------------------------------------------------
*/

export const DEGREE_OPTIONS = [
  'B.Tech / B.E.',
  'B.Arch',
  'B.Plan',
  'B.Des',
  'BFA',
  'BVA',
  'BA',
  'BA (Hons)',
  'B.Sc',
  'B.Sc (Hons)',
  'BCA',
  'B.Com',
  'B.Com (Hons)',
  'BBA',
  'BBM',
  'BMS',
  'Integrated BBA-MBA',
  'MBBS',
  'BDS',
  'BAMS',
  'BHMS',
  'BUMS',
  'BSMS',
  'B.Pharm',
  'Pharm.D',
  'B.Sc Nursing',
  'BPT',
  'BOT',
  'BASLP',
  'Allied Health / Paramedical',
  'BVSc & AH',
  'B.Sc Agriculture',
  'B.Sc Horticulture',
  'B.Sc Forestry',
  'B.F.Sc',
  'LLB',
  'BA LLB',
  'BBA LLB',
  'B.Com LLB',
  'B.Sc LLB',
  'BJMC / BA Journalism',
  'Film / Television Degree',
  'Acting / Theatre Degree',
  'Music Degree',
  'Dance Degree',
  'Animation / VFX Degree',
  'Fashion Design',
  'Interior Design',
  'Hotel Management / BHM',
  'Hospitality Administration',
  'Travel & Tourism',
  'Culinary Arts',
  'Aviation / Airport Management',
  'Merchant Navy / Nautical Science',
  'Marine Engineering',
  'Sports Science',
  'Physical Education',
  'Education / Teaching',
  'Integrated Teacher Education',
  'Diploma',
  'ITI',
  'Polytechnic',
  'CA',
  'CS',
  'CMA',
  'Other',
];


export const COLLEGE_YEAR_OPTIONS = [
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year',
  '5th Year',
  'Final Year',
  'Internship / Training Year',
];


export const EXPERIENCE_OPTIONS = [
  'Fresher',
  'Less than 1 year',
  '1 - 2 years',
  '2 - 3 years',
  '3 - 5 years',
  '5+ years',
];


export const CURRENT_STATUS_OPTIONS = [
  'Final-year student',
  'Job seeking',
  'Working',
  'Self-employed',
  'Freelancing',
  'Preparing for higher studies',
  'Preparing for government exams',
  'Preparing for professional qualification',
  'Career break',
  'Not sure what to do next',
];


export const CAREER_GOAL_OPTIONS = [
  'Explore career options',
  'Choose a stream',
  'Choose a course',
  'Prepare for entrance exams',
  'Find an internship',
  'Prepare for placements',
  'Get first job',
  'Get a better job',
  'Switch career',
  'Government job',
  'Defence career',
  'Start a business',
  'Freelance career',
  'Higher studies in India',
  'Study abroad',
  'MBA',
  'M.Tech / M.E.',
  'MS / MSc',
  'Law',
  'Research / PhD',
  'Creative / Acting career',
  'Not sure yet',
];


/*
|--------------------------------------------------------------------------
| SKILLS
|--------------------------------------------------------------------------
*/

export const SKILL_OPTIONS = [
  'Programming',
  'Data Analysis',
  'AI / Machine Learning',
  'Web Development',
  'App Development',
  'Electronics',
  'CAD / Engineering Design',
  'Research',
  'Laboratory Work',
  'Mathematics',
  'Writing',
  'Public Speaking',
  'Communication',
  'Sales',
  'Marketing',
  'Finance',
  'Accounting',
  'Leadership',
  'Teamwork',
  'Teaching',
  'Counselling / Helping',
  'Graphic Design',
  'UI / UX Design',
  'Drawing / Illustration',
  'Photography',
  'Video Editing',
  'Animation / VFX',
  'Acting',
  'Theatre',
  'Music',
  'Dance',
  'Sports',
  'Cooking / Culinary',
  'Hospitality',
  'Travel Planning',
  'Mechanical / Hands-on Work',
  'Agriculture',
  'Content Creation',
  'Social Media',
];


/*
|--------------------------------------------------------------------------
| EXAM CATALOG
|--------------------------------------------------------------------------
|
| This is intentionally broad and extensible.
| Some universities/states may use their own admission process.
|
*/

export const INDIA_EXAM_CATALOG = [

  /*
  | Engineering / Technology
  */

  {
    id: 'jee-main',
    name: 'JEE Main',
    category: 'engineering',
    stages: [
      'senior-secondary',
    ],
  },
  {
    id: 'jee-advanced',
    name: 'JEE Advanced',
    category: 'engineering',
    stages: [
      'senior-secondary',
    ],
  },
  {
    id: 'bitsat',
    name: 'BITSAT',
    category: 'engineering',
    stages: [
      'senior-secondary',
    ],
  },
  {
    id: 'viteee',
    name: 'VITEEE',
    category: 'engineering',
    stages: [
      'senior-secondary',
    ],
  },
  {
    id: 'srmjeee',
    name: 'SRMJEEE',
    category: 'engineering',
    stages: [
      'senior-secondary',
    ],
  },
  {
    id: 'met',
    name: 'Manipal Entrance Test (MET)',
    category: 'engineering',
    stages: [
      'senior-secondary',
    ],
  },
  {
    id: 'comedk',
    name: 'COMEDK UGET',
    category: 'engineering',
    stages: [
      'senior-secondary',
    ],
  },
  {
    id: 'mht-cet',
    name: 'MHT-CET',
    category: 'engineering',
    stages: [
      'senior-secondary',
    ],
  },
  {
    id: 'wbjee',
    name: 'WBJEE',
    category: 'engineering',
    stages: [
      'senior-secondary',
    ],
  },
  {
    id: 'kcet',
    name: 'KCET',
    category: 'engineering',
    stages: [
      'senior-secondary',
    ],
  },
  {
    id: 'keam',
    name: 'KEAM',
    category: 'engineering',
    stages: [
      'senior-secondary',
    ],
  },
  {
    id: 'gujcet',
    name: 'GUJCET',
    category: 'engineering',
    stages: [
      'senior-secondary',
    ],
  },
  {
    id: 'ap-eapcet',
    name: 'AP EAPCET',
    category: 'engineering',
    stages: [
      'senior-secondary',
    ],
  },
  {
    id: 'tg-eapcet',
    name: 'TG EAPCET',
    category: 'engineering',
    stages: [
      'senior-secondary',
    ],
  },


  /*
  | Medicine / Healthcare
  */

  {
    id: 'neet-ug',
    name: 'NEET UG',
    category: 'medical',
    stages: [
      'senior-secondary',
    ],
  },

  {
    id: 'aiims-nursing',
    name: 'AIIMS Nursing Admission / Entrance Route',
    category: 'nursing',
    stages: [
      'senior-secondary',
    ],
  },

  {
    id: 'paramedical-state',
    name: 'State / University Paramedical Admissions',
    category: 'allied-health',
    stages: [
      'senior-secondary',
    ],
  },


  /*
  | Science / Research
  */

  {
    id: 'cuet-ug',
    name: 'CUET UG',
    category: 'university',
    stages: [
      'senior-secondary',
    ],
  },
  {
    id: 'iiser-iat',
    name: 'IISER Aptitude Test (IAT)',
    category: 'science-research',
    stages: [
      'senior-secondary',
    ],
  },
  {
    id: 'nest',
    name: 'NEST',
    category: 'science-research',
    stages: [
      'senior-secondary',
    ],
  },


  /*
  | Architecture / Planning
  */

  {
    id: 'nata',
    name: 'NATA',
    category: 'architecture',
    stages: [
      'senior-secondary',
    ],
  },
  {
    id: 'jee-paper-2',
    name: 'JEE Main Paper 2 - B.Arch / B.Plan',
    category: 'architecture',
    stages: [
      'senior-secondary',
    ],
  },


  /*
  | Design / Fashion / Fine Arts
  */

  {
    id: 'uceed',
    name: 'UCEED',
    category: 'design',
    stages: [
      'senior-secondary',
    ],
  },
  {
    id: 'nid-dat',
    name: 'NID DAT',
    category: 'design',
    stages: [
      'senior-secondary',
    ],
  },
  {
    id: 'nift',
    name: 'NIFT Entrance Examination',
    category: 'fashion',
    stages: [
      'senior-secondary',
    ],
  },
  {
    id: 'design-private',
    name: 'University-specific Design Entrance / Portfolio',
    category: 'design',
    stages: [
      'senior-secondary',
    ],
  },
  {
    id: 'fine-arts',
    name: 'Fine Arts Aptitude / Portfolio / University Admission',
    category: 'fine-arts',
    stages: [
      'senior-secondary',
    ],
  },


  /*
  | Law
  */

  {
    id: 'clat',
    name: 'CLAT',
    category: 'law',
    stages: [
      'senior-secondary',
      'graduate',
    ],
  },
  {
    id: 'ailet',
    name: 'AILET',
    category: 'law',
    stages: [
      'senior-secondary',
    ],
  },
  {
    id: 'slat',
    name: 'SLAT',
    category: 'law',
    stages: [
      'senior-secondary',
    ],
  },
  {
    id: 'mh-cet-law',
    name: 'MH CET Law',
    category: 'law',
    stages: [
      'senior-secondary',
      'graduate',
    ],
  },


  /*
  | Management / Commerce
  */

  {
    id: 'ipmat',
    name: 'IPMAT',
    category: 'management',
    stages: [
      'senior-secondary',
    ],
  },
  {
    id: 'jipmat',
    name: 'JIPMAT',
    category: 'management',
    stages: [
      'senior-secondary',
    ],
  },
  {
    id: 'npats',
    name: 'NPAT',
    category: 'management',
    stages: [
      'senior-secondary',
    ],
  },
  {
    id: 'set',
    name: 'SET - Symbiosis Entrance Test',
    category: 'management',
    stages: [
      'senior-secondary',
    ],
  },


  /*
  | Hotel Management / Hospitality
  */

  {
    id: 'nchm-jee',
    name: 'NCHM JEE',
    category: 'hospitality',
    stages: [
      'senior-secondary',
    ],
  },
  {
    id: 'hotel-university',
    name: 'University / Institute Hotel Management Entrance',
    category: 'hospitality',
    stages: [
      'senior-secondary',
    ],
  },


  /*
  | Media / Journalism
  */

  {
    id: 'media-cuet',
    name: 'CUET UG - Journalism / Media Programs',
    category: 'media',
    stages: [
      'senior-secondary',
    ],
  },
  {
    id: 'media-university',
    name: 'University-specific Media / Journalism Entrance',
    category: 'media',
    stages: [
      'senior-secondary',
    ],
  },


  /*
  | Acting / Theatre / Film / Performing Arts
  */

  {
    id: 'acting-audition',
    name: 'Acting / Theatre Institute Audition & Aptitude Route',
    category: 'acting',
    stages: [
      'senior-secondary',
      'college',
      'graduate',
    ],
  },
  {
    id: 'performing-arts',
    name: 'University Performing Arts Entrance / Audition',
    category: 'performing-arts',
    stages: [
      'senior-secondary',
      'college',
    ],
  },
  {
    id: 'nsd-route',
    name: 'National School of Drama Admission Route',
    category: 'acting',
    stages: [
      'college',
      'graduate',
    ],
  },
  {
    id: 'film-institute',
    name: 'Film / Television Institute Admission Route',
    category: 'film',
    stages: [
      'college',
      'graduate',
    ],
  },


  /*
  | Agriculture
  */

  {
    id: 'agriculture-cuet',
    name: 'CUET UG / Agriculture University Admission Route',
    category: 'agriculture',
    stages: [
      'senior-secondary',
    ],
  },
  {
    id: 'state-agriculture',
    name: 'State Agriculture University Entrance / Counselling',
    category: 'agriculture',
    stages: [
      'senior-secondary',
    ],
  },


  /*
  | Defence
  */

  {
    id: 'nda',
    name: 'NDA & NA Examination',
    category: 'defence',
    stages: [
      'senior-secondary',
    ],
  },
  {
    id: 'tes',
    name: '10+2 Technical Entry Scheme - Eligibility Route',
    category: 'defence',
    stages: [
      'senior-secondary',
    ],
  },
  {
    id: 'cds',
    name: 'Combined Defence Services Examination',
    category: 'defence',
    stages: [
      'college',
      'graduate',
    ],
  },
  {
    id: 'afcat',
    name: 'AFCAT',
    category: 'defence',
    stages: [
      'college',
      'graduate',
    ],
  },


  /*
  | Maritime / Merchant Navy
  */

  {
    id: 'imu-cet',
    name: 'IMU CET',
    category: 'maritime',
    stages: [
      'senior-secondary',
    ],
  },
  {
    id: 'merchant-sponsorship',
    name: 'Merchant Navy Company Sponsorship / Selection Tests',
    category: 'maritime',
    stages: [
      'senior-secondary',
    ],
  },


  /*
  | Professional qualifications
  */

  {
    id: 'ca-foundation',
    name: 'CA Foundation',
    category: 'accounting',
    stages: [
      'senior-secondary',
      'college',
    ],
  },
  {
    id: 'cseet',
    name: 'CSEET - Company Secretary',
    category: 'company-secretary',
    stages: [
      'senior-secondary',
      'college',
    ],
  },
  {
    id: 'cma-foundation',
    name: 'CMA Foundation',
    category: 'accounting',
    stages: [
      'senior-secondary',
      'college',
    ],
  },


  /*
  | Teaching
  */

  {
    id: 'ncet',
    name: 'NCET - Integrated Teacher Education Programme',
    category: 'teaching',
    stages: [
      'senior-secondary',
    ],
  },


  /*
  | Higher education
  */

  {
    id: 'gate',
    name: 'GATE',
    category: 'higher-engineering',
    stages: [
      'college',
      'graduate',
    ],
  },
  {
    id: 'cat',
    name: 'CAT',
    category: 'mba',
    stages: [
      'college',
      'graduate',
    ],
  },
  {
    id: 'xat',
    name: 'XAT',
    category: 'mba',
    stages: [
      'college',
      'graduate',
    ],
  },
  {
    id: 'nmat',
    name: 'NMAT',
    category: 'mba',
    stages: [
      'college',
      'graduate',
    ],
  },
  {
    id: 'snap',
    name: 'SNAP',
    category: 'mba',
    stages: [
      'college',
      'graduate',
    ],
  },
  {
    id: 'cmat',
    name: 'CMAT',
    category: 'mba',
    stages: [
      'college',
      'graduate',
    ],
  },
  {
    id: 'cuet-pg',
    name: 'CUET PG',
    category: 'postgraduate',
    stages: [
      'college',
      'graduate',
    ],
  },
  {
    id: 'iit-jam',
    name: 'IIT JAM',
    category: 'postgraduate-science',
    stages: [
      'college',
      'graduate',
    ],
  },
  {
    id: 'gre',
    name: 'GRE',
    category: 'study-abroad',
    stages: [
      'college',
      'graduate',
    ],
  },
  {
    id: 'gmat',
    name: 'GMAT',
    category: 'study-abroad',
    stages: [
      'college',
      'graduate',
    ],
  },
  {
    id: 'ielts',
    name: 'IELTS',
    category: 'study-abroad',
    stages: [
      'college',
      'graduate',
    ],
  },
  {
    id: 'toefl',
    name: 'TOEFL',
    category: 'study-abroad',
    stages: [
      'college',
      'graduate',
    ],
  },


  /*
  | Government careers
  */

  {
    id: 'upsc-cse',
    name: 'UPSC Civil Services Examination',
    category: 'government',
    stages: [
      'college',
      'graduate',
    ],
  },
  {
    id: 'ssc-cgl',
    name: 'SSC CGL',
    category: 'government',
    stages: [
      'graduate',
    ],
  },
  {
    id: 'banking',
    name: 'Banking Exams - IBPS / SBI etc.',
    category: 'government',
    stages: [
      'graduate',
    ],
  },
  {
    id: 'state-psc',
    name: 'State Public Service Commission Exams',
    category: 'government',
    stages: [
      'graduate',
    ],
  },
];


/*
|--------------------------------------------------------------------------
| TRAIT LABELS
|--------------------------------------------------------------------------
*/

export const TRAIT_LABELS = {
  technology: 'Technology',
  science: 'Scientific curiosity',
  healthcare: 'Healthcare',
  business: 'Business',
  creative: 'Creativity',
  helping: 'Helping people',
  law: 'Law & governance',
  research: 'Research',
  communication: 'Communication',
  practical: 'Hands-on work',
  hospitality: 'Hospitality',
  performance: 'Performance & acting',
  visualArt: 'Visual arts',
  sports: 'Sports & fitness',
  nature: 'Nature & agriculture',

  logic: 'Logical reasoning',
  numerical: 'Numerical thinking',
  problemSolving: 'Problem solving',
  leadership: 'Leadership',
  empathy: 'Empathy',
  observation: 'Observation',
  discipline: 'Discipline',
  adaptability: 'Adaptability',

  mathematics: 'Mathematics',
  biology: 'Biology',
  language: 'Languages',
  socialScience: 'Social sciences',
  computer: 'Computer science',

  systems: 'Systems-oriented work',
  people: 'People-oriented work',
  structured: 'Structured work',
  flexible: 'Flexible work',
  teamwork: 'Teamwork',
  independent: 'Independent work',
  dynamic: 'Dynamic environments',
  field: 'Field / practical environments',

  income: 'Income potential',
  stability: 'Career stability',
  socialImpact: 'Social impact',
  creativityValue: 'Creative freedom',
  workLifeBalance: 'Work-life balance',
  innovation: 'Innovation',
  entrepreneurship: 'Entrepreneurship',
};


/*
|--------------------------------------------------------------------------
| COMMON CORE QUESTIONS
|--------------------------------------------------------------------------
*/

export const COMMON_QUESTIONS = [
  {
    id: 'common_technology',
    section: 'interest',
    trait: 'technology',
    text:
      'I enjoy understanding how technology, apps, computers, machines or digital systems work.',
  },
  {
    id: 'common_science',
    section: 'interest',
    trait: 'science',
    text:
      'I enjoy finding scientific explanations for how things work.',
  },
  {
    id: 'common_health',
    section: 'interest',
    trait: 'healthcare',
    text:
      'Health, the human body, medicine or patient care interests me.',
  },
  {
    id: 'common_business',
    section: 'interest',
    trait: 'business',
    text:
      'I am interested in business, money, products, markets or how organisations grow.',
  },
  {
    id: 'common_creative',
    section: 'interest',
    trait: 'creative',
    text:
      'I enjoy creating original ideas, designs, stories, visuals or experiences.',
  },
  {
    id: 'common_helping',
    section: 'interest',
    trait: 'helping',
    text:
      'I like understanding people and helping them solve problems.',
  },
  {
    id: 'common_performance',
    section: 'interest',
    trait: 'performance',
    text:
      'Acting, performing, presenting, music, dance or being on stage excites me.',
  },
  {
    id: 'common_hospitality',
    section: 'interest',
    trait: 'hospitality',
    text:
      'I enjoy hosting people, organising experiences, food, travel or hospitality-related activities.',
  },
  {
    id: 'common_practical',
    section: 'interest',
    trait: 'practical',
    text:
      'I enjoy making, repairing, operating or working with real objects and equipment.',
  },
  {
    id: 'common_law',
    section: 'interest',
    trait: 'law',
    text:
      'Debates, rules, rights, public issues or legal questions interest me.',
  },

  {
    id: 'common_logic',
    section: 'strength',
    trait: 'logic',
    text:
      'I am comfortable identifying patterns and reasoning through difficult problems.',
  },
  {
    id: 'common_problem',
    section: 'strength',
    trait: 'problemSolving',
    text:
      'When something goes wrong, I usually enjoy finding a workable solution.',
  },
  {
    id: 'common_communication',
    section: 'strength',
    trait: 'communication',
    text:
      'I can usually explain my ideas clearly to other people.',
  },
  {
    id: 'common_leadership',
    section: 'strength',
    trait: 'leadership',
    text:
      'I am comfortable taking responsibility and coordinating people when needed.',
  },
  {
    id: 'common_empathy',
    section: 'strength',
    trait: 'empathy',
    text:
      'I understand other people’s feelings and perspectives relatively easily.',
  },

  {
    id: 'common_people',
    section: 'work',
    trait: 'people',
    text:
      'I would enjoy work involving frequent interaction with people.',
  },
  {
    id: 'common_systems',
    section: 'work',
    trait: 'systems',
    text:
      'I would enjoy working with data, systems, technology or structured processes.',
  },
  {
    id: 'common_dynamic',
    section: 'work',
    trait: 'dynamic',
    text:
      'I prefer work where situations and challenges change regularly.',
  },
  {
    id: 'common_independent',
    section: 'work',
    trait: 'independent',
    text:
      'I am comfortable working independently for long periods when required.',
  },

  {
    id: 'common_stability',
    section: 'values',
    trait: 'stability',
    text:
      'Long-term career stability is very important to me.',
  },
  {
    id: 'common_income',
    section: 'values',
    trait: 'income',
    text:
      'High earning potential is an important factor in my career choice.',
  },
  {
    id: 'common_impact',
    section: 'values',
    trait: 'socialImpact',
    text:
      'I want my work to create a meaningful positive impact on people or society.',
  },
  {
    id: 'common_innovation',
    section: 'values',
    trait: 'innovation',
    text:
      'I want a career where I can experiment, innovate or create new things.',
  },
  {
    id: 'common_entrepreneur',
    section: 'values',
    trait: 'entrepreneurship',
    text:
      'Building something of my own or becoming an entrepreneur interests me.',
  },
];


/*
|--------------------------------------------------------------------------
| FOUNDATION QUESTIONS - CLASS 8 / 9
|--------------------------------------------------------------------------
*/

export const FOUNDATION_QUESTIONS = [
  {
    id: 'foundation_curiosity',
    section: 'interest',
    trait: 'research',
    text:
      'When I become curious about something, I like searching for more information about it.',
  },
  {
    id: 'foundation_math',
    section: 'academic',
    trait: 'mathematics',
    text:
      'I enjoy mathematics when I understand the idea behind the problem.',
  },
  {
    id: 'foundation_computer',
    section: 'academic',
    trait: 'computer',
    text:
      'I enjoy using computers or learning how digital tools work.',
  },
  {
    id: 'foundation_biology',
    section: 'academic',
    trait: 'biology',
    text:
      'Animals, plants, the environment or the human body are interesting to me.',
  },
  {
    id: 'foundation_language',
    section: 'academic',
    trait: 'language',
    text:
      'I enjoy reading, writing, speaking, storytelling or learning languages.',
  },
  {
    id: 'foundation_art',
    section: 'interest',
    trait: 'visualArt',
    text:
      'Drawing, craft, photography, animation or visual design naturally attracts me.',
  },
  {
    id: 'foundation_sport',
    section: 'interest',
    trait: 'sports',
    text:
      'Sports, fitness or physical activities are an important part of what I enjoy.',
  },
  {
    id: 'foundation_nature',
    section: 'interest',
    trait: 'nature',
    text:
      'Nature, farming, animals, environment or outdoor activities interest me.',
  },
];


/*
|--------------------------------------------------------------------------
| CLASS 10 QUESTIONS
|--------------------------------------------------------------------------
*/

export const CLASS10_QUESTIONS = [
  {
    id: 'class10_math',
    section: 'academic',
    trait: 'mathematics',
    text:
      'I can imagine studying Mathematics at a deeper level in Classes 11 and 12.',
  },
  {
    id: 'class10_biology',
    section: 'academic',
    trait: 'biology',
    text:
      'I can imagine studying Biology in detail for the next two years.',
  },
  {
    id: 'class10_computer',
    section: 'academic',
    trait: 'computer',
    text:
      'Programming, computers or technology are subjects I would like to explore more deeply.',
  },
  {
    id: 'class10_social',
    section: 'academic',
    trait: 'socialScience',
    text:
      'History, politics, society, geography or human behaviour genuinely interest me.',
  },
  {
    id: 'class10_language',
    section: 'academic',
    trait: 'language',
    text:
      'I enjoy language-heavy work such as reading, writing, debating or presenting.',
  },
  {
    id: 'class10_visual',
    section: 'interest',
    trait: 'visualArt',
    text:
      'I would seriously consider a creative field such as design, fine arts, animation or architecture.',
  },
  {
    id: 'class10_performance',
    section: 'interest',
    trait: 'performance',
    text:
      'I would seriously consider acting, theatre, music, dance or another performing-art career.',
  },
  {
    id: 'class10_hospitality',
    section: 'interest',
    trait: 'hospitality',
    text:
      'Hotel management, food, tourism, travel or guest experience sounds interesting as a career area.',
  },
  {
    id: 'class10_practical',
    section: 'work',
    trait: 'field',
    text:
      'I would consider skill-based or practical careers rather than choosing a purely academic path.',
  },
  {
    id: 'class10_competition',
    section: 'strength',
    trait: 'discipline',
    text:
      'I am willing to follow a consistent study routine for a competitive entrance examination if my chosen career requires it.',
  },
];


/*
|--------------------------------------------------------------------------
| CLASS 11 / 12 QUESTIONS
|--------------------------------------------------------------------------
*/

export const SENIOR_SECONDARY_QUESTIONS = [
  {
    id: 'senior_numerical',
    section: 'strength',
    trait: 'numerical',
    text:
      'I am comfortable applying numerical concepts to unfamiliar problems rather than only memorising formulas.',
  },
  {
    id: 'senior_research',
    section: 'interest',
    trait: 'research',
    text:
      'I enjoy exploring a topic deeply even when the answer is not immediately obvious.',
  },
  {
    id: 'senior_competition',
    section: 'strength',
    trait: 'discipline',
    text:
      'I can maintain a structured preparation plan for competitive examinations over several months.',
  },
  {
    id: 'senior_field',
    section: 'work',
    trait: 'field',
    text:
      'I am open to careers that involve laboratories, hospitals, sites, travel, fieldwork or physical environments.',
  },
  {
    id: 'senior_creative',
    section: 'interest',
    trait: 'visualArt',
    text:
      'I would consider portfolio-based careers such as design, architecture, animation, fashion or visual arts.',
  },
  {
    id: 'senior_acting',
    section: 'interest',
    trait: 'performance',
    text:
      'I would consider auditions, performances and creative uncertainty if I strongly wanted an acting or performing-arts career.',
  },
  {
    id: 'senior_business',
    section: 'interest',
    trait: 'business',
    text:
      'Management, finance, entrepreneurship or commercial decision-making appeals to me.',
  },
  {
    id: 'senior_service',
    section: 'values',
    trait: 'socialImpact',
    text:
      'I would consider public service, healthcare, teaching, law or government work because of its impact on people.',
  },
];


/*
|--------------------------------------------------------------------------
| COLLEGE QUESTIONS
|--------------------------------------------------------------------------
*/

export const COLLEGE_QUESTIONS = [
  {
    id: 'college_role_clarity',
    section: 'strength',
    trait: 'observation',
    text:
      'I can identify which parts of my degree or current work I genuinely enjoy and which parts I do not.',
  },
  {
    id: 'college_skills',
    section: 'strength',
    trait: 'problemSolving',
    text:
      'I prefer demonstrating skills through real projects, internships or practical work.',
  },
  {
    id: 'college_research',
    section: 'interest',
    trait: 'research',
    text:
      'Research, postgraduate study or specialised technical expertise is something I would consider.',
  },
  {
    id: 'college_business',
    section: 'interest',
    trait: 'business',
    text:
      'I could see myself moving toward management, consulting, product, sales or entrepreneurship.',
  },
  {
    id: 'college_creative',
    section: 'interest',
    trait: 'creative',
    text:
      'I would consider moving toward a creative or communication-heavy career even if it differs from my degree.',
  },
  {
    id: 'college_adapt',
    section: 'strength',
    trait: 'adaptability',
    text:
      'I am willing to learn skills outside my degree when they improve my career opportunities.',
  },
  {
    id: 'college_job',
    section: 'values',
    trait: 'stability',
    text:
      'Getting a stable first job soon after graduation is a major priority for me.',
  },
  {
    id: 'college_independent',
    section: 'work',
    trait: 'independent',
    text:
      'I would consider freelance, startup or independent work if it suited my abilities.',
  },
];


/*
|--------------------------------------------------------------------------
| GRADUATE QUESTIONS
|--------------------------------------------------------------------------
*/

export const GRADUATE_QUESTIONS = [
  {
    id: 'grad_existing',
    section: 'strength',
    trait: 'observation',
    text:
      'I have a clear understanding of the skills I can currently demonstrate to an employer or client.',
  },
  {
    id: 'grad_reskill',
    section: 'strength',
    trait: 'adaptability',
    text:
      'I am willing to reskill substantially if another career direction offers a better fit.',
  },
  {
    id: 'grad_switch',
    section: 'work',
    trait: 'dynamic',
    text:
      'I am comfortable considering career paths outside my original degree or specialization.',
  },
  {
    id: 'grad_management',
    section: 'interest',
    trait: 'leadership',
    text:
      'I want responsibilities involving leadership, management or decision-making.',
  },
  {
    id: 'grad_higher',
    section: 'interest',
    trait: 'research',
    text:
      'Advanced study or specialised higher education could be worthwhile for my long-term goals.',
  },
  {
    id: 'grad_business',
    section: 'interest',
    trait: 'entrepreneurship',
    text:
      'Entrepreneurship, consulting, freelancing or building an independent career interests me.',
  },
  {
    id: 'grad_government',
    section: 'values',
    trait: 'stability',
    text:
      'I would seriously consider competitive government or public-sector career routes.',
  },
  {
    id: 'grad_creative',
    section: 'interest',
    trait: 'creative',
    text:
      'I would consider a creative or media career if my portfolio and ability supported the transition.',
  },
];


/*
|--------------------------------------------------------------------------
| CAREER FAMILIES
|--------------------------------------------------------------------------
*/

export const CAREER_FAMILIES = [
  {
    id: 'computer-ai',
    name: 'Computer Science, Software & AI',
    description:
      'Software engineering, AI, data, cybersecurity, cloud and digital systems.',
    traits: [
      'technology',
      'logic',
      'problemSolving',
      'computer',
      'systems',
      'innovation',
    ],
    streams: [
      'Science - PCM',
      'Science - PCM + Computer Science',
    ],
    courses: [
      'B.Tech Computer Science',
      'B.Tech AI / Data Science',
      'BCA',
      'B.Sc Computer Science',
      'B.Sc Data Science',
    ],
    roles: [
      'Software Engineer',
      'AI / ML Engineer',
      'Data Scientist',
      'Cybersecurity Analyst',
      'Cloud Engineer',
      'Product Engineer',
    ],
    examCategories: [
      'engineering',
      'university',
    ],
  },

  {
    id: 'engineering',
    name: 'Engineering & Core Technology',
    description:
      'Engineering systems, electronics, mechanical, civil, electrical and industrial technology.',
    traits: [
      'technology',
      'logic',
      'numerical',
      'problemSolving',
      'practical',
      'systems',
    ],
    streams: [
      'Science - PCM',
      'Science - PCM + Computer Science',
    ],
    courses: [
      'B.Tech / B.E.',
      'Engineering Diploma',
      'Integrated Engineering Programs',
    ],
    roles: [
      'Engineer',
      'Design Engineer',
      'Systems Engineer',
      'Project Engineer',
      'Operations Engineer',
    ],
    examCategories: [
      'engineering',
    ],
  },

  {
    id: 'medicine',
    name: 'Medicine & Clinical Healthcare',
    description:
      'Medicine, dentistry, AYUSH and patient-centred clinical careers.',
    traits: [
      'healthcare',
      'biology',
      'science',
      'empathy',
      'discipline',
      'socialImpact',
    ],
    streams: [
      'Science - PCB',
      'Science - PCMB',
    ],
    courses: [
      'MBBS',
      'BDS',
      'BAMS',
      'BHMS',
      'BUMS',
      'BSMS',
    ],
    roles: [
      'Doctor',
      'Dentist',
      'AYUSH Practitioner',
      'Clinical Professional',
    ],
    examCategories: [
      'medical',
    ],
  },

  {
    id: 'allied-health',
    name: 'Nursing, Pharmacy & Allied Healthcare',
    description:
      'Nursing, pharmacy, physiotherapy, rehabilitation and allied health sciences.',
    traits: [
      'healthcare',
      'biology',
      'empathy',
      'helping',
      'socialImpact',
      'practical',
    ],
    streams: [
      'Science - PCB',
      'Science - PCMB',
    ],
    courses: [
      'B.Sc Nursing',
      'B.Pharm',
      'Pharm.D',
      'BPT',
      'BOT',
      'BASLP',
      'Allied Health Sciences',
    ],
    roles: [
      'Nurse',
      'Pharmacist',
      'Physiotherapist',
      'Occupational Therapist',
      'Allied Health Professional',
    ],
    examCategories: [
      'nursing',
      'allied-health',
      'medical',
    ],
  },

  {
    id: 'science-research',
    name: 'Pure Sciences & Research',
    description:
      'Physics, chemistry, mathematics, biology and research-oriented scientific careers.',
    traits: [
      'science',
      'research',
      'logic',
      'observation',
      'innovation',
    ],
    streams: [
      'Science - PCM',
      'Science - PCB',
      'Science - PCMB',
    ],
    courses: [
      'BS-MS',
      'B.Sc Physics',
      'B.Sc Chemistry',
      'B.Sc Mathematics',
      'B.Sc Biology',
    ],
    roles: [
      'Research Scientist',
      'Researcher',
      'Laboratory Scientist',
      'Academic',
    ],
    examCategories: [
      'science-research',
      'university',
      'postgraduate-science',
    ],
  },

  {
    id: 'business',
    name: 'Business & Management',
    description:
      'Management, marketing, consulting, operations and business leadership.',
    traits: [
      'business',
      'leadership',
      'communication',
      'people',
      'entrepreneurship',
    ],
    streams: [
      'Commerce with Mathematics',
      'Commerce without Mathematics',
      'Humanities / Arts',
      'Science - PCM',
      'Science - PCB',
    ],
    courses: [
      'BBA',
      'BMS',
      'BBM',
      'Integrated BBA-MBA',
      'MBA',
    ],
    roles: [
      'Business Manager',
      'Consultant',
      'Product Manager',
      'Marketing Manager',
      'Operations Manager',
    ],
    examCategories: [
      'management',
      'mba',
      'university',
    ],
  },

  {
    id: 'finance',
    name: 'Finance, Accounting & Economics',
    description:
      'Finance, economics, accounting, investment and professional commerce careers.',
    traits: [
      'business',
      'numerical',
      'logic',
      'systems',
      'stability',
    ],
    streams: [
      'Commerce with Mathematics',
      'Commerce without Mathematics',
      'Humanities with Mathematics',
      'Science - PCM',
    ],
    courses: [
      'B.Com',
      'Economics',
      'Finance',
      'CA',
      'CMA',
      'Actuarial / Analytics routes',
    ],
    roles: [
      'Chartered Accountant',
      'Financial Analyst',
      'Economist',
      'Investment Analyst',
      'Accountant',
    ],
    examCategories: [
      'accounting',
      'university',
      'mba',
    ],
  },

  {
    id: 'law',
    name: 'Law & Legal Careers',
    description:
      'Law, litigation, corporate legal work, policy and legal research.',
    traits: [
      'law',
      'communication',
      'logic',
      'research',
      'socialImpact',
    ],
    streams: [
      'Humanities / Arts',
      'Commerce',
      'Science',
    ],
    courses: [
      'BA LLB',
      'BBA LLB',
      'B.Com LLB',
      'LLB',
    ],
    roles: [
      'Lawyer',
      'Corporate Legal Professional',
      'Legal Researcher',
      'Policy Professional',
    ],
    examCategories: [
      'law',
    ],
  },

  {
    id: 'government',
    name: 'Government, Civil Services & Public Policy',
    description:
      'Civil services, public administration, government and policy careers.',
    traits: [
      'law',
      'socialImpact',
      'communication',
      'discipline',
      'stability',
      'research',
    ],
    streams: [
      'Any stream',
    ],
    courses: [
      'Any recognized undergraduate degree',
      'Political Science',
      'Economics',
      'Law',
      'Public Administration',
    ],
    roles: [
      'Civil Servant',
      'Government Officer',
      'Policy Analyst',
      'Public Administrator',
    ],
    examCategories: [
      'government',
    ],
  },

  {
    id: 'design',
    name: 'Design, UI/UX & Creative Technology',
    description:
      'Product design, UI/UX, graphic design and interdisciplinary creative work.',
    traits: [
      'creative',
      'visualArt',
      'technology',
      'innovation',
      'observation',
    ],
    streams: [
      'Any stream',
      'Fine Arts / Visual Arts',
    ],
    courses: [
      'B.Des',
      'Communication Design',
      'Product Design',
      'UI / UX Design',
      'Graphic Design',
    ],
    roles: [
      'Product Designer',
      'UI / UX Designer',
      'Graphic Designer',
      'Creative Technologist',
    ],
    examCategories: [
      'design',
    ],
  },

  {
    id: 'fashion',
    name: 'Fashion, Textile & Lifestyle Design',
    description:
      'Fashion design, textile, styling and lifestyle industries.',
    traits: [
      'creative',
      'visualArt',
      'observation',
      'people',
      'innovation',
    ],
    streams: [
      'Any stream',
      'Fine Arts / Visual Arts',
    ],
    courses: [
      'Fashion Design',
      'Textile Design',
      'Fashion Communication',
      'Accessory Design',
    ],
    roles: [
      'Fashion Designer',
      'Stylist',
      'Textile Designer',
      'Fashion Communicator',
    ],
    examCategories: [
      'fashion',
      'design',
    ],
  },

  {
    id: 'fine-arts',
    name: 'Fine Arts & Visual Arts',
    description:
      'Painting, illustration, sculpture, photography and visual-art practice.',
    traits: [
      'visualArt',
      'creative',
      'independent',
      'observation',
      'creativityValue',
    ],
    streams: [
      'Fine Arts / Visual Arts',
      'Humanities / Arts',
      'Any stream',
    ],
    courses: [
      'BFA',
      'BVA',
      'Painting',
      'Applied Arts',
      'Photography',
    ],
    roles: [
      'Visual Artist',
      'Illustrator',
      'Photographer',
      'Art Director',
      'Independent Artist',
    ],
    examCategories: [
      'fine-arts',
      'university',
    ],
  },

  {
    id: 'acting',
    name: 'Acting, Theatre & Performing Arts',
    description:
      'Acting, theatre, stage performance, music and live performance careers.',
    traits: [
      'performance',
      'creative',
      'communication',
      'people',
      'dynamic',
      'adaptability',
    ],
    streams: [
      'Performing Arts',
      'Humanities / Arts',
      'Any stream',
    ],
    courses: [
      'Acting',
      'Theatre Arts',
      'Drama',
      'Performing Arts',
      'Music',
      'Dance',
    ],
    roles: [
      'Actor',
      'Theatre Artist',
      'Performer',
      'Voice Artist',
      'Director',
      'Stage Professional',
    ],
    examCategories: [
      'acting',
      'performing-arts',
    ],
  },

  {
    id: 'film-media',
    name: 'Film, Media, Journalism & Content',
    description:
      'Film production, journalism, content, television and digital media.',
    traits: [
      'creative',
      'communication',
      'performance',
      'dynamic',
      'observation',
    ],
    streams: [
      'Any stream',
      'Humanities / Arts',
    ],
    courses: [
      'BJMC',
      'Film Production',
      'Mass Communication',
      'Cinematography',
      'Editing',
    ],
    roles: [
      'Journalist',
      'Filmmaker',
      'Video Editor',
      'Content Creator',
      'Cinematographer',
      'Media Producer',
    ],
    examCategories: [
      'media',
      'film',
      'university',
    ],
  },

  {
    id: 'architecture',
    name: 'Architecture, Planning & Built Environment',
    description:
      'Architecture, urban planning, spatial design and built-environment careers.',
    traits: [
      'creative',
      'visualArt',
      'mathematics',
      'problemSolving',
      'practical',
    ],
    streams: [
      'Science - PCM',
    ],
    courses: [
      'B.Arch',
      'B.Plan',
      'Architecture',
      'Urban Planning',
    ],
    roles: [
      'Architect',
      'Urban Planner',
      'Spatial Designer',
      'Built Environment Consultant',
    ],
    examCategories: [
      'architecture',
    ],
  },

  {
    id: 'hospitality',
    name: 'Hotel Management, Hospitality & Culinary',
    description:
      'Hotels, restaurants, culinary arts, guest experience and hospitality management.',
    traits: [
      'hospitality',
      'people',
      'communication',
      'leadership',
      'dynamic',
      'practical',
    ],
    streams: [
      'Any stream',
      'Hotel / Tourism interest',
    ],
    courses: [
      'BHM',
      'B.Sc Hospitality & Hotel Administration',
      'Culinary Arts',
      'Hotel Management',
    ],
    roles: [
      'Hotel Manager',
      'Chef',
      'Hospitality Manager',
      'Food & Beverage Manager',
      'Guest Relations Manager',
    ],
    examCategories: [
      'hospitality',
    ],
  },

  {
    id: 'tourism',
    name: 'Travel, Tourism & Event Management',
    description:
      'Travel, tourism, events and experience-management careers.',
    traits: [
      'hospitality',
      'people',
      'communication',
      'dynamic',
      'leadership',
    ],
    streams: [
      'Any stream',
    ],
    courses: [
      'Travel & Tourism',
      'Event Management',
      'Hospitality',
    ],
    roles: [
      'Tourism Manager',
      'Travel Consultant',
      'Event Manager',
      'Destination Manager',
    ],
    examCategories: [
      'hospitality',
      'university',
    ],
  },

  {
    id: 'psychology',
    name: 'Psychology, Counselling & Social Sciences',
    description:
      'Psychology, human behaviour, counselling and social-science careers.',
    traits: [
      'helping',
      'empathy',
      'people',
      'research',
      'socialImpact',
    ],
    streams: [
      'Humanities / Arts',
      'Science - PCB',
      'Any stream',
    ],
    courses: [
      'BA Psychology',
      'B.Sc Psychology',
      'Sociology',
      'Social Work',
    ],
    roles: [
      'Psychology Professional',
      'Counsellor',
      'Social Researcher',
      'Social Worker',
    ],
    examCategories: [
      'university',
      'postgraduate',
    ],
  },

  {
    id: 'education',
    name: 'Education & Teaching',
    description:
      'Teaching, education, learning design and academic-development careers.',
    traits: [
      'helping',
      'communication',
      'empathy',
      'socialImpact',
      'structured',
    ],
    streams: [
      'Any stream',
    ],
    courses: [
      'Integrated Teacher Education',
      'BA / B.Sc + B.Ed',
      'Education',
    ],
    roles: [
      'Teacher',
      'Educator',
      'Academic Coordinator',
      'Learning Designer',
    ],
    examCategories: [
      'teaching',
      'university',
    ],
  },

  {
    id: 'agriculture',
    name: 'Agriculture, Environment & Food Systems',
    description:
      'Agriculture, food systems, environment, forestry and sustainable-resource careers.',
    traits: [
      'nature',
      'science',
      'practical',
      'field',
      'research',
      'socialImpact',
    ],
    streams: [
      'Science - PCB',
      'Science - PCM',
      'Agriculture',
    ],
    courses: [
      'B.Sc Agriculture',
      'Horticulture',
      'Forestry',
      'Food Technology',
      'Agricultural Engineering',
    ],
    roles: [
      'Agricultural Professional',
      'Agronomist',
      'Food Technologist',
      'Environmental Professional',
    ],
    examCategories: [
      'agriculture',
      'university',
    ],
  },

  {
    id: 'defence',
    name: 'Defence & Uniformed Services',
    description:
      'Armed forces and other disciplined uniformed-service careers.',
    traits: [
      'discipline',
      'leadership',
      'practical',
      'field',
      'stability',
      'socialImpact',
    ],
    streams: [
      'Any stream',
      'Science - PCM',
    ],
    courses: [
      'NDA / Service Academies',
      'Graduate Defence Entry',
    ],
    roles: [
      'Army Officer',
      'Naval Officer',
      'Air Force Officer',
      'Uniformed Service Professional',
    ],
    examCategories: [
      'defence',
    ],
  },

  {
    id: 'merchant-navy',
    name: 'Merchant Navy & Maritime Careers',
    description:
      'Marine engineering, nautical science and commercial maritime careers.',
    traits: [
      'practical',
      'field',
      'discipline',
      'technology',
      'dynamic',
      'systems',
    ],
    streams: [
      'Science - PCM',
    ],
    courses: [
      'B.Tech Marine Engineering',
      'B.Sc Nautical Science',
      'DNS',
    ],
    roles: [
      'Marine Engineer',
      'Deck Officer',
      'Merchant Navy Officer',
      'Maritime Professional',
    ],
    examCategories: [
      'maritime',
    ],
  },

  {
    id: 'sports',
    name: 'Sports, Fitness & Sports Science',
    description:
      'Competitive sports, sports science, coaching, fitness and performance.',
    traits: [
      'sports',
      'discipline',
      'practical',
      'people',
      'dynamic',
    ],
    streams: [
      'Any stream',
      'Sports / Physical Education',
    ],
    courses: [
      'Sports Science',
      'Physical Education',
      'Sports Management',
      'Coaching',
    ],
    roles: [
      'Athlete',
      'Coach',
      'Fitness Professional',
      'Sports Analyst',
      'Sports Manager',
    ],
    examCategories: [
      'university',
    ],
  },

  {
    id: 'aviation',
    name: 'Aviation & Airport Careers',
    description:
      'Commercial aviation, airport operations and aviation-management careers.',
    traits: [
      'discipline',
      'systems',
      'technology',
      'communication',
      'dynamic',
    ],
    streams: [
      'Science - PCM',
      'Any stream for selected non-technical aviation roles',
    ],
    courses: [
      'Commercial Pilot Training',
      'Aviation Management',
      'Airport Management',
    ],
    roles: [
      'Pilot',
      'Airport Operations Professional',
      'Aviation Manager',
    ],
    examCategories: [
      'university',
    ],
  },

  {
    id: 'vocational',
    name: 'Skilled Trades, Polytechnic & Vocational Careers',
    description:
      'Hands-on technical trades, industrial skills and employment-focused vocational paths.',
    traits: [
      'practical',
      'field',
      'problemSolving',
      'technology',
      'independent',
    ],
    streams: [
      'Vocational / Skill-based',
      'Any stream',
    ],
    courses: [
      'ITI',
      'Polytechnic',
      'Diploma',
      'Skill Certification',
    ],
    roles: [
      'Technician',
      'Industrial Specialist',
      'Skilled Professional',
      'Technical Supervisor',
    ],
    examCategories: [],
  },

  {
    id: 'entrepreneurship',
    name: 'Entrepreneurship & Independent Careers',
    description:
      'Startups, business ownership, freelancing and independent professional work.',
    traits: [
      'entrepreneurship',
      'business',
      'leadership',
      'adaptability',
      'innovation',
      'independent',
    ],
    streams: [
      'Any stream',
    ],
    courses: [
      'Any degree + entrepreneurial experience',
      'BBA',
      'Commerce',
      'Technology',
      'Design',
    ],
    roles: [
      'Entrepreneur',
      'Founder',
      'Freelancer',
      'Independent Consultant',
    ],
    examCategories: [
      'management',
      'mba',
    ],
  },
];


/*
|--------------------------------------------------------------------------
| STAGE HELPERS
|--------------------------------------------------------------------------
*/

export function getStageFromClass(
  classValue
) {
  return (
    CLASS_OPTIONS.find(
      (item) =>
        item.value === classValue
    )?.stage ||
    null
  );
}


export function getQuestionsForStage(
  stage
) {
  const stageQuestions = {
    foundation:
      FOUNDATION_QUESTIONS,

    class10:
      CLASS10_QUESTIONS,

    'senior-secondary':
      SENIOR_SECONDARY_QUESTIONS,

    college:
      COLLEGE_QUESTIONS,

    graduate:
      GRADUATE_QUESTIONS,
  };

  return [
    ...COMMON_QUESTIONS,
    ...(
      stageQuestions[
        stage
      ] || []
    ),
  ];
}


export function getExamsForStage(
  stage
) {
  return INDIA_EXAM_CATALOG.filter(
    (exam) =>
      exam.stages.includes(
        stage
      )
  );
}