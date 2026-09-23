import fs from "node:fs";

const file =
  "./frontend/src/pages/Results.jsx";

const backup =
  "./frontend/src/pages/Results.before-csab-reference-fix.jsx";

if (!fs.existsSync(file)) {
  throw new Error(
    `Missing file: ${file}`
  );
}

let s =
  fs.readFileSync(
    file,
    "utf8"
  );

fs.copyFileSync(
  file,
  backup
);


/*
|--------------------------------------------------------------------------
| FIX BROKEN RECOMMENDATION EXAM SOURCE BLOCK
|--------------------------------------------------------------------------
*/

const blockRegex =
  /\/\*\s*\|?-*\s*\|?\s*TRUMARG RECOMMENDATION COUNSELLING SOURCE[\s\S]*?const recommendationExamId\s*=\s*[\s\S]*?baseRecommendationExamId\s*;/m;

const match =
  s.match(
    blockRegex
  );

if (!match) {
  throw new Error(
    "Broken counselling source block not found."
  );
}


const fixedBlock =
`/*
  |--------------------------------------------------------------------------
  | TRUMARG RECOMMENDATION COUNSELLING SOURCE
  |--------------------------------------------------------------------------
  |
  | JEE Main remains the visible/base exam.
  |
  | JoSAA:
  |   API examId = jee-main
  |
  | CSAB:
  |   API examId = csab-special
  |--------------------------------------------------------------------------
  */

  const baseRecommendationExamId =
    String(
      selectedExamId ||
      profile?.examId ||
      ''
    )
      .trim()
      .toLowerCase();


  const recommendationExamId =
    baseRecommendationExamId ===
      'jee-main' &&
    String(
      profile?.counsellingMode ||
      'josaa'
    )
      .trim()
      .toLowerCase() ===
      'csab'
      ? 'csab-special'
      : baseRecommendationExamId;`;


s =
  s.replace(
    blockRegex,
    fixedBlock
  );


/*
|--------------------------------------------------------------------------
| SAFETY CHECKS
|--------------------------------------------------------------------------
*/

if (
  /const baseRecommendationExamId\s*=\s*String\(\s*recommendationExamId/m
    .test(s)
) {
  throw new Error(
    "Self-reference still exists."
  );
}


const declarationCount =
  (
    s.match(
      /const recommendationExamId\s*=/g
    ) || []
  ).length;

if (
  declarationCount !== 1
) {
  throw new Error(
    `Expected exactly 1 recommendationExamId declaration, found ${declarationCount}`
  );
}


fs.writeFileSync(
  file,
  s,
  "utf8"
);


console.log("");
console.log(
  "=============================================="
);
console.log(
  "RESULTS CSAB REFERENCE FIXED"
);
console.log(
  "=============================================="
);
console.log(
  "JoSAA -> recommendationExamId = jee-main"
);
console.log(
  "CSAB  -> recommendationExamId = csab-special"
);
console.log(
  "Admission logic: UNCHANGED"
);
console.log(
  "Review logic: UNCHANGED"
);
console.log(
  "Ranking logic: UNCHANGED"
);
console.log(
  "Backup:",
  backup
);
