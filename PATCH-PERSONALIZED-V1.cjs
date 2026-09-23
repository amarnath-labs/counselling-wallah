const fs =
  require("fs");

const file =
  "./frontend/src/services/cwRecRecommendationService.js";

let text =
  fs.readFileSync(
    file,
    "utf8"
  );


/*
|--------------------------------------------------------------------------
| IMPORT
|--------------------------------------------------------------------------
*/

const importLine =
`import {
  rankPersonalizedRecommendationsV1,
} from './personalizedRecommendationEngineV1.js';

`;


if (
  !text.includes(
    "personalizedRecommendationEngineV1.js"
  )
) {
  text =
    importLine +
    text;
}


/*
|--------------------------------------------------------------------------
| REPLACE ROW MAP
|--------------------------------------------------------------------------
|
| Old variants:
|
| payload.data.map(adaptCWRecRow)
|
| OR
|
| payload.data.map(
|   (row) => adaptCWRecRow(row, rank)
| )
|
|--------------------------------------------------------------------------
*/

const rowsPattern =
  /const\s+rows\s*=\s*Array\.isArray\(payload\?\.data\)[\s\S]*?:\s*\[\]\s*;/;


const match =
  text.match(
    rowsPattern
  );


if (!match) {
  throw new Error(
    "Could not find rows mapping block in cwRecRecommendationService.js"
  );
}


const replacement =
`const adaptedRows =
    Array.isArray(payload?.data)
      ? payload.data.map(
          (row) =>
            adaptCWRecRow(
              row,
              rank
            )
        )
      : [];


  const rows =
    rankPersonalizedRecommendationsV1(
      adaptedRows,
      {
        ...profile,

        rank,

        annualBudget:
          getAnnualBudget(
            profile
          ),

        homeState:
          profile?.homeState ??
          profile?.state ??
          null,

        preferredBranches:
          profile?.preferredBranches ??
          profile?.branchPreferences ??
          profile?.branches ??
          [],
      }
    );`;


text =
  text.replace(
    rowsPattern,
    replacement
  );


fs.writeFileSync(
  file,
  text,
  "utf8"
);


console.log(
  "PASS: cwRecRecommendationService.js now uses Personalized Engine V1"
);
