const CORE_TRAITS = [
  'achievement',
  'adaptability',
  'analytical',
  'collaboration',
  'creativity',
  'entrepreneurship',
  'hands_on',
  'independence',
  'leadership',
  'quantitative',
  'scientific_curiosity',
  'social_helping',
  'stability',
  'structure',
  'technology',
  'verbal',
];


function normalize(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[|_/(),.-]+/g, ' ')
    .replace(/\s+/g, ' ');
}


function normalizeArray(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  return [
    ...new Set(
      values
        .map(normalize)
        .filter(Boolean)
    ),
  ];
}


function hash32(value) {
  let hash = 2166136261;

  for (
    const char of
    String(value ?? '')
  ) {
    hash ^=
      char.charCodeAt(0);

    hash =
      Math.imul(
        hash,
        16777619
      );
  }

  return hash >>> 0;
}


export function buildPsychometricFingerprint(
  profile = {}
) {
  const parts = [
    profile.stage,
    profile.currentClass,
    profile.board,
    profile.stream,
    profile.targetStream,
    profile.goal,
    profile.degree,
    profile.branch,
    profile.specialization,
    profile.currentStatus,

    ...normalizeArray(
      profile.subjects
    ),

    ...normalizeArray([
      ...(profile.targetExams || []),
      ...(profile.entranceExams || []),
    ]),

    ...normalizeArray(
      profile.targetCourses
    ),

    ...normalizeArray([
      ...(profile.interestClusters || []),
      ...(profile.careerInterests || []),
    ]),

    ...normalizeArray(
      profile.careerFamilies
    ),

    ...normalizeArray(
      profile.skills
    ),
  ]
    .map(normalize)
    .filter(Boolean);


  return parts.join('|');
}


function profileText(
  profile = {}
) {
  return buildPsychometricFingerprint(
    profile
  );
}


function includesPhrase(
  text,
  value
) {
  const source =
    ` ${normalize(text)} `;

  const target =
    ` ${normalize(value)} `;

  return source.includes(
    target
  );
}


function includesAny(
  text,
  candidates
) {
  return candidates.some(
    value =>
      includesPhrase(
        text,
        value
      )
  );
}


export function detectBlueprintFamilies(
  profile = {}
) {
  const text =
    profileText(
      profile
    );

  const families = [];


  if (
    includesAny(
      text,
      [
        'jee',
        'btech',
        'engineering',
        'pcm',
        'bitsat',
      ]
    )
  ) {
    families.push(
      'engineering'
    );
  }


  if (
    includesAny(
      text,
      [
        'computer science',
        'technology',
        'software',
        'coding',
        'data science',
        'artificial intelligence',
      ]
    )
  ) {
    families.push(
      'technology'
    );
  }


  if (
    includesAny(
      text,
      [
        'neet',
        'mbbs',
        'medical',
        'medicine',
        'healthcare',
        'pcb',
        'biology',
        'nursing',
      ]
    )
  ) {
    families.push(
      'healthcare'
    );
  }


  if (
    includesAny(
      text,
      [
        'iiser',
        'research',
        'science',
        'nest',
        'bs ms',
      ]
    )
  ) {
    families.push(
      'research_science'
    );
  }


  if (
    includesAny(
      text,
      [
        'commerce',
        'accountancy',
        'finance',
        'economics',
        'bcom',
        'ca ',
        'cma',
        'cseet',
      ]
    )
  ) {
    families.push(
      'commerce_finance'
    );
  }


  if (
    includesAny(
      text,
      [
        'ipmat',
        'jipmat',
        'bba',
        'bms',
        'management',
        'business',
        'entrepreneurship',
      ]
    )
  ) {
    families.push(
      'management_business'
    );
  }


  if (
    includesAny(
      text,
      [
        'clat',
        'ailet',
        'law',
        'legal',
        'governance',
      ]
    )
  ) {
    families.push(
      'law_governance'
    );
  }


  if (
    includesAny(
      text,
      [
        'nata',
        'uceed',
        'nid',
        'nift',
        'architecture',
        'design',
        'barch',
        'bdes',
      ]
    )
  ) {
    families.push(
      'design_architecture'
    );
  }


  if (
    includesAny(
      text,
      [
        'agriculture',
        'icar',
        'environment',
      ]
    )
  ) {
    families.push(
      'agriculture_environment'
    );
  }


  if (
    includesAny(
      text,
      [
        'nchm',
        'hospitality',
        'hotel management',
        'tourism',
      ]
    )
  ) {
    families.push(
      'hospitality'
    );
  }


  if (
    includesAny(
      text,
      [
        'nda',
        'defence',
        'defense',
        'military',
      ]
    )
  ) {
    families.push(
      'defence'
    );
  }


  if (
    includesAny(
      text,
      [
        'imu cet',
        'merchant navy',
        'maritime',
        'marine',
        'nautical',
      ]
    )
  ) {
    families.push(
      'maritime'
    );
  }


  if (
    includesAny(
      text,
      [
        'journalism',
        'media',
        'mass communication',
      ]
    )
  ) {
    families.push(
      'media_communication'
    );
  }


  if (
    includesAny(
      text,
      [
        'teacher',
        'teaching',
        'education',
        'b ed',
      ]
    )
  ) {
    families.push(
      'teaching_education'
    );
  }


  return [
    ...new Set(
      families
    ),
  ];
}


