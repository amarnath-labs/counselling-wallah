import questions from
  './src/data/careerQuestions/v7/graduateBatch01.js';


function isNonEmptyString(value) {
  return (
    typeof value === 'string' &&
    value.trim().length > 0
  );
}


function isFiniteNumber(value) {
  return (
    typeof value === 'number' &&
    Number.isFinite(value)
  );
}


function isArray(value) {
  return Array.isArray(value);
}


function isOptionalString(value) {
  return (
    value === null ||
    value === undefined ||
    typeof value === 'string'
  );
}


function addCount(
  map,
  value
) {
  const key =
    String(
      value ?? '(missing)'
    );

  map.set(
    key,
    (
      map.get(key) ||
      0
    ) + 1
  );
}


function printMap(
  title,
  map
) {
  console.log('');
  console.log(title);
  console.log('-'.repeat(70));

  for (
    const [
      key,
      count,
    ]
    of [
      ...map.entries(),
    ].sort(
      (
        left,
        right
      ) =>
        right[1] -
        left[1]
    )
  ) {
    console.log(
      `${key.padEnd(40)} ${count}`
    );
  }
}


if (
  !Array.isArray(
    questions
  )
) {
  throw new Error(
    'graduateBatch01.js did not export an array.'
  );
}


if (
  questions.length === 0
) {
  throw new Error(
    'Graduate question bank is empty.'
  );
}


console.log('');
console.log(
  '========================================'
);
console.log(
  'GRADUATE METADATA / SCHEMA AUDIT'
);
console.log(
  '========================================'
);
console.log(
  `Questions: ${questions.length}`
);


/*
|--------------------------------------------------------------------------
| Required string fields
|--------------------------------------------------------------------------
*/

const requiredStringFields = [
  'id',
  'stage',
  'section',
  'trait',
  'purpose',
  'text',
  'scenario',
  'scenarioFamily',
  'contextScope',
  'responseFormat',
];


/*
|--------------------------------------------------------------------------
| Required array fields
|--------------------------------------------------------------------------
*/

const requiredArrayFields = [
  'options',
  'degrees',
  'branches',
  'streams',
  'subjects',
  'skills',
  'goals',
  'tags',
  'classes',
  'boards',
  'interestClusters',
  'careerFamilies',
  'specializations',
  'currentStatuses',
  'experiences',
];


/*
|--------------------------------------------------------------------------
| Required numeric fields
|--------------------------------------------------------------------------
*/

const requiredNumericFields = [
  'difficulty',
  'priority',
  'weight',
  'version',
];


const issues = [];


/*
|--------------------------------------------------------------------------
| Distribution maps
|--------------------------------------------------------------------------
*/

const stageMap =
  new Map();

const sectionMap =
  new Map();

const difficultyMap =
  new Map();

const responseFormatMap =
  new Map();

const contextScopeMap =
  new Map();

const versionMap =
  new Map();

const priorityMap =
  new Map();

const weightMap =
  new Map();

const activeMap =
  new Map();

const minClassMap =
  new Map();

const maxClassMap =
  new Map();

const discriminatorGroupMap =
  new Map();


/*
|--------------------------------------------------------------------------
| Counters
|--------------------------------------------------------------------------
*/

let missingRequiredStrings =
  0;

let malformedArrays =
  0;

let malformedNumbers =
  0;

let invalidActive =
  0;

let invalidClassBounds =
  0;

let invalidDiscriminatorGroup =
  0;

let inactiveQuestions =
  0;

let emptyOptions =
  0;

let missingTrait =
  0;

let missingScenario =
  0;

let missingScenarioFamily =
  0;

let duplicateIds =
  0;


/*
|--------------------------------------------------------------------------
| ID uniqueness
|--------------------------------------------------------------------------
*/

const idMap =
  new Map();


for (
  const question
  of questions
) {
  const id =
    String(
      question.id ??
      ''
    ).trim();

  if (id) {
    idMap.set(
      id,
      (
        idMap.get(id) ||
        0
      ) + 1
    );
  }
}


for (
  const [
    id,
    count,
  ]
  of idMap
) {
  if (
    count > 1
  ) {
    duplicateIds += 1;

    issues.push(
      `${id}: duplicate ID (${count} occurrences)`
    );
  }
}


/*
|--------------------------------------------------------------------------
| Validate each question
|--------------------------------------------------------------------------
*/

