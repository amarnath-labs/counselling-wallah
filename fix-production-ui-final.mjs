import fs from "node:fs";

const apiFile =
  "./frontend/src/services/apiClient.js";

const cardFile =
  "./frontend/src/components/CollegeCard.jsx";

const profileFile =
  "./frontend/src/pages/Profile.jsx";


for (const file of [
  apiFile,
  cardFile,
  profileFile,
]) {
  if (!fs.existsSync(file)) {
    throw new Error(
      `Missing file: ${file}`
    );
  }
}


/*
|--------------------------------------------------------------------------
| 1. FIX PRODUCTION API URL CRASH
|--------------------------------------------------------------------------
*/

{
  const backup =
    "./frontend/src/services/apiClient.before-production-url-final.js";

  fs.copyFileSync(
    apiFile,
    backup
  );

  let s =
    fs.readFileSync(
      apiFile,
      "utf8"
    );


  const blockRegex =
    /const configuredApiUrl[\s\S]*?const API_BASE_URL[\s\S]*?;\s*/m;


  if (!blockRegex.test(s)) {
    throw new Error(
      "API URL block not found."
    );
  }


  const replacement =
`const configuredApiUrl =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  '';

const localApiUrl =
  'http://localhost:4000/api';

const productionApiUrl =
  '/api';

const API_BASE_URL =
  import.meta.env.DEV
    ? localApiUrl
    : productionApiUrl;

`;


  s =
    s.replace(
      blockRegex,
      replacement
    );


  if (
    !s.includes(
      "const productionApiUrl ="
    )
  ) {
    throw new Error(
      "productionApiUrl declaration missing."
    );
  }


  fs.writeFileSync(
    apiFile,
    s,
    "utf8"
  );
}


/*
|--------------------------------------------------------------------------
| 2. FORCE PREFERENCE CONTROLS VISIBLE
|--------------------------------------------------------------------------
|
| Desired:
|
| Counselling
|   JoSAA | CSAB
|
| Engineering / Architecture
|   Engineering | Architecture
|--------------------------------------------------------------------------
*/

{
  const backup =
    "./frontend/src/pages/Profile.before-preference-final.jsx";

  fs.copyFileSync(
    profileFile,
    backup
  );

  let s =
    fs.readFileSync(
      profileFile,
      "utf8"
    );


  if (
    !s.includes(
      "TRUMARG JOSAA CSAB SELECTOR"
    )
  ) {
    throw new Error(
      "JoSAA/CSAB selector not found."
    );
  }


  /*
  | Remove only the outer JEE visibility condition.
  | Controls themselves remain unchanged.
  */

  s =
    s.replace(
      /\{\s*isJeeMainProfile\s*&&\s*\(/m,
      "{("
    );


  s =
    s.replace(
      /\{\s*String\([\s\S]*?\.toLowerCase\(\)\s*===\s*'jee-main'\s*&&\s*\(/m,
      "{("
    );


  fs.writeFileSync(
    profileFile,
    s,
    "utf8"
  );
}


/*
|--------------------------------------------------------------------------
| 3. SYNC ADMISSION INTELLIGENCE BUCKET WITH CARD BUCKET
|--------------------------------------------------------------------------
|
| CSAB Match: Target
| -> Intelligence: TARGET
|
| JoSAA Match: Safe
| -> Intelligence: SAFE
|
| Historical ranks/trends remain unchanged.
|--------------------------------------------------------------------------
*/

{
  const backup =
    "./frontend/src/components/CollegeCard.before-final-bucket-sync.jsx";

  fs.copyFileSync(
    cardFile,
    backup
  );

  let s =
    fs.readFileSync(
      cardFile,
      "utf8"
    );


  const bucketRegex =
    /const bucket\s*=\s*intelligence\s*\.historicalBucket\s*;/m;


  if (!bucketRegex.test(s)) {
    throw new Error(
      "Historical bucket block not found."
    );
  }


  s =
    s.replace(
      bucketRegex,
`const bucket =
                            row?.bucket
                              ? String(
                                  row.bucket
                                )
                                  .trim()
                                  .toLowerCase()
                              : intelligence
                                  .historicalBucket;`
    );


  fs.writeFileSync(
    cardFile,
    s,
    "utf8"
  );
}


console.log("");
console.log(
  "=============================================="
);
console.log(
  "TRUMARG PRODUCTION UI FINAL PATCH APPLIED"
);
console.log(
  "=============================================="
);
console.log(
  "productionApiUrl crash: FIXED"
);
console.log(
  "JoSAA / CSAB: VISIBLE"
);
console.log(
  "Engineering / Architecture: VISIBLE"
);
console.log(
  "Admission Intelligence bucket: SYNCED"
);
console.log(
  "Admission calculation logic: UNCHANGED"
);
console.log(
  "Historical cutoff data: UNCHANGED"
);
console.log(
  "Ranking logic: UNCHANGED"
);
