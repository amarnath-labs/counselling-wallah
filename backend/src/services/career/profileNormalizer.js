function normalizeText(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[./(),_-]+/g, ' ')
    .replace(/\s+/g, ' ');
}


function normalizeArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return [
    ...new Set(
      value
        .map(normalizeText)
        .filter(Boolean)
    ),
  ];
}


const SUBJECT_ALIASES = {
  math: 'mathematics',
  maths: 'mathematics',
  mathematics: 'mathematics',

  computer: 'computer science',
  computers: 'computer science',
  'computer science': 'computer science',
  cs: 'computer science',

  'information technology':
    'information technology',
  it: 'information technology',

  bio: 'biology',
  biology: 'biology',

  physics: 'physics',
  chemistry: 'chemistry',
  science: 'science',

  english: 'english',
  hindi: 'hindi',

  'social science': 'social science',
  'social studies': 'social science',
  sst: 'social science',

  history: 'history',
  geography: 'geography',

  economics: 'economics',

  accountancy: 'accountancy',
  accounts: 'accountancy',

  'business studies':
    'business studies',

  'political science':
    'political science',
  polity: 'political science',

  psychology: 'psychology',
  sociology: 'sociology',

  'fine arts': 'fine arts',
  art: 'fine arts',
  arts: 'fine arts',

  'physical education':
    'physical education',
  pe: 'physical education',
};


function normalizeSubject(value) {
  const normalized =
    normalizeText(value);

  if (!normalized) {
    return '';
  }

  return (
    SUBJECT_ALIASES[normalized] ||
    normalized
  );
}


function normalizeSubjectArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return [
    ...new Set(
      value
        .map(normalizeSubject)
        .filter(Boolean)
    ),
  ];
}


function normalizeClass(value) {
  const normalized =
    normalizeText(value);

  if (!normalized) {
    return '';
  }

  const match =
    normalized.match(
      /(?:class\s*)?(\d{1,2})/
    );

  if (!match) {
    return normalized;
  }

  return `class ${Number(match[1])}`;
}


/*
|--------------------------------------------------------------------------
| NORMALIZE ASSESSMENT STAGE
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| currentClass stores the exact educational class:
|
|   class 8
|   class 9
|   class 10
|   class 11
|   class 12
|
| But the adaptive assessment engine uses canonical stages:
|
|   Class 8 / 9   -> foundation
|   Class 10      -> class10
|   Class 11 / 12 -> senior-secondary
|   College       -> college
|   Graduate      -> graduate
|
| Exact class-specific V7 bank selection must continue to use currentClass.
|
|--------------------------------------------------------------------------
*/

function normalizeStage(
  stageValue,
  currentClassValue
) {
  const stage =
    normalizeText(
      stageValue
    );

  const currentClass =
    normalizeClass(
      currentClassValue
    );


  /*
  |--------------------------------------------------------------------------
  | Exact school class has highest authority
  |--------------------------------------------------------------------------
  */

  if (
    currentClass === 'class 8' ||
    currentClass === 'class 9'
  ) {
    return 'foundation';
  }


  if (
    currentClass === 'class 10'
  ) {
    return 'class10';
  }


  if (
    currentClass === 'class 11' ||
    currentClass === 'class 12'
  ) {
    return 'senior-secondary';
  }


  /*
  |--------------------------------------------------------------------------
  | Direct stage aliases
  |--------------------------------------------------------------------------
  */

  const aliases = {
    /*
    |--------------------------------------------------------------------------
    | Class 8
    |--------------------------------------------------------------------------
    */

    'class 8': 'foundation',
    class8: 'foundation',
    '8': 'foundation',

    /*
    |--------------------------------------------------------------------------
    | normalizeText("class-8") -> "class 8"
    |--------------------------------------------------------------------------
    |
    | Because normalizeText replaces "-" with a space,
    | the entry above already handles class-8.
    |--------------------------------------------------------------------------
    */


    /*
    |--------------------------------------------------------------------------
    | Class 9
    |--------------------------------------------------------------------------
    */

    'class 9': 'foundation',
    class9: 'foundation',
    '9': 'foundation',


    /*
    |--------------------------------------------------------------------------
    | Foundation canonical stage
    |--------------------------------------------------------------------------
    */

    foundation: 'foundation',


    /*
    |--------------------------------------------------------------------------
    | Class 10
    |--------------------------------------------------------------------------
    */

    'class 10': 'class10',
    class10: 'class10',
    '10': 'class10',


    /*
    |--------------------------------------------------------------------------
    | Class 11
    |--------------------------------------------------------------------------
    */

    'class 11':
      'senior-secondary',

    class11:
      'senior-secondary',

    '11':
      'senior-secondary',


    /*
    |--------------------------------------------------------------------------
    | Class 12
    |--------------------------------------------------------------------------
    */

    'class 12':
      'senior-secondary',

    class12:
      'senior-secondary',

    '12':
      'senior-secondary',


    /*
    |--------------------------------------------------------------------------
    | Senior-secondary canonical stage
    |--------------------------------------------------------------------------
    |
    | normalizeText("senior-secondary")
    | becomes "senior secondary".
    |--------------------------------------------------------------------------
    */

    'senior secondary':
      'senior-secondary',

    seniorsecondary:
      'senior-secondary',


    /*
    |--------------------------------------------------------------------------
    | College
    |--------------------------------------------------------------------------
    */

    college: 'college',

    undergraduate: 'college',

    'under graduate': 'college',


    /*
    |--------------------------------------------------------------------------
    | Graduate
    |--------------------------------------------------------------------------
    */

    graduate: 'graduate',

    graduated: 'graduate',

    postgraduate: 'graduate',

    'post graduate':
      'graduate',
  };


  if (
    aliases[stage]
  ) {
    return aliases[stage];
  }


  /*
  |--------------------------------------------------------------------------
  | Unknown value
  |--------------------------------------------------------------------------
  |
  | Preserve normalized stage instead of silently falling back to another
  | assessment stage.
  |
  | This prevents Class 8 questions from accidentally becoming a fallback
  | for Graduate or other stages.
  |--------------------------------------------------------------------------
  */

  return stage;
}


