const FOUNDATION_AND_CLASS10 = [
  {
    id: 'technology-computing-family',
    kind: 'career-family',
    name: 'Technology & Computing',
    description: 'Explore careers involving computers, software, digital systems, data and emerging technologies.',
    stages: ['foundation', 'class10'],
    traits: {
      technology: 1,
      analytical: 0.9,
      quantitative: 0.75,
      scientific_curiosity: 0.7,
      creativity: 0.55,
      independence: 0.45,
      achievement: 0.55
    },
    subjects: ['mathematics', 'computer science', 'informatics'],
    skills: [],
    courses: ['Computer Science', 'Information Technology', 'Data Science'],
    roles: ['Software Engineer', 'Data Analyst', 'AI Engineer', 'Cybersecurity Professional'],
    nextSteps: [
      'Explore beginner programming activities',
      'Strengthen mathematics and logical problem solving',
      'Try small technology projects'
    ]
  },

  {
    id: 'engineering-family',
    kind: 'career-family',
    name: 'Engineering & Applied Technology',
    description: 'Explore careers focused on designing, building and improving machines, electronics, infrastructure and technical systems.',
    stages: ['foundation', 'class10'],
    traits: {
      analytical: 0.9,
      quantitative: 0.85,
      hands_on: 0.85,
      technology: 0.8,
      scientific_curiosity: 0.8,
      structure: 0.55,
      achievement: 0.55
    },
    subjects: ['mathematics', 'physics', 'science'],
    skills: [],
    courses: ['Engineering', 'Electronics', 'Mechanical Engineering'],
    roles: ['Engineer', 'Electronics Engineer', 'Mechanical Engineer', 'Civil Engineer'],
    nextSteps: [
      'Explore practical science and engineering activities',
      'Strengthen mathematics and physics foundations',
      'Try building or electronics projects'
    ]
  },

  {
    id: 'science-research-family',
    kind: 'career-family',
    name: 'Science & Research',
    description: 'Explore careers involving scientific investigation, experimentation, discovery and research.',
    stages: ['foundation', 'class10'],
    traits: {
      scientific_curiosity: 1,
      analytical: 0.9,
      quantitative: 0.75,
      independence: 0.65,
      structure: 0.55,
      achievement: 0.5
    },
    subjects: ['science', 'physics', 'chemistry', 'biology', 'mathematics'],
    skills: [],
    courses: ['Pure Sciences', 'Research', 'Mathematics'],
    roles: ['Scientist', 'Researcher', 'Research Engineer'],
    nextSteps: [
      'Explore science experiments and competitions',
      'Read beyond the school syllabus in topics you enjoy',
      'Notice which scientific questions keep your attention'
    ]
  },

  {
    id: 'healthcare-family',
    kind: 'career-family',
    name: 'Medicine & Health',
    description: 'Explore careers focused on health, medicine, patient care and life sciences.',
    stages: ['foundation', 'class10'],
    traits: {
      social_helping: 1,
      scientific_curiosity: 0.9,
      structure: 0.7,
      collaboration: 0.65,
      achievement: 0.6,
      stability: 0.55
    },
    subjects: ['biology', 'science', 'chemistry'],
    skills: [],
    courses: ['Medicine', 'Allied Health Sciences', 'Life Sciences'],
    roles: ['Doctor', 'Healthcare Professional', 'Life Science Researcher'],
    nextSteps: [
      'Explore biology and health-related topics',
      'Learn about different healthcare professions',
      'Observe whether patient-care and life-science topics interest you'
    ]
  },

  {
    id: 'business-family',
    kind: 'career-family',
    name: 'Business & Entrepreneurship',
    description: 'Explore careers involving business decisions, leadership, markets and building organizations.',
    stages: ['foundation', 'class10'],
    traits: {
      entrepreneurship: 1,
      leadership: 0.9,
      achievement: 0.8,
      collaboration: 0.65,
      adaptability: 0.7,
      verbal: 0.6,
      analytical: 0.5
    },
    subjects: ['mathematics', 'economics', 'business studies', 'commerce'],
    skills: [],
    courses: ['Business', 'Management', 'Entrepreneurship'],
    roles: ['Entrepreneur', 'Manager', 'Business Professional'],
    nextSteps: [
      'Explore how businesses solve customer problems',
      'Try small leadership or team projects',
      'Learn basic entrepreneurship and financial concepts'
    ]
  },

  {
    id: 'finance-economics-family',
    kind: 'career-family',
    name: 'Finance & Economics',
    description: 'Explore careers involving money, markets, economics, business analysis and financial decisions.',
    stages: ['foundation', 'class10'],
    traits: {
      quantitative: 1,
      analytical: 0.9,
      structure: 0.75,
      achievement: 0.65,
      stability: 0.6,
      entrepreneurship: 0.45
    },
    subjects: ['mathematics', 'economics', 'commerce'],
    skills: [],
    courses: ['Finance', 'Economics', 'Commerce'],
    roles: ['Financial Analyst', 'Economist', 'Investment Professional'],
    nextSteps: [
      'Build comfort with mathematics and percentages',
      'Explore basic economics and personal finance',
      'Follow simple business and market stories'
    ]
  },

  {
    id: 'creative-design-family',
    kind: 'career-family',
    name: 'Design & Creative Fields',
    description: 'Explore careers involving visual thinking, creativity, communication and creating new experiences.',
    stages: ['foundation', 'class10'],
    traits: {
      creativity: 1,
      independence: 0.7,
      adaptability: 0.65,
      achievement: 0.55,
      verbal: 0.5,
      hands_on: 0.5
    },
    subjects: ['art', 'design', 'english'],
    skills: [],
    courses: ['Design', 'Visual Communication', 'Creative Arts'],
    roles: ['Designer', 'UX Designer', 'Creative Professional'],
    nextSteps: [
      'Build a small portfolio of things you create',
      'Experiment with visual and digital design',
      'Explore different creative professions'
    ]
  },

  {
    id: 'law-policy-family',
    kind: 'career-family',
    name: 'Law, Policy & Governance',
    description: 'Explore careers involving reasoning, communication, public policy, law and governance.',
    stages: ['foundation', 'class10'],
    traits: {
      verbal: 1,
      analytical: 0.8,
      leadership: 0.7,
      social_helping: 0.6,
      structure: 0.55,
      achievement: 0.55
    },
    subjects: ['english', 'social science', 'political science', 'history'],
    skills: [],
    courses: ['Law', 'Public Policy', 'Political Science'],
    roles: ['Lawyer', 'Policy Professional', 'Civil Servant'],
    nextSteps: [
      'Practice reading and forming evidence-based arguments',
      'Explore law, government and current-affairs topics',
      'Participate in debates or communication activities'
    ]
  },

  {
    id: 'education-social-impact-family',
    kind: 'career-family',
    name: 'Education & Social Impact',
    description: 'Explore careers focused on teaching, helping people, communities and social development.',
    stages: ['foundation', 'class10'],
    traits: {
      social_helping: 1,
      verbal: 0.8,
      collaboration: 0.8,
      leadership: 0.55,
      stability: 0.5,
      adaptability: 0.5
    },
    subjects: ['english', 'social science'],
    skills: [],
    courses: ['Education', 'Psychology', 'Social Sciences'],
    roles: ['Teacher', 'Education Professional', 'Social Impact Professional'],
    nextSteps: [
      'Try mentoring or helping classmates learn',
      'Explore education and community projects',
      'Notice which kinds of people-focused problems interest you'
    ]
  },

  {
    id: 'media-communication-family',
    kind: 'career-family',
    name: 'Media & Communication',
    description: 'Explore careers involving writing, storytelling, communication, media and public engagement.',
    stages: ['foundation', 'class10'],
    traits: {
      verbal: 1,
      creativity: 0.85,
      adaptability: 0.7,
      collaboration: 0.6,
      leadership: 0.45,
      independence: 0.45
    },
    subjects: ['english', 'languages', 'social science'],
    skills: [],
    courses: ['Journalism', 'Mass Communication', 'Media Studies'],
    roles: ['Journalist', 'Content Professional', 'Media Professional'],
    nextSteps: [
      'Practice writing and storytelling',
      'Experiment with school media or content projects',
      'Explore journalism and communication careers'
    ]
  }
];


