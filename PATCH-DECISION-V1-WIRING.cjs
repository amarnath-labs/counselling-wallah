const fs =
  require("fs");

const file =
  "./frontend/src/components/DecisionIntelligencePanel.jsx";

let text =
  fs.readFileSync(
    file,
    "utf8"
  );


/*
|--------------------------------------------------------------------------
| CURRENT RANK
|--------------------------------------------------------------------------
*/

text =
  text.replace(
    /const\s+currentRank\s*=\s*index\s*\+\s*1\s*;/,
`const currentRank =
    getCurrentGlobalRankV1(
      row,
      index
    );`
  );


/*
|--------------------------------------------------------------------------
| SCENARIO RANK
|--------------------------------------------------------------------------
*/

text =
  text.replace(
    /findScenarioRank\(\s*row\s*,\s*rows\s*,\s*scenario\s*\)/g,
    `findScenarioRankV1(
          row,
          rows,
          scenario
        )`
  );


/*
|--------------------------------------------------------------------------
| SCENARIO SCORE
|--------------------------------------------------------------------------
*/

text =
  text.replace(
    /scenarioScore\(\s*row\s*,\s*scenario\s*\)/g,
    `scenarioScoreV1(
                row,
                scenario
              )`
  );


/*
|--------------------------------------------------------------------------
| BRANCH ALTERNATIVE
|--------------------------------------------------------------------------
*/

text =
  text.replace(
    /findAlternative\(\s*row\s*,\s*rows\s*,\s*['"]branch['"]\s*\)/g,
    `findBetterAlternativeV1(
          row,
          rows,
          'branch'
        )`
  );


/*
|--------------------------------------------------------------------------
| COLLEGE ALTERNATIVE
|--------------------------------------------------------------------------
*/

text =
  text.replace(
    /findAlternative\(\s*row\s*,\s*rows\s*,\s*['"]college['"]\s*\)/g,
    `findBetterAlternativeV1(
          row,
          rows,
          'quality'
        )`
  );


/*
|--------------------------------------------------------------------------
| BUDGET ALTERNATIVE
|--------------------------------------------------------------------------
*/

text =
  text.replace(
    /findAlternative\(\s*row\s*,\s*rows\s*,\s*['"]budget['"]\s*\)/g,
    `findBetterAlternativeV1(
          row,
          rows,
          'budget'
        )`
  );


/*
|--------------------------------------------------------------------------
| LOCATION ALTERNATIVE
|--------------------------------------------------------------------------
|
| Existing panel may not have one yet.
|--------------------------------------------------------------------------
*/


fs.writeFileSync(
  file,
  text,
  "utf8"
);


console.log(
  "PASS: Decision Intelligence now uses V1 ranking/scenario/alternatives"
);
