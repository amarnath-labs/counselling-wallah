import fs from "node:fs";

const file =
  "./frontend/src/services/apiClient.js";

const backup =
  "./frontend/src/services/apiClient.before-final-production-api-fix.js";

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
| REMOVE BROKEN API URL BLOCK
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
    "API URL configuration block not found."
  );
}


const replacement =
`const API_BASE_URL =
  import.meta.env.DEV
    ? 'http://localhost:4000/api'
    : '/api';


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
    "productionApiUrl still exists after repair."
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
  "productionApiUrl removed completely"
);
