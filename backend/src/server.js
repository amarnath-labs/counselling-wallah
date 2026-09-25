import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';

import RedisRateLimitStore from './services/redisRateLimitStore.js';
import collegeRedisCache from './middleware/collegeRedisCache.js';

import { pool } from './db/pool.js';

import healthRouter from './routes/health.js';
import healthScaleRouter from './routes/healthScale.js';

import reviewsRouter from './routes/reviews.js';
import requestIdMiddleware from './middleware/requestId.js';
import systemHealthRouter from './routes/systemHealth.js';

import authRouter from './routes/auth.js';
import examsRouter from './routes/exams.js';
import collegesRouter from './routes/colleges.js';
import counsellingRouter from './routes/counselling.js';
import cwRecV1DevRouter from './routes/cwRecV1-dev.js';

import neetRecommendationsRouter from './routes/neetRecommendations.js';
import paymentsRouter from './routes/payments.js';
import feedbackRouter from './routes/feedback.js';

import reviewEnrichmentRouter from './routes/reviewEnrichment.js';
import careerAssessmentRouter
  from './routes/careerAssessment.js';

import careerAssessmentV2Router
  from './routes/careerAssessmentV2.js';


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
*/

const allowedOrigins =
  new Set([
    'http://localhost:4173',
    'http://localhost:5173',
    'http://localhost:5174',

        'http://localhost:5175',
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
  '*',
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
| RENDER EDGE CACHE SAFETY
|--------------------------------------------------------------------------
*/


app.use(
  '/api/reviews',
  reviewsRouter
);


app.use(
  '/api/review-enrichment',
  reviewEnrichmentRouter
);

app.use(
  (
    req,
    res,
    next
  ) => {

    res.set(
      'CDN-Cache-Control',
      'no-store'
    );

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
  '[CORS] Production origin:',
  'https://counselling-wallah-frontend.vercel.app'
);


console.log(
  '[CORS] TruMarg:',
  'https://trumarg.com'
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
| REQUEST ID
|--------------------------------------------------------------------------
*/

app.use(
  requestIdMiddleware
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
*/

app.use(
  '/api/health',
  healthScaleRouter
);

app.use(
  '/api/health',
  healthRouter
);


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
| AUTH RATE LIMIT
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

    store:
      new RedisRateLimitStore({
        prefix:
          'cw:auth-rate-limit:',
      }),

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


/*
|--------------------------------------------------------------------------
| AUTH
|--------------------------------------------------------------------------
*/

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
| CW-REC
|--------------------------------------------------------------------------
*/

app.use(
  '/api/dev/cw-rec',
  cwRecV1DevRouter
);

app.use(
  '/api/neet',
  neetRecommendationsRouter
);


/*
|--------------------------------------------------------------------------
| TRUMARG PUBLIC RECOMMENDATION API V1
|--------------------------------------------------------------------------
|
| Stable production alias.
| Existing /api/dev/cw-rec route remains temporarily for compatibility.
|
*/

app.use(
  '/api/v1',
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
| CAREER DISCOVERY
|--------------------------------------------------------------------------
|
| V2:
|
| POST
| /api/career/assessment/start
|
| POST
| /api/career/assessment/:id/answer
|
| GET
| /api/career/assessment/:id/report
|
| Legacy compatibility:
|
| POST
| /api/career/assessment/next-question
|
| POST
| /api/career/assessment/debug-candidates
|
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| CAREER V2
|--------------------------------------------------------------------------
|
| V2 mounted FIRST.
|--------------------------------------------------------------------------
*/

app.use(
  '/api/career',
  careerAssessmentV2Router
);


/*
|--------------------------------------------------------------------------
| CAREER LEGACY
|--------------------------------------------------------------------------
|
| Keeps existing adaptive frontend/API tests working.
|--------------------------------------------------------------------------
*/

app.use(
  '/api/career',
  careerAssessmentRouter
);



/*
|--------------------------------------------------------------------------
| LOADER.IO BACKEND VERIFICATION
|--------------------------------------------------------------------------
*/

app.get(
  '/loaderio-98d882296b5a0c06adfa54d1c631f2f9.txt',
  (_req, res) => {
    return res
      .status(200)
      .type('text/plain')
      .send(
        'loaderio-98d882296b5a0c06adfa54d1c631f2f9'
      );
  }
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
    | CORS ERROR
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
    | SERVICE ERROR STATUS
    |--------------------------------------------------------------------------
    |
    | Allows career services to return proper 400 / 404 instead of every
    | error becoming 500.
    |--------------------------------------------------------------------------
    */

    const requestedStatus =
      Number(
        error?.statusCode
      );


    const statusCode =
      Number.isInteger(
        requestedStatus
      ) &&
      requestedStatus >= 400 &&
      requestedStatus < 600
        ? requestedStatus
        : 500;


    return res
      .status(
        statusCode
      )
      .json({
        error:
          statusCode < 500
            ? (
                error?.message ||
                'Request failed'
              )
            : 'Internal server error',
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
        `TruMarg API listening on 0.0.0.0:${PORT}`
      );

    }
  );


let shutdownStarted =
  false;


async function gracefulShutdown(
  signal
) {

  if (
    shutdownStarted
  ) {
    return;
  }

  shutdownStarted =
    true;

  console.log(
    `[SERVER] ${signal} received. Starting graceful shutdown...`
  );


  /*
  |--------------------------------------------------------------------------
  | HARD STOP FALLBACK
  |--------------------------------------------------------------------------
  */

  const forceExitTimer =
    setTimeout(
      () => {

        console.error(
          '[SERVER] Graceful shutdown timeout exceeded'
        );

        process.exit(1);

      },
      15_000
    );

  forceExitTimer.unref();


  server.close(
    async () => {

      console.log(
        '[SERVER] HTTP server closed'
      );

      try {

        await pool.end();

        console.log(
          '[SERVER] PostgreSQL pool closed'
        );

        process.exit(0);

      } catch (error) {

        console.error(
          '[SERVER] Shutdown error:',
          error
        );

        process.exit(1);
      }
    }
  );
}


process.on(
  'SIGTERM',
  () =>
    gracefulShutdown(
      'SIGTERM'
    )
);


process.on(
  'SIGINT',
  () =>
    gracefulShutdown(
      'SIGINT'
    )
);


