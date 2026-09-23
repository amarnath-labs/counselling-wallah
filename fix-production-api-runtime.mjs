import fs from "node:fs";

const file =
  "./frontend/src/services/apiClient.js";

const backup =
  "./frontend/src/services/apiClient.before-production-api-runtime-fix.js";

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
| REBUILD API URL CONFIG
|--------------------------------------------------------------------------
*/

const start =
  s.indexOf(
    "const configuredApiUrl"
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
    "API URL config block not found."
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
  s.slice(
    0,
    start
  ) +
  replacement +
  s.slice(
    end
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
  "PRODUCTION API RUNTIME FIXED"
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
  "productionApiUrl is explicitly defined"
);
console.log(
  "Backup:",
  backup
);
