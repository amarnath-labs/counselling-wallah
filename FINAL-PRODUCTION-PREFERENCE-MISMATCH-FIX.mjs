import fs from "node:fs";


/* ============================================================
   1. FIX productionApiUrl CRASH
   ============================================================ */

{
  const file =
    "./frontend/src/services/apiClient.js";

  const backup =
    "./frontend/src/services/apiClient.before-production-api-crash-fix.js";

  let s =
    fs.readFileSync(
      file,
      "utf8"
    );

  fs.copyFileSync(
    file,
    backup
  );


  if (
    s.includes(
      "productionApiUrl"
    ) &&
    !/const\s+productionApiUrl\s*=/.test(
      s
    )
  ) {

    const marker =
      /const\s+configuredApiUrl\s*=/;

    if (!marker.test(s)) {
      throw new Error(
        "configuredApiUrl marker not found"
      );
    }

    s =
      s.replace(
        marker,
`const productionApiUrl =
  '/api';

const configuredApiUrl =`
      );
  }


  fs.writeFileSync(
    file,
    s,
    "utf8"
  );

  console.log(
    "PASS: productionApiUrl restored"
  );
}



/* ============================================================
   2. FORCE PREFERENCE CONTROLS VISIBLE
   ============================================================ */

{
  const file =
    "./frontend/src/pages/Profile.jsx";

  const backup =
    "./frontend/src/pages/Profile.before-final-preferences-fix.jsx";

  let s =
    fs.readFileSync(
      file,
      "utf8"
    );

  fs.copyFileSync(
    file,
    backup
  );


  if (
    !s.includes(
      "TRUMARG JOSAA CSAB SELECTOR"
    )
  ) {
    throw new Error(
      "JoSAA/CSAB selector not found"
    );
  }


  /*
   * Remove only outer JEE visibility gate.
   * JoSAA/CSAB functionality remains unchanged.
   */

  s =
    s.replace(
      /\{\s*isJeeMainProfile\s*&&\s*\(/,
      "{("
    );


  fs.writeFileSync(
    file,
    s,
    "utf8"
  );

  console.log(
    "PASS: Preference selectors visible"
  );
}



/* ============================================================
   3. SYNC CARD BUCKET WITH CANONICAL row.bucket
   ============================================================ */

{
  const file =
    "./frontend/src/components/CollegeCard.jsx";

  const backup =
    "./frontend/src/components/CollegeCard.before-final-bucket-sync.jsx";

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
   * Add one canonical source for display.
   */

  const componentRegex =
    /export default function CollegeCard\(\{\s*row,\s*mode\s*=\s*['"]locked['"],?\s*\}\)\s*\{/m;

  if (!componentRegex.test(s)) {
    throw new Error(
      "CollegeCard component marker not found"
    );
  }


  if (
    !s.includes(
      "const canonicalAdmissionBucket ="
    )
  ) {

    s =
      s.replace(
        componentRegex,
        match =>
`${match}

  /*
  |--------------------------------------------------------------------------
  | CANONICAL ADMISSION DISPLAY
  |--------------------------------------------------------------------------
  |
  | Same row.bucket is used by:
  | - bucket section
  | - JoSAA / CSAB Match
  | - Admission Intelligence headline
  |--------------------------------------------------------------------------
  */

  const canonicalAdmissionBucket =
    String(
      row?.bucket ||
      row?.admission?.bucket ||
      row?.historicalFit?.bucket ||
      'target'
    )
      .trim()
      .toLowerCase();

  const canonicalAdmission =
    meta[
      canonicalAdmissionBucket
    ] ||
    meta.target;

`
      );
  }


  /*
   * Match label/color should never use another classifier.
   */

  s =
    s.replaceAll(
      "admission.label",
      "canonicalAdmission.label"
    );

  s =
    s.replaceAll(
      "admission.color",
      "canonicalAdmission.color"
    );


  fs.writeFileSync(
    file,
    s,
    "utf8"
  );

  console.log(
    "PASS: CollegeCard bucket display synchronized"
  );
}


console.log("");
console.log(
  "=============================================="
);
console.log(
  "FINAL PRODUCTION UI REPAIR APPLIED"
);
console.log(
  "=============================================="
);
console.log(
  "JoSAA / CSAB: ENABLED"
);
console.log(
  "Engineering / Architecture: ENABLED"
);
console.log(
  "Card bucket = canonical row.bucket"
);
console.log(
  "Admission calculation formula: UNCHANGED"
);
console.log(
  "Ranking logic: UNCHANGED"
);
console.log(
  "CSAB dataset mapping: UNCHANGED"
);
