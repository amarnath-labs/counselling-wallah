const fs =
  require("fs");

const path =
  require("path");


const ROOT =
  process.cwd();


function read(rel) {
  const file =
    path.join(
      ROOT,
      rel
    );

  if (
    !fs.existsSync(file)
  ) {
    throw new Error(
      `Missing file: ${rel}`
    );
  }

  return {
    file,
    text:
      fs.readFileSync(
        file,
        "utf8"
      ),
  };
}


function backup(file) {
  const stamp =
    new Date()
      .toISOString()
      .replace(
        /[:.]/g,
        "-"
      );

  const destination =
    `${file}.before-production-api-fix-${stamp}.bak`;

  fs.copyFileSync(
    file,
    destination
  );

  console.log(
    "BACKUP:",
    destination
  );
}


function write(
  file,
  text
) {
  fs.writeFileSync(
    file,
    text,
    "utf8"
  );
}


/*
|--------------------------------------------------------------------------
| 1. API CLIENT
|--------------------------------------------------------------------------
|
| DEV:
| http://localhost:4000/api
|
| PROD:
| https://counsellingwallah-backend.onrender.com/api
|
| Production intentionally ignores stale VITE_API_BASE_URL=/api.
|
|--------------------------------------------------------------------------
*/

{
  const {
    file,
    text: original,
  } =
    read(
      "frontend/src/services/apiClient.js"
    );

  backup(
    file
  );

  let text =
    original;


  /*
  |--------------------------------------------------------------------------
  | localApiUrl
  |--------------------------------------------------------------------------
  */

  if (
    /const\s+localApiUrl\s*=/.test(
      text
    )
  ) {
    text =
      text.replace(
        /const\s+localApiUrl\s*=\s*['"`][^'"`]*['"`]\s*;/m,
        `const localApiUrl =
  'http://localhost:4000/api';`
      );
  }


  /*
  |--------------------------------------------------------------------------
  | productionApiUrl
  |--------------------------------------------------------------------------
  */

  if (
    /const\s+productionApiUrl\s*=/.test(
      text
    )
  ) {
    text =
      text.replace(
        /const\s+productionApiUrl\s*=\s*['"`][^'"`]*['"`]\s*;/m,
        `const productionApiUrl =
  'https://counsellingwallah-backend.onrender.com/api';`
      );
  }


  /*
  |--------------------------------------------------------------------------
  | configuredApiUrl
  |--------------------------------------------------------------------------
  |
  | Production env containing "/api" must NOT win.
  |
  */

  text =
    text.replace(
      /const\s+configuredApiUrl\s*=\s*[\s\S]*?;\s*(?=\r?\n\s*const\s+localApiUrl)/m,
      `const configuredApiUrl =
  import.meta.env.DEV
    ? (
        import.meta.env.VITE_API_BASE_URL ||
        import.meta.env.VITE_API_URL ||
        ''
      )
    : '';

`
    );


  /*
  |--------------------------------------------------------------------------
  | API_BASE_URL
  |--------------------------------------------------------------------------
  |
  | Preserve normalize function but force production base.
  |
  */

  text =
    text.replace(
      /const\s+API_BASE_URL\s*=\s*normalizeApiBaseUrl\([\s\S]*?\)\s*;\s*(?=\r?\n\s*console\.log)/m,
      `const API_BASE_URL =
  import.meta.env.DEV
    ? (
        normalizeApiBaseUrl(
          configuredApiUrl
        ) ||
        localApiUrl
      )
    : productionApiUrl;

`
    );


  write(
    file,
    text
  );

  console.log(
    "PASS: apiClient production base -> Render"
  );
}


/*
|--------------------------------------------------------------------------
| 2. CW-REC SERVICE
|--------------------------------------------------------------------------
*/

{
  const {
    file,
    text: original,
  } =
    read(
      "frontend/src/services/cwRecRecommendationService.js"
    );

  backup(
    file
  );

  let text =
    original;


  /*
  |--------------------------------------------------------------------------
  | Import API_BASE_URL if missing
  |--------------------------------------------------------------------------
  */

  if (
    !/import\s*\{\s*API_BASE_URL\s*\}\s*from\s*['"]\.\/apiClient(?:\.js)?['"]/.test(
      text
    )
  ) {
    text =
`import {
  API_BASE_URL,
} from './apiClient.js';

` + text;
  }


  /*
  |--------------------------------------------------------------------------
  | Remove temporary duplicate CW_REC_API_BASE declaration
  |--------------------------------------------------------------------------
  */

  text =
    text.replace(
      /const\s+CW_REC_API_BASE\s*=\s*[\s\S]*?;\s*/m,
      ""
    );


  /*
  |--------------------------------------------------------------------------
  | Normalize recommendation URL
  |--------------------------------------------------------------------------
  |
  | Handles:
  | /api/dev/cw-rec/recommendations
  | http://localhost...
  | Render URL
  | template literal variants
  |
  */

  text =
    text.replace(
      /[`'"]\/api\/dev\/cw-rec\/recommendations\?\$\{params\.toString\(\)\}[`'"]/g,
      "`${API_BASE_URL}/dev/cw-rec/recommendations?${params.toString()}`"
    );


  text =
    text.replace(
      /`\$\{[^}]+\}\/dev\/cw-rec\/recommendations\?\$\{params\.toString\(\)\}`/g,
      "`${API_BASE_URL}/dev/cw-rec/recommendations?${params.toString()}`"
    );


  text =
    text.replace(
      /`https:\/\/counsellingwallah-backend\.onrender\.com\/api\/dev\/cw-rec\/recommendations\?\$\{params\.toString\(\)\}`/g,
      "`${API_BASE_URL}/dev/cw-rec/recommendations?${params.toString()}`"
    );


  /*
  |--------------------------------------------------------------------------
  | limit <= 100
  |--------------------------------------------------------------------------
  */

  text =
    text.replace(
      /Math\.min\(\s*1000\s*,\s*Number\(\s*limit\s*\)\s*\|\|\s*100\s*\)/g,
      `Math.min(
      100,
      Number(limit) || 100
    )`
    );


  /*
  |--------------------------------------------------------------------------
  | Any literal limit:1000 default
  |--------------------------------------------------------------------------
  */

  text =
    text.replace(
      /limit\s*=\s*1000\b/g,
      "limit = 100"
    );


  write(
    file,
    text
  );

  console.log(
    "PASS: CW-REC uses central API base and max limit 100"
  );
}


/*
|--------------------------------------------------------------------------
| 3. COUNSELLING SERVICE
|--------------------------------------------------------------------------
|
| Remove another independent API-base decision.
|
|--------------------------------------------------------------------------
*/

{
  const rel =
    "frontend/src/services/counsellingService.js";

  const {
    file,
    text: original,
  } =
    read(
      rel
    );

  backup(
    file
  );

  let text =
    original;


  if (
    !/import\s*\{\s*API_BASE_URL\s*\}/.test(
      text
    )
  ) {
    text =
`import {
  API_BASE_URL,
} from './apiClient.js';

` + text;
  }


  text =
    text.replace(
      /const\s+API_BASE\s*=\s*[\s\S]*?;\s*(?=\r?\n)/m,
      `const API_BASE =
  API_BASE_URL;`
    );


  write(
    file,
    text
  );

  console.log(
    "PASS: counsellingService uses central API base"
  );
}


/*
|--------------------------------------------------------------------------
| 4. PRODUCTION /API FETCH AUDIT
|--------------------------------------------------------------------------
*/

{
  const root =
    path.join(
      ROOT,
      "frontend",
      "src"
    );

  const extensions =
    new Set([
      ".js",
      ".jsx",
      ".ts",
      ".tsx",
    ]);


  const hits =
    [];


  function walk(dir) {
    for (
      const entry
      of fs.readdirSync(
        dir,
        {
          withFileTypes:
            true,
        }
      )
    ) {
      const full =
        path.join(
          dir,
          entry.name
        );


      if (
        entry.isDirectory()
      ) {
        walk(
          full
        );

        continue;
      }


      if (
        !extensions.has(
          path.extname(
            entry.name
          )
        )
      ) {
        continue;
      }


      const content =
        fs.readFileSync(
          full,
          "utf8"
        );


      const lines =
        content.split(
          /\r?\n/
        );


      lines.forEach(
        (
          line,
          index
        ) => {
          if (
            /fetch\s*\(\s*[`'"]\/api\//.test(
              line
            )
          ) {
            hits.push(
              `${path.relative(
                ROOT,
                full
              )}:${index + 1}: ${line.trim()}`
            );
          }
        }
      );
    }
  }


  walk(
    root
  );


  if (
    hits.length
  ) {
    console.log("");
    console.log(
      "WARNING: direct fetch('/api/...') occurrences remain:"
    );

    hits.forEach(
      hit =>
        console.log(
          hit
        )
    );
  } else {
    console.log(
      "PASS: no obvious direct fetch('/api/...') remains"
    );
  }
}


console.log("");
console.log(
  "=========================================="
);
console.log(
  "MASTER PRODUCTION API PATCH COMPLETE"
);
console.log(
  "=========================================="
);
