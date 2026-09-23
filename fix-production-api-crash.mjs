import fs from "node:fs";

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

/*
|--------------------------------------------------------------------------
| REMOVE BROKEN API BASE DECLARATIONS
|--------------------------------------------------------------------------
*/

const start =
  s.indexOf(
    "const localApiUrl"
  );

const logMarker =
  s.indexOf(
    "console.log(",
    start
  );

if (
  start < 0 ||
  logMarker < 0
) {
  throw new Error(
    "API base block not found."
  );
}

const replacement =
`const localApiUrl =
  'http://localhost:4000/api';

const productionApiUrl =
  '/api';

const configuredApiUrl =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  '';

const API_BASE_URL =
  import.meta.env.DEV
    ? localApiUrl
    : productionApiUrl;


`;

s =
  s.slice(
    0,
    start
  ) +
  replacement +
  s.slice(
    logMarker
  );

/*
|--------------------------------------------------------------------------
| SAFETY
|--------------------------------------------------------------------------
*/

if (
  !s.includes(
    "const productionApiUrl ="
  )
) {
  throw new Error(
    "productionApiUrl missing."
  );
}

if (
  !s.includes(
    "const API_BASE_URL ="
  )
) {
  throw new Error(
    "API_BASE_URL missing."
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
  "PRODUCTION API CRASH FIXED"
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
  "productionApiUrl defined"
);
