function normalizeText(value) {
  return String(
    value ?? ''
  )
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/\(fw\)/g, ' ')
    .replace(/\bfw\b/g, ' ')
    .replace(/self finance/g, ' ')
    .replace(
      /collaboration\s*(?:and|&)\s*twining\s*program/g,
      ' '
    )
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}


const PREFERENCE_ALIASES = {
  cse: 'CSE',
  cs: 'CSE',
  computer: 'CSE',
  'computer science': 'CSE',
  'computer science engineering': 'CSE',
  'computer science and engineering': 'CSE',

  it: 'IT',
  'information technology': 'IT',

  ai: 'CSE_AI_ML',
  ml: 'CSE_AI_ML',
  aiml: 'CSE_AI_ML',
  'ai ml': 'CSE_AI_ML',
  'artificial intelligence':
    'CSE_AI_ML',
  'artificial intelligence machine learning':
    'CSE_AI_ML',
  'artificial intelligence and machine learning':
    'CSE_AI_ML',

  ds: 'CSE_DS',
  'data science': 'CSE_DS',
  'cse data science': 'CSE_DS',

  cyber: 'CSE_CYBER',
  cybersecurity: 'CSE_CYBER',
  'cyber security': 'CSE_CYBER',

  iot: 'CSE_IOT',
  'internet of things': 'CSE_IOT',

  ece: 'ECE',
  'electronics communication':
    'ECE',
  'electronics and communication':
    'ECE',
  'electronics and communication engineering':
    'ECE',

  electronics:
    'ELECTRONICS',
  'electronics engineering':
    'ELECTRONICS',

  vlsi: 'VLSI',

  ee: 'EE',
  electrical: 'EE',
  'electrical engineering':
    'EE',

  eee: 'EEE',
  'electrical electronics':
    'EEE',
  'electrical and electronics engineering':
    'EEE',

  me: 'ME',
  mechanical: 'ME',
  'mechanical engineering':
    'ME',

  ce: 'CE',
  civil: 'CE',
  'civil engineering':
    'CE',

  chemical: 'CHEMICAL',
  'chemical engineering':
    'CHEMICAL',

  biotech: 'BIOTECH',
  biotechnology: 'BIOTECH',

  textile: 'TEXTILE',

  agriculture:
    'AGRICULTURE',
  agricultural:
    'AGRICULTURE',
  'agriculture engineering':
    'AGRICULTURE',
  'agricultural engineering':
    'AGRICULTURE',

  mining: 'MINING',

  aeronautical:
    'AERONAUTICAL',

  automobile:
    'AUTOMOBILE',

  biomedical:
    'BIOMEDICAL',

  instrumentation:
    'INSTRUMENTATION',

  mechatronics:
    'MECHATRONICS',

  robotics:
    'ROBOTICS',

  mnc: 'MNC',
  'mathematics computing':
    'MNC',
  'mathematics and computing':
    'MNC',

  food: 'FOOD',
  'food technology':
    'FOOD',
  'food engineering':
    'FOOD',
};


