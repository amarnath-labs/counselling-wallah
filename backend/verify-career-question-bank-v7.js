import {
  CAREER_QUESTION_BANK_V7,
} from './src/data/careerQuestions/v7/index.js';

import {
  V7_CANONICAL_TRAITS,
  V7_CLASS_CONFIG,
  V7_CONTEXT_SCOPES,
  V7_RESPONSE_FORMATS,
} from './src/data/careerQuestions/v7/shared.js';


function fail(message) {
  throw new Error(message);
}


function validateQuestion(
  question
) {
  if (!question.id) {
    fail('Question missing id');
  }

  if (!question.text) {
    fail(
      `${question.id}: missing text`
    );
  }

  if (
    !V7_CANONICAL_TRAITS.includes(
      question.trait
    )
  ) {
    fail(
      `${question.id}: invalid trait ${question.trait}`
    );
  }

  if (
    !V7_CONTEXT_SCOPES.includes(
      question.contextScope
    )
  ) {
    fail(
      `${question.id}: invalid contextScope ${question.contextScope}`
    );
  }

  if (
    !V7_RESPONSE_FORMATS.includes(
      question.responseFormat
    )
  ) {
    fail(
      `${question.id}: invalid responseFormat ${question.responseFormat}`
    );
  }

  if (
    question.version !== 7
  ) {
    fail(
      `${question.id}: version must be 7`
    );
  }


  if (
    typeof question.scenario !== 'string' ||
    !question.scenario.trim()
  ) {
    fail(
      `${question.id}: missing scenario`
    );
  }


  if (
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(
      question.scenario
    )
  ) {
    fail(
      `${question.id}: invalid scenario slug "${question.scenario}"`
    );
  }


  if (
    typeof question.scenarioFamily !==
      'string' ||
    !question.scenarioFamily.trim()
  ) {
    fail(
      `${question.id}: missing scenarioFamily`
    );
  }


  if (
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(
      question.scenarioFamily
    )
  ) {
    fail(
      `${question.id}: invalid scenarioFamily "${question.scenarioFamily}"`
    );
  }


  if (
    !Number.isInteger(
      Number(question.difficulty)
    ) ||
    Number(question.difficulty) < 1 ||
    Number(question.difficulty) > 5
  ) {
    fail(
      `${question.id}: difficulty must be 1-5`
    );
  }

  if (
    question.minClass != null &&
    question.maxClass != null &&
    Number(question.minClass) >
      Number(question.maxClass)
  ) {
    fail(
      `${question.id}: minClass > maxClass`
    );
  }
}


function main() {
  const ids =
    new Set();

  const textByClass =
    new Map();

  const traitCounts =
    new Map();

  /*
  |--------------------------------------------------------------------------
  | Scenario uniqueness
  |--------------------------------------------------------------------------
  |
  | Within the same class and trait, one semantic scenario may only
  | represent one assessment item.
  |
  | Different traits may intentionally examine different behaviours
  | inside the same broader real-world situation.
  |
  */

  const scenarioByTrait =
    new Map();


  for (
    const question
    of CAREER_QUESTION_BANK_V7
  ) {
    validateQuestion(
      question
    );

    if (
      ids.has(
        question.id
      )
    ) {
      fail(
        `Duplicate id: ${question.id}`
      );
    }

    ids.add(
      question.id
    );


    const classKey =
      question.classes?.[0] ||
      question.stage;


    const textKey =
      `${classKey}::${String(
        question.text
      )
        .trim()
        .toLowerCase()}`;


    if (
      textByClass.has(
        textKey
      )
    ) {
      fail(
        `Duplicate wording in ${classKey}: ${question.text}`
      );
    }

    textByClass.set(
      textKey,
      question.id
    );


    const scenarioKey =
      `${classKey}::${question.trait}::${question.scenario}`;

    if (
      scenarioByTrait.has(
        scenarioKey
      )
    ) {
      fail(
        `Duplicate scenario for ${classKey}/${question.trait}: ` +
        `${question.scenario} ` +
        `(${scenarioByTrait.get(scenarioKey)} and ${question.id})`
      );
    }

    scenarioByTrait.set(
      scenarioKey,
      question.id
    );


    const traitKey =
      `${classKey}::${question.trait}`;

    traitCounts.set(
      traitKey,
      (
        traitCounts.get(
          traitKey
        ) || 0
      ) + 1
    );
  }


  const summary = {};

  for (
    const [
      classKey,
      config,
    ]
    of Object.entries(
      V7_CLASS_CONFIG
    )
  ) {
    const relevant =
      CAREER_QUESTION_BANK_V7
        .filter(
          (question) => {
            if (
              config.classNumber != null
            ) {
              return (
                question.classes?.[0] ===
                classKey
              );
            }

            return (
              question.stage ===
              config.stage
            );
          }
        );


    const traitsPresent =
      new Set(
        relevant.map(
          (question) =>
            question.trait
        )
      );


    const missingTraits =
      V7_CANONICAL_TRAITS
        .filter(
          (trait) =>
            !traitsPresent.has(
              trait
            )
        );


    summary[classKey] = {
      total:
        relevant.length,

      target:
        config.minimumTarget,

      traits:
        traitsPresent.size,

      missingTraits,
    };
  }


  console.table(
    Object.entries(
      summary
    ).map(
      ([
        classKey,
        item,
      ]) => ({
        classKey,

        total:
          item.total,

        target:
          item.target,

        traits:
          item.traits,

        missingTraits:
          item.missingTraits.join(', '),
      })
    )
  );


  console.log(
    '\nTOTAL V7 QUESTIONS:',
    CAREER_QUESTION_BANK_V7.length
  );


  if (
    CAREER_QUESTION_BANK_V7.length ===
    0
  ) {
    console.log(
      '\nÃ¢Å“â€¦ V7 FOUNDATION STRUCTURE VALID'
    );

    console.log(
      'Ã¢â€žÂ¹Ã¯Â¸Â Question files are intentionally empty at this stage.'
    );

    return;
  }


  console.log(
    '\nÃ¢Å“â€¦ V7 QUESTION BANK VALIDATION PASSED'
  );
}


main();

