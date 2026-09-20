import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import helmet from 'helmet';

import {
  rateLimit,
} from 'express-rate-limit';


import {
  pool,
} from './db/pool.js';


import RedisRateLimitStore from './services/redisRateLimitStore.js';

import collegeRedisCache from './middleware/collegeRedisCache.js';


import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import examsRouter from './routes/exams.js';
import collegesRouter from './routes/colleges.js';
import counsellingRouter from './routes/counselling.js';
import cwRecV1DevRouter from './routes/cwRecV1-dev.js';
import paymentsRouter from './routes/payments.js';
import feedbackRouter from './routes/feedback.js';


const app =
  express();


app.disable(
  'x-powered-by'
);


/*
|--------------------------------------------------------------------------
| RENDER REVERSE PROXY
|--------------------------------------------------------------------------
*/

app.set(
  'trust proxy',
  1
);


/*
|--------------------------------------------------------------------------
| SERVER CONFIG
|--------------------------------------------------------------------------
*/

const PORT =
  Number(
    process.env.PORT
  ) ||
  4000;


/*
|--------------------------------------------------------------------------
| CORS ALLOWLIST
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


/*
|--------------------------------------------------------------------------
| ENV CONFIGURED ORIGINS
|--------------------------------------------------------------------------
*/

const configuredOrigins =
  String(
    process.env
      .CORS_ORIGIN ||
    ''
  )
    .split(',')
    .map(
      (origin) =>
        origin.trim()
    )
    .filter(Boolean);


/*
|--------------------------------------------------------------------------
| VERCEL PREVIEW CHECK
|--------------------------------------------------------------------------
*/

