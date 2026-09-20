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
| Student basics
|--------------------------------------------------------------------------
*/

export const CLASS_OPTIONS = [
  'Class 8',
  'Class 9',
  'Class 10',
  'Class 11',
  'Class 12',
  'College',
  'Graduate',
];

export const BOARD_OPTIONS = [
  'CBSE',
  'ICSE / ISC',
  'State Board',
  'IB',
  'Cambridge',
  'Other',
];

export const STREAM_OPTIONS = [
  'Not selected yet',
  'Science - PCM',
  'Science - PCB',
  'Science - PCMB',
  'Commerce',
  'Humanities / Arts',
  'Vocational',
  'Other',
];

export const SUBJECT_OPTIONS = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science',
  'English',
  'Economics',
  'Accountancy',
  'Business Studies',
  'Political Science',
  'History',
  'Geography',
  'Psychology',
  'Sociology',
  'Fine Arts / Design',
  'Physical Education',
];

/*
|--------------------------------------------------------------------------
| Assessment questions
|--------------------------------------------------------------------------
|
| Around 40 questions.
|
| Sections:
| interest       = 12
| strength       = 8
| academic       = 7
| work           = 6
| values         = 7
|
| Total          = 40
|
*/

export const CAREER_ASSESSMENT_QUESTIONS = [
  /*
  |--------------------------------------------------------------------------
  | INTEREST — 12
  |--------------------------------------------------------------------------
  */

  {
    id: 'interest_technology_1',
    section: 'interest',
    trait: 'technology',
    text:
      'I enjoy understanding how apps, computers, machines, electronics or digital systems work.',
  },

  {
    id: 'interest_science_1',
    section: 'interest',
    trait: 'science',
    text:
      'I enjoy asking why things happen and exploring scientific explanations.',
  },

  {
    id: 'interest_healthcare_1',
    section: 'interest',
    trait: 'healthcare',
    text:
      'Learning about the human body, health, medicines or patient care interests me.',
  },

  {
    id: 'interest_business_1',
    section: 'interest',
    trait: 'business',
    text:
      'I find businesses, markets, products, customers and how companies grow interesting.',
  },

  {
    id: 'interest_creative_1',
    section: 'interest',
    trait: 'creative',
    text:
      'I naturally enjoy designing, drawing, writing, editing, creating visuals or making original things.',
  },

  {
    id: 'interest_social_1',
    section: 'interest',
    trait: 'socialHelping',
    text:
      'I feel interested in understanding people and helping them solve personal or social problems.',
  },

  {
    id: 'interest_governance_1',
    section: 'interest',
    trait: 'lawGovernance',
    text:
      'Law, public policy, government, current affairs and how society is governed interest me.',
  },

  {
    id: 'interest_research_1',
    section: 'interest',
    trait: 'research',
    text:
      'I would enjoy spending time investigating a difficult question even if the answer is not immediately obvious.',
  },

  {
    id: 'interest_practical_1',
    section: 'interest',
    trait: 'practical',
    text:
      'I enjoy building, fixing, operating or experimenting with real objects and equipment.',
  },

  {
    id: 'interest_communication_1',
    section: 'interest',
    trait: 'communication',
    text:
      'I enjoy presenting ideas, writing, speaking, explaining or communicating with an audience.',
  },

  {
    id: 'interest_outdoor_1',
    section: 'interest',
    trait: 'outdoor',
    text:
      'I would enjoy a career that sometimes involves fieldwork, travel, outdoor activity or working outside a normal office.',
  },

  {
    id: 'interest_entrepreneurship_1',
    section: 'interest',
    trait: 'entrepreneurship',
    text:
      'Starting something of my own, building a product or taking responsibility for a new venture excites me.',
  },

  /*
  |--------------------------------------------------------------------------
  | STRENGTHS — 8
  |--------------------------------------------------------------------------
  */

  {
    id: 'strength_logic_1',
    section: 'strength',
    trait: 'logicalReasoning',
    text:
      'I can usually break a complicated problem into smaller logical steps.',
    validationGroup: 'logic',
  },

  {
    id: 'strength_numbers_1',
    section: 'strength',
    trait: 'numerical',
    text:
      'I am comfortable interpreting numbers, calculations, graphs or quantitative information.',
  },

  {
    id: 'strength_problem_1',
    section: 'strength',
    trait: 'problemSolving',
    text:
      'When something does not work, I usually want to find the cause instead of immediately giving up.',
    validationGroup: 'problem',
  },

  {
    id: 'strength_creativity_1',
    section: 'strength',
    trait: 'creativity',
    text:
      'I can often think of multiple different ways to approach the same task.',
  },

  {
    id: 'strength_communication_1',
    section: 'strength',
    trait: 'communication',
    text:
      'I can explain an idea clearly enough that another person can understand it.',
  },

  {
    id: 'strength_leadership_1',
    section: 'strength',
    trait: 'leadership',
    text:
      'In group situations, I am comfortable organizing people or taking responsibility when needed.',
  },

  {
    id: 'strength_empathy_1',
    section: 'strength',
    trait: 'empathy',
    text:
      'I often notice how other people may be feeling and can understand their point of view.',
  },

  {
    id: 'strength_observation_1',
    section: 'strength',
    trait: 'observation',
    text:
      'I notice details, patterns or small changes that other people sometimes miss.',
  },

  /*
  |--------------------------------------------------------------------------
  | ACADEMIC — 7
  |--------------------------------------------------------------------------
  */

  {
    id: 'academic_math_1',
    section: 'academic',
    trait: 'mathematics',
    text:
      'I am comfortable learning mathematics when I understand the underlying logic.',
  },

  {
    id: 'academic_physics_1',
    section: 'academic',
    trait: 'physics',
    text:
      'Concepts involving forces, motion, electricity, machines or physical systems make sense to me.',
  },

  {
    id: 'academic_chemistry_1',
    section: 'academic',
    trait: 'chemistry',
    text:
      'I can engage with chemical concepts, reactions, materials and laboratory-based learning.',
  },

  {
    id: 'academic_biology_1',
    section: 'academic',
    trait: 'biology',
    text:
      'I am comfortable learning biological concepts such as cells, organisms, health and life processes.',
  },

  {
    id: 'academic_language_1',
    section: 'academic',
    trait: 'language',
    text:
      'Reading, writing, comprehension and expressing ideas through language are comfortable for me.',
  },

  {
    id: 'academic_social_1',
    section: 'academic',
    trait: 'socialScience',
    text:
      'I enjoy understanding society, economics, history, geography, politics or human behaviour.',
  },

  {
    id: 'academic_computer_1',
    section: 'academic',
    trait: 'computerScience',
    text:
      'I am comfortable learning programming, computational thinking or computer-related concepts.',
  },

  /*
  |--------------------------------------------------------------------------
  | WORK PREFERENCE — 6
  |--------------------------------------------------------------------------
  */

  {
    id: 'work_systems_1',
    section: 'work',
    trait: 'systems',
    text:
      'I would enjoy work where I spend significant time solving technical, analytical or system-oriented problems.',
  },

  {
    id: 'work_people_1',
    section: 'work',
    trait: 'people',
    text:
      'Regularly interacting with, supporting or influencing people would make work more satisfying for me.',
  },

  {
    id: 'work_structure_1',
    section: 'work',
    trait: 'structured',
    text:
      'I prefer clear processes, defined responsibilities and measurable goals.',
  },

  {
    id: 'work_flexible_1',
    section: 'work',
    trait: 'flexible',
    text:
      'I prefer freedom to experiment and choose how I approach my work.',
  },

  {
    id: 'work_team_1',
    section: 'work',
    trait: 'teamwork',
    text:
      'I enjoy collaborating with a team rather than doing everything independently.',
  },

  {
    id: 'work_dynamic_1',
    section: 'work',
    trait: 'dynamic',
    text:
      'I would enjoy work where projects, problems or environments change regularly.',
  },

  /*
  |--------------------------------------------------------------------------
  | CAREER VALUES — 7
  |--------------------------------------------------------------------------
  */

  {
    id: 'value_income_1',
    section: 'values',
    trait: 'income',
    text:
      'High earning potential is an important factor when I think about my future career.',
  },

  {
    id: 'value_stability_1',
    section: 'values',
    trait: 'stability',
    text:
      'Long-term job stability and predictable career progression are important to me.',
  },

  {
    id: 'value_impact_1',
    section: 'values',
    trait: 'socialImpact',
    text:
      'I want my work to create a meaningful positive impact on people or society.',
  },

  {
    id: 'value_creativity_1',
    section: 'values',
    trait: 'creativeFreedom',
    text:
      'Having freedom to create, design or express original ideas is important to me.',
  },

  {
    id: 'value_balance_1',
    section: 'values',
    trait: 'workLifeBalance',
    text:
      'Having enough personal time outside work is an important career priority for me.',
  },

  {
    id: 'value_innovation_1',
    section: 'values',
    trait: 'innovation',
    text:
      'I would prefer a career where I can keep learning, experimenting and working on new ideas.',
  },

  {
    id: 'value_entrepreneurship_1',
    section: 'values',
    trait: 'entrepreneurialFreedom',
    text:
      'Having the possibility of starting a business, freelancing or working independently appeals to me.',
  },
];

