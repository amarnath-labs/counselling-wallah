const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

function file(rel) {
  return path.join(ROOT, rel);
}

function read(rel) {
  const p = file(rel);

  if (!fs.existsSync(p)) {
    throw new Error(`Missing file: ${rel}`);
  }

  return fs.readFileSync(p, "utf8");
}

function write(rel, content) {
  const p = file(rel);

  fs.mkdirSync(
    path.dirname(p),
    {
      recursive: true,
    }
  );

  fs.writeFileSync(
    p,
    content,
    "utf8"
  );

  console.log("WRITE:", rel);
}

function backup(rel) {
  const p = file(rel);

  if (!fs.existsSync(p)) {
    return;
  }

  const stamp =
    new Date()
      .toISOString()
      .replace(/[:.]/g, "-");

  const dest =
    `${p}.before-phase-a-${stamp}.bak`;

  fs.copyFileSync(
    p,
    dest
  );

  console.log("BACKUP:", rel);
}


/*
|--------------------------------------------------------------------------
| 1. REQUEST ID MIDDLEWARE
|--------------------------------------------------------------------------
*/

write(
  "backend/src/middleware/requestId.js",
`import {
  randomUUID,
} from 'node:crypto';


export default function requestIdMiddleware(
  req,
  res,
  next
) {
  const incoming =
    String(
      req.headers[
        'x-request-id'
      ] || ''
    ).trim();


  const requestId =
    incoming ||
    \`req_\${randomUUID()}\`;


  req.requestId =
    requestId;


  res.setHeader(
    'x-request-id',
    requestId
  );


  next();
}
`
);


/*
|--------------------------------------------------------------------------
| 2. SYSTEM HEALTH ROUTER
|--------------------------------------------------------------------------
|
| /live  = process alive, NO database dependency
| /ready = DB dependency check
|
|--------------------------------------------------------------------------
*/

write(
  "backend/src/routes/systemHealth.js",
`import {
  Router,
} from 'express';

import {
  pool,
} from '../db/pool.js';


const router =
  Router();


router.get(
  '/live',
  (
    _req,
    res
  ) => {
    return res.json({
      ok: true,

      service:
        'trumarg-api',

      status:
        'alive',

      time:
        new Date()
          .toISOString(),
    });
  }
);


router.get(
  '/ready',
  async (
    req,
    res
  ) => {
    const startedAt =
      Date.now();


    try {
      const result =
        await pool.query(
          \`
            SELECT
              current_database()
                AS database_name,
              NOW()
                AS database_time
          \`
        );


      return res.json({
        ok: true,

        service:
          'trumarg-api',

        ready: true,

        database: {
          ok: true,

          name:
            result
              ?.rows?.[0]
              ?.database_name ||
            null,

          time:
            result
              ?.rows?.[0]
              ?.database_time ||
            null,
        },

        requestId:
          req.requestId ||
          null,

        durationMs:
          Date.now() -
          startedAt,
      });

    } catch (error) {

      console.error(
        '[READINESS ERROR]',
        {
          requestId:
            req.requestId,

          message:
            error?.message,

          code:
            error?.code,
        }
      );


      return res
        .status(503)
        .json({
          ok: false,

          service:
            'trumarg-api',

          ready: false,

          database: {
            ok: false,
          },

          requestId:
            req.requestId ||
            null,

          durationMs:
            Date.now() -
            startedAt,
        });
    }
  }
);


export default router;
`
);


/*
|--------------------------------------------------------------------------
| 3. PATCH SERVER
|--------------------------------------------------------------------------
*/

