import fs from "node:fs";

const apiClient =
  "./frontend/src/services/apiClient.js";

const counselling =
  "./frontend/src/services/counsellingService.js";


for (const file of [
  apiClient,
  counselling,
]) {
  if (!fs.existsSync(file)) {
    throw new Error(
      `Missing file: ${file}`
    );
  }

  fs.copyFileSync(
    file,
    file.replace(
      /(\.[^.]+)$/,
      ".before-cloudflare-api$1"
    )
  );
}


/*
|--------------------------------------------------------------------------
| API CLIENT
|--------------------------------------------------------------------------
*/

let api =
  fs.readFileSync(
    apiClient,
    "utf8"
  );


api =
  api.replace(
    /const localApiUrl\s*=\s*[\s\S]*?;/,
`const localApiUrl =
  'http://localhost:4000/api';`
  );


api =
  api.replace(
    /const productionApiUrl\s*=\s*[\s\S]*?;/,
`const productionApiUrl =
  '/api';`
  );


fs.writeFileSync(
  apiClient,
  api,
  "utf8"
);


/*
|--------------------------------------------------------------------------
| COUNSELLING SERVICE
|--------------------------------------------------------------------------
*/

let cs =
  fs.readFileSync(
    counselling,
    "utf8"
  );


cs =
  cs.replace(
    /const API_BASE\s*=\s*[\s\S]*?;/,
`const API_BASE =
  import.meta.env.DEV
    ? 'http://localhost:4000/api'
    : '/api';`
  );


fs.writeFileSync(
  counselling,
  cs,
  "utf8"
);


console.log("");
console.log(
  "=============================================="
);
console.log(
  "CLOUDFLARE SAME-ORIGIN API PATCHED"
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
