import questions from
  './src/data/careerQuestions/v7/graduateBatch01.js';


function normalizeValue(value) {
  return String(
    value || ''
  )
    .trim()
    .toLowerCase();
}


function countValues(
  items,
  getter
) {
  const map =
    new Map();


  for (
    const item
    of items
  ) {
    const raw =
      getter(
        item
      );


    const value =
      normalizeValue(
        raw
      ) ||
      '(empty)';


    map.set(
      value,
      (
        map.get(
          value
        ) ||
        0
      ) +
        1
    );
  }


  return [
    ...map.entries(),
  ].sort(
    (
      left,
      right
    ) =>
      right[1] -
      left[1]
  );
}


function groupByTrait(
  items
) {
  const map =
    new Map();


  for (
    const item
    of items
  ) {
    const trait =
      normalizeValue(
        item.trait
      ) ||
      '(empty)';


    if (
      !map.has(
        trait
      )
    ) {
      map.set(
        trait,
        []
      );
    }


    map.get(
      trait
    ).push(
      item
    );
  }


  return map;
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


console.log('');
console.log(
  '========================================'
);
console.log(
  'GRADUATE SCENARIO DIVERSITY AUDIT'
);
console.log(
  '========================================'
);
console.log(
  `Questions: ${questions.length}`
);


/*
|--------------------------------------------------------------------------
| Missing metadata
|--------------------------------------------------------------------------
*/


const missingScenario =
  questions.filter(
    question =>
      !normalizeValue(
        question.scenario
      )
  );


const missingScenarioFamily =
  questions.filter(
    question =>
      !normalizeValue(
        question.scenarioFamily
      )
  );


console.log('');
console.log(
  'METADATA COMPLETENESS'
);
console.log(
  '-'.repeat(
    70
  )
);

console.log(
  `Missing scenario: ${missingScenario.length}`
);

console.log(
  `Missing scenarioFamily: ${missingScenarioFamily.length}`
);


/*
|--------------------------------------------------------------------------
| Global diversity
|--------------------------------------------------------------------------
*/


const globalScenarioRows =
  countValues(
    questions,
    question =>
      question.scenario
  );


const globalFamilyRows =
  countValues(
    questions,
    question =>
      question.scenarioFamily
  );


console.log('');
console.log(
  'GLOBAL DIVERSITY'
);
console.log(
  '-'.repeat(
    70
  )
);

console.log(
  `Unique scenarios: ${globalScenarioRows.length}`
);

console.log(
  `Unique scenario families: ${globalFamilyRows.length}`
);


console.log('');
console.log(
  'TOP SCENARIOS'
);
console.log(
  '-'.repeat(
    70
  )
);


for (
  const [
    scenario,
    count,
  ]
  of globalScenarioRows.slice(
    0,
    15
  )
) {
  console.log(
    `${scenario.padEnd(
      45
    )} ${count}`
  );
}


console.log('');
console.log(
  'TOP SCENARIO FAMILIES'
);
console.log(
  '-'.repeat(
    70
  )
);


for (
  const [
    family,
    count,
  ]
  of globalFamilyRows.slice(
    0,
    15
  )
) {
  console.log(
    `${family.padEnd(
      45
    )} ${count}`
  );
}


/*
|--------------------------------------------------------------------------
| Per-trait diversity
|--------------------------------------------------------------------------
*/


const traitGroups =
  groupByTrait(
    questions
  );


console.log('');
console.log(
  'PER-TRAIT DIVERSITY'
);
console.log(
  '-'.repeat(
    70
  )
);


const issues =
  [];


for (
  const [
    trait,
    traitQuestions,
  ]
  of [
    ...traitGroups.entries(),
  ].sort()
) {
  const scenarioRows =
    countValues(
      traitQuestions,
      question =>
        question.scenario
    );


  const familyRows =
    countValues(
      traitQuestions,
      question =>
        question.scenarioFamily
    );


  const scenarioCount =
    scenarioRows.filter(
      (
        [
          value,
        ]
      ) =>
        value !==
        '(empty)'
    ).length;


  const familyCount =
    familyRows.filter(
      (
        [
          value,
        ]
      ) =>
        value !==
        '(empty)'
    ).length;


  const topScenario =
    scenarioRows.find(
      (
        [
          value,
        ]
      ) =>
        value !==
        '(empty)'
    );


  const topFamily =
    familyRows.find(
      (
        [
          value,
        ]
      ) =>
        value !==
        '(empty)'
    );


  const topScenarioCount =
    topScenario?.[1] ||
    0;


  const topFamilyCount =
    topFamily?.[1] ||
    0;


  const topScenarioShare =
    traitQuestions.length
      ? (
          topScenarioCount /
          traitQuestions.length
        ) *
        100
      : 0;


  const topFamilyShare =
    traitQuestions.length
      ? (
          topFamilyCount /
          traitQuestions.length
        ) *
        100
      : 0;


  console.log('');
  console.log(
    `${trait}`
  );

  console.log(
    `  Questions: ${traitQuestions.length}`
  );

  console.log(
    `  Unique scenarios: ${scenarioCount}`
  );

  console.log(
    `  Unique scenario families: ${familyCount}`
  );

  console.log(
    `  Top scenario share: ${topScenarioShare.toFixed(
      1
    )}%${
      topScenario
        ? ` (${topScenario[0]})`
        : ''
    }`
  );

  console.log(
    `  Top family share: ${topFamilyShare.toFixed(
      1
    )}%${
      topFamily
        ? ` (${topFamily[0]})`
        : ''
    }`
  );


  /*
  |--------------------------------------------------------------------------
  | Review thresholds
  |--------------------------------------------------------------------------
  |
  | These are audit heuristics, not hard psychometric rules.
  |--------------------------------------------------------------------------
  */


  if (
    scenarioCount <
    8
  ) {
    issues.push(
      `${trait}: only ${scenarioCount} unique scenarios`
    );
  }


  if (
    familyCount <
    4
  ) {
    issues.push(
      `${trait}: only ${familyCount} scenario families`
    );
  }


  if (
    topScenarioShare >
    25
  ) {
    issues.push(
      `${trait}: one scenario covers ${topScenarioShare.toFixed(
        1
      )}%`
    );
  }


  if (
    topFamilyShare >
    45
  ) {
    issues.push(
      `${trait}: one scenario family covers ${topFamilyShare.toFixed(
        1
      )}%`
    );
  }
}


/*
|--------------------------------------------------------------------------
| Repeated trait + scenario combinations
|--------------------------------------------------------------------------
*/


const traitScenarioMap =
  new Map();


for (
  const question
  of questions
) {
  const key =
    [
      normalizeValue(
        question.trait
      ),
      normalizeValue(
        question.scenario
      ),
    ].join(
      '::'
    );


  traitScenarioMap.set(
    key,
    (
      traitScenarioMap.get(
        key
      ) ||
      0
    ) +
      1
  );
}


const repeatedTraitScenarios =
  [
    ...traitScenarioMap.entries(),
  ]
    .filter(
      (
        [
          ,
          count,
        ]
      ) =>
        count >
        1
    )
    .sort(
      (
        left,
        right
      ) =>
        right[1] -
        left[1]
    );


console.log('');
console.log(
  'REPEATED TRAIT + SCENARIO'
);
console.log(
  '-'.repeat(
    70
  )
);

console.log(
  `Repeated combinations: ${repeatedTraitScenarios.length}`
);


for (
  const [
    key,
    count,
  ]
  of repeatedTraitScenarios.slice(
    0,
    20
  )
) {
  console.log(
    `${key.padEnd(
      55
    )} ${count}`
  );
}


/*
|--------------------------------------------------------------------------
| Final result
|--------------------------------------------------------------------------
*/


const metadataPass =
  missingScenario.length ===
    0 &&
  missingScenarioFamily.length ===
    0;


const repeatedCombinationPass =
  repeatedTraitScenarios.length ===
  0;


const diversityPass =
  issues.length ===
  0;


console.log('');
console.log(
  'DIVERSITY FLAGS'
);
console.log(
  '-'.repeat(
    70
  )
);


if (
  issues.length ===
  0
) {
  console.log(
    'No major scenario diversity issues detected.'
  );
} else {
  for (
    const issue
    of issues
  ) {
    console.log(
      `REVIEW: ${issue}`
    );
  }
}


console.log('');
console.log(
  'EXPECTED STRUCTURE CHECK'
);
console.log(
  '-'.repeat(
    70
  )
);

console.log(
  `Scenario metadata: ${
    metadataPass
      ? 'PASS'
      : 'REVIEW'
  }`
);

console.log(
  `Trait + scenario uniqueness: ${
    repeatedCombinationPass
      ? 'PASS'
      : 'REVIEW'
  }`
);

console.log(
  `Scenario diversity: ${
    diversityPass
      ? 'PASS'
      : 'REVIEW'
  }`
);


const passed =
  questions.length ===
    500 &&
  metadataPass &&
  repeatedCombinationPass &&
  diversityPass;


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