function isAllowedVercelPreview(
  origin
) {

  try {

    const url =
      new URL(
        origin
      );


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


    if (
      hostname ===
      'counselling-wallah-frontend.vercel.app'
    ) {

      return true;
    }


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
| CORS ORIGIN HANDLER
|--------------------------------------------------------------------------
*/

function corsOriginHandler(
  origin,
  callback
) {

  /*
  |--------------------------------------------------------------------------
  | curl / Postman / server-to-server
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
  | Explicit allowlist
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
  | Environment allowlist
  |--------------------------------------------------------------------------
  */

  if (
    configuredOrigins.includes(
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
  | Vercel preview
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


/*
|--------------------------------------------------------------------------
| CORS OPTIONS
|--------------------------------------------------------------------------
*/

const corsOptions = {

  origin:
    corsOriginHandler,

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

  exposedHeaders: [
    'X-CW-Redis-Cache',
    'X-CW-Cache-Type',
    'RateLimit',
    'RateLimit-Policy',
    'Retry-After',
  ],

  optionsSuccessStatus:
    204,
};


/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
*/

app.use(
  cors(
    corsOptions
  )
);


/*
|--------------------------------------------------------------------------
| SECURITY HEADERS
|--------------------------------------------------------------------------
*/

app.use(
  helmet({
    contentSecurityPolicy:
      false,

    crossOriginResourcePolicy:
      false,
  })
);


/*
|--------------------------------------------------------------------------
| PREFLIGHT
|--------------------------------------------------------------------------
*/

app.options(
  /.*/,
  cors(
    corsOptions
  )
);


/*
|--------------------------------------------------------------------------
| COMPRESSION
|--------------------------------------------------------------------------
*/

app.use(
  compression({
    threshold:
      1024,
  })
);


/*
|--------------------------------------------------------------------------
| CACHE POLICY
|--------------------------------------------------------------------------
|
| Private APIs must never be CDN cached.
|
| Public APIs may define their own cache behaviour.
|
|--------------------------------------------------------------------------
*/

app.use(
  (
    req,
    res,
    next
  ) => {

    const privateApi =
      req.path.startsWith(
        '/api/auth'
      ) ||
      req.path.startsWith(
        '/api/payments'
      ) ||
      req.path.startsWith(
        '/api/feedback'
      );


    if (privateApi) {

      res.set(
        'Cache-Control',
        'private, no-store'
      );


      res.set(
        'CDN-Cache-Control',
        'no-store'
      );
    }


    next();
  }
);


/*
|--------------------------------------------------------------------------
| BODY PARSERS
|--------------------------------------------------------------------------
*/

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
  '[CORS] Production Vercel:',
  'https://counselling-wallah-frontend.vercel.app'
);


console.log(
  '[CORS] TruMarg:',
  'https://trumarg.com'
);


console.log(
  '[CORS] Configured origins:',
  configuredOrigins.length
    ? configuredOrigins.join(
        ', '
      )
    : 'not set'
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

      time:
        new Date()
          .toISOString(),
    });
  }
);


/*
|--------------------------------------------------------------------------
| HEALTH
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
          `
          SELECT
            current_database() AS database_name,
            NOW() AS database_time
          `
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

        databaseTime:
          result
            ?.rows?.[0]
            ?.database_time ||
          null,

        serverTime:
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
| AUTH DISTRIBUTED RATE-LIMIT STORE
|--------------------------------------------------------------------------
*/

const authRateLimitStore =
  new RedisRateLimitStore({
    prefix:
      'cw:rate-limit:auth:',
  });


/*
|--------------------------------------------------------------------------
| AUTH RATE LIMITER
|--------------------------------------------------------------------------
*/

const authRateLimiter =
  rateLimit({

    windowMs:
      15 *
      60 *
      1000,

    limit:
      30,

    store:
      authRateLimitStore,

    standardHeaders:
      'draft-8',

    legacyHeaders:
      false,

    message: {
      error:
        'Too many authentication attempts. Please try again later.',
    },
  });


/*
|--------------------------------------------------------------------------
| AUTH
|--------------------------------------------------------------------------
*/

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
|
| Redis middleware executes before existing collegesRouter.
|
|--------------------------------------------------------------------------
*/

app.use(
  '/api/colleges',
  collegeRedisCache,
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
| PERSONALIZED RECOMMENDATION
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


/*
|--------------------------------------------------------------------------
| FEEDBACK
|--------------------------------------------------------------------------
*/

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
| GLOBAL ERROR HANDLER
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


    console.error(
      'Stack:',
      error?.stack
    );


    console.error(
      '========================================'
    );


    /*
    |--------------------------------------------------------------------------
    | CORS
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


    /*
    |--------------------------------------------------------------------------
    | Invalid JSON
    |--------------------------------------------------------------------------
    */

    if (
      error instanceof
        SyntaxError &&
      error?.status ===
        400 &&
      'body' in error
    ) {

      return res
        .status(400)
        .json({
          error:
            'Invalid JSON body',
        });
    }


    /*
    |--------------------------------------------------------------------------
    | Default
    |--------------------------------------------------------------------------
    */

    return res
      .status(
        error?.status ||
        error?.statusCode ||
        500
      )
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

const server =
  app.listen(
    PORT,

    '0.0.0.0',

    () => {

      console.log(
        `[SERVER] Counselling Wallah API listening on 0.0.0.0:${PORT}`
      );
    }
  );


/*
|--------------------------------------------------------------------------
| GRACEFUL SHUTDOWN
|--------------------------------------------------------------------------
*/

let shuttingDown =
  false;


async function shutdown(
  signal
) {

  if (shuttingDown) {
    return;
  }


  shuttingDown =
    true;


  console.log(
    `[SERVER] ${signal} received. Starting graceful shutdown...`
  );


  server.close(
    async () => {

      try {

        console.log(
          '[SERVER] HTTP server closed.'
        );


        await pool.end();


        console.log(
          '[SERVER] PostgreSQL pool closed.'
        );


        process.exit(0);

      } catch (error) {

        console.error(
          '[SERVER] Graceful shutdown failed:',
          error
        );


        process.exit(1);
      }
    }
  );


  setTimeout(
    () => {

      console.error(
        '[SERVER] Forced shutdown after timeout.'
      );


      process.exit(1);

    },

    10_000

  ).unref();
}


process.on(
  'SIGTERM',
  () =>
    shutdown(
      'SIGTERM'
    )
);


process.on(
  'SIGINT',
  () =>
    shutdown(
      'SIGINT'
    )
);


export default app;