const FAMILY_TRAITS = {
  engineering: [
    'analytical',
    'quantitative',
    'hands_on',
    'scientific_curiosity',
    'technology',
    'structure',
  ],

  technology: [
    'analytical',
    'quantitative',
    'technology',
    'creativity',
    'adaptability',
  ],

  healthcare: [
    'scientific_curiosity',
    'social_helping',
    'analytical',
    'collaboration',
    'stability',
    'structure',
  ],

  research_science: [
    'scientific_curiosity',
    'analytical',
    'quantitative',
    'achievement',
    'independence',
  ],

  commerce_finance: [
    'quantitative',
    'analytical',
    'structure',
    'achievement',
    'stability',
  ],

  management_business: [
    'leadership',
    'entrepreneurship',
    'collaboration',
    'verbal',
    'achievement',
    'adaptability',
  ],

  law_governance: [
    'verbal',
    'analytical',
    'leadership',
    'social_helping',
    'structure',
  ],

  design_architecture: [
    'creativity',
    'hands_on',
    'analytical',
    'independence',
    'adaptability',
  ],

  agriculture_environment: [
    'scientific_curiosity',
    'hands_on',
    'social_helping',
    'adaptability',
  ],

  hospitality: [
    'verbal',
    'collaboration',
    'leadership',
    'social_helping',
    'adaptability',
  ],

  defence: [
    'leadership',
    'stability',
    'achievement',
    'collaboration',
    'adaptability',
    'hands_on',
  ],

  maritime: [
    'stability',
    'hands_on',
    'adaptability',
    'analytical',
    'achievement',
  ],

  media_communication: [
    'verbal',
    'creativity',
    'collaboration',
    'leadership',
  ],

  teaching_education: [
    'verbal',
    'social_helping',
    'collaboration',
    'structure',
  ],
};


export function buildPsychometricBlueprint(
  profile = {}
) {
  const fingerprint =
    buildPsychometricFingerprint(
      profile
    );

  const families =
    detectBlueprintFamilies(
      profile
    );


  const preferredTraits = [
    ...new Set(
      families.flatMap(
        family =>
          FAMILY_TRAITS[
            family
          ] || []
      )
    ),
  ];


  const stage =
    normalize(
      profile.stage
    );


  const totalQuestions =
    (
      stage === 'college' ||
      stage === 'graduate'
    )
      ? 44
      : 42;


  return {
    fingerprint,

    fingerprintHash:
      hash32(
        fingerprint
      ),

    families,

    coreTraits:
      CORE_TRAITS,

    preferredTraits,

    totalQuestions,

    anchorTarget:
      Math.round(
        totalQuestions *
        0.36
      ),

    profileTarget:
      Math.round(
        totalQuestions *
        0.38
      ),

    adaptiveTarget:
      totalQuestions -
      Math.round(
        totalQuestions *
        0.36
      ) -
      Math.round(
        totalQuestions *
        0.38
      ),
  };
}


export function psychometricPhase({
  profile = {},
  answers = [],
}) {
  const blueprint =
    buildPsychometricBlueprint(
      profile
    );

  const answered =
    answers.length;


  if (
    answered <
    blueprint.anchorTarget
  ) {
    return 'anchor';
  }


  if (
    answered <
    (
      blueprint.anchorTarget +
      blueprint.profileTarget
    )
  ) {
    return 'profile';
  }


  return 'adaptive';
}


