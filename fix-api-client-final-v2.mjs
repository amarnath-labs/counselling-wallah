import fs from "node:fs";

const file =
  "./frontend/src/services/apiClient.js";

const backup =
  "./frontend/src/services/apiClient.before-final-production-fix.js";

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
| FIND GENERIC REQUEST SECTION
|--------------------------------------------------------------------------
*/

const requestMarker =
`/*
|--------------------------------------------------------------------------
| GENERIC API REQUEST
|--------------------------------------------------------------------------
*/`;

const markerIndex =
  s.indexOf(
    requestMarker
  );

if (markerIndex < 0) {
  throw new Error(
    "GENERIC API REQUEST marker not found."
  );
}


/*
|--------------------------------------------------------------------------
| KEEP normalizeApiBaseUrl FUNCTION
|--------------------------------------------------------------------------
*/

const normalizeStart =
  s.indexOf(
    "function normalizeApiBaseUrl"
  );

if (normalizeStart < 0) {
  throw new Error(
    "normalizeApiBaseUrl not found."
  );
}

const normalizeEndMarker =
  "\n\n/*";

const normalizeEnd =
  s.indexOf(
    normalizeEndMarker,
    normalizeStart
  );

if (normalizeEnd < 0) {
  throw new Error(
    "Could not locate end of normalizeApiBaseUrl."
  );
}

const normalizeFunction =
  s.slice(
    normalizeStart,
    normalizeEnd
  );


/*
|--------------------------------------------------------------------------
| FINAL API CONFIG
|--------------------------------------------------------------------------
*/

const newTop =
`${normalizeFunction}


/*
|--------------------------------------------------------------------------
| API URL
|--------------------------------------------------------------------------
*/

const configuredApiUrl =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  '';


const localApiUrl =
  'http://localhost:4000/api';


const productionApiUrl =
  '/api';


const API_BASE_URL =
  import.meta.env.DEV
    ? (
        normalizeApiBaseUrl(
          configuredApiUrl
        ) ||
        localApiUrl
      )
    : productionApiUrl;


console.log(
  '[API] Environment:',
  import.meta.env.DEV
    ? 'development'
    : 'production'
);


console.log(
  '[API] Base URL:',
  API_BASE_URL
);


`;


/*
|--------------------------------------------------------------------------
| REBUILD FILE
|--------------------------------------------------------------------------
*/

s =
  newTop +
  s.slice(
    markerIndex
  );


/*
|--------------------------------------------------------------------------
| SAFETY CHECKS
|--------------------------------------------------------------------------
*/

const productionCount =
  (
    s.match(
      /const productionApiUrl\s*=/g
    ) || []
  ).length;

const configuredCount =
  (
    s.match(
      /const configuredApiUrl\s*=/g
    ) || []
  ).length;

const apiBaseCount =
  (
    s.match(
      /const API_BASE_URL\s*=/g
    ) || []
  ).length;


if (productionCount !== 1) {
  throw new Error(
    "productionApiUrl declaration count = " +
    productionCount
  );
}

if (configuredCount !== 1) {
  throw new Error(
    "configuredApiUrl declaration count = " +
    configuredCount
  );
}

if (apiBaseCount !== 1) {
  throw new Error(
    "API_BASE_URL declaration count = " +
    apiBaseCount
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
  "API CLIENT FINAL FIX APPLIED"
);
console.log(
  "=============================================="
);
console.log(
  "DEV  -> http://localhost:4000/api"
);
console.log(
  "PROD -> /api"
);
console.log(
  "configuredApiUrl declarations: " +
  configuredCount
);
console.log(
  "productionApiUrl declarations: " +
  productionCount
);
console.log(
  "API_BASE_URL declarations: " +
  apiBaseCount
);
console.log(
  "Preference logic: UNCHANGED"
);
console.log(
  "Admission logic: UNCHANGED"
);
