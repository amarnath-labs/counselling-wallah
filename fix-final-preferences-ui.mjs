import fs from "node:fs";

const file =
  "./frontend/src/pages/Profile.jsx";

const backup =
  "./frontend/src/pages/Profile.before-final-preferences-ui.jsx";

if (!fs.existsSync(file)) {
  throw new Error(`Missing file: ${file}`);
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
| REQUIRED MARKERS
|--------------------------------------------------------------------------
*/

if (
  !s.includes(
    "TRUMARG JOSAA CSAB SELECTOR"
  )
) {
  throw new Error(
    "JoSAA/CSAB selector block missing."
  );
}

if (
  !s.includes(
    "Engineering / Architecture"
  )
) {
  throw new Error(
    "Engineering/Architecture block missing."
  );
}


/*
|--------------------------------------------------------------------------
| MAKE COUNSELLING SELECTOR VISIBLE ON PROFILE
|--------------------------------------------------------------------------
|
| Remove only the outer JEE visibility condition.
| The buttons and their state logic remain unchanged.
|--------------------------------------------------------------------------
*/

s =
  s.replace(
    /\{\s*String\([\s\S]*?\)\s*\.trim\(\)\s*\.toLowerCase\(\)\s*===\s*'jee-main'\s*&&\s*\(/m,
    "{("
  );

s =
  s.replace(
    /\{\s*isJeeMainProfile\s*&&\s*\(/m,
    "{("
  );


/*
|--------------------------------------------------------------------------
| ARCHITECTURE FAMILY DETECTION
|--------------------------------------------------------------------------
*/

s =
  s.replace(
    /\/architecture\|b\\\.arch\/i/g,
    "/architecture|planning|b\\.?\\s*arch|b\\.?\\s*plan/i"
  );


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
  "FINAL PREFERENCES UI READY"
);
console.log(
  "=============================================="
);
console.log(
  "Preferences -> JoSAA / CSAB"
);
console.log(
  "Preferences -> Engineering / Architecture"
);
console.log(
  "Engineering -> engineering branches"
);
console.log(
  "Architecture -> Architecture/B.Arch/Planning/B.Plan"
);
console.log(
  "Admission logic: UNCHANGED"
);
console.log(
  "Ranking logic: UNCHANGED"
);
console.log(
  "Review logic: UNCHANGED"
);
console.log(
  "Backup:",
  backup
);