function domainOverlap(
  question,
  families
) {
  const domains =
    normalizeArray(
      question.inferredDomains ||
      question.profileMap?.domains ||
      []
    );


  if (!domains.length) {
    return false;
  }


  return families.some(
    family =>
      domains.includes(
        normalize(
          family
        )
      )
  );
}


export function isNeutralAnchorQuestion(
  question
) {
  const domains =
    (
      question.inferredDomains ||
      question.profileMap?.domains ||
      []
    )
      .map(normalize)
      .filter(Boolean);


  /*
  |--------------------------------------------------------------------------
  | Neutral anchor rule
  |--------------------------------------------------------------------------
  |
  | Best anchors:
  | - general
  | - no detected domain
  |
  | Career-specific domains should not dominate the common anchor layer.
  |
  */

  if (!domains.length) {
    return true;
  }


  if (
    domains.length === 1 &&
    domains[0] === 'general'
  ) {
    return true;
  }


  return false;
}


export function traitUsageCount(
  answers = [],
  trait
) {
  const target =
    normalize(
      trait
    );


  return answers.filter(
    answer =>
      normalize(
        answer.trait
      ) === target
  ).length;
}


export function traitQuotaMultiplier({
  question,
  answers = [],
  maxPerTrait = 4,
}) {
  const count =
    traitUsageCount(
      answers,
      question.trait
    );


  if (
    count >=
    maxPerTrait
  ) {
    return 0.05;
  }


  if (
    count ===
    maxPerTrait - 1
  ) {
    return 0.45;
  }


  if (
    count ===
    maxPerTrait - 2
  ) {
    return 0.78;
  }


  return 1;
}

export function psychometricBlueprintScore({
  question,
  profile = {},
  answers = [],
}) {
  const blueprint =
    buildPsychometricBlueprint(
      profile
    );

  const phase =
    psychometricPhase({
      profile,
      answers,
    });

  const trait =
    normalize(
      question.trait
    );

  const profileDomainMatch =
    domainOverlap(
      question,
      blueprint.families
    );

  const preferredTrait =
    blueprint.preferredTraits.includes(
      trait
    );


  const variation =
    (
      hash32(
        `${blueprint.fingerprint}|${question.id}`
      ) %
      1000
    ) / 1000;


  /*
  |--------------------------------------------------------------------------
  | Anchor phase
  |--------------------------------------------------------------------------
  |
  | Core psychometric comparability stays dominant.
  | Fingerprint variation chooses different valid item variants.
  |
  */

  if (
    phase === 'anchor'
  ) {
    /*
    |--------------------------------------------------------------------------
    | TRUE ANCHOR PHASE
    |--------------------------------------------------------------------------
    |
    | Profile-specific domain/fingerprint influence is intentionally
    | excluded here so different profile combinations retain comparable
    | psychometric anchors.
    |
    */

    if (
      !CORE_TRAITS.includes(
        trait
      )
    ) {
      return 0.25;
    }


    const anchorVariation =
      (
        hash32(
          `anchor|${question.stage}|${question.trait}|${question.id}`
        ) %
        1000
      ) / 1000;


    return Math.min(
      1,
      0.82 +
        anchorVariation *
          0.18
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Profile-specific phase
  |--------------------------------------------------------------------------
  */

  if (
    phase === 'profile'
  ) {
    let score = 0.30;


    if (profileDomainMatch) {
      score += 0.42;
    }


    if (preferredTrait) {
      score += 0.18;
    }


    score +=
      variation * 0.10;


    return Math.min(
      1,
      score
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Adaptive phase
  |--------------------------------------------------------------------------
  |
  | Existing questionRanker remains the main adaptive intelligence.
  | Blueprint only provides a light career-context preference.
  |
  */

  let score = 0.50;


  if (profileDomainMatch) {
    score += 0.20;
  }


  if (preferredTrait) {
    score += 0.10;
  }


  score +=
    variation * 0.20;


  return Math.min(
    1,
    score
  );
}


export default {
  buildPsychometricFingerprint,
  detectBlueprintFamilies,
  buildPsychometricBlueprint,
  psychometricPhase,
  psychometricBlueprintScore,
};