/*
|--------------------------------------------------------------------------
| Cross-question validation pairs
|--------------------------------------------------------------------------
|
| These do not diagnose personality.
| They only help estimate answer consistency.
|
*/

export const VALIDATION_PAIRS = [
  [
    'interest_technology_1',
    'work_systems_1',
  ],
  [
    'interest_creative_1',
    'value_creativity_1',
  ],
  [
    'interest_social_1',
    'strength_empathy_1',
  ],
  [
    'interest_business_1',
    'value_entrepreneurship_1',
  ],
  [
    'interest_research_1',
    'value_innovation_1',
  ],
  [
    'interest_communication_1',
    'strength_communication_1',
  ],
];

/*
|--------------------------------------------------------------------------
| Practical profile options
|--------------------------------------------------------------------------
*/

export const PRACTICAL_OPTIONS = {
  studyCommitment: [
    {
      value: 'short',
      label:
        'Prefer a shorter study path',
    },
    {
      value: 'medium',
      label:
        'Comfortable with 3–4 years of higher education',
    },
    {
      value: 'long',
      label:
        'Comfortable with 5+ years if the career requires it',
    },
  ],

  budgetFlexibility: [
    {
      value: 'limited',
      label:
        'Budget is a major constraint',
    },
    {
      value: 'moderate',
      label:
        'Moderate flexibility',
    },
    {
      value: 'flexible',
      label:
        'Flexible if the opportunity is strong',
    },
  ],

  locationFlexibility: [
    {
      value: 'local',
      label:
        'Prefer studying / working near home',
    },
    {
      value: 'state',
      label:
        'Comfortable moving within my state / region',
    },
    {
      value: 'anywhere',
      label:
        'Comfortable moving anywhere for the right opportunity',
    },
  ],

  competitiveExam: [
    {
      value: 'avoid',
      label:
        'Prefer paths with fewer highly competitive entrance exams',
    },
    {
      value: 'maybe',
      label:
        'Open to competitive exams if needed',
    },
    {
      value: 'willing',
      label:
        'Comfortable preparing seriously for competitive exams',
    },
  ],
};

/*
|--------------------------------------------------------------------------
| Career families
|--------------------------------------------------------------------------
*/

