import fs from "node:fs";

const file =
  "./src/routes/cwRecV1-dev.js";

const backup =
  "./src/routes/cwRecV1-dev.before-csab-working-final.js";

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
| 1. SUPPORTED EXAM
|--------------------------------------------------------------------------
*/

if (
  !s.includes(
    "'csab-special'"
  )
) {
  throw new Error(
    "csab-special support marker not found."
  );
}


/*
|--------------------------------------------------------------------------
| 2. ENSURE CSAB DATASET FILTER EXISTS
|--------------------------------------------------------------------------
*/

if (
  !s.includes(
    "co.counselling_type = 'CSAB_SPECIAL'"
  )
) {
  throw new Error(
    "CSAB_SPECIAL SQL filter not found."
  );
}


/*
|--------------------------------------------------------------------------
| 3. JEE-MAIN FAMILY BOOLEAN
|--------------------------------------------------------------------------
*/

const examMarker =
  "const architectureOnlyRequest =";

const examIndex =
  s.indexOf(
    examMarker
  );

if (examIndex < 0) {
  throw new Error(
    "architectureOnlyRequest marker not found."
  );
}


if (
  !s.includes(
    "const isJeeMainFamily ="
  )
) {
  const addition =
`
      /*
      |--------------------------------------------------------------------------
      | TRUMARG JEE MAIN FAMILY
      |--------------------------------------------------------------------------
      |
      | JoSAA and CSAB both use JEE Main rank for NIT/IIIT/GFTI recommendations.
      | Their datasets remain strictly separate:
      |
      | jee-main     -> JOSAA
      | csab-special -> CSAB_SPECIAL
      |--------------------------------------------------------------------------
      */

      const isJeeMainFamily =
        examId === 'jee-main' ||
        examId === 'csab-special';


`;

  s =
    s.slice(
      0,
      examIndex
    ) +
    addition +
    s.slice(
      examIndex
    );
}


/*
|--------------------------------------------------------------------------
| 4. REPLACE JEE-MAIN-ONLY SAFETY CONDITIONS WHERE APPROPRIATE
|--------------------------------------------------------------------------
*/

s =
  s.replace(
    /examId === 'jee-main'\s*\|\|\s*examId === 'csab-special'/g,
    "isJeeMainFamily"
  );

s =
  s.replace(
    /examId === 'jee-main'/g,
    (match, offset) => {
      const before =
        s.slice(
          Math.max(
            0,
            offset - 220
          ),
          offset
        );

      /*
      | Do NOT alter the SQL dataset selection block:
      | jee-main must still mean JOSAA only.
      */

      if (
        before.includes(
          "co.counselling_type = 'JOSAA'"
        ) ||
        before.includes(
          "| JEE MAIN"
        )
      ) {
        return match;
      }

      return "isJeeMainFamily";
    }
  );


/*
|--------------------------------------------------------------------------
| 5. EXPLICIT FINAL INSTITUTE SAFETY
|--------------------------------------------------------------------------
*/

const finalSafetyRegex =
  /if\s*\(\s*isJeeMainFamily\s*\)\s*\{\s*finalRows\s*=\s*uniqueRows\.filter\(/m;

if (
  !finalSafetyRegex.test(
    s
  )
) {
  /*
  | Older/current route may still use explicit OR.
  */

  s =
    s.replace(
      /if\s*\(\s*examId === 'jee-main'\s*\|\|\s*examId === 'csab-special'\s*\)/m,
      "if (\n        isJeeMainFamily\n      )"
    );
}


/*
|--------------------------------------------------------------------------
| 6. SAFETY ASSERTIONS
|--------------------------------------------------------------------------
*/

if (
  !s.includes(
    "co.counselling_type = 'JOSAA'"
  )
) {
  throw new Error(
    "JOSAA filter disappeared."
  );
}

if (
  !s.includes(
    "co.counselling_type = 'CSAB_SPECIAL'"
  )
) {
  throw new Error(
    "CSAB_SPECIAL filter disappeared."
  );
}

if (
  !s.includes(
    "const isJeeMainFamily ="
  )
) {
  throw new Error(
    "isJeeMainFamily helper missing."
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
  "CSAB RECOMMENDATION FLOW PATCHED"
);
console.log(
  "=============================================="
);
console.log(
  "JoSAA -> JOSAA data"
);
console.log(
  "CSAB  -> CSAB_SPECIAL data"
);
console.log(
  "JEE Main family institute rules shared"
);
console.log(
  "Admission bucket logic: UNCHANGED"
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
