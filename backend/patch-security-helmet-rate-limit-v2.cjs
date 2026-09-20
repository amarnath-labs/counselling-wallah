const fs = require("fs");

const file = "./src/server.js";
let s = fs.readFileSync(file, "utf8");

/* 1. Imports */
if (!s.includes("import helmet from 'helmet';")) {
  const importRe =
    /import compression from ['"]compression['"];/;

  if (!importRe.test(s)) {
    throw new Error("compression import not found");
  }

  s = s.replace(
    importRe,
    `import compression from 'compression';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';`
  );
}

/* 2. Express fingerprint + proxy */
if (!s.includes("app.disable('x-powered-by');")) {
  const appRe =
    /const app\s*=\s*express\(\);/;

  if (!appRe.test(s)) {
    throw new Error("Express app declaration not found");
  }

  s = s.replace(
    appRe,
    `const app = express();

app.disable('x-powered-by');

/*
 * Render reverse proxy.
 * Needed for correct client IP handling.
 */
app.set('trust proxy', 1);`
  );
}

/* 3. Helmet after CORS middleware */
if (!s.includes("helmet({")) {
  const corsRe =
    /app\.use\(\s*cors\(\s*corsOptions\s*\)\s*\);/m;

  const match = s.match(corsRe);

  if (!match) {
    throw new Error("CORS app.use block not found");
  }

  s = s.replace(
    corsRe,
    `${match[0]}

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: false,
  })
);`
  );
}

/* 4. Auth brute-force limiter */
if (!s.includes("const authRateLimiter =")) {
  const authRe =
    /app\.use\(\s*['"]\/api\/auth['"]\s*,\s*authRouter\s*\);/m;

  const match = s.match(authRe);

  if (!match) {
    throw new Error("Auth router mount not found");
  }

  const limiterBlock =
`const authRateLimiter =
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
    authRe,
    limiterBlock
  );
}

fs.writeFileSync(
  file,
  s,
  "utf8"
);

console.log(
  "Security patch successfully applied."
);