export const CAREER_FAMILIES = [
  {
    id: 'computer-ai',
    name:
      'Computer Science & AI',
    icon:
      '\uD83D\uDCBB',
    description:
      'Build software, intelligent systems, digital products, data platforms and secure computing systems.',

    streams: [
      'Science - PCM',
      'Science - PCMB',
      'Diploma / vocational technology routes',
    ],

    roles: [
      'Software Engineer',
      'AI / ML Engineer',
      'Data Scientist',
      'Cybersecurity Analyst',
      'Cloud Engineer',
      'Product Engineer',
    ],

    subjects: [
      'Mathematics',
      'Computer Science',
      'Physics',
    ],

    entrances: [
      'JEE Main',
      'JEE Advanced',
      'BITSAT',
      'State Engineering CETs',
      'CUET',
      'University-specific admissions',
    ],

    roadmap: [
      'Build mathematics and logical reasoning',
      'Learn programming fundamentals',
      'Explore engineering / CS entrance routes',
      'Choose CS / IT / AI / Data-related degree or equivalent skill path',
      'Build projects and internships',
      'Specialize in software, AI, data, cloud or cybersecurity',
    ],

    profile: {
      interest: [
        'technology',
        'research',
      ],

      strength: [
        'logicalReasoning',
        'problemSolving',
        'numerical',
        'observation',
      ],

      academic: [
        'mathematics',
        'computerScience',
        'physics',
      ],

      work: [
        'systems',
        'flexible',
        'dynamic',
      ],

      values: [
        'income',
        'innovation',
        'entrepreneurialFreedom',
      ],
    },

    practical: {
      studyCommitment: [
        'medium',
        'long',
      ],

      budgetFlexibility: [
        'limited',
        'moderate',
        'flexible',
      ],

      locationFlexibility: [
        'local',
        'state',
        'anywhere',
      ],

      competitiveExam: [
        'maybe',
        'willing',
      ],
    },

    cautions: [
      'Technology changes quickly, so continuous learning is important.',
      'Strong logical thinking and consistent practice matter more than only memorizing concepts.',
    ],
  },

  {
    id: 'engineering-technology',
    name:
      'Engineering & Technology',
    icon:
      '\u2699\uFE0F',
    description:
      'Design, build and improve machines, electronics, infrastructure, industrial systems and technology.',

    streams: [
      'Science - PCM',
      'Science - PCMB',
      'Diploma / Polytechnic',
    ],

    roles: [
      'Mechanical Engineer',
      'Electronics Engineer',
      'Electrical Engineer',
      'Civil Engineer',
      'Robotics Engineer',
      'Industrial Engineer',
    ],

    subjects: [
      'Mathematics',
      'Physics',
      'Chemistry',
    ],

    entrances: [
      'JEE Main',
      'JEE Advanced',
      'BITSAT',
      'State Engineering CETs',
      'Diploma / Polytechnic admissions',
    ],

    roadmap: [
      'Strengthen mathematics and physics',
      'Explore engineering disciplines',
      'Prepare for relevant entrance examinations',
      'Choose an engineering specialization',
      'Build technical projects',
      'Complete internships and industry exposure',
    ],

    profile: {
      interest: [
        'technology',
        'practical',
        'science',
      ],

      strength: [
        'logicalReasoning',
        'problemSolving',
        'numerical',
        'observation',
      ],

      academic: [
        'mathematics',
        'physics',
        'chemistry',
      ],

      work: [
        'systems',
        'structured',
        'teamwork',
      ],

      values: [
        'innovation',
        'income',
        'stability',
      ],
    },

    practical: {
      studyCommitment: [
        'medium',
        'long',
      ],

      budgetFlexibility: [
        'limited',
        'moderate',
        'flexible',
      ],

      locationFlexibility: [
        'state',
        'anywhere',
      ],

      competitiveExam: [
        'maybe',
        'willing',
      ],
    },

    cautions: [
      'Different engineering branches have very different work environments.',
      'Hands-on projects are important for understanding whether engineering genuinely suits you.',
    ],
  },

  {
    id: 'medicine-healthcare',
    name:
      'Medicine & Healthcare',
    icon:
      '\u2695\uFE0F',
    description:
      'Work in patient care, medicine, diagnosis, rehabilitation, pharmacy and healthcare systems.',

    streams: [
      'Science - PCB',
      'Science - PCMB',
    ],

    roles: [
      'Doctor',
      'Dentist',
      'Pharmacist',
      'Physiotherapist',
      'Nurse',
      'Public Health Professional',
    ],

    subjects: [
      'Biology',
      'Chemistry',
      'Physics',
    ],

    entrances: [
      'NEET UG',
      'State healthcare admissions',
      'University-specific health science admissions',
    ],

    roadmap: [
      'Build a strong Biology and Chemistry foundation',
      'Understand healthcare career options beyond only MBBS',
      'Prepare for relevant entrance exams',
      'Complete professional healthcare education',
      'Gain clinical / practical exposure',
      'Choose specialization where required',
    ],

    profile: {
      interest: [
        'healthcare',
        'science',
        'socialHelping',
      ],

      strength: [
        'empathy',
        'observation',
        'problemSolving',
      ],

      academic: [
        'biology',
        'chemistry',
        'physics',
      ],

      work: [
        'people',
        'structured',
        'teamwork',
      ],

      values: [
        'socialImpact',
        'stability',
      ],
    },

    practical: {
      studyCommitment: [
        'long',
      ],

      budgetFlexibility: [
        'moderate',
        'flexible',
      ],

      locationFlexibility: [
        'state',
        'anywhere',
      ],

      competitiveExam: [
        'willing',
      ],
    },

    cautions: [
      'Many healthcare careers require long study periods and professional licensing.',
      'Patient-facing roles can involve emotional pressure and irregular schedules.',
    ],
  },

  {
    id: 'life-sciences',
    name:
      'Life Sciences & Biotechnology',
    icon:
      '\uD83E\uDDEC',
    description:
      'Study living systems and apply biology to biotechnology, genetics, pharmaceuticals and health research.',

    streams: [
      'Science - PCB',
      'Science - PCMB',
    ],

    roles: [
      'Biotechnologist',
      'Microbiologist',
      'Genetics Researcher',
      'Clinical Research Associate',
      'Bioinformatics Analyst',
      'Pharmaceutical Researcher',
    ],

    subjects: [
      'Biology',
      'Chemistry',
      'Computer Science',
    ],

    entrances: [
      'CUET',
      'IISER Aptitude Test',
      'University-specific admissions',
      'Engineering entrances for biotechnology programs',
    ],

    roadmap: [
      'Strengthen biology and chemistry',
      'Explore biotechnology and life-science domains',
      'Choose BSc / BS / BTech / integrated science routes',
      'Gain laboratory or computational research exposure',
      'Consider postgraduate specialization',
    ],

    profile: {
      interest: [
        'science',
        'healthcare',
        'research',
      ],

      strength: [
        'observation',
        'problemSolving',
        'logicalReasoning',
      ],

      academic: [
        'biology',
        'chemistry',
        'computerScience',
      ],

      work: [
        'systems',
        'structured',
      ],

      values: [
        'innovation',
        'socialImpact',
      ],
    },

    practical: {
      studyCommitment: [
        'medium',
        'long',
      ],

      budgetFlexibility: [
        'limited',
        'moderate',
        'flexible',
      ],

      locationFlexibility: [
        'state',
        'anywhere',
      ],

      competitiveExam: [
        'maybe',
        'willing',
      ],
    },

    cautions: [
      'Research-intensive careers often benefit from postgraduate study.',
      'Career outcomes vary significantly by specialization and research experience.',
    ],
  },

  {
    id: 'pure-science-research',
    name:
      'Pure Sciences & Research',
    icon:
      '\uD83D\uDD2C',
    description:
      'Investigate fundamental questions in physics, chemistry, mathematics and scientific research.',

    streams: [
      'Science - PCM',
      'Science - PCB',
      'Science - PCMB',
    ],

    roles: [
      'Research Scientist',
      'Physicist',
      'Chemist',
      'Mathematician',
      'Scientific Analyst',
      'Academic Researcher',
    ],

    subjects: [
      'Mathematics',
      'Physics',
      'Chemistry',
      'Biology',
    ],

    entrances: [
      'IISER Aptitude Test',
      'NEST',
      'CUET',
      'ISI admission tests',
      'CMI admission tests',
      'University-specific science admissions',
    ],

    roadmap: [
      'Build strong conceptual science foundations',
      'Explore scientific problem solving',
      'Choose BS / BSc / integrated research programs',
      'Participate in research projects',
      'Consider MSc / PhD depending on career goals',
    ],

    profile: {
      interest: [
        'science',
        'research',
      ],

      strength: [
        'logicalReasoning',
        'numerical',
        'observation',
        'problemSolving',
      ],

      academic: [
        'mathematics',
        'physics',
        'chemistry',
        'biology',
      ],

      work: [
        'systems',
        'flexible',
      ],

      values: [
        'innovation',
        'socialImpact',
      ],
    },

    practical: {
      studyCommitment: [
        'long',
      ],

      budgetFlexibility: [
        'limited',
        'moderate',
        'flexible',
      ],

      locationFlexibility: [
        'state',
        'anywhere',
      ],

      competitiveExam: [
        'maybe',
        'willing',
      ],
    },

    cautions: [
      'Research careers often involve long education pathways.',
      'Curiosity and persistence are important because results may take time.',
    ],
  },

  {
    id: 'business-management',
    name:
      'Business & Management',
    icon:
      '\uD83D\uDCBC',
    description:
      'Manage organizations, teams, products, operations, marketing and business strategy.',

    streams: [
      'Commerce',
      'Science',
      'Humanities / Arts',
      'Any stream',
    ],

    roles: [
      'Product Manager',
      'Marketing Manager',
      'Operations Manager',
      'Business Analyst',
      'Management Consultant',
      'Sales Leader',
    ],

    subjects: [
      'Business Studies',
      'Economics',
      'Mathematics',
      'English',
    ],

    entrances: [
      'CUET',
      'IPMAT',
      'NPAT',
      'SET',
      'University-specific admissions',
      'CAT later for MBA',
    ],

    roadmap: [
      'Develop communication and analytical ability',
      'Learn business fundamentals',
      'Choose BBA / BMS / BCom / economics / related program',
      'Gain internships and leadership exposure',
      'Specialize in marketing, operations, product, consulting or strategy',
    ],

    profile: {
      interest: [
        'business',
        'communication',
      ],

      strength: [
        'leadership',
        'communication',
        'problemSolving',
      ],

      academic: [
        'language',
        'mathematics',
        'socialScience',
      ],

      work: [
        'people',
        'teamwork',
        'dynamic',
      ],

      values: [
        'income',
        'innovation',
        'entrepreneurialFreedom',
      ],
    },

    practical: {
      studyCommitment: [
        'medium',
        'long',
      ],

      budgetFlexibility: [
        'limited',
        'moderate',
        'flexible',
      ],

      locationFlexibility: [
        'local',
        'state',
        'anywhere',
      ],

      competitiveExam: [
        'avoid',
        'maybe',
        'willing',
      ],
    },

    cautions: [
      'Management is a broad field, so real internships are useful before specializing.',
      'Communication and execution skills matter strongly alongside academic performance.',
    ],
  },

  {
    id: 'finance-economics',
    name:
      'Finance & Economics',
    icon:
      '\uD83D\uDCCA',
    description:
      'Work with money, markets, investment, financial analysis, accounting and economic decision-making.',

    streams: [
      'Commerce',
      'Science',
      'Humanities with Mathematics / Economics',
    ],

    roles: [
      'Financial Analyst',
      'Investment Analyst',
      'Economist',
      'Chartered Accountant',
      'Risk Analyst',
      'Actuarial Analyst',
    ],

    subjects: [
      'Mathematics',
      'Economics',
      'Accountancy',
      'Business Studies',
    ],

    entrances: [
      'CUET',
      'CA Foundation',
      'CMA Foundation',
      'Actuarial examinations',
      'University-specific admissions',
    ],

    roadmap: [
      'Build numerical and analytical skills',
      'Learn economics and financial fundamentals',
      'Choose finance / economics / commerce degree or professional pathway',
      'Gain practical finance experience',
      'Pursue specialization or professional credentials',
    ],

    profile: {
      interest: [
        'business',
        'research',
      ],

      strength: [
        'numerical',
        'logicalReasoning',
        'observation',
      ],

      academic: [
        'mathematics',
        'socialScience',
      ],

      work: [
        'systems',
        'structured',
      ],

      values: [
        'income',
        'stability',
      ],
    },

    practical: {
      studyCommitment: [
        'medium',
        'long',
      ],

      budgetFlexibility: [
        'limited',
        'moderate',
        'flexible',
      ],

      locationFlexibility: [
        'state',
        'anywhere',
      ],

      competitiveExam: [
        'maybe',
        'willing',
      ],
    },

    cautions: [
      'Many high-end finance careers are quantitatively demanding.',
      'Professional qualifications can require sustained exam preparation.',
    ],
  },

  {
    id: 'law',
    name:
      'Law & Legal Careers',
    icon:
      '\u2696\uFE0F',
    description:
      'Work with law, rights, regulation, disputes, contracts and legal institutions.',

    streams: [
      'Any stream',
    ],

    roles: [
      'Lawyer',
      'Corporate Legal Professional',
      'Legal Researcher',
      'Litigation Professional',
      'Compliance Specialist',
      'Judicial Services Aspirant',
    ],

    subjects: [
      'English',
      'Political Science',
      'History',
      'Economics',
    ],

    entrances: [
      'CLAT',
      'AILET',
      'SLAT',
      'MH CET Law',
      'University-specific law admissions',
    ],

    roadmap: [
      'Develop reading and communication skills',
      'Understand legal and social issues',
      'Prepare for law entrances',
      'Complete legal education',
      'Build internships, mooting and research experience',
      'Choose litigation, corporate law, policy or specialization',
    ],

    profile: {
      interest: [
        'lawGovernance',
        'communication',
      ],

      strength: [
        'communication',
        'logicalReasoning',
        'observation',
      ],

      academic: [
        'language',
        'socialScience',
      ],

      work: [
        'people',
        'dynamic',
        'structured',
      ],

      values: [
        'socialImpact',
        'income',
      ],
    },

    practical: {
      studyCommitment: [
        'medium',
        'long',
      ],

      budgetFlexibility: [
        'limited',
        'moderate',
        'flexible',
      ],

      locationFlexibility: [
        'state',
        'anywhere',
      ],

      competitiveExam: [
        'maybe',
        'willing',
      ],
    },

    cautions: [
      'Legal careers involve significant reading, writing and argumentation.',
      'Early internships help distinguish litigation, corporate and policy pathways.',
    ],
  },

  {
    id: 'government-civil-services',
    name:
      'Government & Civil Services',
    icon:
      '\uD83C\uDFDB\uFE0F',
    description:
      'Work in administration, government services, public institutions, regulation and policymaking.',

    streams: [
      'Any stream',
    ],

    roles: [
      'Civil Services Officer',
      'State Government Officer',
      'Policy Officer',
      'Public Administrator',
      'Government Analyst',
      'Regulatory Professional',
    ],

    subjects: [
      'Political Science',
      'History',
      'Geography',
      'Economics',
      'English',
    ],

    entrances: [
      'UPSC Civil Services later',
      'State PSC examinations',
      'SSC examinations',
      'Government recruitment examinations',
    ],

    roadmap: [
      'Build general awareness and communication',
      'Choose a suitable undergraduate degree',
      'Develop disciplined study habits',
      'Understand public administration and current affairs',
      'Prepare for relevant government examinations',
    ],

    profile: {
      interest: [
        'lawGovernance',
        'socialHelping',
      ],

      strength: [
        'communication',
        'leadership',
        'logicalReasoning',
      ],

      academic: [
        'socialScience',
        'language',
      ],

      work: [
        'people',
        'structured',
        'teamwork',
      ],

      values: [
        'stability',
        'socialImpact',
      ],
    },

    practical: {
      studyCommitment: [
        'medium',
        'long',
      ],

      budgetFlexibility: [
        'limited',
        'moderate',
        'flexible',
      ],

      locationFlexibility: [
        'state',
        'anywhere',
      ],

      competitiveExam: [
        'willing',
      ],
    },

    cautions: [
      'Government examinations can be highly competitive.',
      'Students should keep parallel career options instead of relying on one examination only.',
    ],
  },

  {
    id: 'design-creative',
    name:
      'Design & Creative Arts',
    icon:
      '\uD83C\uDFA8',
    description:
      'Create visual, digital, physical and interactive experiences through creativity and design thinking.',

    streams: [
      'Any stream',
    ],

    roles: [
      'UX Designer',
      'Product Designer',
      'Graphic Designer',
      'Animator',
      'Fashion Designer',
      'Illustrator',
    ],

    subjects: [
      'Fine Arts / Design',
      'English',
      'Computer Science',
    ],

    entrances: [
      'NID DAT',
      'UCEED',
      'NIFT Entrance',
      'University-specific design admissions',
      'Portfolio-based admissions',
    ],

    roadmap: [
      'Practice visual and creative thinking',
      'Explore multiple design disciplines',
      'Build a portfolio',
      'Prepare for design entrance tests where relevant',
      'Complete design education or focused professional training',
      'Build internships and real projects',
    ],

    profile: {
      interest: [
        'creative',
        'communication',
      ],

      strength: [
        'creativity',
        'observation',
        'communication',
      ],

      academic: [
        'language',
        'computerScience',
      ],

      work: [
        'flexible',
        'dynamic',
      ],

      values: [
        'creativeFreedom',
        'innovation',
        'entrepreneurialFreedom',
      ],
    },

    practical: {
      studyCommitment: [
        'short',
        'medium',
        'long',
      ],

      budgetFlexibility: [
        'limited',
        'moderate',
        'flexible',
      ],

      locationFlexibility: [
        'local',
        'state',
        'anywhere',
      ],

      competitiveExam: [
        'avoid',
        'maybe',
        'willing',
      ],
    },

    cautions: [
      'A strong portfolio can matter as much as academic marks in many design careers.',
      'Creative careers often require repeated feedback and iteration.',
    ],
  },

  {
    id: 'architecture',
    name:
      'Architecture & Built Environment',
    icon:
      '\uD83C\uDFD7\uFE0F',
    description:
      'Combine design, mathematics and technical planning to create buildings and physical spaces.',

    streams: [
      'Science - PCM',
    ],

    roles: [
      'Architect',
      'Urban Designer',
      'Interior Architect',
      'Landscape Architect',
      'Urban Planner',
      'Building Design Specialist',
    ],

    subjects: [
      'Mathematics',
      'Physics',
      'Fine Arts / Design',
    ],

    entrances: [
      'NATA',
      'JEE Main Paper 2',
      'University-specific architecture admissions',
    ],

    roadmap: [
      'Build mathematics and visual thinking',
      'Practice sketching and spatial reasoning',
      'Prepare for architecture entrances',
      'Complete professional architecture education',
      'Build studio and internship experience',
    ],

    profile: {
      interest: [
        'creative',
        'technology',
        'practical',
      ],

      strength: [
        'creativity',
        'observation',
        'problemSolving',
      ],

      academic: [
        'mathematics',
        'physics',
      ],

      work: [
        'systems',
        'flexible',
        'teamwork',
      ],

      values: [
        'creativeFreedom',
        'innovation',
      ],
    },

    practical: {
      studyCommitment: [
        'long',
      ],

      budgetFlexibility: [
        'moderate',
        'flexible',
      ],

      locationFlexibility: [
        'state',
        'anywhere',
      ],

      competitiveExam: [
        'maybe',
        'willing',
      ],
    },

    cautions: [
      'Architecture education is studio-intensive and typically longer than many undergraduate programs.',
      'The profession combines creativity with technical rules and client constraints.',
    ],
  },

  {
    id: 'media-communication',
    name:
      'Media & Communication',
    icon:
      '\uD83C\uDFA4',
    description:
      'Create, communicate and distribute information through journalism, digital media, content and communication.',

    streams: [
      'Any stream',
    ],

    roles: [
      'Journalist',
      'Content Strategist',
      'Public Relations Professional',
      'Digital Media Producer',
      'Copywriter',
      'Communication Specialist',
    ],

    subjects: [
      'English',
      'Political Science',
      'Psychology',
    ],

    entrances: [
      'CUET',
      'University-specific media admissions',
      'Portfolio / interview-based admissions',
    ],

    roadmap: [
      'Develop strong writing and speaking skills',
      'Explore journalism, content and digital media',
      'Build a writing / video / communication portfolio',
      'Study media, journalism or communication',
      'Gain internships and publishing experience',
    ],

    profile: {
      interest: [
        'communication',
        'creative',
        'socialHelping',
      ],

      strength: [
        'communication',
        'creativity',
        'observation',
      ],

      academic: [
        'language',
        'socialScience',
      ],

      work: [
        'people',
        'dynamic',
        'flexible',
      ],

      values: [
        'creativeFreedom',
        'socialImpact',
        'entrepreneurialFreedom',
      ],
    },

    practical: {
      studyCommitment: [
        'short',
        'medium',
        'long',
      ],

      budgetFlexibility: [
        'limited',
        'moderate',
        'flexible',
      ],

      locationFlexibility: [
        'state',
        'anywhere',
      ],

      competitiveExam: [
        'avoid',
        'maybe',
        'willing',
      ],
    },

    cautions: [
      'Media careers can be highly portfolio- and experience-driven.',
      'Communication platforms and job roles change rapidly.',
    ],
  },

  {
    id: 'psychology-social-sciences',
    name:
      'Psychology & Social Sciences',
    icon:
      '\uD83E\uDDE0',
    description:
      'Study human behaviour, society, relationships, communities and social systems.',

    streams: [
      'Humanities / Arts',
      'Science',
      'Commerce',
      'Any stream',
    ],

    roles: [
      'Psychology Professional',
      'Behavioural Researcher',
      'Social Researcher',
      'Counselling Professional',
      'Development Sector Professional',
      'Human Resources Professional',
    ],

    subjects: [
      'Psychology',
      'Sociology',
      'English',
      'Political Science',
    ],

    entrances: [
      'CUET',
      'University-specific admissions',
    ],

    roadmap: [
      'Explore psychology and social science subjects',
      'Develop observation and communication skills',
      'Choose psychology / sociology / social science degree',
      'Gain research or community exposure',
      'Pursue postgraduate / professional qualifications where required',
    ],

    profile: {
      interest: [
        'socialHelping',
        'research',
        'communication',
      ],

      strength: [
        'empathy',
        'communication',
        'observation',
      ],

      academic: [
        'socialScience',
        'language',
      ],

      work: [
        'people',
        'teamwork',
      ],

      values: [
        'socialImpact',
        'workLifeBalance',
      ],
    },

    practical: {
      studyCommitment: [
        'medium',
        'long',
      ],

      budgetFlexibility: [
        'limited',
        'moderate',
        'flexible',
      ],

      locationFlexibility: [
        'local',
        'state',
        'anywhere',
      ],

      competitiveExam: [
        'avoid',
        'maybe',
      ],
    },

    cautions: [
      'Professional psychology practice may require postgraduate training and regulated qualifications.',
      'Career paths differ greatly between research, counselling, HR and social-sector work.',
    ],
  },

  {
    id: 'education-teaching',
    name:
      'Education & Teaching',
    icon:
      '\uD83C\uDF93',
    description:
      'Help others learn through teaching, training, curriculum, education technology and academic support.',

    streams: [
      'Any stream',
    ],

    roles: [
      'Teacher',
      'Academic Instructor',
      'Education Content Developer',
      'Instructional Designer',
      'Academic Coordinator',
      'Education Technology Specialist',
    ],

    subjects: [
      'English',
      'Any chosen specialization subject',
    ],

    entrances: [
      'CUET',
      'Teacher education admissions',
      'University-specific admissions',
    ],

    roadmap: [
      'Identify subjects you enjoy explaining',
      'Develop communication and patience',
      'Choose suitable undergraduate specialization',
      'Complete required teacher education where relevant',
      'Gain classroom / tutoring experience',
    ],

    profile: {
      interest: [
        'socialHelping',
        'communication',
      ],

      strength: [
        'communication',
        'empathy',
        'leadership',
      ],

      academic: [
        'language',
        'socialScience',
      ],

      work: [
        'people',
        'structured',
        'teamwork',
      ],

      values: [
        'socialImpact',
        'stability',
        'workLifeBalance',
      ],
    },

    practical: {
      studyCommitment: [
        'medium',
        'long',
      ],

      budgetFlexibility: [
        'limited',
        'moderate',
        'flexible',
      ],

      locationFlexibility: [
        'local',
        'state',
        'anywhere',
      ],

      competitiveExam: [
        'avoid',
        'maybe',
        'willing',
      ],
    },

    cautions: [
      'Teaching quality depends heavily on communication and patience.',
      'Some formal teaching roles require specific education qualifications.',
    ],
  },

  {
    id: 'agriculture-environment',
    name:
      'Agriculture & Environment',
    icon:
      '\uD83C\uDF31',
    description:
      'Work with food systems, agriculture, sustainability, environment, climate and natural resources.',

    streams: [
      'Science - PCB',
      'Science - PCM',
      'Science - PCMB',
      'Agriculture / vocational routes',
    ],

    roles: [
      'Agricultural Scientist',
      'Environmental Analyst',
      'Food Technology Professional',
      'Sustainability Specialist',
      'Agronomist',
      'Environmental Researcher',
    ],

    subjects: [
      'Biology',
      'Chemistry',
      'Geography',
      'Mathematics',
    ],

    entrances: [
      'ICAR-related admissions',
      'CUET',
      'State agriculture admissions',
      'University-specific admissions',
    ],

    roadmap: [
      'Explore agriculture and environmental systems',
      'Build science fundamentals',
      'Choose agriculture / environment / food technology pathway',
      'Gain field and research exposure',
      'Specialize based on agriculture, food, climate or sustainability interests',
    ],

    profile: {
      interest: [
        'science',
        'outdoor',
        'practical',
        'research',
      ],

      strength: [
        'observation',
        'problemSolving',
      ],

      academic: [
        'biology',
        'chemistry',
        'socialScience',
      ],

      work: [
        'dynamic',
        'systems',
      ],

      values: [
        'socialImpact',
        'innovation',
      ],
    },

    practical: {
      studyCommitment: [
        'medium',
        'long',
      ],

      budgetFlexibility: [
        'limited',
        'moderate',
        'flexible',
      ],

      locationFlexibility: [
        'state',
        'anywhere',
      ],

      competitiveExam: [
        'maybe',
        'willing',
      ],
    },

    cautions: [
      'Some roles require significant fieldwork or relocation.',
      'The sector includes very different careers from laboratory research to farm management.',
    ],
  },

  {
    id: 'hospitality-tourism',
    name:
      'Hospitality & Tourism',
    icon:
      '\u2708\uFE0F',
    description:
      'Build customer experiences across hotels, tourism, travel, events, food service and hospitality operations.',

    streams: [
      'Any stream',
    ],

    roles: [
      'Hotel Manager',
      'Travel Consultant',
      'Event Manager',
      'Hospitality Operations Professional',
      'Tourism Manager',
      'Food Service Manager',
    ],

    subjects: [
      'English',
      'Business Studies',
      'Geography',
    ],

    entrances: [
      'NCHM JEE',
      'CUET',
      'University-specific hospitality admissions',
    ],

    roadmap: [
      'Build communication and service orientation',
      'Explore hospitality and tourism domains',
      'Choose hotel management / tourism / hospitality program',
      'Gain internships and customer-facing experience',
      'Specialize in operations, events, travel or hospitality management',
    ],

    profile: {
      interest: [
        'communication',
        'outdoor',
        'business',
      ],

      strength: [
        'communication',
        'leadership',
        'empathy',
      ],

      academic: [
        'language',
        'socialScience',
      ],

      work: [
        'people',
        'teamwork',
        'dynamic',
      ],

      values: [
        'income',
        'socialImpact',
      ],
    },

    practical: {
      studyCommitment: [
        'short',
        'medium',
      ],

      budgetFlexibility: [
        'moderate',
        'flexible',
      ],

      locationFlexibility: [
        'state',
        'anywhere',
      ],

      competitiveExam: [
        'avoid',
        'maybe',
      ],
    },

    cautions: [
      'Hospitality often involves customer-facing work and irregular hours.',
      'Location flexibility can significantly expand career opportunities.',
    ],
  },

  {
    id: 'sports-fitness',
    name:
      'Sports & Fitness',
    icon:
      '\uD83C\uDFC3',
    description:
      'Build careers around sports performance, fitness, coaching, physical education and sports management.',

    streams: [
      'Any stream',
    ],

    roles: [
      'Sports Coach',
      'Fitness Professional',
      'Sports Analyst',
      'Physical Education Professional',
      'Sports Manager',
      'Strength & Conditioning Professional',
    ],

    subjects: [
      'Physical Education',
      'Biology',
    ],

    entrances: [
      'University sports admissions',
      'Physical education admissions',
      'Sports trials / performance-based pathways',
    ],

    roadmap: [
      'Build sports participation and fitness knowledge',
      'Identify performance, coaching or management interests',
      'Choose sports / PE / fitness education route',
      'Gain certifications where relevant',
      'Build practical coaching or performance experience',
    ],

    profile: {
      interest: [
        'outdoor',
        'practical',
        'socialHelping',
      ],

      strength: [
        'leadership',
        'communication',
        'empathy',
      ],

      academic: [
        'biology',
      ],

      work: [
        'people',
        'dynamic',
        'teamwork',
      ],

      values: [
        'socialImpact',
        'workLifeBalance',
      ],
    },

    practical: {
      studyCommitment: [
        'short',
        'medium',
        'long',
      ],

      budgetFlexibility: [
        'limited',
        'moderate',
        'flexible',
      ],

      locationFlexibility: [
        'local',
        'state',
        'anywhere',
      ],

      competitiveExam: [
        'avoid',
        'maybe',
      ],
    },

    cautions: [
      'Many sports careers depend on practical performance and certifications.',
      'Income can vary significantly across roles and experience levels.',
    ],
  },

  {
    id: 'defence-uniformed',
    name:
      'Defence & Uniformed Services',
    icon:
      '\uD83D\uDEE1\uFE0F',
    description:
      'Serve in military, defence, policing and other disciplined uniformed services.',

    streams: [
      'Science - PCM for several technical routes',
      'Any stream for selected non-technical routes',
    ],

    roles: [
      'Armed Forces Officer',
      'Technical Defence Officer',
      'Police Officer',
      'Coast Guard Officer',
      'Defence Technical Professional',
      'Security Services Professional',
    ],

    subjects: [
      'Mathematics',
      'Physics',
      'English',
      'Physical Education',
    ],

    entrances: [
      'NDA',
      'CDS later',
      'AFCAT later',
      'CAPF examinations',
      'State police recruitment',
      'Service-specific entries',
    ],

    roadmap: [
      'Build physical fitness and discipline',
      'Strengthen academic eligibility subjects',
      'Understand defence entry routes',
      'Prepare for written examinations and selection processes',
      'Maintain medical and fitness standards',
    ],

    profile: {
      interest: [
        'outdoor',
        'practical',
        'lawGovernance',
      ],

      strength: [
        'leadership',
        'problemSolving',
        'observation',
      ],

      academic: [
        'mathematics',
        'physics',
        'language',
      ],

      work: [
        'structured',
        'teamwork',
        'dynamic',
      ],

      values: [
        'socialImpact',
        'stability',
      ],
    },

    practical: {
      studyCommitment: [
        'medium',
        'long',
      ],

      budgetFlexibility: [
        'limited',
        'moderate',
        'flexible',
      ],

      locationFlexibility: [
        'anywhere',
      ],

      competitiveExam: [
        'willing',
      ],
    },

    cautions: [
      'Defence careers may require strict medical, physical and selection standards.',
      'Service life can involve relocation, risk and demanding schedules.',
    ],
  },

  {
    id: 'vocational-skilled',
    name:
      'Skilled & Vocational Careers',
    icon:
      '\uD83D\uDD27',
    description:
      'Build practical expertise in technical trades, operations, manufacturing, repair and applied skills.',

    streams: [
      'Vocational',
      'Diploma / Polytechnic',
      'ITI',
      'Any stream depending on specialization',
    ],

    roles: [
      'Industrial Technician',
      'Electrician',
      'Automotive Technician',
      'Machining Specialist',
      'Maintenance Technician',
      'Technical Supervisor',
    ],

    subjects: [
      'Mathematics',
      'Physics',
      'Vocational subjects',
    ],

    entrances: [
      'ITI admissions',
      'Polytechnic admissions',
      'Skill-development programs',
      'Apprenticeship pathways',
    ],

    roadmap: [
      'Identify hands-on technical strengths',
      'Choose a trade or technical specialization',
      'Complete practical training',
      'Gain apprenticeship experience',
      'Add certifications and advanced technical skills',
    ],

    profile: {
      interest: [
        'practical',
        'technology',
      ],

      strength: [
        'problemSolving',
        'observation',
      ],

      academic: [
        'mathematics',
        'physics',
      ],

      work: [
        'systems',
        'structured',
      ],

      values: [
        'stability',
        'income',
      ],
    },

    practical: {
      studyCommitment: [
        'short',
        'medium',
      ],

      budgetFlexibility: [
        'limited',
        'moderate',
        'flexible',
      ],

      locationFlexibility: [
        'local',
        'state',
        'anywhere',
      ],

      competitiveExam: [
        'avoid',
        'maybe',
      ],
    },

    cautions: [
      'Income growth often depends on specialization, certification and experience.',
      'Choose accredited programs with strong apprenticeship or placement links.',
    ],
  },

  {
    id: 'entrepreneurship',
    name:
      'Entrepreneurship & Startups',
    icon:
      '\uD83D\uDE80',
    description:
      'Create and grow businesses, products, services or independent ventures.',

    streams: [
      'Any stream',
    ],

    roles: [
      'Founder',
      'Startup Operator',
      'Independent Consultant',
      'E-commerce Entrepreneur',
      'Product Builder',
      'Small Business Owner',
    ],

    subjects: [
      'Business Studies',
      'Economics',
      'Mathematics',
      'Computer Science',
      'English',
    ],

    entrances: [
      'No single mandatory entrance path',
      'Business / technology / domain-specific higher education',
    ],

    roadmap: [
      'Build problem-solving and communication skills',
      'Learn basic finance and business fundamentals',
      'Identify real customer problems',
      'Build small projects or experiments',
      'Learn sales, product and execution',
      'Scale only after validating demand',
    ],

    profile: {
      interest: [
        'entrepreneurship',
        'business',
        'creative',
      ],

      strength: [
        'leadership',
        'problemSolving',
        'communication',
        'creativity',
      ],

      academic: [
        'mathematics',
        'language',
        'computerScience',
      ],

      work: [
        'flexible',
        'dynamic',
        'people',
      ],

      values: [
        'entrepreneurialFreedom',
        'income',
        'innovation',
        'creativeFreedom',
      ],
    },

    practical: {
      studyCommitment: [
        'short',
        'medium',
        'long',
      ],

      budgetFlexibility: [
        'limited',
        'moderate',
        'flexible',
      ],

      locationFlexibility: [
        'local',
        'state',
        'anywhere',
      ],

      competitiveExam: [
        'avoid',
        'maybe',
        'willing',
      ],
    },

    cautions: [
      'Entrepreneurship has greater uncertainty than most conventional career paths.',
      'Building skills and industry experience before launching can significantly reduce risk.',
    ],
  },
];

