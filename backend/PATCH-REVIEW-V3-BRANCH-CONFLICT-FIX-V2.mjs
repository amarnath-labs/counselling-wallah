import fs from "node:fs";

const path =
  "./src/services/reviewScoringServiceV3.js";

const backup =
  "./src/services/reviewScoringServiceV3.before-branch-conflict-fix-v2.js";

const original =
  fs.readFileSync(
    path,
    "utf8"
  );


/*
|--------------------------------------------------------------------------
| ALREADY PATCHED?
|--------------------------------------------------------------------------
*/

if (
  original.includes(
    "branch_target_item_conflict"
  )
) {
  throw new Error(
    "Branch conflict fix already applied."
  );
}


/*
|--------------------------------------------------------------------------
| FIND resolveAspectEvidenceEligibility()
|--------------------------------------------------------------------------
*/

const functionStartMatch =
  original.match(
    /function\s+resolveAspectEvidenceEligibility\s*\(\s*\{/m
  );


if (
  !functionStartMatch
) {
  throw new Error(
    "resolveAspectEvidenceEligibility() not found."
  );
}


const functionStart =
  functionStartMatch.index;


/*
|--------------------------------------------------------------------------
| FIND FUNCTION BODY OPENING BRACE
|--------------------------------------------------------------------------
*/

const signatureTail =
  original.slice(
    functionStart
  );


const bodyMatch =
  signatureTail.match(
    /\}\s*\)\s*\{/m
  );


if (
  !bodyMatch
) {
  throw new Error(
    "Function body opening brace not found."
  );
}


const openingBrace =
  functionStart +
  bodyMatch.index +
  bodyMatch[0].lastIndexOf(
    "{"
  );


/*
|--------------------------------------------------------------------------
| BRACE MATCH FUNCTION
|--------------------------------------------------------------------------
*/

let depth = 0;
let closingBrace = -1;


for (
  let i = openingBrace;
  i < original.length;
  i++
) {
  const char =
    original[i];


  if (
    char === "{"
  ) {
    depth++;
  }
  else if (
    char === "}"
  ) {
    depth--;


    if (
      depth === 0
    ) {
      closingBrace =
        i;

      break;
    }
  }
}


if (
  closingBrace === -1
) {
  throw new Error(
    "Function closing brace not found."
  );
}


const before =
  original.slice(
    0,
    functionStart
  );


let fn =
  original.slice(
    functionStart,
    closingBrace + 1
  );


const after =
  original.slice(
    closingBrace + 1
  );


console.log(
  "resolveAspectEvidenceEligibility extracted chars:",
  fn.length
);


/*
|--------------------------------------------------------------------------
| CONFIRM OLD UNSAFE LOGIC EXISTS INSIDE THIS FUNCTION
|--------------------------------------------------------------------------
*/

const evidenceBranchRegex =
  /const\s+evidenceBranch\s*=\s*canonicalizeBranch\s*\(\s*targetBranch\s*\|\|\s*itemBranch\s*\)\s*;/m;


if (
  !evidenceBranchRegex.test(
    fn
  )
) {
  throw new Error(
    "Unsafe targetBranch || itemBranch resolver not found. No changes written."
  );
}


/*
|--------------------------------------------------------------------------
| REPLACE ONLY BRANCH RESOLUTION
|--------------------------------------------------------------------------
*/

fn =
  fn.replace(
    evidenceBranchRegex,
`/*
    |--------------------------------------------------------------------------
    | STRICT BRANCH EVIDENCE RESOLUTION
    |--------------------------------------------------------------------------
    |
    | Never allow target_branch to silently override a conflicting
    | VERIFIED review-item branch.
    |
    */

    const targetEvidenceBranch =
      canonicalizeBranch(
        targetBranch
      );


    const verifiedItemBranch =
      branchVerified &&
      itemBranch
        ? canonicalizeBranch(
            itemBranch
          )
        : null;


    /*
    |--------------------------------------------------------------------------
    | CONFLICT = REJECT
    |--------------------------------------------------------------------------
    */

    if (
      targetEvidenceBranch &&
      verifiedItemBranch &&
      targetEvidenceBranch !==
        verifiedItemBranch
    ) {
      return {
        usable: false,

        reason:
          "different_branch",

        scopeReason:
          "branch_target_item_conflict",
      };
    }


    /*
    |--------------------------------------------------------------------------
    | USE EXPLICIT TARGET, OTHERWISE VERIFIED ITEM BRANCH
    |--------------------------------------------------------------------------
    */

    const evidenceBranch =
      targetEvidenceBranch ||
      verifiedItemBranch;`
  );


/*
|--------------------------------------------------------------------------
| VALIDATE PATCHED FUNCTION
|--------------------------------------------------------------------------
*/

const required = [
  "targetEvidenceBranch",
  "verifiedItemBranch",
  "branch_target_item_conflict",
];


for (
  const token
  of required
) {
  if (
    !fn.includes(
      token
    )
  ) {
    throw new Error(
      `Validation failed: ${token}`
    );
  }
}


if (
  /canonicalizeBranch\s*\(\s*targetBranch\s*\|\|\s*itemBranch\s*\)/m.test(
    fn
  )
) {
  throw new Error(
    "Unsafe old branch precedence still exists."
  );
}


/*
|--------------------------------------------------------------------------
| WRITE AFTER ALL VALIDATIONS
|--------------------------------------------------------------------------
*/

fs.writeFileSync(
  backup,
  original,
  "utf8"
);


fs.writeFileSync(
  path,
  before +
    fn +
    after,
  "utf8"
);


console.log(
  "SUCCESS: strict branch conflict protection applied."
);

console.log(
  "Backup:",
  backup
);