for (
  const question
  of questions
) {
  const id =
    question.id ??
    '(missing-id)';


  /*
  |--------------------------------------------------------------------------
  | Required strings
  |--------------------------------------------------------------------------
  */

  for (
    const field
    of requiredStringFields
  ) {
    if (
      !isNonEmptyString(
        question[field]
      )
    ) {
      missingRequiredStrings +=
        1;

      issues.push(
        `${id}: invalid/missing string field "${field}"`
      );
    }
  }


  /*
  |--------------------------------------------------------------------------
  | Required arrays
  |--------------------------------------------------------------------------
  */

  for (
    const field
    of requiredArrayFields
  ) {
    if (
      !isArray(
        question[field]
      )
    ) {
      malformedArrays +=
        1;

      issues.push(
        `${id}: "${field}" must be an array`
      );
    }
  }


  /*
  |--------------------------------------------------------------------------
  | Required numeric fields
  |--------------------------------------------------------------------------
  */

  for (
    const field
    of requiredNumericFields
  ) {
    if (
      !isFiniteNumber(
        question[field]
      )
    ) {
      malformedNumbers +=
        1;

      issues.push(
        `${id}: "${field}" must be a finite number`
      );
    }
  }


  /*
  |--------------------------------------------------------------------------
  | discriminatorGroup
  |--------------------------------------------------------------------------
  |
  | Optional / nullable string field.
  |--------------------------------------------------------------------------
  */

  if (
    !isOptionalString(
      question.discriminatorGroup
    )
  ) {
    invalidDiscriminatorGroup +=
      1;

    issues.push(
      `${id}: discriminatorGroup must be string, null, or undefined`
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Active
  |--------------------------------------------------------------------------
  */

  if (
    typeof question.active !==
    'boolean'
  ) {
    invalidActive +=
      1;

    issues.push(
      `${id}: active must be boolean`
    );
  } else if (
    question.active ===
    false
  ) {
    inactiveQuestions +=
      1;
  }


  /*
  |--------------------------------------------------------------------------
  | minClass / maxClass
  |--------------------------------------------------------------------------
  |
  | Graduate questions may legitimately leave these undefined/null.
  |--------------------------------------------------------------------------
  */

  const minClass =
    question.minClass;

  const maxClass =
    question.maxClass;


  const minValid =
    minClass === null ||
    minClass === undefined ||
    isFiniteNumber(
      minClass
    );


  const maxValid =
    maxClass === null ||
    maxClass === undefined ||
    isFiniteNumber(
      maxClass
    );


  if (
    !minValid ||
    !maxValid
  ) {
    invalidClassBounds +=
      1;

    issues.push(
      `${id}: invalid minClass/maxClass type`
    );
  }


  if (
    isFiniteNumber(
      minClass
    ) &&
    isFiniteNumber(
      maxClass
    ) &&
    minClass >
      maxClass
  ) {
    invalidClassBounds +=
      1;

    issues.push(
      `${id}: minClass (${minClass}) > maxClass (${maxClass})`
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Important field checks
  |--------------------------------------------------------------------------
  */

  if (
    Array.isArray(
      question.options
    ) &&
    question.options.length ===
      0
  ) {
    emptyOptions +=
      1;

    issues.push(
      `${id}: options array is empty`
    );
  }


  if (
    !isNonEmptyString(
      question.trait
    )
  ) {
    missingTrait +=
      1;
  }


  if (
    !isNonEmptyString(
      question.scenario
    )
  ) {
    missingScenario +=
      1;
  }


  if (
    !isNonEmptyString(
      question.scenarioFamily
    )
  ) {
    missingScenarioFamily +=
      1;
  }


  /*
  |--------------------------------------------------------------------------
  | Distribution collection
  |--------------------------------------------------------------------------
  */

  addCount(
    stageMap,
    question.stage
  );

  addCount(
    sectionMap,
    question.section
  );

  addCount(
    difficultyMap,
    question.difficulty
  );

  addCount(
    responseFormatMap,
    question.responseFormat
  );

  addCount(
    contextScopeMap,
    question.contextScope
  );

  addCount(
    versionMap,
    question.version
  );

  addCount(
    priorityMap,
    question.priority
  );

  addCount(
    weightMap,
    question.weight
  );

  addCount(
    activeMap,
    question.active
  );

  addCount(
    minClassMap,
    question.minClass
  );

  addCount(
    maxClassMap,
    question.maxClass
  );

  addCount(
    discriminatorGroupMap,
    question.discriminatorGroup
  );
}


/*
|--------------------------------------------------------------------------
| Schema validation summary
|--------------------------------------------------------------------------
*/

console.log('');
console.log(
  'SCHEMA VALIDATION'
);
console.log(
  '-'.repeat(70)
);

console.log(
  `Missing/invalid required strings: ${missingRequiredStrings}`
);

console.log(
  `Malformed required arrays: ${malformedArrays}`
);

console.log(
  `Malformed numeric fields: ${malformedNumbers}`
);

console.log(
  `Invalid discriminatorGroup values: ${invalidDiscriminatorGroup}`
);

console.log(
  `Invalid active values: ${invalidActive}`
);

console.log(
  `Inactive questions: ${inactiveQuestions}`
);

console.log(
  `Invalid class bounds: ${invalidClassBounds}`
);

console.log(
  `Empty option arrays: ${emptyOptions}`
);

console.log(
  `Duplicate IDs: ${duplicateIds}`
);


/*
|--------------------------------------------------------------------------
| Critical metadata
|--------------------------------------------------------------------------
*/

console.log('');
console.log(
  'CRITICAL METADATA'
);
console.log(
  '-'.repeat(70)
);

console.log(
  `Missing trait: ${missingTrait}`
);

console.log(
  `Missing scenario: ${missingScenario}`
);

console.log(
  `Missing scenarioFamily: ${missingScenarioFamily}`
);


/*
|--------------------------------------------------------------------------
| Distribution output
|--------------------------------------------------------------------------
*/

printMap(
  'STAGE DISTRIBUTION',
  stageMap
);

printMap(
  'SECTION DISTRIBUTION',
  sectionMap
);

printMap(
  'DIFFICULTY DISTRIBUTION',
  difficultyMap
);

printMap(
  'RESPONSE FORMAT DISTRIBUTION',
  responseFormatMap
);

printMap(
  'CONTEXT SCOPE DISTRIBUTION',
  contextScopeMap
);

printMap(
  'VERSION DISTRIBUTION',
  versionMap
);

printMap(
  'PRIORITY DISTRIBUTION',
  priorityMap
);

printMap(
  'WEIGHT DISTRIBUTION',
  weightMap
);

printMap(
  'ACTIVE DISTRIBUTION',
  activeMap
);

printMap(
  'DISCRIMINATOR GROUP DISTRIBUTION',
  discriminatorGroupMap
);

printMap(
  'MIN CLASS DISTRIBUTION',
  minClassMap
);

printMap(
  'MAX CLASS DISTRIBUTION',
  maxClassMap
);


/*
|--------------------------------------------------------------------------
| Unexpected top-level keys
|--------------------------------------------------------------------------
*/

const expectedKeys =
  new Set([
    'id',
    'stage',
    'section',
    'trait',
    'purpose',
    'text',
    'options',
    'degrees',
    'branches',
    'streams',
    'subjects',
    'skills',
    'goals',
    'tags',
    'classes',
    'boards',
    'interestClusters',
    'careerFamilies',
    'difficulty',
    'discriminatorGroup',
    'scenario',
    'scenarioFamily',
    'contextScope',
    'minClass',
    'maxClass',
    'responseFormat',
    'priority',
    'weight',
    'active',
    'version',
    'specializations',
    'currentStatuses',
    'experiences',
  ]);


const unexpectedKeys =
  new Map();


for (
  const question
  of questions
) {
  for (
    const key
    of Object.keys(
      question
    )
  ) {
    if (
      !expectedKeys.has(
        key
      )
    ) {
      unexpectedKeys.set(
        key,
        (
          unexpectedKeys.get(
            key
          ) ||
          0
        ) + 1
      );
    }
  }
}


console.log('');
console.log(
  'UNEXPECTED TOP-LEVEL FIELDS'
);
console.log(
  '-'.repeat(70)
);


if (
  unexpectedKeys.size ===
  0
) {
  console.log(
    'None'
  );
} else {
  for (
    const [
      key,
      count,
    ]
    of unexpectedKeys
  ) {
    console.log(
      `${key.padEnd(40)} ${count}`
    );

    issues.push(
      `Unexpected top-level field "${key}" found in ${count} questions`
    );
  }
}


/*
|--------------------------------------------------------------------------
| Known Graduate v7 value checks
|--------------------------------------------------------------------------
*/

console.log('');
console.log(
  'KNOWN VALUE CHECKS'
);
console.log(
  '-'.repeat(70)
);


const invalidStages =
  questions.filter(
    question =>
      question.stage !==
      'graduate'
  );


const invalidResponseFormats =
  questions.filter(
    question =>
      question.responseFormat !==
      'likert-5'
  );


const invalidContextScopes =
  questions.filter(
    question =>
      question.contextScope !==
      'professional'
  );


const invalidVersions =
  questions.filter(
    question =>
      question.version !==
      7
  );


const invalidWeights =
  questions.filter(
    question =>
      question.weight !==
      1
  );


const invalidDifficulties =
  questions.filter(
    question =>
      ![
        3,
        4,
      ].includes(
        question.difficulty
      )
  );


const invalidPriorities =
  questions.filter(
    question =>
      ![
        3,
        4,
      ].includes(
        question.priority
      )
  );


console.log(
  `stage === graduate: ${
    invalidStages.length ===
    0
      ? 'PASS'
      : `REVIEW (${invalidStages.length})`
  }`
);

console.log(
  `responseFormat === likert-5: ${
    invalidResponseFormats.length ===
    0
      ? 'PASS'
      : `REVIEW (${invalidResponseFormats.length})`
  }`
);

console.log(
  `contextScope === professional: ${
    invalidContextScopes.length ===
    0
      ? 'PASS'
      : `REVIEW (${invalidContextScopes.length})`
  }`
);

console.log(
  `version === 7: ${
    invalidVersions.length ===
    0
      ? 'PASS'
      : `REVIEW (${invalidVersions.length})`
  }`
);

console.log(
  `weight === 1: ${
    invalidWeights.length ===
    0
      ? 'PASS'
      : `REVIEW (${invalidWeights.length})`
  }`
);

console.log(
  `difficulty in [3, 4]: ${
    invalidDifficulties.length ===
    0
      ? 'PASS'
      : `REVIEW (${invalidDifficulties.length})`
  }`
);

console.log(
  `priority in [3, 4]: ${
    invalidPriorities.length ===
    0
      ? 'PASS'
      : `REVIEW (${invalidPriorities.length})`
  }`
);


/*
|--------------------------------------------------------------------------
| Final checks
|--------------------------------------------------------------------------
*/

const schemaPass =
  missingRequiredStrings ===
    0 &&
  malformedArrays ===
    0 &&
  malformedNumbers ===
    0 &&
  invalidDiscriminatorGroup ===
    0 &&
  invalidActive ===
    0 &&
  invalidClassBounds ===
    0 &&
  emptyOptions ===
    0 &&
  duplicateIds ===
    0;


const metadataPass =
  missingTrait ===
    0 &&
  missingScenario ===
    0 &&
  missingScenarioFamily ===
    0;


const unexpectedFieldsPass =
  unexpectedKeys.size ===
  0;


const knownValuesPass =
  invalidStages.length ===
    0 &&
  invalidResponseFormats.length ===
    0 &&
  invalidContextScopes.length ===
    0 &&
  invalidVersions.length ===
    0 &&
  invalidWeights.length ===
    0 &&
  invalidDifficulties.length ===
    0 &&
  invalidPriorities.length ===
    0;


console.log('');
console.log(
  'EXPECTED STRUCTURE CHECK'
);
console.log(
  '-'.repeat(70)
);

console.log(
  `500 questions: ${
    questions.length ===
    500
      ? 'PASS'
      : 'FAIL'
  }`
);

console.log(
  `Schema consistency: ${
    schemaPass
      ? 'PASS'
      : 'REVIEW'
  }`
);

console.log(
  `Critical metadata: ${
    metadataPass
      ? 'PASS'
      : 'REVIEW'
  }`
);

console.log(
  `Known Graduate v7 values: ${
    knownValuesPass
      ? 'PASS'
      : 'REVIEW'
  }`
);

console.log(
  `Unexpected fields: ${
    unexpectedFieldsPass
      ? 'PASS'
      : 'REVIEW'
  }`
);


/*
|--------------------------------------------------------------------------
| Issue preview
|--------------------------------------------------------------------------
*/

console.log('');
console.log(
  'ISSUE PREVIEW'
);
console.log(
  '-'.repeat(70)
);


if (
  issues.length ===
  0
) {
  console.log(
    'No metadata/schema issues detected.'
  );
} else {
  console.log(
    `Total issues: ${issues.length}`
  );

  for (
    const issue
    of issues.slice(
      0,
      40
    )
  ) {
    console.log(
      `REVIEW: ${issue}`
    );
  }

  if (
    issues.length >
    40
  ) {
    console.log(
      `... ${issues.length - 40} more`
    );
  }
}


/*
|--------------------------------------------------------------------------
| Final result
|--------------------------------------------------------------------------
*/

const passed =
  questions.length ===
    500 &&
  schemaPass &&
  metadataPass &&
  knownValuesPass &&
  unexpectedFieldsPass;


console.log('');
console.log(
  '========================================'
);

console.log(
  passed
    ? 'RESULT: PASS'
    : 'RESULT: REVIEW'
);

console.log(
  '========================================'
);