const SENIOR_SECONDARY = [
  {
    id: 'software-computing-cluster',
    kind: 'career-cluster',
    name: 'Software & Computing',
    description: 'Career pathways involving software development, computing systems and digital products.',
    stages: ['senior-secondary'],
    traits: {
      technology: 1,
      analytical: 0.95,
      quantitative: 0.75,
      independence: 0.65,
      structure: 0.55,
      achievement: 0.6
    },
    subjects: ['mathematics', 'computer science'],
    skills: ['Programming'],
    courses: ['Computer Science', 'Software Engineering', 'Information Technology'],
    roles: ['Software Engineer', 'Backend Developer', 'Frontend Developer'],
    nextSteps: [
      'Explore programming fundamentals',
      'Compare computing degree pathways',
      'Build a small software project'
    ]
  },

  {
    id: 'ai-data-cluster',
    kind: 'career-cluster',
    name: 'AI, Data & Analytics',
    description: 'Career pathways involving data, statistics, machine learning and analytical decision-making.',
    stages: ['senior-secondary'],
    traits: {
      analytical: 1,
      quantitative: 1,
      technology: 0.85,
      scientific_curiosity: 0.8,
      structure: 0.6,
      independence: 0.55
    },
    subjects: ['mathematics', 'statistics', 'computer science'],
    skills: ['Programming', 'Data Analysis'],
    courses: ['Data Science', 'Artificial Intelligence', 'Statistics'],
    roles: ['Data Analyst', 'Data Scientist', 'ML Engineer'],
    nextSteps: [
      'Strengthen mathematics and statistics',
      'Learn introductory programming',
      'Explore data-analysis projects'
    ]
  },

  {
    id: 'engineering-cluster',
    kind: 'career-cluster',
    name: 'Engineering & Electronics',
    description: 'Career pathways across electronics, electrical, mechanical and other engineering disciplines.',
    stages: ['senior-secondary'],
    traits: {
      analytical: 0.95,
      quantitative: 0.9,
      technology: 0.85,
      hands_on: 0.8,
      scientific_curiosity: 0.75,
      structure: 0.6
    },
    subjects: ['mathematics', 'physics'],
    skills: ['Electronics'],
    courses: ['Electronics Engineering', 'Electrical Engineering', 'Mechanical Engineering'],
    roles: ['Electronics Engineer', 'Embedded Engineer', 'Core Engineer'],
    nextSteps: [
      'Compare major engineering branches',
      'Strengthen mathematics and physics',
      'Try practical technical projects'
    ]
  },

  {
    id: 'health-life-science-cluster',
    kind: 'career-cluster',
    name: 'Medicine & Life Sciences',
    description: 'Pathways involving medicine, healthcare, biology and life-science research.',
    stages: ['senior-secondary'],
    traits: {
      scientific_curiosity: 1,
      social_helping: 0.9,
      structure: 0.7,
      achievement: 0.7,
      collaboration: 0.55,
      stability: 0.5
    },
    subjects: ['biology', 'chemistry', 'physics'],
    skills: [],
    courses: ['Medicine', 'Biotechnology', 'Life Sciences'],
    roles: ['Doctor', 'Healthcare Professional', 'Biological Researcher'],
    nextSteps: [
      'Compare medicine and life-science pathways',
      'Review entrance requirements',
      'Explore healthcare and research careers'
    ]
  },

  {
    id: 'business-finance-cluster',
    kind: 'career-cluster',
    name: 'Business, Finance & Management',
    description: 'Pathways involving management, finance, markets, entrepreneurship and organizational leadership.',
    stages: ['senior-secondary'],
    traits: {
      entrepreneurship: 0.9,
      leadership: 0.8,
      quantitative: 0.7,
      analytical: 0.7,
      achievement: 0.75,
      adaptability: 0.65,
      verbal: 0.55
    },
    subjects: ['economics', 'accountancy', 'business studies', 'mathematics'],
    skills: [],
    courses: ['Business', 'Finance', 'Economics', 'Management'],
    roles: ['Financial Analyst', 'Manager', 'Entrepreneur'],
    nextSteps: [
      'Explore finance and management degrees',
      'Strengthen quantitative and communication skills',
      'Try business case or entrepreneurship activities'
    ]
  },

  {
    id: 'law-humanities-cluster',
    kind: 'career-cluster',
    name: 'Law, Humanities & Public Policy',
    description: 'Pathways involving law, policy, governance, social sciences and public institutions.',
    stages: ['senior-secondary'],
    traits: {
      verbal: 1,
      analytical: 0.8,
      social_helping: 0.65,
      leadership: 0.6,
      structure: 0.5,
      achievement: 0.55
    },
    subjects: ['english', 'political science', 'history', 'economics'],
    skills: ['Communication'],
    courses: ['Law', 'Political Science', 'Economics', 'Public Policy'],
    roles: ['Lawyer', 'Policy Analyst', 'Civil Services Professional'],
    nextSteps: [
      'Explore law and humanities degree pathways',
      'Develop reading and argumentation skills',
      'Research relevant entrance examinations'
    ]
  },

  {
    id: 'design-media-cluster',
    kind: 'career-cluster',
    name: 'Design, Media & Communication',
    description: 'Pathways involving design, communication, storytelling, media and creative problem-solving.',
    stages: ['senior-secondary'],
    traits: {
      creativity: 1,
      verbal: 0.75,
      adaptability: 0.7,
      independence: 0.65,
      collaboration: 0.55,
      achievement: 0.5
    },
    subjects: ['art', 'design', 'english'],
    skills: [],
    courses: ['Design', 'Mass Communication', 'Visual Communication'],
    roles: ['Designer', 'UX Designer', 'Media Professional'],
    nextSteps: [
      'Build a portfolio',
      'Explore design and communication entrance routes',
      'Try real creative projects'
    ]
  }
];


