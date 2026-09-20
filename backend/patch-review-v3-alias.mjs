import fs from "fs";

const filePath =
  "./src/services/reviewScoringServiceV3.js";

const backupPath =
  "./src/services/reviewScoringServiceV3.before-alias-fix.bak";


/*
|--------------------------------------------------------------------------
| BACKUP
|--------------------------------------------------------------------------
*/

fs.copyFileSync(
  filePath,
  backupPath
);


let content =
  fs.readFileSync(
    filePath,
    "utf8"
  );


/*
|--------------------------------------------------------------------------
| FIX 1
| COLLEGE ID ALIAS
|--------------------------------------------------------------------------
*/

if (
  !content.includes(
    "REVIEW_COLLEGE_ID_ALIASES"
  )
) {
  const normalizeIndex =
    content.indexOf(
      "function normalizeText(value)"
    );

  if (
    normalizeIndex === -1
  ) {
    throw new Error(
      "normalizeText(value) not found"
    );
  }


  const aliasBlock = `
/*
|--------------------------------------------------------------------------
| REVIEW COLLEGE ID ALIASES
|--------------------------------------------------------------------------
|
| Explicit verified aliases only.
| No fuzzy college matching.
|
*/

const REVIEW_COLLEGE_ID_ALIASES = new Map([
  [
    "maulana-azad-national-institute-of-technology-bhopal",
    "manit-bhopal",
  ],
]);


function resolveReviewCollegeId(
  collegeId
) {
  const id =
    String(
      collegeId ?? ""
    )
      .trim()
      .toLowerCase();

  if (!id) {
    return null;
  }

  return (
    REVIEW_COLLEGE_ID_ALIASES.get(
      id
    ) ??
    id
  );
}


`;


  content =
    content.slice(
      0,
      normalizeIndex
    ) +
    aliasBlock +
    content.slice(
      normalizeIndex
    );


  console.log(
    "✅ College alias added"
  );
} else {
  console.log(
    "ℹ️ College alias already exists"
  );
}


/*
|--------------------------------------------------------------------------
| FIX 2
| REPLACE canonicalizeBranch()
|--------------------------------------------------------------------------
|
| JoSAA branch:
|
| Computer Science and Engineering
| (4 Years, Bachelor of Technology)
|
| becomes:
|
| Computer Science and Engineering
|
*/

const branchStart =
  content.indexOf(
    "function canonicalizeBranch(value)"
  );


const aspectStart =
  content.indexOf(
    "function canonicalizeAspect(value)",
    branchStart
  );


if (
  branchStart === -1 ||
  aspectStart === -1
) {
  throw new Error(
    "canonicalizeBranch/canonicalizeAspect boundary not found"
  );
}


const newBranchFunction = `
function canonicalizeBranch(value) {
  /*
  |--------------------------------------------------------------------------
  | Remove counselling duration / degree suffix
  |--------------------------------------------------------------------------
  */

  const cleanedLabel =
    String(value ?? "")
      .trim()
      .replace(
        /\\s*\\(\\s*\\d+\\s+years?\\b[\\s\\S]*$/i,
        ""
      )
      .trim();


  const normalized =
    normalizeText(
      cleanedLabel
    );


  if (!normalized) {
    return null;
  }


  if (
    BRANCH_ALIASES.has(
      normalized
    )
  ) {
    return BRANCH_ALIASES.get(
      normalized
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Strict fallback
  |--------------------------------------------------------------------------
  |
  | No fuzzy matching.
  |
  */

  return normalized.replace(
    /\\s+/g,
    "_"
  );
}


`;


content =
  content.slice(
    0,
    branchStart
  ) +
  newBranchFunction +
  content.slice(
    aspectStart
  );


console.log(
  "✅ Counselling branch normalization fixed"
);


/*
|--------------------------------------------------------------------------
| FIX 3
| FIND MAIN V3 FUNCTION
|--------------------------------------------------------------------------
*/

const mainFunctionMarker =
  "export async function getCollegeReviewIntelligenceV3";


const mainStart =
  content.indexOf(
    mainFunctionMarker
  );


if (
  mainStart === -1
) {
  throw new Error(
    "getCollegeReviewIntelligenceV3() not found"
  );
}


let beforeMain =
  content.slice(
    0,
    mainStart
  );


let main =
  content.slice(
    mainStart
  );