const DEGREE_ALIASES = {
  'b tech b e': 'btech',
  'b tech': 'btech',
  btech: 'btech',

  'b e': 'be',
  be: 'be',

  'b arch': 'barch',
  barch: 'barch',

  'b plan': 'bplan',
  bplan: 'bplan',

  'b des': 'bdes',
  bdes: 'bdes',

  bfa: 'bfa',
  bva: 'bva',

  ba: 'ba',
  'ba hons': 'ba-hons',

  'b sc': 'bsc',
  bsc: 'bsc',

  'b sc hons':
    'bsc-hons',

  'bsc hons':
    'bsc-hons',

  bs: 'bs',

  'bs ms':
    'bs-ms',

  bca: 'bca',

  'b com':
    'bcom',

  bcom:
    'bcom',

  'b com hons':
    'bcom-hons',

  'bcom hons':
    'bcom-hons',

  bba: 'bba',
  bbm: 'bbm',
  bms: 'bms',

  'integrated bba mba':
    'integrated-bba-mba',

  llb: 'llb',

  'ba llb':
    'ba-llb',

  'bba llb':
    'bba-llb',

  'bcom llb':
    'bcom-llb',

  'b pharm':
    'bpharm',

  bpharm:
    'bpharm',

  bhm: 'bhm',
};


function normalizeDegree(value) {
  const normalized =
    normalizeText(
      value
    );


  if (!normalized) {
    return '';
  }


  /*
  |--------------------------------------------------------------------------
  | Engineering
  |--------------------------------------------------------------------------
  */

  if (
    normalized ===
      'b tech b e' ||
    normalized ===
      'b tech be' ||
    normalized ===
      'btech be' ||
    normalized ===
      'b tech' ||
    normalized ===
      'btech'
  ) {
    return 'btech';
  }


  if (
    normalized ===
      'b e' ||
    normalized ===
      'be'
  ) {
    return 'be';
  }


  /*
  |--------------------------------------------------------------------------
  | Architecture / planning / design
  |--------------------------------------------------------------------------
  */

  if (
    normalized ===
      'b arch' ||
    normalized ===
      'barch'
  ) {
    return 'barch';
  }


  if (
    normalized ===
      'b plan' ||
    normalized ===
      'bplan'
  ) {
    return 'bplan';
  }


  if (
    normalized ===
      'b des' ||
    normalized ===
      'bdes'
  ) {
    return 'bdes';
  }


  /*
  |--------------------------------------------------------------------------
  | Arts
  |--------------------------------------------------------------------------
  */

  if (
    normalized ===
      'ba hons' ||
    normalized ===
      'b a hons'
  ) {
    return 'ba-hons';
  }


  if (
    normalized ===
      'ba' ||
    normalized ===
      'b a'
  ) {
    return 'ba';
  }


  /*
  |--------------------------------------------------------------------------
  | Science
  |--------------------------------------------------------------------------
  */

  if (
    normalized ===
      'b sc hons' ||
    normalized ===
      'bsc hons'
  ) {
    return 'bsc-hons';
  }


  if (
    normalized ===
      'b sc' ||
    normalized ===
      'bsc'
  ) {
    return 'bsc';
  }


  if (
    normalized ===
    'bs ms'
  ) {
    return 'bs-ms';
  }


  /*
  |--------------------------------------------------------------------------
  | Commerce
  |--------------------------------------------------------------------------
  */

  if (
    normalized ===
      'b com hons' ||
    normalized ===
      'bcom hons'
  ) {
    return 'bcom-hons';
  }


  if (
    normalized ===
      'b com' ||
    normalized ===
      'bcom'
  ) {
    return 'bcom';
  }


  /*
  |--------------------------------------------------------------------------
  | Management
  |--------------------------------------------------------------------------
  */

  if (
    normalized ===
    'integrated bba mba'
  ) {
    return 'integrated-bba-mba';
  }


  /*
  |--------------------------------------------------------------------------
  | Law
  |--------------------------------------------------------------------------
  */

  if (
    normalized ===
    'ba llb'
  ) {
    return 'ba-llb';
  }


  if (
    normalized ===
    'bba llb'
  ) {
    return 'bba-llb';
  }


  if (
    normalized ===
      'bcom llb' ||
    normalized ===
      'b com llb'
  ) {
    return 'bcom-llb';
  }


  /*
  |--------------------------------------------------------------------------
  | Pharmacy
  |--------------------------------------------------------------------------
  */

  if (
    normalized ===
      'b pharm' ||
    normalized ===
      'bpharm'
  ) {
    return 'bpharm';
  }


  /*
  |--------------------------------------------------------------------------
  | Simple canonical forms
  |--------------------------------------------------------------------------
  */

  const aliases = {
    bfa: 'bfa',
    bva: 'bva',

    bs: 'bs',

    bca: 'bca',

    bba: 'bba',
    bbm: 'bbm',
    bms: 'bms',

    llb: 'llb',

    bhm: 'bhm',

    bed: 'bed',
  };


  return (
    aliases[normalized] ||
    DEGREE_ALIASES[normalized] ||
    normalized
  );
}


