import fs from "node:fs";

const file =
  "./frontend/src/services/apiClient.js";

const backup =
  "./frontend/src/services/apiClient.before-production-api-crash-fix.js";

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
| REPLACE COMPLETE API URL CONFIGURATION
|--------------------------------------------------------------------------
|
| Development:
|   http://localhost:4000/api
|
| Production:
|   /api
|
| No productionApiUrl variable dependency.
|--------------------------------------------------------------------------
*/

const start =
  s.indexOf(
    "const configuredApiUrl ="
  );

const end =
  s.indexOf(
    "console.log(",
    start
  );

if (
  start < 0 ||
  end < 0
) {
  throw new Error(
    "API URL configuration block not found."
  );
}


const newBlock =
`const configuredApiUrl =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  '';


const localApiUrl =
  normalizeApiBaseUrl(
    configuredApiUrl
  ) ||
  'http://localhost:4000/api';


const API_BASE_URL =
  import.meta.env.DEV
    ? localApiUrl
    : '/api';


`;


s =
  s.slice(
    0,
    start
  ) +
  newBlock +
  s.slice(
    end
  );


/*
|--------------------------------------------------------------------------
| SAFETY
|--------------------------------------------------------------------------
*/

if (
  s.includes(
    "productionApiUrl"
  )
) {
  throw new Error(
    "productionApiUrl reference still exists."
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
  "DEV  -> localhost:4000/api"
);
console.log(
  "PROD -> /api"
);
console.log(
  "productionApiUrl dependency removed"
);