const COLLEGE_AND_GRADUATE = [
  {
    id: 'software-engineer',
    kind: 'career-role',
    name: 'Software Engineer',
    description: 'Builds and maintains software applications, platforms and systems.',
    stages: ['college', 'graduate'],
    traits: {
      technology: 1,
      analytical: 0.95,
      quantitative: 0.65,
      structure: 0.65,
      independence: 0.65,
      achievement: 0.65,
      adaptability: 0.55
    },
    academic: {
      preferredDegrees: ['B.Tech / B.E.', 'BCA', 'B.Sc', 'B.Sc (Hons)', 'BS', 'BS-MS'],
      preferredBranches: ['computer science', 'cse', 'it', 'information technology', 'ece', 'electronics']
    },
    skills: ['Programming', 'Web Development', 'App Development', 'Cloud Computing'],
    courses: ['Computer Science', 'Software Engineering', 'Information Technology'],
    roles: ['Software Engineer', 'Backend Developer', 'Frontend Developer', 'Full-Stack Developer'],
    nextSteps: [
      'Strengthen programming fundamentals',
      'Build deployable projects',
      'Practice data structures and problem solving'
    ]
  },

  {
    id: 'data-analyst',
    kind: 'career-role',
    name: 'Data Analyst',
    description: 'Uses data, statistics and visualization to support decisions.',
    stages: ['college', 'graduate'],
    traits: {
      analytical: 1,
      quantitative: 0.9,
      technology: 0.7,
      structure: 0.8,
      achievement: 0.55,
      independence: 0.5
    },
    academic: {
      preferredDegrees: ['B.Tech / B.E.', 'B.Sc', 'B.Sc (Hons)', 'BCA', 'B.Com', 'BBA', 'BA'],
      preferredBranches: ['computer', 'electronics', 'mathematics', 'statistics', 'economics', 'commerce']
    },
    skills: ['Data Analysis', 'Programming', 'AI / Machine Learning'],
    courses: ['Data Analytics', 'Statistics', 'Business Analytics'],
    roles: ['Data Analyst', 'Business Analyst', 'BI Analyst'],
    nextSteps: [
      'Learn SQL and spreadsheets deeply',
      'Practice Python or R',
      'Build analytics projects'
    ]
  },

  {
    id: 'ml-engineer',
    kind: 'career-role',
    name: 'AI / Machine Learning Engineer',
    description: 'Builds systems that learn from data and automate predictions or decisions.',
    stages: ['college', 'graduate'],
    traits: {
      analytical: 1,
      quantitative: 0.95,
      technology: 0.95,
      scientific_curiosity: 0.85,
      independence: 0.65,
      achievement: 0.7,
      adaptability: 0.6
    },
    academic: {
      preferredDegrees: ['B.Tech / B.E.', 'B.Sc', 'B.Sc (Hons)', 'BS', 'BS-MS', 'BCA'],
      preferredBranches: ['computer', 'cse', 'it', 'ece', 'electronics', 'mathematics', 'statistics']
    },
    skills: ['Programming', 'AI / Machine Learning', 'Data Analysis'],
    courses: ['Artificial Intelligence', 'Machine Learning', 'Data Science'],
    roles: ['ML Engineer', 'AI Engineer', 'Applied ML Engineer'],
    nextSteps: [
      'Strengthen Python, mathematics and statistics',
      'Build end-to-end ML projects',
      'Learn model evaluation and deployment'
    ]
  },

  {
    id: 'embedded-engineer',
    kind: 'career-role',
    name: 'Embedded Systems Engineer',
    description: 'Works with electronics, firmware, sensors and connected devices.',
    stages: ['college', 'graduate'],
    traits: {
      technology: 0.95,
      analytical: 0.9,
      quantitative: 0.75,
      hands_on: 0.95,
      scientific_curiosity: 0.75,
      structure: 0.7,
      achievement: 0.6
    },
    academic: {
      preferredDegrees: ['B.Tech / B.E.', 'Diploma'],
      preferredBranches: ['ece', 'electronics', 'electrical', 'instrumentation']
    },
    skills: ['Electronics', 'Programming', 'Electrical Systems'],
    courses: ['Embedded Systems', 'Electronics and Communication Engineering', 'IoT'],
    roles: ['Embedded Engineer', 'Firmware Engineer', 'IoT Engineer'],
    nextSteps: [
      'Learn C/C++ for embedded systems',
      'Practice microcontrollers',
      'Build sensor and IoT projects'
    ]
  },

  {
    id: 'vlsi-engineer',
    kind: 'career-role',
    name: 'VLSI / Semiconductor Engineer',
    description: 'Designs, verifies or tests integrated circuits and semiconductor systems.',
    stages: ['college', 'graduate'],
    traits: {
      analytical: 1,
      quantitative: 0.9,
      technology: 0.9,
      scientific_curiosity: 0.8,
      structure: 0.9,
      achievement: 0.65,
      independence: 0.55
    },
    academic: {
      preferredDegrees: ['B.Tech / B.E.', 'M.Tech / M.E.', 'MS'],
      preferredBranches: ['ece', 'electronics', 'electrical', 'vlsi']
    },
    skills: ['Electronics', 'Electrical Systems'],
    courses: ['VLSI Design', 'Microelectronics', 'Semiconductor Engineering'],
    roles: ['VLSI Design Engineer', 'Verification Engineer', 'Physical Design Engineer'],
    nextSteps: [
      'Strengthen digital electronics',
      'Learn HDL fundamentals',
      'Explore design and verification toolchains'
    ]
  },

  {
    id: 'product-manager',
    kind: 'career-role',
    name: 'Product Management',
    description: 'Connects customer needs, business goals and technology execution.',
    stages: ['college', 'graduate'],
    traits: {
      leadership: 0.95,
      verbal: 0.9,
      collaboration: 0.85,
      adaptability: 0.85,
      analytical: 0.7,
      entrepreneurship: 0.7,
      achievement: 0.7
    },
    academic: {
      preferredDegrees: [],
      preferredBranches: []
    },
    skills: ['Communication', 'Data Analysis'],
    courses: ['Product Management', 'Business Management'],
    roles: ['Associate Product Manager', 'Product Analyst', 'Product Manager'],
    nextSteps: [
      'Practice product case studies',
      'Learn analytics and user research',
      'Build evidence of product thinking'
    ]
  },

  {
    id: 'finance-analyst',
    kind: 'career-role',
    name: 'Finance / Investment Analyst',
    description: 'Evaluates financial information, markets and business performance.',
    stages: ['college', 'graduate'],
    traits: {
      quantitative: 0.95,
      analytical: 0.95,
      structure: 0.85,
      achievement: 0.75,
      stability: 0.6,
      entrepreneurship: 0.45
    },
    academic: {
      preferredDegrees: ['B.Com', 'B.Com (Hons)', 'BBA', 'BBM', 'BMS', 'BA', 'MBA'],
      preferredBranches: ['finance', 'commerce', 'economics', 'business']
    },
    skills: ['Data Analysis'],
    courses: ['Finance', 'Economics', 'Commerce'],
    roles: ['Financial Analyst', 'Investment Analyst', 'Credit Analyst'],
    nextSteps: [
      'Strengthen accounting and finance basics',
      'Learn financial modelling',
      'Build analytical finance projects'
    ]
  },

  {
    id: 'ux-designer',
    kind: 'career-role',
    name: 'UX / Product Designer',
    description: 'Designs useful and understandable digital experiences around user needs.',
    stages: ['college', 'graduate'],
    traits: {
      creativity: 1,
      social_helping: 0.7,
      collaboration: 0.75,
      adaptability: 0.75,
      analytical: 0.55,
      independence: 0.6,
      verbal: 0.55
    },
    academic: {
      preferredDegrees: [],
      preferredBranches: ['design', 'computer', 'architecture']
    },
    skills: ['Design', 'Communication'],
    courses: ['UX Design', 'Interaction Design', 'Product Design'],
    roles: ['UX Designer', 'Product Designer', 'Interaction Designer'],
    nextSteps: [
      'Build a design portfolio',
      'Practice user research',
      'Complete end-to-end design case studies'
    ]
  }
];


export const CAREER_PROFILES = Object.freeze([
  ...FOUNDATION_AND_CLASS10,
  ...SENIOR_SECONDARY,
  ...COLLEGE_AND_GRADUATE
]);

export default CAREER_PROFILES;
