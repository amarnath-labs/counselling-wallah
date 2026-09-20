import {
  QUESTIONS,
} from './src/data/careerQuestions/v7/class8.js';


console.log({
  total:
    QUESTIONS.length,

  withScenario:
    QUESTIONS.filter(
      (q) =>
        Boolean(q.scenario)
    ).length,

  withScenarioFamily:
    QUESTIONS.filter(
      (q) =>
        Boolean(
          q.scenarioFamily
        )
    ).length,

  uniqueScenarios:
    new Set(
      QUESTIONS.map(
        (q) => q.scenario
      )
    ).size,

  uniqueFamilies:
    new Set(
      QUESTIONS.map(
        (q) =>
          q.scenarioFamily
      )
    ).size,
});


console.table(
  QUESTIONS.slice(
    0,
    12
  ).map(
    (q) => ({
      id: q.id,
      trait: q.trait,
      scenarioFamily:
        q.scenarioFamily,
      scenario:
        q.scenario,
    })
  )
);
