import fs from "node:fs";

const path =
  "./src/pages/Results.jsx";

let content =
  fs.readFileSync(
    path,
    "utf8"
  );


const backup =
  "./src/pages/Results.jsx.before-v2-shadow";

fs.writeFileSync(
  backup,
  content,
  "utf8"
);


/*
|--------------------------------------------------------------------------
| IMPORT
|--------------------------------------------------------------------------
*/

if (
  !content.includes(
    "applyPersonalizedV2Shadow"
  )
) {
  const marker =
    "import {\n  fetchCWRecommendations,";

  const index =
    content.indexOf(
      marker
    );

  if (
    index === -1
  ) {
    throw new Error(
      "fetchCWRecommendations import marker not found. No changes made."
    );
  }


  const importEnd =
    content.indexOf(
      ";",
      index
    );


  if (
    importEnd === -1
  ) {
    throw new Error(
      "Import end not found."
    );
  }


  const addition = `

import {
  applyPersonalizedV2Shadow,
} from '../services/personalizedRecommendationV2';
`;


  content =
    content.slice(
      0,
      importEnd + 1
    ) +
    addition +
    content.slice(
      importEnd + 1
    );
}


/*
|--------------------------------------------------------------------------
| RESPONSE WIRING
|--------------------------------------------------------------------------
*/

const oldBlock = `setRecommendationRows(
            Array.isArray(
              response?.data
            )
              ? response.data
              : []
          );`;


const newBlock = `const rawRecommendationRows =
            Array.isArray(
              response?.data
            )
              ? response.data
              : [];


          const v2ShadowRows =
            applyPersonalizedV2Shadow(
              rawRecommendationRows,
              {
                ...profile,

                examId:
                  selectedExamId ||
                  profile?.examId,
              }
            );


          setRecommendationRows(
            v2ShadowRows
          );`;


if (
  !content.includes(
    oldBlock
  )
) {
  throw new Error(
    "setRecommendationRows marker not found. Results.jsx was NOT changed."
  );
}


content =
  content.replace(
    oldBlock,
    newBlock
  );


fs.writeFileSync(
  path,
  content,
  "utf8"
);


console.log(
  "SUCCESS: Personalized V2 shadow engine wired."
);
