import fs from "node:fs";

const file =
  "./frontend/src/pages/Profile.jsx";

const backup =
  "./frontend/src/pages/Profile.before-production-jee-detection.jsx";

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
| ROBUST JEE MAIN DETECTION
|--------------------------------------------------------------------------
*/

const pMarker =
`  const p =
    profile || {};`;

if (!s.includes(pMarker)) {
  throw new Error(
    "Profile state marker not found."
  );
}

if (!s.includes("const isJeeMainProfile =")) {

  s =
    s.replace(
      pMarker,
`${pMarker}

  const normalizedSelectedExamId =
    String(
      selectedExamId || ''
    )
      .trim()
      .toLowerCase();

  const normalizedProfileExamId =
    String(
      p?.examId || ''
    )
      .trim()
      .toLowerCase();

  const normalizedProfileExamName =
    String(
      p?.exam || ''
    )
      .trim()
      .toLowerCase();

  const isJeeMainProfile =
    normalizedSelectedExamId ===
      'jee-main' ||
    normalizedProfileExamId ===
      'jee-main' ||
    normalizedProfileExamName ===
      'jee main' ||
    normalizedProfileExamName ===
      'jee mains';
`
    );
}


/*
|--------------------------------------------------------------------------
| REPLACE FRAGILE JOSAA/CSAB VISIBILITY CONDITION
|--------------------------------------------------------------------------
*/

const selectorRegex =
/\{\s*String\([\s\S]*?\)\s*\.trim\(\)\s*\.toLowerCase\(\)\s*===\s*'jee-main'\s*&&\s*\(/m;

if (!selectorRegex.test(s)) {
  throw new Error(
    "Current JoSAA/CSAB visibility condition not found."
  );
}

s =
  s.replace(
    selectorRegex,
    "{isJeeMainProfile && ("
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
  "PROFILE PRODUCTION JEE DETECTION FIXED"
);
console.log(
  "=============================================="
);
console.log(
  "selectedExamId=jee-main -> visible"
);
console.log(
  "profile.examId=jee-main -> visible"
);
console.log(
  "profile.exam=JEE Main -> visible"
);
console.log(
  "Admission logic: UNCHANGED"
);
console.log(
  "CSAB logic: UNCHANGED"
);
console.log(
  "Ranking logic: UNCHANGED"
);
console.log(
  "Backup:",
  backup
);
