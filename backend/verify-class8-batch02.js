import batch from
  './src/data/careerQuestions/v7/class8Batch02.js';


const traitCounts =
  {};


for (
  const question of batch
) {
  traitCounts[
    question.trait
  ] =
    (
      traitCounts[
        question.trait
      ] || 0
    ) + 1;
}


const scenarioKeys =
  new Set(
    batch.map(
      (question) =>
        `${question.trait}::${question.scenario}`
    )
  );


console.log({
  total:
    batch.length,

  withScenario:
    batch.filter(
      (question) =>
        Boolean(
          question.scenario
        )
    ).length,

  withScenarioFamily:
    batch.filter(
      (question) =>
        Boolean(
          question.scenarioFamily
        )
    ).length,

  uniqueTraitScenarios:
    scenarioKeys.size,
});


console.table(
  Object.entries(
    traitCounts
  ).map(
    ([trait, count]) => ({
      trait,
      count,
    })
  )
);


if (
  batch.length !== 404 ||
  scenarioKeys.size !== 404
) {
  throw new Error(
    'Class-8 Batch-02 validation failed'
  );
}


console.log(
  '\n✅ CLASS-8 BATCH-02 SOURCE CHECK PASSED'
);
