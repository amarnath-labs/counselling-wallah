import fs from "node:fs";

const file =
  "./frontend/src/services/apiClient.js";

const backup =
  "./frontend/src/services/apiClient.before-final-api-config-fix.js";

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
| FIND BROKEN API CONFIG AREA
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
  end < 0 ||
  end <= start
) {
  throw new Error(
    "Could not locate API configuration block."
  );
}


/*
|--------------------------------------------------------------------------
| FINAL API CONFIG
|--------------------------------------------------------------------------
|
| DEV:
|   localhost backend
|
| PROD:
|   same-origin /api
|   Vercel rewrite -> Render
|--------------------------------------------------------------------------
*/

const cleanConfig =
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
    ? (
        normalizeApiBaseUrl(
          configuredApiUrl
        ) ||
        localApiUrl
      )
    : productionApiUrl;


`;


s =
  s.slice(
    0,
    start
  ) +
  cleanConfig +
  s.slice(
    end
  );


/*
|--------------------------------------------------------------------------
| SAFETY
|--------------------------------------------------------------------------
*/

const configuredCount =
  (
    s.match(
      /const configuredApiUrl\s*=/g
    ) || []
  ).length;

const productionCount =
  (
    s.match(
      /const productionApiUrl\s*=/g
    ) || []
  ).length;

const baseCount =
  (
    s.match(
      /const API_BASE_URL\s*=/g
    ) || []
  ).length;


if (configuredCount !== 1) {
  throw new Error(
    `configuredApiUrl declarations: ${configuredCount}`
  );
}

if (productionCount !== 1) {
  throw new Error(
    `productionApiUrl declarations: ${productionCount}`
  );
}

if (baseCount !== 1) {
  throw new Error(
    `API_BASE_URL declarations: ${baseCount}`
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
  "API CLIENT CONFIG FIXED"
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
  "configuredApiUrl declarations:",
  configuredCount
);
console.log(
  "productionApiUrl declarations:",
  productionCount
);
console.log(
  "API_BASE_URL declarations:",
  baseCount
);
console.log(
  "Backup:",
  backup
);
