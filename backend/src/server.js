import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';

import { pool } from './db/pool.js';

import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import examsRouter from './routes/exams.js';
import collegesRouter from './routes/colleges.js';
import counsellingRouter from './routes/counselling.js';
import cwRecV1DevRouter from './routes/cwRecV1-dev.js';
import paymentsRouter from './routes/payments.js';
import feedbackRouter from './routes/feedback.js';


const app = express();

app.disable('x-powered-by');

/*
 * Render reverse proxy.
 * Needed for correct client IP handling.
 */
app.set('trust proxy', 1);


/*
|--------------------------------------------------------------------------
| SERVER CONFIG
|--------------------------------------------------------------------------
*/

const PORT =
  Number(
    process.env.PORT
  ) || 4000;


/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| We use credentials/cookies for authentication.
| Therefore Access-Control-Allow-Origin CANNOT be "*".
|
| We explicitly allow:
|
| - Local Vite dev
| - Local Vite preview
| - Main Vercel production domain
| - Counselling Wallah Vercel preview deployments
| - Optional CORS_ORIGIN environment variable
|
|--------------------------------------------------------------------------
*/


const allowedOrigins =
  new Set([
    'http://localhost:4173',
    'http://localhost:5173',
    'http://localhost:5174',

    'https://counselling-wallah-frontend.vercel.app',
    'https://trumarg.com',
    'https://www.trumarg.com',
  ]);


const configuredOrigin =
  String(
    process.env.CORS_ORIGIN ||
    ''
  ).trim();


/*
|--------------------------------------------------------------------------
| VERCEL PREVIEW DOMAIN CHECK
|--------------------------------------------------------------------------
|
| Examples allowed:
|
| counselling-wallah-frontend-n4iwispg5.vercel.app
| counselling-wallah-frontend-xxxxx.vercel.app
|
| Other random *.vercel.app domains are NOT allowed.
|
|--------------------------------------------------------------------------
*/

function isAllowedVercelPreview(
  origin
) {
  try {
    const url =
      new URL(origin);

    const hostname =
      String(
        url.hostname ||
        ''
      )
        .trim()
        .toLowerCase();


    if (
      url.protocol !==
      'https:'
    ) {
      return false;
    }


    /*
    |--------------------------------------------------------------------------
    | Main production domain
    |--------------------------------------------------------------------------
    */

    if (
      hostname ===
      'counselling-wallah-frontend.vercel.app'
    ) {
      return true;
    }


    /*
    |--------------------------------------------------------------------------
    | Vercel preview deployments
    |--------------------------------------------------------------------------
    */

    return (
      hostname.startsWith(
        'counselling-wallah-frontend-'
      ) &&
      hostname.endsWith(
        '.vercel.app'
      )
    );

  } catch {
    return false;
  }
}


/*
|--------------------------------------------------------------------------
| ORIGIN VALIDATION
|--------------------------------------------------------------------------
*/

