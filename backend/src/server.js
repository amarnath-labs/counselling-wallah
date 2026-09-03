import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { pool } from './db/pool.js';

import authRouter from './routes/auth.js';
import examsRouter from './routes/exams.js';
import collegesRouter from './routes/colleges.js';
import counsellingRouter from './routes/counselling.js';
import cwRecV1DevRouter from './routes/cwRecV1-dev.js';
import paymentsRouter from './routes/payments.js';


const app = express();


/*
|--------------------------------------------------------------------------
| CONFIG
|--------------------------------------------------------------------------
*/

const PORT =
  Number(
    process.env.PORT
  ) || 4000;


const HOST =
  '0.0.0.0';


const FRONTEND_URL =
  String(
    process.env.FRONTEND_URL || ''
  )
    .trim()
    .replace(/\/+$/, '');


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

    'https://counselling-wallah-frontend.vercel.app',

    ...(FRONTEND_URL
      ? [FRONTEND_URL]
      : []),
  ]);


function corsOriginHandler(
  origin,
  callback
) {
  /*
  |--------------------------------------------------------------------------
  | Allow server-to-server / curl / Postman / health checks
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
  | Allow configured frontend origins
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


  console.warn(
    `[CORS] Blocked origin: ${origin}`
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
};


/*
|--------------------------------------------------------------------------
| CORS MIDDLEWARE
|--------------------------------------------------------------------------
*/

app.use(
  cors(
    corsOptions
  )
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
| ROOT
|--------------------------------------------------------------------------
*/

app.get(
  '/',
  (
    req,
    res
  ) => {
    return res.json({
      ok:
        true,

      service:
        'Counselling Wallah API',

      environment:
        process.env.NODE_ENV ||
        'development',

      health:
        '/api/health',
    });
  }
);


/*
|--------------------------------------------------------------------------
| HEALTH CHECK
|--------------------------------------------------------------------------
*/

app.get(
  '/api/health',
  async (
    req,
    res
  ) => {
    try {
      const result =
        await pool.query(`
          SELECT
            current_database() AS database_name,
            NOW() AS database_time
        `);


      return res.json({
        ok:
          true,

        database:
          'postgresql',

        databaseName:
          result.rows?.[0]
            ?.database_name ||
          null,

        time:
          new Date()
            .toISOString(),
      });

    } catch (
      error
    ) {
      console.error(
        'HEALTH CHECK ERROR:',
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
| AUTH ROUTES
|--------------------------------------------------------------------------
|
| POST /api/auth/register
| POST /api/auth/login
| GET  /api/auth/me
| POST /api/auth/logout
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
| CW-REC V1 DEVELOPMENT
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
|
| POST /api/payments/create-order
| GET  /api/payments/status/:orderId
| GET  /api/payments/verify/:orderId
| GET  /api/payments/me/access
|--------------------------------------------------------------------------
*/

app.use(
  '/api/payments',
  paymentsRouter
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
    return res
      .status(404)
      .json({
        error:
          `Route not found: ${req.method} ${req.originalUrl}`,
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
    next
  ) => {
    console.error(
      'API ERROR:',
      error
    );


    /*
    |--------------------------------------------------------------------------
    | CORS ERROR
    |--------------------------------------------------------------------------
    */

    if (
      error?.message
        ?.startsWith(
          'CORS blocked origin:'
        )
    ) {
      return res
        .status(403)
        .json({
          error:
            error.message,
        });
    }


    /*
    |--------------------------------------------------------------------------
    | JSON BODY ERROR
    |--------------------------------------------------------------------------
    */

    if (
      error instanceof SyntaxError &&
      error.status === 400 &&
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
    | ZOD VALIDATION
    |--------------------------------------------------------------------------
    */

    if (
      error?.name ===
      'ZodError'
    ) {
      return res
        .status(400)
        .json({
          error:
            'Invalid request data',

          details:
            error?.issues ||
            [],
        });
    }


    /*
    |--------------------------------------------------------------------------
    | POSTGRES UNIQUE VIOLATION
    |--------------------------------------------------------------------------
    */

    if (
      error?.code ===
      '23505'
    ) {
      return res
        .status(409)
        .json({
          error:
            'Record already exists',
        });
    }


    /*
    |--------------------------------------------------------------------------
    | CUSTOM ERROR STATUS
    |--------------------------------------------------------------------------
    */

    const status =
      Number(
        error?.statusCode ||
        error?.status ||
        500
      );


    return res
      .status(
        Number.isInteger(status) &&
        status >= 400 &&
        status <= 599
          ? status
          : 500
      )
      .json({
        error:
          error?.message ||
          'Internal server error',
      });
  }
);


/*
|--------------------------------------------------------------------------
| SERVER
|--------------------------------------------------------------------------
*/

const server =
  app.listen(
    PORT,
    HOST,
    () => {
      console.log('');
      console.log(
        '========================================'
      );
      console.log(
        'COUNSELLING WALLAH BACKEND'
      );
      console.log(
        '========================================'
      );

      console.log(
        `Environment: ${
          process.env.NODE_ENV ||
          'development'
        }`
      );

      console.log(
        `Server: http://localhost:${PORT}`
      );

      console.log(
        `Health: http://localhost:${PORT}/api/health`
      );

      console.log(
        `Auth: http://localhost:${PORT}/api/auth/me`
      );

      console.log(
        `Payments: http://localhost:${PORT}/api/payments/test`
      );

      console.log(
        `Frontend origin: ${
          FRONTEND_URL ||
          'local development'
        }`
      );

      console.log(
        '========================================'
      );
      console.log('');
    }
  );


/*
|--------------------------------------------------------------------------
| PROCESS ERROR LOGGING
|--------------------------------------------------------------------------
*/

process.on(
  'unhandledRejection',
  (
    reason
  ) => {
    console.error(
      'UNHANDLED REJECTION:',
      reason
    );
  }
);


process.on(
  'uncaughtException',
  (
    error
  ) => {
    console.error(
      'UNCAUGHT EXCEPTION:',
      error
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
  if (
    shuttingDown
  ) {
    return;
  }


  shuttingDown =
    true;


  console.log(
    `${signal} received. Shutting down server...`
  );


  const forceExitTimer =
    setTimeout(
      () => {
        console.error(
          'Forced shutdown after timeout.'
        );

        process.exit(
          1
        );
      },
      10000
    );


  forceExitTimer.unref();


  server.close(
    async () => {
      try {
        await pool.end();


        console.log(
          'Database pool closed.'
        );


        process.exit(
          0
        );

      } catch (
        error
      ) {
        console.error(
          'Shutdown error:',
          error
        );


        process.exit(
          1
        );
      }
    }
  );
}


process.on(
  'SIGINT',
  () => {
    shutdown(
      'SIGINT'
    );
  }
);


process.on(
  'SIGTERM',
  () => {
    shutdown(
      'SIGTERM'
    );
  }
);

