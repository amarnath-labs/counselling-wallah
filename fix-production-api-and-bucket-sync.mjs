import fs from "node:fs";


/* =========================================================
   1. FIX PRODUCTION API URL CRASH
   ========================================================= */

{
  const file =
    "./frontend/src/services/apiClient.js";

  const backup =
    "./frontend/src/services/apiClient.before-production-url-fix.js";

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
  | Ensure these constants exist.
  */

  if (
    !/const\s+localApiUrl\s*=/.test(s)
  ) {
    const marker =
      /const\s+configuredApiUrl\s*=[\s\S]*?;\s*/m;

    if (!marker.test(s)) {
      throw new Error(
        "configuredApiUrl marker not found in apiClient.js"
      );
    }

    s =
      s.replace(
        marker,
        match =>
`${match}

const localApiUrl =
  'http://localhost:4000/api';

const productionApiUrl =
  '/api';

`
      );
  }


  if (
    !/const\s+productionApiUrl\s*=/.test(s)
  ) {
    const localMarker =
      /const\s+localApiUrl\s*=\s*[\s\S]*?;\s*/m;

    if (!localMarker.test(s)) {
      throw new Error(
        "localApiUrl marker not found."
      );
    }

    s =
      s.replace(
        localMarker,
        match =>
`${match}

const productionApiUrl =
  '/api';

`
      );
  }


  /*
  | Force production URL to same-origin /api
  */

  s =
    s.replace(
      /const\s+productionApiUrl\s*=\s*[\s\S]*?;/m,
`const productionApiUrl =
  '/api';`
    );


  fs.writeFileSync(
    file,
    s,
    "utf8"
  );

  console.log(
    "apiClient productionApiUrl fixed"
  );
}



/* =========================================================
   2. SYNC ADMISSION INTELLIGENCE BUCKET
   ========================================================= */

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
  | Historical intelligence may calculate its own bucket.
  | For displayed admission status, canonical row.bucket
  | must be the single source of truth.
  */

  const oldPattern =
    /const\s+bucket\s*=\s*intelligence\s*\.historicalBucket\s*;/g;


  const matches =
    s.match(
      oldPattern
    ) || [];


  if (
    matches.length === 0 &&
    !s.includes(
      "const bucket = canonicalAdmissionBucket;"
    )
  ) {
    throw new Error(
      "Historical bucket block not found in CollegeCard.jsx"
    );
  }


  if (
    !s.includes(
      "const canonicalAdmissionBucket ="
    )
  ) {

    const admissionMarker =
      /const\s+admission\s*=\s*meta\[row\?\.bucket\]\s*\|\|\s*meta\.backup\s*;/m;

    if (!admissionMarker.test(s)) {
      throw new Error(
        "Canonical admission marker not found."
      );
    }


    s =
      s.replace(
        admissionMarker,
        match =>
`${match}

  const canonicalAdmissionBucket =
    String(
      row?.bucket ||
      'backup'
    )
      .trim()
      .toLowerCase();

`
      );
  }


  s =
    s.replace(
      oldPattern,
`const bucket =
                            canonicalAdmissionBucket;`
    );


  fs.writeFileSync(
    file,
    s,
    "utf8"
  );

  console.log(
    "Admission Intelligence bucket synced"
  );
}


console.log("");
console.log(
  "=============================================="
);
console.log(
  "PRODUCTION CRASH + BUCKET MISMATCH FIXED"
);
console.log(
  "=============================================="
);
console.log(
  "CSAB Match Target -> Intelligence TARGET"
);
console.log(
  "CSAB Match Dream  -> Intelligence DREAM"
);
console.log(
  "JoSAA Match uses same canonical bucket"
);
console.log(
  "productionApiUrl -> /api"
);
console.log(
  "Admission calculation: UNCHANGED"
);
console.log(
  "Historical cutoff rows: UNCHANGED"
);
console.log(
  "Ranking: UNCHANGED"
);
