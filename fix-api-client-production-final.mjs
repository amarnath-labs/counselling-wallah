import fs from "node:fs";

const file =
  "./frontend/src/services/apiClient.js";

const backup =
  "./frontend/src/services/apiClient.before-production-api-repair.js";

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
| FIND COMPLETE API URL DECLARATION BLOCK
|--------------------------------------------------------------------------
*/

const markers = [
  "const configuredApiUrl",
  "const localApiUrl",
  "const productionApiUrl",
  "const API_BASE_URL",
];

const positions =
  markers
    .map(
      marker =>
        s.indexOf(
          marker
        )
    )
    .filter(
      index =>
        index >= 0
    );

if (
  positions.length === 0
) {
  throw new Error(
    "API URL declarations not found."
  );
}

const start =
  Math.min(
    ...positions
  );

const end =
  s.indexOf(
    "console.log(",
    start
  );

if (
  end < 0 ||
  end <= start
) {
  throw new Error(
    "API URL block end not found."
  );
}


/*
|--------------------------------------------------------------------------
| FINAL API URL CONTRACT
|--------------------------------------------------------------------------
|
| Development -> localhost backend
| Production  -> same-origin /api
|--------------------------------------------------------------------------
*/

const fixed =
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
  fixed +
  s.slice(
    end
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

const baseCount =
  (
    s.match(
      /const API_BASE_URL\s*=/g
    ) || []
  ).length;

if (
  productionCount !== 1
) {
  throw new Error(
    `productionApiUrl declarations: ${productionCount}`
  );
}

if (
  baseCount !== 1
) {
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
  "productionApiUrl declarations:",
  productionCount
);
console.log(
  "API_BASE_URL declarations:",
  baseCount
);
