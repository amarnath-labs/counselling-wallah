/*
|--------------------------------------------------------------------------
| TruMarg Adaptive Career Question Bank
|--------------------------------------------------------------------------
|
| Backend-owned question knowledge base.
|
| Each question contains retrieval metadata.
| Later these records can also be stored in PostgreSQL + pgvector.
|
*/

export const CAREER_QUESTION_BANK = [
  /*
  |--------------------------------------------------------------------------
  | FOUNDATION — CLASS 8 / 9
  |--------------------------------------------------------------------------
  */

  {
    id: 'foundation_technology_01',
    stage: 'foundation',
    section: 'interest',
    trait: 'technology',

    text:
      'I enjoy exploring computers, gadgets, apps, machines or understanding how technology works.',

    tags: [
      'technology',
      'computers',
      'machines',
      'digital',
    ],

    goals: [
      'explore-careers',
    ],

    priority: 0.82,
  },

  {
    id: 'foundation_science_01',
    stage: 'foundation',
    section: 'interest',
    trait: 'science',

    text:
      'I often become curious about why scientific or natural things happen.',

    tags: [
      'science',
      'curiosity',
      'research',
    ],

    goals: [
      'explore-careers',
    ],

    priority: 0.82,
  },

  {
    id: 'foundation_creative_01',
    stage: 'foundation',
    section: 'interest',
    trait: 'creative',

    text:
      'I enjoy drawing, designing, writing, making videos, crafts or creating something original.',

    tags: [
      'creative',
      'design',
      'art',
      'content',
    ],

    goals: [
      'explore-careers',
    ],

    priority: 0.82,
  },

  {
    id: 'foundation_performance_01',
    stage: 'foundation',
    section: 'interest',
    trait: 'performance',

    text:
      'Acting, music, dance, theatre, presenting or performing in front of others excites me.',

    tags: [
      'acting',
      'theatre',
      'music',
      'dance',
      'performance',
    ],

    goals: [
      'explore-careers',
    ],

    priority: 0.78,
  },

  {
    id: 'foundation_business_01',
    stage: 'foundation',
    section: 'interest',
    trait: 'business',

    text:
      'I find businesses, money, selling products or the idea of starting something of my own interesting.',

    tags: [
      'business',
      'money',
      'entrepreneurship',
    ],

    goals: [
      'explore-careers',
    ],

    priority: 0.8,
  },

  {
    id: 'foundation_health_01',
    stage: 'foundation',
    section: 'interest',
    trait: 'healthcare',

    text:
      'Learning about health, the human body, medicines, animals or how doctors help people interests me.',

    tags: [
      'healthcare',
      'biology',
      'medical',
    ],

    goals: [
      'explore-careers',
    ],

    priority: 0.8,
  },

  {
    id: 'foundation_logic_01',
    stage: 'foundation',
    section: 'strength',
    trait: 'logic',

    text:
      'I enjoy puzzles, patterns and questions where I need to think carefully before finding the answer.',

    tags: [
      'logic',
      'reasoning',
      'problem-solving',
    ],

    goals: [
      'explore-careers',
    ],

    priority: 0.88,
  },

  {
    id: 'foundation_people_01',
    stage: 'foundation',
    section: 'work',
    trait: 'people',

    text:
      'I enjoy activities where I meet, communicate with or help other people.',

    tags: [
      'people',
      'communication',
      'social',
    ],

    goals: [
      'explore-careers',
    ],

    priority: 0.75,
  },


  /*
  |--------------------------------------------------------------------------
  | CLASS 10 — STREAM DISCOVERY
  |--------------------------------------------------------------------------
  */

  {
    id: 'class10_pcm_01',
    stage: 'class10',
    section: 'academic',
    trait: 'mathematics',

    text:
      'I can imagine studying Mathematics at a deeper level throughout Classes 11 and 12.',

    tags: [
      'pcm',
      'mathematics',
      'engineering',
      'architecture',
    ],

    streams: [
      'Science - PCM',
      'Science - PCMB',
      'Science - PCM + Computer Science',
    ],

    goals: [
      'choose-stream',
      'choose-course',
    ],

    priority: 0.95,
  },

  {
    id: 'class10_pcb_01',
    stage: 'class10',
    section: 'academic',
    trait: 'biology',

    text:
      'I can imagine studying Biology in significant detail for the next two years.',

    tags: [
      'pcb',
      'biology',
      'medical',
      'healthcare',
    ],

    streams: [
      'Science - PCB',
      'Science - PCMB',
    ],

    goals: [
      'choose-stream',
      'choose-course',
    ],

    priority: 0.95,
  },

  {
    id: 'class10_commerce_01',
    stage: 'class10',
    section: 'interest',
    trait: 'business',

    text:
      'Business, economics, finance, markets or entrepreneurship are areas I would enjoy studying further.',

    tags: [
      'commerce',
      'business',
      'finance',
      'economics',
    ],

    streams: [
      'Commerce with Mathematics',
      'Commerce without Mathematics',
    ],

    goals: [
      'choose-stream',
    ],

    priority: 0.9,
  },

  {
    id: 'class10_humanities_01',
    stage: 'class10',
    section: 'interest',
    trait: 'socialScience',

    text:
      'Psychology, politics, society, history, geography or human behaviour genuinely interest me.',

    tags: [
      'humanities',
      'psychology',
      'law',
      'social-science',
    ],

    streams: [
      'Humanities / Arts',
      'Humanities with Psychology',
      'Humanities with Legal Studies',
    ],

    goals: [
      'choose-stream',
    ],

    priority: 0.9,
  },

  {
    id: 'class10_design_01',
    stage: 'class10',
    section: 'interest',
    trait: 'visualArt',

    text:
      'I would seriously consider design, architecture, fashion, animation or visual arts as a future career direction.',

    tags: [
      'design',
      'architecture',
      'fashion',
      'animation',
      'fine-arts',
    ],

    streams: [
      'Fine Arts / Visual Arts',
      'Humanities / Arts',
    ],

    goals: [
      'choose-stream',
      'choose-course',
    ],

    priority: 0.86,
  },

  {
    id: 'class10_acting_01',
    stage: 'class10',
    section: 'interest',
    trait: 'performance',

    text:
      'I would seriously consider acting, theatre, music, dance or another performing-art career.',

    tags: [
      'acting',
      'theatre',
      'music',
      'dance',
      'film',
    ],

    streams: [
      'Performing Arts',
      'Humanities / Arts',
    ],

    goals: [
      'choose-stream',
      'choose-course',
    ],

    priority: 0.84,
  },

  {
    id: 'class10_hospitality_01',
    stage: 'class10',
    section: 'interest',
    trait: 'hospitality',

    text:
      'Hotel management, culinary arts, tourism, travel or event management sounds interesting to me.',

    tags: [
      'hotel-management',
      'hospitality',
      'culinary',
      'tourism',
      'travel',
    ],

    goals: [
      'choose-stream',
      'choose-course',
    ],

    priority: 0.8,
  },


  /*
  |--------------------------------------------------------------------------
  | CLASS 11 / 12
  |--------------------------------------------------------------------------
  */

  {
    id: 'senior_engineering_01',
    stage: 'senior-secondary',
    section: 'interest',
    trait: 'technology',

    text:
      'I enjoy solving technical problems involving software, electronics, machines or engineering systems.',

    tags: [
      'engineering',
      'technology',
      'jee-main',
      'jee-advanced',
    ],

    streams: [
      'Science - PCM',
      'Science - PCM + Computer Science',
      'Science - PCMB',
    ],

    exams: [
      'jee-main',
      'jee-advanced',
      'bitsat',
      'viteee',
    ],

    priority: 0.9,
  },

  {
    id: 'senior_medical_01',
    stage: 'senior-secondary',
    section: 'interest',
    trait: 'healthcare',

    text:
      'I am genuinely interested in professional responsibilities involving healthcare, diagnosis, treatment or patient care.',

    tags: [
      'medical',
      'healthcare',
      'neet',
      'biology',
    ],

    streams: [
      'Science - PCB',
      'Science - PCMB',
    ],

    exams: [
      'neet-ug',
    ],

    priority: 0.9,
  },

  {
    id: 'senior_research_01',
    stage: 'senior-secondary',
    section: 'interest',
    trait: 'research',

    text:
      'I enjoy exploring scientific questions deeply even when there is no immediate examination benefit.',

    tags: [
      'research',
      'iiser',
      'science',
      'nest',
    ],

    exams: [
      'iiser-iat',
      'nest',
    ],

    priority: 0.82,
  },

  {
    id: 'senior_law_01',
    stage: 'senior-secondary',
    section: 'interest',
    trait: 'law',

    text:
      'Legal reasoning, rights, public policy, governance or structured debate appeals to me.',

    tags: [
      'law',
      'clat',
      'ailet',
      'legal',
    ],

    exams: [
      'clat',
      'ailet',
    ],

    priority: 0.82,
  },

  {
    id: 'senior_hotel_01',
    stage: 'senior-secondary',
    section: 'interest',
    trait: 'hospitality',

    text:
      'I would seriously consider hotel management, hospitality, culinary arts, tourism or events as a profession.',

    tags: [
      'hotel-management',
      'nchm-jee',
      'hospitality',
      'tourism',
    ],

    exams: [
      'nchm-jee',
    ],

    priority: 0.82,
  },

  {
    id: 'senior_acting_01',
    stage: 'senior-secondary',
    section: 'interest',
    trait: 'performance',

    text:
      'I would seriously consider auditions and portfolio-based progression for acting, film, theatre, music or dance.',

    tags: [
      'acting',
      'film',
      'theatre',
      'performance',
      'audition',
    ],

    priority: 0.82,
  },


  /*
  |--------------------------------------------------------------------------
  | COLLEGE — GENERAL PROFESSIONAL DIRECTION
  |--------------------------------------------------------------------------
  */

  {
    id: 'college_technical_01',
    stage: 'college',
    section: 'interest',
    trait: 'technology',

    text:
      'I enjoy solving technical or digital problems enough to consider a technology-oriented professional role.',

    tags: [
      'technology',
      'software',
      'engineering',
      'digital',
    ],

    goals: [
      'first-job',
      'placement',
      'internship',
      'career-switch',
    ],

    priority: 0.82,
  },

  {
    id: 'college_business_01',
    stage: 'college',
    section: 'interest',
    trait: 'business',

    text:
      'I could see myself working in management, consulting, product, marketing, sales or business strategy.',

    tags: [
      'management',
      'consulting',
      'product',
      'business',
      'marketing',
    ],

    goals: [
      'first-job',
      'placement',
      'mba',
      'career-switch',
    ],

    priority: 0.8,
  },

  {
    id: 'college_research_01',
    stage: 'college',
    section: 'interest',
    trait: 'research',

    text:
      'Research, advanced technical specialization or postgraduate study genuinely interests me.',

    tags: [
      'research',
      'mtech',
      'ms',
      'higher-studies',
    ],

    goals: [
      'higher-studies',
      'mtech',
      'ms',
      'research',
    ],

    priority: 0.8,
  },

  {
    id: 'college_placement_01',
    stage: 'college',
    section: 'values',
    trait: 'stability',

    text:
      'Getting into a stable career soon after graduation is currently a major priority for me.',

    tags: [
      'placement',
      'job',
      'stability',
    ],

    goals: [
      'first-job',
      'placement',
    ],

    priority: 0.92,
  },

  {
    id: 'college_portfolio_01',
    stage: 'college',
    section: 'strength',
    trait: 'discipline',

    text:
      'I am willing to build projects, certifications, internships or portfolio evidence outside regular college coursework.',

    tags: [
      'projects',
      'internship',
      'portfolio',
      'skills',
    ],

    goals: [
      'first-job',
      'internship',
      'placement',
      'career-switch',
    ],

    priority: 0.88,
  },


  /*
  |--------------------------------------------------------------------------
  | B.TECH / ENGINEERING
  |--------------------------------------------------------------------------
  */

  {
    id: 'college_btech_software_01',
    stage: 'college',
    section: 'career-direction',
    trait: 'software',

    text:
      'I would enjoy building software applications, APIs or digital products as a major part of my career.',

    degrees: [
      'B.Tech / B.E.',
      'BCA',
      'B.Sc',
    ],

    tags: [
      'software',
      'programming',
      'development',
    ],

    skills: [
      'Programming',
      'Web Development',
      'App Development',
    ],

    priority: 0.94,
  },

  {
    id: 'college_ai_01',
    stage: 'college',
    section: 'career-direction',
    trait: 'ai',

    text:
      'I enjoy using programming, mathematics or data to build intelligent or predictive systems.',

    degrees: [
      'B.Tech / B.E.',
      'BCA',
      'B.Sc',
    ],

    tags: [
      'ai',
      'machine-learning',
      'data-science',
      'python',
    ],

    skills: [
      'AI / Machine Learning',
      'Programming',
      'Data Analysis',
    ],

    priority: 0.94,
  },

  {
    id: 'college_core_engineering_01',
    stage: 'college',
    section: 'career-direction',
    trait: 'coreEngineering',

    text:
      'I would enjoy working directly with physical engineering systems, equipment, machines, electronics or infrastructure.',

    degrees: [
      'B.Tech / B.E.',
      'Diploma',
      'Polytechnic',
    ],

    tags: [
      'core-engineering',
      'hardware',
      'electronics',
      'mechanical',
      'electrical',
      'civil',
    ],

    priority: 0.91,
  },


  /*
  |--------------------------------------------------------------------------
  | ECE DISCRIMINATORS
  |--------------------------------------------------------------------------
  */

  {
    id: 'college_ece_software_vs_core_01',

    stage: 'college',

    section:
      'career-discriminator',

    trait:
      'software',

    text:
      'Would you prefer building software systems over working directly with electronic hardware?',

    degrees: [
      'B.Tech / B.E.',
    ],

    branches: [
      'ece',
      'electronics',
      'electronics and communication',
      'electronics & communication',
      'electronics and communication engineering',
    ],

    tags: [
      'ece',
      'software',
      'electronics',
      'career-direction',
    ],

    purpose:
      'discriminator',

    priority:
      1,
  },

  {
    id: 'college_ece_embedded_01',

    stage:
      'college',

    section:
      'career-discriminator',

    trait:
      'embedded',

    text:
      'I would enjoy working with microcontrollers, sensors, embedded systems or IoT devices.',

    degrees: [
      'B.Tech / B.E.',
    ],

    branches: [
      'ece',
      'electronics',
      'electronics and communication',
      'electronics & communication',
      'electronics and communication engineering',
    ],

    tags: [
      'ece',
      'embedded',
      'iot',
      'electronics',
    ],

    priority:
      0.98,
  },

  {
    id: 'college_ece_vlsi_01',

    stage:
      'college',

    section:
      'career-discriminator',

    trait:
      'electronics',

    text:
      'Semiconductor design, VLSI, digital electronics or chip technology interests me professionally.',

    degrees: [
      'B.Tech / B.E.',
    ],

    branches: [
      'ece',
      'electronics',
      'electronics and communication',
      'electronics & communication',
      'electronics and communication engineering',
    ],

    tags: [
      'ece',
      'vlsi',
      'semiconductor',
      'electronics',
    ],

    priority:
      0.96,
  },


  /*
  |--------------------------------------------------------------------------
  | CREATIVE / ACTING
  |--------------------------------------------------------------------------
  */

  {
    id: 'college_acting_01',
    stage: 'college',
    section: 'career-direction',
    trait: 'performance',

    text:
      'I would seriously consider building an acting, theatre or performance portfolio even if my current degree is unrelated.',

    tags: [
      'acting',
      'theatre',
      'performance',
      'portfolio',
    ],

    goals: [
      'creative-career',
      'career-switch',
    ],

    priority: 0.9,
  },

  {
    id: 'college_media_01',
    stage: 'college',
    section: 'career-direction',
    trait: 'creative',

    text:
      'I would enjoy professional work involving film, video, journalism, content creation or digital media.',

    tags: [
      'film',
      'media',
      'journalism',
      'content',
    ],

    goals: [
      'creative-career',
      'career-switch',
    ],

    priority: 0.9,
  },


  /*
  |--------------------------------------------------------------------------
  | HOSPITALITY
  |--------------------------------------------------------------------------
  */

  {
    id: 'college_hospitality_01',

    stage:
      'college',

    section:
      'career-direction',

    trait:
      'hospitality',

    text:
      'I would enjoy managing guest experiences, hotel operations, food service, events or tourism-related activities.',

    degrees: [
      'Hotel Management / BHM',
      'Hospitality Administration',
      'Travel & Tourism',
      'Culinary Arts',
    ],

    tags: [
      'hotel-management',
      'hospitality',
      'tourism',
      'culinary',
    ],

    priority:
      0.96,
  },


  /*
  |--------------------------------------------------------------------------
  | GRADUATE
  |--------------------------------------------------------------------------
  */

  {
    id: 'graduate_reskill_01',

    stage:
      'graduate',

    section:
      'career-transition',

    trait:
      'adaptability',

    text:
      'I am willing to substantially reskill if another career path provides a better long-term fit.',

    goals: [
      'career-switch',
      'better-job',
      'first-job',
    ],

    tags: [
      'reskill',
      'career-switch',
      'upskill',
    ],

    priority:
      0.95,
  },

  {
    id: 'graduate_higher_studies_01',

    stage:
      'graduate',

    section:
      'career-transition',

    trait:
      'research',

    text:
      'I would pursue higher education if its long-term career benefit justified the additional time and cost.',

    goals: [
      'higher-studies',
      'mtech',
      'ms',
      'mba',
      'research',
    ],

    tags: [
      'higher-studies',
      'masters',
      'mba',
      'mtech',
      'ms',
    ],

    priority:
      0.9,
  },

  {
    id: 'graduate_government_01',

    stage:
      'graduate',

    section:
      'career-transition',

    trait:
      'stability',

    text:
      'I am willing to invest sustained preparation time for government or public-sector competitive examinations.',

    goals: [
      'government-job',
      'civil-services',
    ],

    tags: [
      'government',
      'upsc',
      'ssc',
      'banking',
      'railway',
    ],

    priority:
      0.92,
  },
];


export default CAREER_QUESTION_BANK;