/*
|--------------------------------------------------------------------------
| Trait labels
|--------------------------------------------------------------------------
*/

export const TRAIT_LABELS = {
  technology:
    'Technology',

  science:
    'Scientific curiosity',

  healthcare:
    'Healthcare',

  business:
    'Business',

  creative:
    'Creative work',

  socialHelping:
    'Helping people',

  lawGovernance:
    'Law & governance',

  research:
    'Research',

  practical:
    'Hands-on work',

  communication:
    'Communication',

  outdoor:
    'Field / outdoor work',

  entrepreneurship:
    'Entrepreneurship',

  logicalReasoning:
    'Logical reasoning',

  numerical:
    'Numerical comfort',

  problemSolving:
    'Problem solving',

  creativity:
    'Creativity',

  leadership:
    'Leadership',

  empathy:
    'Empathy',

  observation:
    'Observation',

  mathematics:
    'Mathematics',

  physics:
    'Physics',

  chemistry:
    'Chemistry',

  biology:
    'Biology',

  language:
    'Language & communication',

  socialScience:
    'Social sciences',

  computerScience:
    'Computer science',

  systems:
    'Systems-oriented work',

  people:
    'People-oriented work',

  structured:
    'Structured environments',

  flexible:
    'Flexible environments',

  teamwork:
    'Teamwork',

  dynamic:
    'Dynamic environments',

  income:
    'Income potential',

  stability:
    'Stability',

  socialImpact:
    'Social impact',

  creativeFreedom:
    'Creative freedom',

  workLifeBalance:
    'Work-life balance',

  innovation:
    'Innovation',

  entrepreneurialFreedom:
    'Independent / entrepreneurial freedom',
};