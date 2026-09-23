import fs from "node:fs";

const path =
  "./src/services/reviewScoringServiceV3.js";

const backup =
  "./src/services/reviewScoringServiceV3.before-dominance-semantics-fix.js";

const original =
  fs.readFileSync(
    path,
    "utf8"
  );


const regex =
  /const\s+sourceDominancePass\s*=\s*effectiveReviewCount\s*>=\s*50\s*&&\s*effectiveSourceCount\s*>=\s*3\s*&&\s*maxSourceShare\s*!==\s*null\s*&&\s*maxSourceShare\s*<=\s*0\.60\s*;/m;


if (
  !regex.test(
    original
  )
) {
  throw new Error(
    "Old combined sourceDominancePass block not found. No changes written."
  );
}


const updated =
  original.replace(
    regex,
`const sourceDominancePass =
    maxSourceShare !==
      null &&
    maxSourceShare <=
      0.60;`
  );


if (
  updated ===
  original
) {
  throw new Error(
    "No replacement occurred."
  );
}


fs.writeFileSync(
  backup,
  original,
  "utf8"
);


fs.writeFileSync(
  path,
  updated,
  "utf8"
);


console.log(
  "SUCCESS: sourceDominancePass now means only <=60% source dominance."
);

console.log(
  "Backup:",
  backup
);