function corsOriginHandler(
  origin,
  callback
) {

  /*
  |--------------------------------------------------------------------------
  | Requests without Origin
  |--------------------------------------------------------------------------
  |
  | curl, Postman, Render health checks,
  | server-to-server requests etc.
  |--------------------------------------------------------------------------
  */

  if (!origin) {
    return callback(
      null,
      true
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Explicit local / production allowlist
  |--------------------------------------------------------------------------
  */

  if (
    allowedOrigins.has(
      origin
    )
  ) {
    return callback(
      null,
      true
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Environment configured origin
  |--------------------------------------------------------------------------
  */

  if (
    configuredOrigin &&
    origin ===
      configuredOrigin
  ) {
    return callback(
      null,
      true
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Counselling Wallah Vercel preview
  |--------------------------------------------------------------------------
  */

  if (
    isAllowedVercelPreview(
      origin
    )
  ) {
    return callback(
      null,
      true
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Reject unknown origins
  |--------------------------------------------------------------------------
  */

  console.warn(
    '[CORS] Blocked origin:',
    origin
  );


  return callback(
    new Error(
      `CORS blocked origin: ${origin}`
    )
  );
}


const corsOptions = {

  origin:
    corsOriginHandler,


  /*
  |--------------------------------------------------------------------------
  | Required for auth cookies
  |--------------------------------------------------------------------------
  */

  credentials:
    true,


  methods: [
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'OPTIONS',
  ],


  allowedHeaders: [
    'Content-Type',
    'Authorization',
  ],


  optionsSuccessStatus:
    204,
};


/*
|--------------------------------------------------------------------------
| APPLY CORS
|--------------------------------------------------------------------------
*/

app.use(
  cors(
    corsOptions
  )
);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: false,
  })
);


/*
|--------------------------------------------------------------------------
| PREFLIGHT
|--------------------------------------------------------------------------
|
| Explicitly handle browser OPTIONS requests.
|--------------------------------------------------------------------------
*/

app.options(
  '*',
  cors(
    corsOptions
  )
);


/*
|--------------------------------------------------------------------------
| BODY PARSERS
|--------------------------------------------------------------------------
*/

app.use(
  compression({
    threshold: 1024,
  })
);

/*
|--------------------------------------------------------------------------
| RENDER EDGE CACHE SAFETY
|--------------------------------------------------------------------------
*/

app.use((req, res, next) => {
  res.set(
    'CDN-Cache-Control',
    'no-store'
  );

  next();
});


app.use(
  express.json({
    limit:
      '1mb',
  })
);


app.use(
  express.urlencoded({
    extended:
      true,

    limit:
      '1mb',
  })
);


/*
|--------------------------------------------------------------------------
| COOKIE PARSER
|--------------------------------------------------------------------------
|
| Authentication JWT/session cookie is read by auth routes/middleware.
|--------------------------------------------------------------------------
*/

app.use(
  cookieParser()
);


/*
|--------------------------------------------------------------------------
| STARTUP LOGGING
|--------------------------------------------------------------------------
*/

console.log(
  '[SERVER] Environment:',
  process.env.NODE_ENV ||
  'not set'
);


console.log(
  '[SERVER] PORT:',
  PORT
);


console.log(
  '[CORS] Production origin:',
  'https://counselling-wallah-frontend.vercel.app'
);


console.log(
  '[CORS] Configured origin:',
  configuredOrigin ||
  'not set'
);


console.log(
  '[CORS] Vercel previews:',
  'enabled'
);


/*
|--------------------------------------------------------------------------
| API ROOT
|--------------------------------------------------------------------------
*/

app.get(
  '/api',
  (
    _req,
    res
  ) => {
    return res.json({
      name:
        'Counselling Wallah API',

      phase:
        2,

      status:
        process.env.NODE_ENV ||
        'development',
    });
  }
);


/*
|--------------------------------------------------------------------------
| HEALTH
|--------------------------------------------------------------------------
|
| Keep the existing health router.
|--------------------------------------------------------------------------
*/

app.use(
  '/api/health',
  healthRouter
);


/*
|--------------------------------------------------------------------------
| DATABASE HEALTH FALLBACK
|--------------------------------------------------------------------------
|
| Useful if health router structure changes.
|--------------------------------------------------------------------------
*/

app.get(
  '/api/health/database',
  async (
    _req,
    res
  ) => {
    try {
      const result =
        await pool.query(
          'SELECT current_database() AS database_name'
        );


      return res.json({
        ok:
          true,

        database:
          'postgresql',

        databaseName:
          result
            ?.rows?.[0]
            ?.database_name ||
          null,

        time:
          new Date()
            .toISOString(),
      });

    } catch (error) {

      console.error(
        '[DATABASE HEALTH ERROR]',
        error
      );


      return res
        .status(500)
        .json({
          ok:
            false,

          error:
            'Database connection failed',
        });
    }
  }
);


/*
|--------------------------------------------------------------------------
| AUTH
|--------------------------------------------------------------------------
|
| POST /api/auth/register
| POST /api/auth/login
| GET  /api/auth/me
| POST /api/auth/logout
|--------------------------------------------------------------------------
*/

const authRateLimiter =
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

app.use(
  '/api/auth',
  authRouter
);


/*
|--------------------------------------------------------------------------
| EXAMS
|--------------------------------------------------------------------------
*/

app.use(
  '/api/exams',
  examsRouter
);


/*
|--------------------------------------------------------------------------
| COLLEGES
|--------------------------------------------------------------------------
*/

app.use(
  '/api/colleges',
  collegesRouter
);


/*
|--------------------------------------------------------------------------
| COUNSELLING
|--------------------------------------------------------------------------
*/

app.use(
  '/api/counselling',
  counsellingRouter
);


/*
|--------------------------------------------------------------------------
| CW-REC
|--------------------------------------------------------------------------
|
| IMPORTANT:
| Do not remove.
|
| Personalized Recommendation frontend currently uses this route.
|--------------------------------------------------------------------------
*/

app.use(
  '/api/dev/cw-rec',
  cwRecV1DevRouter
);


/*
|--------------------------------------------------------------------------
| PAYMENTS
|--------------------------------------------------------------------------
*/

app.use(
  '/api/payments',
  paymentsRouter
);

app.use(
  '/api/feedback',
  feedbackRouter
);


/*
|--------------------------------------------------------------------------
| 404
|--------------------------------------------------------------------------
*/

app.use(
  (
    req,
    res
  ) => {

    console.warn(
      `[404] ${req.method} ${req.originalUrl}`
    );


    return res
      .status(404)
      .json({
        error:
          'Route not found',

        path:
          req.originalUrl,

        method:
          req.method,
      });
  }
);


/*
|--------------------------------------------------------------------------
| ERROR HANDLER
|--------------------------------------------------------------------------
*/

app.use(
  (
    error,
    req,
    res,
    _next
  ) => {

    console.error(
      '========================================'
    );

    console.error(
      '[API ERROR]'
    );

    console.error(
      'Method:',
      req.method
    );

    console.error(
      'URL:',
      req.originalUrl
    );

    console.error(
      'Message:',
      error?.message
    );

    console.error(
      'Name:',
      error?.name
    );


    if (
      error?.code
    ) {
      console.error(
        'Code:',
        error.code
      );
    }


    if (
      error?.detail
    ) {
      console.error(
        'Detail:',
        error.detail
      );
    }


    if (
      error?.hint
    ) {
      console.error(
        'Hint:',
        error.hint
      );
    }


    console.error(
      'Stack:',
      error?.stack
    );


    console.error(
      '========================================'
    );


    /*
    |--------------------------------------------------------------------------
    | CORS failure
    |--------------------------------------------------------------------------
    */

    if (
      String(
        error?.message ||
        ''
      ).startsWith(
        'CORS blocked origin:'
      )
    ) {
      return res
        .status(403)
        .json({
          error:
            'Origin not allowed',
        });
    }


    return res
      .status(500)
      .json({
        error:
          'Internal server error',
      });
  }
);


/*
|--------------------------------------------------------------------------
| START SERVER
|--------------------------------------------------------------------------
*/

app.listen(
  PORT,
  '0.0.0.0',
  () => {

    console.log(
      `Counselling Wallah API listening on 0.0.0.0:${PORT}`
    );

  }
);


