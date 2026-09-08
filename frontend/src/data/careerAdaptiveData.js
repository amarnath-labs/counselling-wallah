/*
|--------------------------------------------------------------------------
| TruMarg Career Discovery V4
|--------------------------------------------------------------------------
|
| India-focused adaptive career guidance data.
|
| IMPORTANT
| - Questions change according to student stage.
| - Class 8/9 ≠ Class 10 ≠ Class 11/12 ≠ College ≠ Graduate.
| - Career fit is guidance, not a psychometric diagnosis.
| - Entrance routes can change. Official eligibility must be verified.
|
*/


/*
|--------------------------------------------------------------------------
| LIKERT OPTIONS
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
| EDUCATION STAGES
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
| SCHOOL BOARDS
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
| SCHOOL STREAMS / DIRECTIONS
|--------------------------------------------------------------------------
*/

export const STREAM_OPTIONS = {
  foundation: [
    'Not decided yet',
    'Science',
    'Commerce',
    'Humanities / Social Sciences',
    'Arts / Design',
    'Performing Arts',
    'Sports',
    'Computer / Technology',
    'Agriculture / Environment',
    'Vocational / Practical Learning',
    'Hotel / Tourism / Hospitality',
    'Not sure',
  ],

  class10: [
    'Not decided yet',
    'Science - PCM',
    'Science - PCB',
    'Science - PCMB',
    'Science - PCM + Computer Science',
    'Science - PCB + Psychology',
    'Commerce with Mathematics',
    'Commerce without Mathematics',
    'Humanities / Arts',
    'Humanities with Mathematics',
    'Humanities with Psychology',
    'Humanities with Legal Studies',
    'Fine Arts / Visual Arts',
    'Performing Arts',
    'Computer / IT focused',
    'Agriculture',
    'Home Science',
    'Sports / Physical Education',
    'Vocational / Skill-based',
    'Hospitality / Hotel Management interest',
    'Travel / Tourism interest',
    'Not sure',
    'Other',
  ],

  'senior-secondary': [
    'Science - PCM',
    'Science - PCB',
    'Science - PCMB',
    'Science - PCM + Computer Science',
    'Science - PCB + Psychology',
    'Science - Biotechnology',
    'Commerce with Mathematics',
    'Commerce without Mathematics',
    'Humanities / Arts',
    'Humanities with Mathematics',
    'Humanities with Psychology',
    'Humanities with Legal Studies',
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
  'Data Science',
  'Engineering Graphics',
  'English',
  'Hindi',
  'Other Language',
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
  'Philosophy',
  'Fine Arts',
  'Painting',
  'Graphic Design',
  'Music',
  'Dance',
  'Theatre / Drama',
  'Mass Media',
  'Home Science',
  'Agriculture',
  'Physical Education',
  'Vocational / Skill Subject',
];


/*
|--------------------------------------------------------------------------
| COLLEGE / QUALIFICATION OPTIONS
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
  'BS',
  'BS-MS',
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
  'Food Technology',

  'LLB',
  'BA LLB',
  'BBA LLB',
  'B.Com LLB',
  'B.Sc LLB',

  'BJMC / Journalism',
  'Mass Communication',
  'Film / Television',
  'Acting / Theatre',
  'Music',
  'Dance',
  'Animation / VFX',
  'Gaming / Game Design',

  'Fashion Design',
  'Textile Design',
  'Interior Design',

  'Hotel Management / BHM',
  'Hospitality Administration',
  'Travel & Tourism',
  'Culinary Arts',

  'Aviation',
  'Airport Management',

  'Nautical Science',
  'Marine Engineering',

  'Sports Science',
  'Physical Education',

  'Education / Teaching',
  'Integrated Teacher Education',

  'Diploma',
  'Polytechnic',
  'ITI',

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
  'Preparing for defence services',
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
  'Civil Services',
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
  'Media / Content career',
  'Design career',

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
  'Cybersecurity',
  'Cloud Computing',

  'Electronics',
  'Electrical Systems',
  'Mechanical Design',
  'CAD / Engineering Design',
  'Civil / Construction Knowledge',

  'Research',
  'Laboratory Work',
  'Mathematics',
  'Statistics',

  'Writing',
  'Public Speaking',
  'Communication',
  'Debating',

  'Sales',
  'Marketing',
  'Finance',
  'Accounting',

  'Leadership',
  'Teamwork',
  'Problem Solving',
  'Project Management',

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
  'Fitness',

  'Cooking / Culinary',
  'Hospitality',
  'Travel Planning',
  'Event Management',

  'Mechanical / Hands-on Work',
  'Agriculture',

  'Content Creation',
  'Social Media',

  'Entrepreneurship',
];


/*
|--------------------------------------------------------------------------
| INDIA EXAM / ADMISSION ROUTE CATALOG
|--------------------------------------------------------------------------
*/

export const INDIA_EXAM_CATALOG = [
  // ENGINEERING

  {
    id: 'jee-main',
    name: 'JEE Main',
    category: 'engineering',
    stages: ['senior-secondary'],
  },
  {
    id: 'jee-advanced',
    name: 'JEE Advanced',
    category: 'engineering',
    stages: ['senior-secondary'],
  },
  {
    id: 'bitsat',
    name: 'BITSAT',
    category: 'engineering',
    stages: ['senior-secondary'],
  },
  {
    id: 'viteee',
    name: 'VITEEE',
    category: 'engineering',
    stages: ['senior-secondary'],
  },
  {
    id: 'srmjeee',
    name: 'SRMJEEE',
    category: 'engineering',
    stages: ['senior-secondary'],
  },
  {
    id: 'met',
    name: 'Manipal Entrance Test (MET)',
    category: 'engineering',
    stages: ['senior-secondary'],
  },
  {
    id: 'comedk',
    name: 'COMEDK UGET',
    category: 'engineering',
    stages: ['senior-secondary'],
  },
  {
    id: 'mht-cet',
    name: 'MHT-CET',
    category: 'engineering',
    stages: ['senior-secondary'],
  },
  {
    id: 'wbjee',
    name: 'WBJEE',
    category: 'engineering',
    stages: ['senior-secondary'],
  },
  {
    id: 'kcet',
    name: 'KCET',
    category: 'engineering',
    stages: ['senior-secondary'],
  },
  {
    id: 'keam',
    name: 'KEAM',
    category: 'engineering',
    stages: ['senior-secondary'],
  },
  {
    id: 'gujcet',
    name: 'GUJCET',
    category: 'engineering',
    stages: ['senior-secondary'],
  },
  {
    id: 'ap-eapcet',
    name: 'AP EAPCET',
    category: 'engineering',
    stages: ['senior-secondary'],
  },
  {
    id: 'tg-eapcet',
    name: 'TG EAPCET',
    category: 'engineering',
    stages: ['senior-secondary'],
  },
  {
    id: 'ojee',
    name: 'OJEE / Odisha Engineering Admission Route',
    category: 'engineering',
    stages: ['senior-secondary'],
  },
  {
    id: 'uptac',
    name: 'UPTAC Counselling',
    category: 'engineering',
    stages: ['senior-secondary'],
  },

  // MEDICAL / HEALTHCARE

  {
    id: 'neet-ug',
    name: 'NEET UG',
    category: 'medical',
    stages: ['senior-secondary'],
  },
  {
    id: 'aiims-nursing',
    name: 'AIIMS Nursing Admission Route',
    category: 'nursing',
    stages: ['senior-secondary'],
  },
  {
    id: 'state-nursing',
    name: 'State / University Nursing Entrance',
    category: 'nursing',
    stages: ['senior-secondary'],
  },
  {
    id: 'paramedical',
    name: 'State / University Paramedical Entrance',
    category: 'allied-health',
    stages: ['senior-secondary'],
  },
  {
    id: 'pharmacy-state',
    name: 'State / University Pharmacy Admission',
    category: 'pharmacy',
    stages: ['senior-secondary'],
  },

  // SCIENCE / RESEARCH

  {
    id: 'cuet-ug',
    name: 'CUET UG',
    category: 'university',
    stages: ['senior-secondary'],
  },
  {
    id: 'iiser-iat',
    name: 'IISER Aptitude Test (IAT)',
    category: 'science-research',
    stages: ['senior-secondary'],
  },
  {
    id: 'nest',
    name: 'NEST',
    category: 'science-research',
    stages: ['senior-secondary'],
  },

  // ARCHITECTURE

  {
    id: 'nata',
    name: 'NATA',
    category: 'architecture',
    stages: ['senior-secondary'],
  },
  {
    id: 'jee-paper-2',
    name: 'JEE Main Paper 2 - B.Arch / B.Plan',
    category: 'architecture',
    stages: ['senior-secondary'],
  },

  // DESIGN / FASHION / FINE ARTS

  {
    id: 'uceed',
    name: 'UCEED',
    category: 'design',
    stages: ['senior-secondary'],
  },
  {
    id: 'nid-dat',
    name: 'NID DAT',
    category: 'design',
    stages: ['senior-secondary'],
  },
  {
    id: 'nift',
    name: 'NIFT Entrance Examination',
    category: 'fashion',
    stages: ['senior-secondary'],
  },
  {
    id: 'design-university',
    name: 'University-specific Design Entrance / Portfolio',
    category: 'design',
    stages: ['senior-secondary'],
  },
  {
    id: 'fine-arts-route',
    name: 'Fine Arts Aptitude / Portfolio / University Admission',
    category: 'fine-arts',
    stages: ['senior-secondary'],
  },

  // LAW

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
    stages: ['senior-secondary'],
  },
  {
    id: 'slat',
    name: 'SLAT',
    category: 'law',
    stages: ['senior-secondary'],
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

  // MANAGEMENT

  {
    id: 'ipmat',
    name: 'IPMAT',
    category: 'management',
    stages: ['senior-secondary'],
  },
  {
    id: 'jipmat',
    name: 'JIPMAT',
    category: 'management',
    stages: ['senior-secondary'],
  },
  {
    id: 'npat',
    name: 'NPAT',
    category: 'management',
    stages: ['senior-secondary'],
  },
  {
    id: 'set',
    name: 'SET - Symbiosis Entrance Test',
    category: 'management',
    stages: ['senior-secondary'],
  },

  // HOTEL / HOSPITALITY

  {
    id: 'nchm-jee',
    name: 'NCHM JEE',
    category: 'hospitality',
    stages: ['senior-secondary'],
  },
  {
    id: 'hotel-university',
    name: 'University / Institute Hotel Management Entrance',
    category: 'hospitality',
    stages: ['senior-secondary'],
  },

  // MEDIA / JOURNALISM

  {
    id: 'media-cuet',
    name: 'CUET UG - Journalism / Media Programs',
    category: 'media',
    stages: ['senior-secondary'],
  },
  {
    id: 'media-university',
    name: 'University-specific Journalism / Media Entrance',
    category: 'media',
    stages: ['senior-secondary'],
  },

  // ACTING / FILM / PERFORMING ARTS

  {
    id: 'performing-arts',
    name: 'Performing Arts University Entrance / Audition',
    category: 'performing-arts',
    stages: [
      'senior-secondary',
      'college',
    ],
  },
  {
    id: 'acting-audition',
    name: 'Acting / Theatre Audition & Aptitude Route',
    category: 'acting',
    stages: [
      'senior-secondary',
      'college',
      'graduate',
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

  // AGRICULTURE

  {
    id: 'agriculture-cuet',
    name: 'CUET UG / Agriculture University Admission',
    category: 'agriculture',
    stages: ['senior-secondary'],
  },
  {
    id: 'state-agriculture',
    name: 'State Agriculture University Entrance / Counselling',
    category: 'agriculture',
    stages: ['senior-secondary'],
  },

  // DEFENCE

  {
    id: 'nda',
    name: 'NDA & NA Examination',
    category: 'defence',
    stages: ['senior-secondary'],
  },
  {
    id: 'tes',
    name: '10+2 Technical Entry Scheme',
    category: 'defence',
    stages: ['senior-secondary'],
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

  // MARITIME

  {
    id: 'imu-cet',
    name: 'IMU CET',
    category: 'maritime',
    stages: ['senior-secondary'],
  },
  {
    id: 'merchant-sponsorship',
    name: 'Merchant Navy Sponsorship / Company Selection Tests',
    category: 'maritime',
    stages: ['senior-secondary'],
  },

  // PROFESSIONAL QUALIFICATIONS

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

  // TEACHING

  {
    id: 'ncet',
    name: 'NCET - Integrated Teacher Education Programme',
    category: 'teaching',
    stages: ['senior-secondary'],
  },

  // HIGHER EDUCATION

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
    id: 'mat',
    name: 'MAT',
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

  // GOVERNMENT

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
    id: 'state-psc',
    name: 'State Public Service Commission Exams',
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
    stages: ['graduate'],
  },
  {
    id: 'banking',
    name: 'Banking Exams - IBPS / SBI etc.',
    category: 'government',
    stages: ['graduate'],
  },
  {
    id: 'railway',
    name: 'Railway Recruitment Examinations',
    category: 'government',
    stages: ['graduate'],
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
  performance: 'Acting & performance',
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
  language: 'Language & communication',
  socialScience: 'Social sciences',
  computer: 'Computer science',

  systems: 'Systems-oriented work',
  people: 'People-oriented work',
  structured: 'Structured environments',
  flexible: 'Flexible environments',
  teamwork: 'Teamwork',
  independent: 'Independent work',
  dynamic: 'Dynamic environments',
  field: 'Field / practical environments',

  income: 'Income potential',
  stability: 'Stability',
  socialImpact: 'Social impact',
  creativityValue: 'Creative freedom',
  workLifeBalance: 'Work-life balance',
  innovation: 'Innovation',
  entrepreneurship: 'Entrepreneurship',
};


/*
|--------------------------------------------------------------------------
| QUESTION FACTORY
|--------------------------------------------------------------------------
*/

function q(
  id,
  section,
  trait,
  text
) {
  return {
    id,
    section,
    trait,
    text,
  };
}


/*
|--------------------------------------------------------------------------
| CLASS 8 / 9
|--------------------------------------------------------------------------
*/

export const FOUNDATION_QUESTIONS = [
  q(
    'f_technology',
    'interest',
    'technology',
    'I enjoy exploring computers, gadgets, apps, machines or how technology works.'
  ),

  q(
    'f_science',
    'interest',
    'science',
    'I often become curious about why natural or scientific things happen.'
  ),

  q(
    'f_health',
    'interest',
    'healthcare',
    'Learning about the human body, health, animals or medicines interests me.'
  ),

  q(
    'f_business',
    'interest',
    'business',
    'I find shops, businesses, money, products or selling things interesting.'
  ),

  q(
    'f_creative',
    'interest',
    'creative',
    'I enjoy making something original rather than only following instructions.'
  ),

  q(
    'f_art',
    'interest',
    'visualArt',
    'Drawing, photography, craft, animation, fashion or visual design attracts me.'
  ),

  q(
    'f_performance',
    'interest',
    'performance',
    'I enjoy acting, music, dance, performing, presenting or being on stage.'
  ),

  q(
    'f_helping',
    'interest',
    'helping',
    'I like listening to people and helping them when they have a problem.'
  ),

  q(
    'f_sports',
    'interest',
    'sports',
    'Sports, fitness and physical activities are things I genuinely enjoy.'
  ),

  q(
    'f_nature',
    'interest',
    'nature',
    'Nature, animals, farming, plants or environmental activities interest me.'
  ),

  q(
    'f_hospitality',
    'interest',
    'hospitality',
    'I enjoy organising activities, food, trips or making guests feel comfortable.'
  ),

  q(
    'f_practical',
    'interest',
    'practical',
    'I enjoy building, repairing, assembling or working with real objects.'
  ),

  q(
    'f_logic',
    'strength',
    'logic',
    'I enjoy puzzles, patterns and questions that require thinking step by step.'
  ),

  q(
    'f_problem',
    'strength',
    'problemSolving',
    'When something does not work, I like figuring out how to fix it.'
  ),

  q(
    'f_communication',
    'strength',
    'communication',
    'I usually enjoy explaining my ideas to friends, teachers or family.'
  ),

  q(
    'f_leadership',
    'strength',
    'leadership',
    'I am comfortable taking responsibility during group activities.'
  ),

  q(
    'f_empathy',
    'strength',
    'empathy',
    'I can usually understand how another person might be feeling.'
  ),

  q(
    'f_math',
    'academic',
    'mathematics',
    'I enjoy mathematics when I understand the idea behind the problem.'
  ),

  q(
    'f_biology',
    'academic',
    'biology',
    'Biology and living things are subjects I would like to understand better.'
  ),

  q(
    'f_computer',
    'academic',
    'computer',
    'I would like to learn more about coding, computers or digital technology.'
  ),

  q(
    'f_language',
    'academic',
    'language',
    'Reading, writing, speaking or storytelling are activities I enjoy.'
  ),

  q(
    'f_social',
    'academic',
    'socialScience',
    'History, geography, society or current affairs are interesting to me.'
  ),

  q(
    'f_people',
    'work',
    'people',
    'I enjoy activities where I interact with other people.'
  ),

  q(
    'f_independent',
    'work',
    'independent',
    'I can stay focused on an activity independently when I really enjoy it.'
  ),

  q(
    'f_dynamic',
    'work',
    'dynamic',
    'I enjoy trying different activities instead of doing exactly the same thing every day.'
  ),

  q(
    'f_stability',
    'values',
    'stability',
    'Having a secure and dependable career sounds important to me.'
  ),

  q(
    'f_impact',
    'values',
    'socialImpact',
    'I would like my future work to help people or improve society.'
  ),

  q(
    'f_innovation',
    'values',
    'innovation',
    'Creating or discovering something new sounds exciting to me.'
  ),
];


/*
|--------------------------------------------------------------------------
| CLASS 10
|--------------------------------------------------------------------------
*/

export const CLASS10_QUESTIONS = [
  q(
    'c10_technology',
    'interest',
    'technology',
    'I would enjoy studying computers, electronics, engineering or technology in greater depth.'
  ),

  q(
    'c10_science',
    'interest',
    'science',
    'I enjoy understanding scientific concepts instead of only memorising them for examinations.'
  ),

  q(
    'c10_health',
    'interest',
    'healthcare',
    'Medicine, healthcare, the human body or patient care feels like a career area I could seriously explore.'
  ),

  q(
    'c10_business',
    'interest',
    'business',
    'Business, money, economics, marketing or entrepreneurship are topics I genuinely want to understand.'
  ),

  q(
    'c10_law',
    'interest',
    'law',
    'Debates, laws, rights, politics or public issues naturally interest me.'
  ),

  q(
    'c10_creative',
    'interest',
    'creative',
    'I would seriously consider a career where creativity is a major part of the work.'
  ),

  q(
    'c10_design',
    'interest',
    'visualArt',
    'Design, architecture, fashion, animation, drawing or visual communication appeals to me.'
  ),

  q(
    'c10_performance',
    'interest',
    'performance',
    'Acting, theatre, music, dance or performing arts is something I would genuinely consider professionally.'
  ),

  q(
    'c10_hospitality',
    'interest',
    'hospitality',
    'Hotel management, culinary arts, tourism, travel or guest experience sounds interesting as a career.'
  ),

  q(
    'c10_sports',
    'interest',
    'sports',
    'I would seriously consider sports, fitness, coaching or sports science as part of my future career.'
  ),

  q(
    'c10_nature',
    'interest',
    'nature',
    'Agriculture, environment, food systems, forestry or nature-related careers interest me.'
  ),

  q(
    'c10_practical',
    'interest',
    'practical',
    'I would consider vocational or skill-based education if it matched my strengths better than a conventional academic route.'
  ),

  q(
    'c10_logic',
    'strength',
    'logic',
    'I am comfortable solving questions where I have to reason through multiple steps.'
  ),

  q(
    'c10_numerical',
    'strength',
    'numerical',
    'Working with numbers and mathematical relationships usually feels manageable to me.'
  ),

  q(
    'c10_problem',
    'strength',
    'problemSolving',
    'I enjoy solving unfamiliar problems rather than only practising known question patterns.'
  ),

  q(
    'c10_communication',
    'strength',
    'communication',
    'Writing, explaining, presenting or debating ideas is one of my stronger areas.'
  ),

  q(
    'c10_empathy',
    'strength',
    'empathy',
    'I am patient when understanding another person’s problem or point of view.'
  ),

  q(
    'c10_leadership',
    'strength',
    'leadership',
    'I am comfortable organising a group and taking responsibility for an outcome.'
  ),

  q(
    'c10_math',
    'academic',
    'mathematics',
    'I can imagine studying Mathematics at a significantly deeper level in Classes 11 and 12.'
  ),

  q(
    'c10_biology',
    'academic',
    'biology',
    'I can imagine studying Biology in detail for the next two years.'
  ),

  q(
    'c10_computer',
    'academic',
    'computer',
    'Computer Science, coding or technology is an academic area I would like to continue exploring.'
  ),

  q(
    'c10_language',
    'academic',
    'language',
    'I am comfortable with courses that involve substantial reading, writing and communication.'
  ),

  q(
    'c10_social',
    'academic',
    'socialScience',
    'I would enjoy studying society, politics, psychology, history, economics or related humanities subjects in greater depth.'
  ),

  q(
    'c10_people',
    'work',
    'people',
    'I can imagine enjoying a career where I communicate with people for much of the day.'
  ),

  q(
    'c10_systems',
    'work',
    'systems',
    'I can imagine enjoying work involving systems, technology, calculations, data or structured processes.'
  ),

  q(
    'c10_field',
    'work',
    'field',
    'I am open to careers involving hospitals, laboratories, sites, kitchens, studios, sports grounds or other practical environments.'
  ),

  q(
    'c10_dynamic',
    'work',
    'dynamic',
    'I would prefer a career with changing situations and challenges rather than highly repetitive work.'
  ),

  q(
    'c10_income',
    'values',
    'income',
    'Future earning potential is an important consideration when I compare career options.'
  ),

  q(
    'c10_stability',
    'values',
    'stability',
    'A stable and predictable career path is very important to me.'
  ),

  q(
    'c10_impact',
    'values',
    'socialImpact',
    'I want my future work to contribute meaningfully to people or society.'
  ),

  q(
    'c10_innovation',
    'values',
    'innovation',
    'I want a career where I can build, create, discover or improve things.'
  ),

  q(
    'c10_entrepreneurship',
    'values',
    'entrepreneurship',
    'Starting a business or building something of my own sounds exciting to me.'
  ),

  q(
    'c10_discipline',
    'strength',
    'discipline',
    'I am willing to follow a consistent preparation routine if my preferred career requires a competitive entrance examination.'
  ),
];


/*
|--------------------------------------------------------------------------
| CLASS 11 / 12
|--------------------------------------------------------------------------
*/

export const SENIOR_SECONDARY_QUESTIONS = [
  q(
    'ss_technology',
    'interest',
    'technology',
    'I enjoy understanding or building software, machines, electronics or technical systems.'
  ),

  q(
    'ss_science',
    'interest',
    'science',
    'Scientific questions interest me even when there is no immediate examination benefit.'
  ),

  q(
    'ss_healthcare',
    'interest',
    'healthcare',
    'I am genuinely interested in healthcare responsibilities such as diagnosis, treatment, rehabilitation or patient support.'
  ),

  q(
    'ss_business',
    'interest',
    'business',
    'I enjoy analysing businesses, markets, money, customers or commercial decisions.'
  ),

  q(
    'ss_law',
    'interest',
    'law',
    'Legal reasoning, public policy, rights, governance or advocacy appeals to me.'
  ),

  q(
    'ss_research',
    'interest',
    'research',
    'I enjoy exploring a subject deeply even when finding an answer takes significant time.'
  ),

  q(
    'ss_design',
    'interest',
    'visualArt',
    'I would seriously consider portfolio-based fields such as design, architecture, fashion or visual arts.'
  ),

  q(
    'ss_performance',
    'interest',
    'performance',
    'I would seriously consider auditions and portfolio-based progression for acting, theatre, film, music or dance.'
  ),

  q(
    'ss_hospitality',
    'interest',
    'hospitality',
    'Hospitality, culinary arts, tourism, events or guest experience could be a serious professional direction for me.'
  ),

  q(
    'ss_sports',
    'interest',
    'sports',
    'Sports performance, coaching, sports science or fitness could be a serious professional direction for me.'
  ),

  q(
    'ss_agriculture',
    'interest',
    'nature',
    'Agriculture, sustainability, food technology or environmental work interests me professionally.'
  ),

  q(
    'ss_practical',
    'interest',
    'practical',
    'I enjoy applying knowledge to real equipment, laboratories, field sites, studios or practical environments.'
  ),

  q(
    'ss_logic',
    'strength',
    'logic',
    'I am comfortable solving unfamiliar problems through logical reasoning.'
  ),

  q(
    'ss_numerical',
    'strength',
    'numerical',
    'I am comfortable applying quantitative concepts rather than only memorising formulas.'
  ),

  q(
    'ss_problem',
    'strength',
    'problemSolving',
    'I usually persist when a difficult problem does not have an obvious solution.'
  ),

  q(
    'ss_communication',
    'strength',
    'communication',
    'I can communicate complex ideas clearly in writing or speech.'
  ),

  q(
    'ss_leadership',
    'strength',
    'leadership',
    'I am comfortable making decisions and taking responsibility in group situations.'
  ),

  q(
    'ss_empathy',
    'strength',
    'empathy',
    'I can remain patient and attentive when dealing with another person’s needs.'
  ),

  q(
    'ss_math',
    'academic',
    'mathematics',
    'I am comfortable continuing into a course where mathematics remains important.'
  ),

  q(
    'ss_biology',
    'academic',
    'biology',
    'I am comfortable continuing into a course requiring detailed biological understanding.'
  ),

  q(
    'ss_computer',
    'academic',
    'computer',
    'I would enjoy a course where programming, computing or data is an important component.'
  ),

  q(
    'ss_language',
    'academic',
    'language',
    'I am comfortable with a degree requiring substantial reading, writing, interpretation or communication.'
  ),

  q(
    'ss_social',
    'academic',
    'socialScience',
    'I enjoy analysing society, behaviour, history, politics, geography, law or economics.'
  ),

  q(
    'ss_people',
    'work',
    'people',
    'I would enjoy a profession involving frequent interaction with people, clients, patients or teams.'
  ),

  q(
    'ss_systems',
    'work',
    'systems',
    'I would enjoy working deeply with technical systems, data or structured processes.'
  ),

  q(
    'ss_field',
    'work',
    'field',
    'I am comfortable considering careers involving fieldwork, laboratories, hospitals, sites or travel.'
  ),

  q(
    'ss_dynamic',
    'work',
    'dynamic',
    'I prefer professional environments where challenges change frequently.'
  ),

  q(
    'ss_independent',
    'work',
    'independent',
    'I am comfortable working independently for long periods when a task requires concentration.'
  ),

  q(
    'ss_income',
    'values',
    'income',
    'Long-term earning potential strongly influences my course and career choices.'
  ),

  q(
    'ss_stability',
    'values',
    'stability',
    'Career stability is more important to me than taking a highly uncertain career path.'
  ),

  q(
    'ss_impact',
    'values',
    'socialImpact',
    'Creating a positive impact through my profession is an important career priority.'
  ),

  q(
    'ss_innovation',
    'values',
    'innovation',
    'I want opportunities to create, discover or innovate in my future career.'
  ),

  q(
    'ss_entrepreneurship',
    'values',
    'entrepreneurship',
    'I could imagine eventually becoming an entrepreneur or independent professional.'
  ),

  q(
    'ss_discipline',
    'strength',
    'discipline',
    'I can consistently prepare for a competitive entrance examination over several months if required.'
  ),

  q(
    'ss_adaptability',
    'strength',
    'adaptability',
    'I am willing to reconsider my original course choice if another path fits my strengths significantly better.'
  ),
];


/*
|--------------------------------------------------------------------------
| COLLEGE
|--------------------------------------------------------------------------
*/

export const COLLEGE_QUESTIONS = [
  q(
    'college_technical',
    'interest',
    'technology',
    'I enjoy solving technical or digital problems enough to consider a technology-oriented professional role.'
  ),

  q(
    'college_research',
    'interest',
    'research',
    'Research, advanced technical specialization or postgraduate study genuinely interests me.'
  ),

  q(
    'college_business',
    'interest',
    'business',
    'I could see myself working in management, consulting, product, marketing, sales or business strategy.'
  ),

  q(
    'college_creative',
    'interest',
    'creative',
    'Creative problem-solving, content, design or communication-heavy work attracts me professionally.'
  ),

  q(
    'college_helping',
    'interest',
    'helping',
    'I would enjoy professional work where helping, teaching, advising or supporting people is a major responsibility.'
  ),

  q(
    'college_law',
    'interest',
    'law',
    'Policy, governance, legal work, public administration or regulatory careers interest me.'
  ),

  q(
    'college_performance',
    'interest',
    'performance',
    'I would seriously consider building a portfolio for acting, media, theatre, performance or entertainment work.'
  ),

  q(
    'college_hospitality',
    'interest',
    'hospitality',
    'Hospitality, events, travel, tourism, food or customer-experience roles interest me professionally.'
  ),

  q(
    'college_entrepreneur',
    'interest',
    'entrepreneurship',
    'Building a startup, freelance practice or independent business appeals to me.'
  ),

  q(
    'college_problem',
    'strength',
    'problemSolving',
    'I can take an unfamiliar professional problem and break it into smaller solvable parts.'
  ),

  q(
    'college_logic',
    'strength',
    'logic',
    'I am comfortable making decisions based on evidence, logic or structured analysis.'
  ),

  q(
    'college_communication',
    'strength',
    'communication',
    'I can explain my work clearly in presentations, interviews, meetings or written communication.'
  ),

  q(
    'college_leadership',
    'strength',
    'leadership',
    'I am comfortable owning a task and coordinating others when required.'
  ),

  q(
    'college_adaptability',
    'strength',
    'adaptability',
    'I am willing to learn important skills outside my degree if they improve my career opportunities.'
  ),

  q(
    'college_observation',
    'strength',
    'observation',
    'I can identify which types of assignments, projects or responsibilities I perform better than others.'
  ),

  q(
    'college_discipline',
    'strength',
    'discipline',
    'I can follow a consistent learning or preparation plan for several months when working toward an important career goal.'
  ),

  q(
    'college_people',
    'work',
    'people',
    'I would enjoy a role involving frequent interaction with clients, customers, patients, students or teams.'
  ),

  q(
    'college_systems',
    'work',
    'systems',
    'I prefer working deeply with systems, technology, data or structured processes.'
  ),

  q(
    'college_field',
    'work',
    'field',
    'I am comfortable with jobs involving fieldwork, plants, laboratories, hospitals, sites, travel or operations.'
  ),

  q(
    'college_independent',
    'work',
    'independent',
    'I can work effectively without continuous supervision.'
  ),

  q(
    'college_teamwork',
    'work',
    'teamwork',
    'I enjoy collaborating closely with a team to complete larger projects.'
  ),

  q(
    'college_dynamic',
    'work',
    'dynamic',
    'I prefer roles where projects and challenges change regularly.'
  ),

  q(
    'college_flexible',
    'work',
    'flexible',
    'I value flexibility in how, where or when I work.'
  ),

  q(
    'college_income',
    'values',
    'income',
    'Compensation and long-term earning growth are major factors in the roles I consider.'
  ),

  q(
    'college_stability',
    'values',
    'stability',
    'Getting into a stable career soon after graduation is currently a major priority.'
  ),

  q(
    'college_impact',
    'values',
    'socialImpact',
    'I want my professional work to produce a meaningful impact beyond salary.'
  ),

  q(
    'college_innovation',
    'values',
    'innovation',
    'I want a career where I can build, experiment, research or improve existing solutions.'
  ),

  q(
    'college_worklife',
    'values',
    'workLifeBalance',
    'Work-life balance is an important factor when I compare career options.'
  ),

  q(
    'college_switch',
    'strength',
    'adaptability',
    'I would consider a career different from my degree if my abilities and interests fit that direction better.'
  ),

  q(
    'college_higher',
    'interest',
    'research',
    'I would invest additional years in higher education if specialization significantly improved my career options.'
  ),

  q(
    'college_portfolio',
    'strength',
    'discipline',
    'I am willing to build projects, certifications, internships or a portfolio outside regular college coursework.'
  ),

  q(
    'college_interview',
    'strength',
    'communication',
    'With preparation, I feel comfortable presenting my skills and experience during interviews.'
  ),

  q(
    'college_uncertainty',
    'strength',
    'adaptability',
    'I can tolerate some uncertainty while exploring a promising new career direction.'
  ),

  q(
    'college_ownership',
    'strength',
    'leadership',
    'I prefer roles where I can take ownership of outcomes rather than only execute instructions.'
  ),

  q(
    'college_learning',
    'values',
    'innovation',
    'Continuous learning is something I expect to remain part of my professional life.'
  ),

  q(
    'college_location',
    'work',
    'flexible',
    'I would consider relocating if a significantly better career opportunity required it.'
  ),
];


/*
|--------------------------------------------------------------------------
| GRADUATE
|--------------------------------------------------------------------------
*/

export const GRADUATE_QUESTIONS = [
  q(
    'grad_technical',
    'interest',
    'technology',
    'I would enjoy reskilling for a technology or digital role if my current skills provided a reasonable foundation.'
  ),

  q(
    'grad_business',
    'interest',
    'business',
    'Management, consulting, product, marketing, sales or business roles interest me.'
  ),

  q(
    'grad_research',
    'interest',
    'research',
    'Advanced specialization, research or postgraduate study remains attractive to me.'
  ),

  q(
    'grad_creative',
    'interest',
    'creative',
    'I would consider transitioning toward design, media, content or another creative profession if my portfolio supported it.'
  ),

  q(
    'grad_helping',
    'interest',
    'helping',
    'Teaching, counselling, training, healthcare or other people-support roles appeal to me.'
  ),

  q(
    'grad_governance',
    'interest',
    'law',
    'Government, policy, law, administration or civil-service careers strongly interest me.'
  ),

  q(
    'grad_performance',
    'interest',
    'performance',
    'I would consider acting, media, entertainment or performing arts professionally despite the uncertainty of such careers.'
  ),

  q(
    'grad_entrepreneurship',
    'interest',
    'entrepreneurship',
    'Entrepreneurship, freelancing, consulting or independent professional work appeals to me.'
  ),

  q(
    'grad_problem',
    'strength',
    'problemSolving',
    'I can solve practical work problems without needing step-by-step instructions.'
  ),

  q(
    'grad_logic',
    'strength',
    'logic',
    'I am comfortable analysing alternatives before making an important professional decision.'
  ),

  q(
    'grad_communication',
    'strength',
    'communication',
    'I can explain my experience and value clearly to an employer, client or interviewer.'
  ),

  q(
    'grad_leadership',
    'strength',
    'leadership',
    'I am ready to take increasing ownership, responsibility or leadership in my career.'
  ),

  q(
    'grad_adaptability',
    'strength',
    'adaptability',
    'I am willing to substantially reskill if another career path offers a much better long-term fit.'
  ),

  q(
    'grad_skillawareness',
    'strength',
    'observation',
    'I understand which of my current skills are strong enough to demonstrate professionally.'
  ),

  q(
    'grad_discipline',
    'strength',
    'discipline',
    'I can maintain a structured preparation plan for jobs, examinations or higher education.'
  ),

  q(
    'grad_people',
    'work',
    'people',
    'I prefer roles involving significant interaction with people, clients or teams.'
  ),

  q(
    'grad_systems',
    'work',
    'systems',
    'I prefer roles involving systems, technology, data, analysis or structured processes.'
  ),

  q(
    'grad_independent',
    'work',
    'independent',
    'I am comfortable being responsible for my own work without close supervision.'
  ),

  q(
    'grad_dynamic',
    'work',
    'dynamic',
    'I enjoy professional environments where priorities and challenges change frequently.'
  ),

  q(
    'grad_field',
    'work',
    'field',
    'I am open to field-based, operational, travel-intensive or on-site work.'
  ),

  q(
    'grad_flexible',
    'work',
    'flexible',
    'Flexibility in location or working arrangement is important to me.'
  ),

  q(
    'grad_income',
    'values',
    'income',
    'My next career move should meaningfully improve my long-term earning potential.'
  ),

  q(
    'grad_stability',
    'values',
    'stability',
    'Job security and predictable career progression are major priorities for me.'
  ),

  q(
    'grad_impact',
    'values',
    'socialImpact',
    'I want my work to have a meaningful positive impact on people or society.'
  ),

  q(
    'grad_innovation',
    'values',
    'innovation',
    'I want opportunities to keep learning and working on new problems.'
  ),

  q(
    'grad_worklife',
    'values',
    'workLifeBalance',
    'Work-life balance strongly influences the opportunities I am willing to accept.'
  ),

  q(
    'grad_switch',
    'strength',
    'adaptability',
    'I would change industries if the new path offered stronger fit and realistic opportunity.'
  ),

  q(
    'grad_higherstudy',
    'interest',
    'research',
    'I would pursue higher education if the expected career benefit justified the time and cost.'
  ),

  q(
    'grad_exam',
    'strength',
    'discipline',
    'I am prepared for sustained competitive-exam preparation if a government or professional career is my preferred direction.'
  ),

  q(
    'grad_portfolio',
    'strength',
    'discipline',
    'I am willing to build new projects, certifications or portfolio evidence before applying for a new role.'
  ),

  q(
    'grad_network',
    'strength',
    'communication',
    'I am comfortable networking and reaching out to people for professional opportunities.'
  ),

  q(
    'grad_uncertainty',
    'strength',
    'adaptability',
    'I can accept short-term uncertainty if a career transition has strong long-term potential.'
  ),
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
      'Software engineering, artificial intelligence, data, cybersecurity, cloud and digital systems.',
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
      'Mechanical, electrical, electronics, civil, chemical and interdisciplinary engineering careers.',
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
      'Integrated Engineering Program',
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
      'Medicine, dentistry, AYUSH and patient-focused clinical careers.',
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
      'Nursing, pharmacy, physiotherapy, rehabilitation and allied health professions.',
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
      'pharmacy',
      'medical',
    ],
  },

  {
    id: 'science-research',
    name: 'Pure Sciences & Research',
    description:
      'Physics, chemistry, biology, mathematics and research-oriented scientific careers.',
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
      'Finance, economics, banking, accounting, investment and professional commerce careers.',
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
      'Litigation, corporate law, legal research, policy and legal services.',
    traits: [
      'law',
      'communication',
      'logic',
      'research',
      'socialImpact',
    ],
    streams: [
      'Humanities / Arts',
      'Commerce with Mathematics',
      'Commerce without Mathematics',
      'Science - PCM',
      'Science - PCB',
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
      'Civil services, public administration, government, regulation and policy careers.',
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
      'Product design, UI/UX, communication design and creative technology.',
    traits: [
      'creative',
      'visualArt',
      'technology',
      'innovation',
      'observation',
    ],
    streams: [
      'Fine Arts / Visual Arts',
      'Humanities / Arts',
      'Science - PCM',
      'Commerce with Mathematics',
      'Commerce without Mathematics',
      'Any stream',
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
      'Fashion design, textiles, styling and lifestyle industries.',
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
      'Humanities / Arts',
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
      'Painting, illustration, sculpture, photography and visual-art careers.',
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
      'Acting, theatre, stage, music, dance and performance careers.',
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
      'Film production, journalism, television, content and digital media.',
    traits: [
      'creative',
      'communication',
      'performance',
      'dynamic',
      'observation',
    ],
    streams: [
      'Humanities / Arts',
      'Any stream',
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
      'Architecture, planning, spatial design and built-environment careers.',
    traits: [
      'creative',
      'visualArt',
      'mathematics',
      'problemSolving',
      'practical',
    ],
    streams: [
      'Science - PCM',
      'Science - PCM + Computer Science',
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
      'Hotels, restaurants, culinary arts, food service and guest experience.',
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
      'Hospitality / Hotel Management interest',
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
      'Humanities with Psychology',
      'Science - PCB',
      'Science - PCB + Psychology',
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
      'Teaching, education, learning design and academic careers.',
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
      'Agriculture, food systems, environment, forestry and sustainability.',
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
      'Science - PCMB',
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
      'Armed forces and disciplined uniformed-service careers.',
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
      'Marine engineering, nautical science and maritime careers.',
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
      'Competitive sports, coaching, fitness, sports science and management.',
    traits: [
      'sports',
      'discipline',
      'practical',
      'people',
      'dynamic',
    ],
    streams: [
      'Sports / Physical Education',
      'Any stream',
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
      'Commercial aviation, aviation operations and airport careers.',
    traits: [
      'discipline',
      'systems',
      'technology',
      'communication',
      'dynamic',
    ],
    streams: [
      'Science - PCM',
      'Any stream',
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
      'Practical technical skills, industrial trades and employment-focused vocational paths.',
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
| STAGE FUNCTIONS
|--------------------------------------------------------------------------
*/

export function getStageFromClass(
  classValue
) {
  return (
    CLASS_OPTIONS.find(
      (item) =>
        item.value ===
        classValue
    )?.stage ||
    null
  );
}


/*
|--------------------------------------------------------------------------
| STAGE-SPECIFIC QUESTION ENGINE
|--------------------------------------------------------------------------
|
| No shared common question list is prepended.
| Each stage gets its own complete question bank.
|
*/

export function getQuestionsForStage(
  stage
) {
  switch (stage) {
    case 'foundation':
      return [
        ...FOUNDATION_QUESTIONS,
      ];

    case 'class10':
      return [
        ...CLASS10_QUESTIONS,
      ];

    case 'senior-secondary':
      return [
        ...SENIOR_SECONDARY_QUESTIONS,
      ];

    case 'college':
      return [
        ...COLLEGE_QUESTIONS,
      ];

    case 'graduate':
      return [
        ...GRADUATE_QUESTIONS,
      ];

    default:
      return [];
  }
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