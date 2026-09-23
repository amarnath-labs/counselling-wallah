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
| REPLACE COMPLETE API URL SECTION
|--------------------------------------------------------------------------
*/

const apiSectionRegex =
/const\s+configuredApiUrl[\s\S]*?const\s+API_BASE_URL\s*=[\s\S]*?;/m;

if (!apiSectionRegex.test(s)) {

  const apiBaseOnlyRegex =
    /const\s+API_BASE_URL\s*=[\s\S]*?;/m;

  if (!apiBaseOnlyRegex.test(s)) {
    throw new Error(
      "API URL section not found. Do not write file."
    );
  }

  s =
    s.replace(
      apiBaseOnlyRegex,
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
    : productionApiUrl;`
    );

} else {

  s =
    s.replace(
      apiSectionRegex,
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
    : productionApiUrl;`
    );
}


/*
|--------------------------------------------------------------------------
| SAFETY
|--------------------------------------------------------------------------
*/

const prodDecl =
  (
    s.match(
      /const\s+productionApiUrl\s*=/g
    ) || []
  ).length;

const apiBaseDecl =
  (
    s.match(
      /const\s+API_BASE_URL\s*=/g
    ) || []
  ).length;

if (prodDecl !== 1) {
  throw new Error(
    `productionApiUrl declarations = ${prodDecl}`
  );
}

if (apiBaseDecl !== 1) {
  throw new Error(
    `API_BASE_URL declarations = ${apiBaseDecl}`
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
  "productionApiUrl declaration: 1"
);
console.log(
  "API_BASE_URL declaration: 1"
);
console.log(
  "Backup:",
  backup
);