export function normalizeCareerProfile(
  input = {}
) {
  const careerInterests =
    normalizeArray(
      input.careerInterests ||
      input.interests ||
      input.interestClusters ||
      []
    );


  const interestClusters =
    normalizeArray(
      input.interestClusters ||
      input.careerInterests ||
      input.interests ||
      []
    );


  const careerFamilies =
    normalizeArray(
      input.careerFamilies ||
      []
    );


  return {
    /*
    |--------------------------------------------------------------------------
    | Canonical adaptive stage
    |--------------------------------------------------------------------------
    */

    stage:
      normalizeStage(
        input.stage,
        input.currentClass
      ),


    /*
    |--------------------------------------------------------------------------
    | Exact educational class
    |--------------------------------------------------------------------------
    |
    | This remains separate from stage.
    |
    | Examples:
    |
    | class 8
    | class 9
    | class 10
    | class 11
    | class 12
    |--------------------------------------------------------------------------
    */

    currentClass:
      normalizeClass(
        input.currentClass
      ),


    board:
      normalizeText(
        input.board
      ),


    stream:
      normalizeText(
        input.stream
      ),


    subjects:
      normalizeSubjectArray(
        input.subjects
      ),


    targetExams:
      normalizeArray(
        input.targetExams ||
        input.entranceExams ||
        input.exams ||
        input.admissionRoutes
      ),


    entranceExams:
      normalizeArray(
        input.entranceExams ||
        input.targetExams ||
        input.exams ||
        input.admissionRoutes
      ),


    targetCourses:
      normalizeArray(
        input.targetCourses ||
        input.courses
      ),


    degree:
      normalizeDegree(
        input.degree ||
        input.highestQualification
      ),


    specialization:
      normalizeText(
        input.specialization ||
        input.branch
      ),


    branch:
      normalizeText(
        input.branch ||
        input.specialization
      ),


    collegeYear:
      normalizeText(
        input.collegeYear
      ),


    graduationYear:
      normalizeText(
        input.graduationYear
      ),


    goal:
      normalizeText(
        input.goal
      ),


    skills:
      normalizeArray(
        input.skills
      ),


    experience:
      normalizeText(
        input.experience
      ),


    currentStatus:
      normalizeText(
        input.currentStatus
      ),


    careerInterests,


    interestClusters,


    careerFamilies,
  };
}


export function profileToTags(
  profile
) {
  return [
    profile.stage,
    profile.currentClass,
    profile.board,
    profile.stream,
    profile.degree,
    profile.specialization,
    profile.branch,
    profile.collegeYear,
    profile.goal,
    profile.experience,
    profile.currentStatus,

    ...(profile.subjects || []),

    ...(profile.targetExams || []),

    ...(profile.entranceExams || []),

    ...(profile.targetCourses || []),

    ...(profile.skills || []),

    ...(profile.careerInterests || []),

    ...(profile.interestClusters || []),

    ...(profile.careerFamilies || []),
  ].filter(Boolean);
}