export function getBranchFamily(
  branchName
) {
  const text =
    normalizeText(
      branchName
    );


  if (!text) {
    return null;
  }


  /* =============================
     COMPUTER
  ============================= */

  if (
    text.includes(
      'cyber security'
    )
  ) {
    return 'CSE_CYBER';
  }


  if (
    text.includes(
      'internet of things'
    )
  ) {
    return 'CSE_IOT';
  }


  if (
    text.includes(
      'data science'
    )
  ) {
    return 'CSE_DS';
  }


  if (
    text.includes(
      'artificial intelligence'
    ) ||
    text.includes(
      'machine learning'
    ) ||
    text.includes(
      'aiml'
    )
  ) {
    return 'CSE_AI_ML';
  }


  if (
    text.includes(
      'computer science and business'
    )
  ) {
    return 'CSE_BUSINESS';
  }


  if (
    text.includes(
      'computer science and design'
    )
  ) {
    return 'CSE_DESIGN';
  }


  if (
    text.includes(
      'computer science information technology'
    ) ||
    text.includes(
      'computer science and information technology'
    ) ||
    text.includes(
      'computer science and technology'
    )
  ) {
    return 'CSE_IT';
  }


  if (
    text ===
      'computer science' ||
    text.includes(
      'computer science engineering'
    ) ||
    text.includes(
      'computer science and engineering'
    )
  ) {
    return 'CSE';
  }


  if (
    text.includes(
      'information technology'
    )
  ) {
    return 'IT';
  }


  /* =============================
     ELECTRICAL / ELECTRONICS
  ============================= */

  if (
    text.includes(
      'vlsi'
    )
  ) {
    return 'VLSI';
  }


  if (
    text.includes(
      'electronics and communication'
    ) ||
    text.includes(
      'electronics communication'
    ) ||
    text.includes(
      'electronics and telecommunication'
    )
  ) {
    return 'ECE';
  }


  if (
    text.includes(
      'electronic and computer engineering'
    )
  ) {
    return 'ECE';
  }


  if (
    text.includes(
      'electrical and computer engineering'
    )
  ) {
    return 'EE';
  }


  if (
    text.includes(
      'electrical and electronics engineering'
    )
  ) {
    return 'EEE';
  }


  if (
    text.includes(
      'electrical engineering'
    )
  ) {
    return 'EE';
  }


  if (
    text.includes(
      'electronics engineering'
    )
  ) {
    return 'ELECTRONICS';
  }


  if (
    text.includes(
      'instrumentation'
    )
  ) {
    return 'INSTRUMENTATION';
  }


  /* =============================
     CORE
  ============================= */

  if (
    text.includes(
      'mechanical'
    )
  ) {
    if (
      text.includes(
        'mechatronics'
      )
    ) {
      return 'MECHATRONICS';
    }

    return 'ME';
  }


  if (
    text.includes(
      'mechatronics'
    )
  ) {
    return 'MECHATRONICS';
  }


  if (
    text.includes(
      'robotics'
    ) ||
    text.includes(
      'automotion and robotics'
    )
  ) {
    return 'ROBOTICS';
  }


  if (
    text.includes(
      'civil engineering'
    )
  ) {
    return 'CE';
  }


  if (
    text.includes(
      'chemical engineering'
    )
  ) {
    return 'CHEMICAL';
  }


  if (
    text.includes(
      'biotechnology'
    ) ||
    text.includes(
      'bioinformatics'
    )
  ) {
    return 'BIOTECH';
  }


  if (
    text.includes(
      'textile'
    ) ||
    text.includes(
      'man made fibre'
    ) ||
    text.includes(
      'carpet'
    ) ||
    text.includes(
      'handloom'
    )
  ) {
    return 'TEXTILE';
  }


  if (
    text.includes(
      'agriculture engineering'
    ) ||
    text.includes(
      'agricultural engineering'
    )
  ) {
    return 'AGRICULTURE';
  }


  if (
    text.includes(
      'mining engineering'
    )
  ) {
    return 'MINING';
  }


  if (
    text.includes(
      'aeronautical'
    )
  ) {
    return 'AERONAUTICAL';
  }


  if (
    text.includes(
      'automobile'
    )
  ) {
    return 'AUTOMOBILE';
  }


  if (
    text.includes(
      'biomedical'
    )
  ) {
    return 'BIOMEDICAL';
  }


  if (
    text.includes(
      'mathematics and computing'
    )
  ) {
    return 'MNC';
  }


  if (
    text.includes(
      'food technology'
    ) ||
    text.includes(
      'food engineering'
    )
  ) {
    return 'FOOD';
  }


  if (
    text.includes(
      'environmental engineering'
    )
  ) {
    return 'ENVIRONMENTAL';
  }


  if (
    text.includes(
      'manufacturing'
    ) ||
    text.includes(
      'industrial production'
    )
  ) {
    return 'MANUFACTURING';
  }


  if (
    text.includes(
      'plastic engineering'
    )
  ) {
    return 'PLASTIC';
  }


  return 'OTHER';
}


export function normalizeBranchPreference(
  value
) {
  const text =
    normalizeText(
      value
    );


  if (!text) {
    return null;
  }


  if (
    Object.prototype
      .hasOwnProperty.call(
        PREFERENCE_ALIASES,
        text
      )
  ) {
    return PREFERENCE_ALIASES[
      text
    ];
  }


  return getBranchFamily(
    text
  );
}