/*
|--------------------------------------------------------------------------
| FIX 4
| ADD reviewCollegeId AFTER requestedBranch
|--------------------------------------------------------------------------
*/

if (
  !main.includes(
    "const reviewCollegeId ="
  )
) {
  const requestedRegex =
    /const requestedBranch\s*=\s*canonicalizeBranch\(\s*branch\s*\)\s*;/;


  const requestedMatch =
    main.match(
      requestedRegex
    );


  if (
    !requestedMatch
  ) {
    /*
    |--------------------------------------------------------------------------
    | It may already use strip/other branch normalization.
    |--------------------------------------------------------------------------
    */

    const alternateRegex =
      /const requestedBranch\s*=\s*canonicalizeBranch\([\s\S]*?\)\s*;/;


    const alternateMatch =
      main.match(
        alternateRegex
      );


    if (
      !alternateMatch
    ) {
      throw new Error(
        "requestedBranch assignment not found"
      );
    }


    main =
      main.replace(
        alternateMatch[0],
        `${alternateMatch[0]}


  const reviewCollegeId =
    resolveReviewCollegeId(
      collegeId
    );`
      );
  } else {
    main =
      main.replace(
        requestedMatch[0],
        `${requestedMatch[0]}


  const reviewCollegeId =
    resolveReviewCollegeId(
      collegeId
    );`
      );
  }


  console.log(
    "✅ reviewCollegeId added"
  );
} else {
  console.log(
    "ℹ️ reviewCollegeId already exists"
  );
}


/*
|--------------------------------------------------------------------------
| FIX 5
| DATABASE LOADERS USE reviewCollegeId
|--------------------------------------------------------------------------
*/

main =
  main.replace(
    /loadReviewAspectEvidence\(\s*client\s*,\s*collegeId\s*\)/g,
    `loadReviewAspectEvidence(
        client,
        reviewCollegeId
      )`
  );


main =
  main.replace(
    /loadPlatformAggregates\(\s*client\s*,\s*collegeId\s*\)/g,
    `loadPlatformAggregates(
        client,
        reviewCollegeId
      )`
  );


main =
  main.replace(
    /loadPlatformAspectRatings\(\s*client\s*,\s*collegeId\s*\)/g,
    `loadPlatformAspectRatings(
        client,
        reviewCollegeId
      )`
  );


console.log(
  "✅ Review DB loaders now use reviewCollegeId"
);


/*
|--------------------------------------------------------------------------
| FIX 6
| ADD reviewCollegeId TO FINAL RESPONSE
|--------------------------------------------------------------------------
*/

const finalMarker =
  "Final V3 contract";


const finalMarkerIndex =
  main.lastIndexOf(
    finalMarker
  );


if (
  finalMarkerIndex === -1
) {
  throw new Error(
    "Final V3 contract marker not found"
  );
}


const finalReturnIndex =
  main.indexOf(
    "return {",
    finalMarkerIndex
  );


if (
  finalReturnIndex === -1
) {
  throw new Error(
    "Final V3 return not found"
  );
}


const returnHead =
  main.slice(
    finalReturnIndex,
    finalReturnIndex + 800
  );


if (
  !returnHead.includes(
    "reviewCollegeId,"
  )
) {
  const collegeFieldIndex =
    main.indexOf(
      "collegeId,",
      finalReturnIndex
    );


  if (
    collegeFieldIndex === -1
  ) {
    throw new Error(
      "collegeId field not found in final return"
    );
  }


  const insertAt =
    collegeFieldIndex +
    "collegeId,".length;


  main =
    main.slice(
      0,
      insertAt
    ) +
    `

    reviewCollegeId,` +
    main.slice(
      insertAt
    );


  console.log(
    "✅ reviewCollegeId added to API result"
  );
} else {
  console.log(
    "ℹ️ reviewCollegeId already present in result"
  );
}


/*
|--------------------------------------------------------------------------
| REBUILD
|--------------------------------------------------------------------------
*/

content =
  beforeMain +
  main;


/*
|--------------------------------------------------------------------------
| SAVE
|--------------------------------------------------------------------------
*/

fs.writeFileSync(
  filePath,
  content,
  "utf8"
);


console.log("");
console.log(
  "========================================"
);

console.log(
  "REVIEW V3 PATCH COMPLETE"
);

console.log(
  "========================================"
);

console.log(
  `Backup: ${backupPath}`
);

console.log("");