{
  const rel =
    "backend/src/server.js";

  backup(rel);

  let text =
    read(rel);


  /*
  | imports
  */

  if (
    !text.includes(
      "./middleware/requestId.js"
    )
  ) {
    const importAnchor =
      /import\s+healthRouter\s+from\s+['"]\.\/routes\/health\.js['"];\s*/;

    if (
      !importAnchor.test(text)
    ) {
      throw new Error(
        "healthRouter import anchor not found in server.js"
      );
    }

    text =
      text.replace(
        importAnchor,
        match =>
`${match}
import requestIdMiddleware from './middleware/requestId.js';
import systemHealthRouter from './routes/systemHealth.js';

`
      );
  }


  /*
  | request id middleware
  |
  | Insert before API routes, after core middleware.
  */

  if (
    !text.includes(
      "app.use(requestIdMiddleware)"
    )
  ) {
    const apiRootMarker =
      /\/\*\s*\r?\n\|[-]+\r?\n\|\s*API ROOT/i;

    const match =
      text.match(
        apiRootMarker
      );

    if (!match) {
      throw new Error(
        "API ROOT marker not found"
      );
    }

    const index =
      match.index;

    text =
      text.slice(
        0,
        index
      ) +
`/*
|--------------------------------------------------------------------------
| REQUEST ID
|--------------------------------------------------------------------------
*/

app.use(
  requestIdMiddleware
);


` +
      text.slice(index);
  }


  /*
  | system health routes
  */

  if (
    !text.includes(
      "'/api/health/system'"
    )
  ) {
    const healthMountPattern =
      /app\.use\(\s*['"]\/api\/health['"]\s*,\s*healthRouter\s*\)\s*;?/m;

    const match =
      text.match(
        healthMountPattern
      );

    if (!match) {
      throw new Error(
        "Existing /api/health mount not found"
      );
    }

    text =
      text.replace(
        healthMountPattern,
`${match[0]}


/*
|--------------------------------------------------------------------------
| SYSTEM HEALTH
|--------------------------------------------------------------------------
|
| GET /api/health/system/live
| GET /api/health/system/ready
|
*/

app.use(
  '/api/health/system',
  systemHealthRouter
);`
      );
  }


  /*
  | stable production recommendation alias
  */

  if (
    !text.includes(
      "'/api/v1'"
    ) &&
    !text.includes(
      '"/api/v1"'
    )
  ) {
    const cwPattern =
      /app\.use\(\s*['"]\/api\/dev\/cw-rec['"]\s*,\s*cwRecV1DevRouter\s*\)\s*;?/m;

    const match =
      text.match(
        cwPattern
      );

    if (!match) {
      throw new Error(
        "Existing CW-REC mount not found"
      );
    }

    text =
      text.replace(
        cwPattern,
`${match[0]}


/*
|--------------------------------------------------------------------------
| TRUMARG RECOMMENDATION API V1
|--------------------------------------------------------------------------
|
| Stable production alias.
|
| Existing /api/dev/cw-rec remains temporarily so old deployed
| frontend bundles do not break during migration.
|
*/

app.use(
  '/api/v1',
  cwRecV1DevRouter
);`
      );
  }


  /*
  | enrich global error response with request ID
  |
  | Do NOT expose stack/database details.
  */

  if (
    !text.includes(
      "requestId:\n          req.requestId"
    )
  ) {
    text =
      text.replace(
        /error:\s*error\?\.status\s*===\s*400\s*\?\s*error\.message\s*:\s*['"]Internal server error['"]\s*,?/m,
`error:
          error?.status === 400
            ? error.message
            : 'Internal server error',

        requestId:
          req.requestId ||
          null,`
      );
  }


  write(
    rel,
    text
  );
}


/*
|--------------------------------------------------------------------------
| 4. API CLIENT
|--------------------------------------------------------------------------
|
| DEV  -> localhost
| PROD -> same-origin /api
|
|--------------------------------------------------------------------------
*/

{
  const rel =
    "frontend/src/services/apiClient.js";

  backup(rel);

  let text =
    read(rel);


  text =
    text.replace(
      /const\s+localApiUrl\s*=\s*['"\`][^'"\`]+['"\`]\s*;/m,
`const localApiUrl =
  'http://localhost:4000/api';`
    );


  text =
    text.replace(
      /const\s+productionApiUrl\s*=\s*['"\`][^'"\`]+['"\`]\s*;/m,
`const productionApiUrl =
  '/api';`
    );


  /*
  | production should not accidentally be forced to old Render URL
  | by a stale VITE_API_URL.
  */

  const configuredPattern =
    /const\s+configuredApiUrl\s*=\s*[\s\S]*?;\s*(?=\r?\n\s*const\s+(?:localApiUrl|productionApiUrl))/m;


  if (
    configuredPattern.test(
      text
    )
  ) {
    text =
      text.replace(
        configuredPattern,
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
  }


  /*
  | normalize API_BASE_URL decision
  */

  const basePattern =
    /const\s+API_BASE_URL\s*=\s*[\s\S]*?;\s*(?=\r?\n\s*console\.log)/m;


  if (
    basePattern.test(
      text
    )
  ) {
    text =
      text.replace(
        basePattern,
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
  }


  write(
    rel,
    text
  );
}


/*
|--------------------------------------------------------------------------
| 5. CW-REC FRONTEND ROUTE
|--------------------------------------------------------------------------
|
| IMPORTANT:
| Keep limit behavior unchanged for now.
| Only migrate endpoint path.
|
|--------------------------------------------------------------------------
*/

{
  const rel =
    "frontend/src/services/cwRecRecommendationService.js";

  backup(rel);

  let text =
    read(rel);


  text =
    text.replace(
      /\$\{API_BASE_URL\}\/dev\/cw-rec\/recommendations/g,
      '${API_BASE_URL}/v1/recommendations'
    );


  text =
    text.replace(
      /\/api\/dev\/cw-rec\/recommendations/g,
      '/api/v1/recommendations'
    );


  write(
    rel,
    text
  );
}


/*
|--------------------------------------------------------------------------
| 6. PRODUCTION SMOKE TEST SCRIPT
|--------------------------------------------------------------------------
*/

write(
  "backend/scripts/smoke-production.mjs",
`const base =
  String(
    process.env.TRUMARG_API_BASE ||
    'https://counsellingwallah-backend.onrender.com/api'
  )
    .replace(
      /\\/+$/,
      ''
    );


async function check(
  name,
  url,
  allowed = [200]
) {
  const started =
    Date.now();


  try {
    const response =
      await fetch(
        url,
        {
          redirect:
            'manual',
        }
      );


    const text =
      await response.text();


    const result = {
      name,
      status:
        response.status,
      ms:
        Date.now() -
        started,
      ok:
        allowed.includes(
          response.status
        ),
      requestId:
        response.headers.get(
          'x-request-id'
        ),
      body:
        text.slice(
          0,
          300
        ),
    };


    console.log(
      JSON.stringify(
        result,
        null,
        2
      )
    );


    return result;

  } catch (error) {

    const result = {
      name,
      status:
        null,
      ms:
        Date.now() -
        started,
      ok:
        false,
      error:
        error?.message,
    };


    console.log(
      JSON.stringify(
        result,
        null,
        2
      )
    );


    return result;
  }
}


const tests = [];


tests.push(
  await check(
    'liveness',
    \`\${base}/health/system/live\`
  )
);


tests.push(
  await check(
    'readiness',
    \`\${base}/health/system/ready\`
  )
);


tests.push(
  await check(
    'exams',
    \`\${base}/exams\`
  )
);


const recommendationUrl =
  \`\${base}/v1/recommendations\` +
  '?examId=jee-main' +
  '&rank=3000' +
  '&category=OPEN' +
  '&year=2026' +
  '&round=1' +
  '&branchPreferences=CSE%2CIT' +
  '&annualBudget=1000000' +
  '&gender=Male' +
  '&homeState=Maharashtra' +
  '&locationMode=NONE' +
  '&limit=1000';


tests.push(
  await check(
    'recommendations',
    recommendationUrl
  )
);


const failed =
  tests.filter(
    test =>
      !test.ok
  );


console.log('');
console.log(
  '=============================='
);
console.log(
  'TRUMARG PRODUCTION SMOKE TEST'
);
console.log(
  '=============================='
);

console.log(
  'Passed:',
  tests.length -
    failed.length
);

console.log(
  'Failed:',
  failed.length
);


if (
  failed.length
) {
  process.exitCode =
    1;
}
`
);


/*
|--------------------------------------------------------------------------
| 7. PACKAGE SCRIPT
|--------------------------------------------------------------------------
*/

{
  const rel =
    "backend/package.json";

  backup(rel);

  const pkg =
    JSON.parse(
      read(rel)
    );


  pkg.scripts =
    pkg.scripts || {};


  pkg.scripts[
    "smoke:production"
  ] =
    "node scripts/smoke-production.mjs";


  write(
    rel,
    JSON.stringify(
      pkg,
      null,
      2
    ) + "\n"
  );
}


console.log('');
console.log(
  '=========================================='
);

console.log(
  'TRUMARG PHASE A PATCH COMPLETE'
);

console.log(
  '=========================================='
);