function getFamilyRelationScore(
  preferredFamily,
  candidateFamily
) {
  if (
    !preferredFamily ||
    !candidateFamily
  ) {
    return null;
  }


  if (
    preferredFamily ===
    candidateFamily
  ) {
    return 100;
  }


  const computerFamilies =
    new Set([
      'CSE',
      'IT',
      'CSE_IT',
      'CSE_AI_ML',
      'CSE_DS',
      'CSE_CYBER',
      'CSE_IOT',
      'CSE_BUSINESS',
      'CSE_DESIGN',
    ]);


  if (
    computerFamilies.has(
      preferredFamily
    ) &&
    computerFamilies.has(
      candidateFamily
    )
  ) {
    if (
      preferredFamily ===
        'CSE' ||
      candidateFamily ===
        'CSE'
    ) {
      return 90;
    }


    if (
      preferredFamily ===
        'IT' ||
      candidateFamily ===
        'IT'
    ) {
      return 85;
    }


    return 82;
  }


  const electronicsFamilies =
    new Set([
      'ECE',
      'ELECTRONICS',
      'VLSI',
      'EE',
      'EEE',
      'INSTRUMENTATION',
    ]);


  if (
    electronicsFamilies.has(
      preferredFamily
    ) &&
    electronicsFamilies.has(
      candidateFamily
    )
  ) {
    if (
      (
        preferredFamily ===
          'ECE' &&
        candidateFamily ===
          'ELECTRONICS'
      ) ||
      (
        preferredFamily ===
          'ELECTRONICS' &&
        candidateFamily ===
          'ECE'
      )
    ) {
      return 92;
    }


    if (
      preferredFamily ===
        'VLSI' ||
      candidateFamily ===
        'VLSI'
    ) {
      return 88;
    }


    return 80;
  }


  if (
    (
      preferredFamily ===
        'ME' &&
      candidateFamily ===
        'MECHATRONICS'
    ) ||
    (
      preferredFamily ===
        'MECHATRONICS' &&
      candidateFamily ===
        'ME'
    )
  ) {
    return 88;
  }


  if (
    (
      preferredFamily ===
        'MECHATRONICS' &&
      candidateFamily ===
        'ROBOTICS'
    ) ||
    (
      preferredFamily ===
        'ROBOTICS' &&
      candidateFamily ===
        'MECHATRONICS'
    )
  ) {
    return 85;
  }


  return 40;
}


export function scoreBranchPreference({
  branchName,
  preferences = [],
}) {
  const candidateFamily =
    getBranchFamily(
      branchName
    );


  const cleanedPreferences =
    Array.isArray(
      preferences
    )
      ? preferences
          .map(
            normalizeBranchPreference
          )
          .filter(
            Boolean
          )
      : [];


  if (
    cleanedPreferences.length ===
    0
  ) {
    return {
      candidateFamily,

      preferenceRank:
        null,

      familyMatchScore:
        null,

      matchedPreference:
        null,

      matchedPreferencePosition:
        null,

      matchType:
        'NO_PREFERENCE',
    };
  }


  const exactIndex =
    cleanedPreferences
      .findIndex(
        (family) =>
          family ===
          candidateFamily
      );


  if (
    exactIndex >= 0
  ) {
    return {
      candidateFamily,

      preferenceRank:
        exactIndex + 1,

      familyMatchScore:
        100,

      matchedPreference:
        cleanedPreferences[
          exactIndex
        ],

      matchedPreferencePosition:
        exactIndex + 1,

      matchType:
        'EXACT_FAMILY',
    };
  }


  let bestScore =
    null;

  let bestPreference =
    null;

  let bestIndex =
    null;


  cleanedPreferences
    .forEach(
      (
        preferredFamily,
        index
      ) => {
        const relationScore =
          getFamilyRelationScore(
            preferredFamily,
            candidateFamily
          );


        if (
          relationScore ===
          null
        ) {
          return;
        }


        const adjustedScore =
          Math.max(
            0,
            relationScore -
            (
              index * 4
            )
          );


        if (
          bestScore ===
            null ||
          adjustedScore >
            bestScore
        ) {
          bestScore =
            adjustedScore;

          bestPreference =
            preferredFamily;

          bestIndex =
            index;
        }
      }
    );


  return {
    candidateFamily,

    preferenceRank:
      null,

    familyMatchScore:
      bestScore,

    matchedPreference:
      bestPreference,

    matchedPreferencePosition:
      bestIndex === null
        ? null
        : bestIndex + 1,

    matchType:
      bestScore !== null &&
      bestScore > 40
        ? 'RELATED_FAMILY'
        : 'NON_PREFERRED',
  };
}


export function parseBranchPreferences(
  value
) {
  if (
    Array.isArray(
      value
    )
  ) {
    return value
      .map(
        (item) =>
          String(
            item
          ).trim()
      )
      .filter(
        Boolean
      );
  }


  return String(
    value ?? ''
  )
    .split(',')
    .map(
      (item) =>
        item.trim()
    )
    .filter(
      Boolean
    );
}