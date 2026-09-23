import fs from "node:fs";

const file =
  "./frontend/src/services/apiClient.js";

const backup =
  "./frontend/src/services/apiClient.before-production-url-repair.js";

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
| REMOVE BROKEN API URL DEFINITIONS
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
    "API URL section boundaries not found."
  );
}


const fixedBlock =
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
  fixedBlock +
  s.slice(
    end
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
    "productionApiUrl declaration missing after repair."
  );
}

if (
  !s.includes(
    "const API_BASE_URL ="
  )
) {
  throw new Error(
    "API_BASE_URL declaration missing."
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
  "API CLIENT PRODUCTION CRASH FIXED"
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
  "JoSAA / CSAB UI: UNCHANGED"
);
console.log(
  "Engineering / Architecture UI: UNCHANGED"
);
console.log(
  "Admission logic: UNCHANGED"
);
console.log(
  "Ranking logic: UNCHANGED"
);
console.log(
  "Backup:",
  backup
);
