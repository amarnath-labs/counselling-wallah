import fs from "node:fs";

const file =
  "./frontend/src/services/apiClient.js";

const backup =
  "./frontend/src/services/apiClient.before-api-url-mismatch-fix.js";

let s =
  fs.readFileSync(
    file,
    "utf8"
  );

fs.copyFileSync(
  file,
  backup
);

const oldBlock =
`const API_BASE_URL =
  import.meta.env.DEV
    ? 'http://localhost:4000/api'
    : '/api';`;

const newBlock =
`const localApiUrl =
  'http://localhost:4000/api';

const productionApiUrl =
  '/api';

const API_BASE_URL =
  import.meta.env.DEV
    ? localApiUrl
    : productionApiUrl;`;

if (!s.includes(oldBlock)) {
  throw new Error(
    "Current API_BASE_URL block not found."
  );
}

s =
  s.replace(
    oldBlock,
    newBlock
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
  "API URL MISMATCH FIXED"
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
  "Preferences logic: UNCHANGED"
);
console.log(
  "JoSAA/CSAB logic: UNCHANGED"
);
console.log(
  "Architecture logic: UNCHANGED"
);
