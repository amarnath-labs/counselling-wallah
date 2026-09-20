const fs = require("fs");

const file = "./src/server.js";
let s = fs.readFileSync(file, "utf8");

/*
 * 1. Imports
 */
if (!s.includes("import helmet from 'helmet';")) {
  const marker =
    "import compression from 'compression';";

  if (!s.includes(marker)) {
    throw new Error("compression import not found");
  }

  s = s.replace(
    marker,
    `${marker}
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';`
  );
}

/*
 * 2. Express security config
 */
if (!s.includes("app.disable('x-powered-by');")) {
  const re =
    /const app\s*=\s*express\(\);/;

  if (!re.test(s)) {
    throw new Error("const app = express() not found");
  }

  s = s.replace(
    re,
    `const app = express();

app.disable('x-powered-by');

/*
 * Render runs behind a reverse proxy.
 * Required for reliable client IP rate limiting.
 */
app.set('trust proxy', 1);`
  );
}

/*
 * 3. Helmet
 *
 * CSP / CORP are disabled here because this is a JSON API
 * consumed cross-origin by the Vercel frontend.
 */
if (!s.includes("helmet({")) {
  const marker =
    "app.use(\n  cors(\n    corsOptions\n  )\n);";

  if (!s.includes(marker)) {
    throw new Error("CORS middleware block not found");
  }

  s = s.replace(
    marker,
    `${marker}

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: false,
  })
);`
  );
}

/*
 * 4. Login/register brute-force limiter
 */
if (!s.includes("const authRateLimiter =")) {
  const authMountRe =
    /app\.use\(\s*['"]\/api\/auth['"]\s*,\s*authRouter\s*\);/m;

  const match =
    s.match(authMountRe);

  if (!match) {
    throw new Error("auth router mount not found");
  }

  const block = `const authRateLimiter =
  rateLimit({
    windowMs:
      15 * 60 * 1000,

    limit:
      30,

    standardHeaders:
      'draft-8',

    legacyHeaders:
      false,

    message: {
      error:
        'Too many authentication attempts. Please try again later.',
    },
  });

app.use(
  '/api/auth/login',
  authRateLimiter
);

app.use(
  '/api/auth/register',
  authRateLimiter
);

${match[0]}`;

  s = s.replace(
    authMountRe,
    block
  );
}

fs.writeFileSync(
  file,
  s,
  "utf8"
);

console.log(
  "Helmet + auth rate limiting added."
);
