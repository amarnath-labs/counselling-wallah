import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { pool } from './db/pool.js';
import examsRouter from './routes/exams.js';
import collegesRouter from './routes/colleges.js';
import counsellingRouter from './routes/counselling.js';

dotenv.config();

const app = express();

/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
| Vite can run on 5173 or 5174.
|--------------------------------------------------------------------------
*/

const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://localhost:5174',
]);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(
        new Error(
          `CORS blocked origin: ${origin}`
        )
      );
    },
    credentials: true,
  })
);

/*
|--------------------------------------------------------------------------
| JSON
|--------------------------------------------------------------------------
*/

app.use(
  express.json()
);

/*
|--------------------------------------------------------------------------
| HEALTH
|--------------------------------------------------------------------------
*/

app.get(
  '/api/health',
  async (req, res) => {
    try {
      await pool.query(
        'SELECT 1'
      );

      res.json({
        ok: true,
        database: 'postgresql',
        time:
          new Date().toISOString(),
      });
    } catch (error) {
      console.error(
        'HEALTH CHECK ERROR:',
        error
      );

      res.status(500).json({
        ok: false,
        error:
          'Database connection failed',
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| ROUTES
|--------------------------------------------------------------------------
*/

app.use(
  '/api/exams',
  examsRouter
);

app.use(
  '/api/colleges',
  collegesRouter
);

app.use(
  '/api/counselling',
  counsellingRouter
);

/*
|--------------------------------------------------------------------------
| 404
|--------------------------------------------------------------------------
*/

app.use(
  (req, res) => {
    res.status(404).json({
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
  (error, req, res, next) => {
    console.error(
      'API ERROR:',
      error
    );

    if (
      error?.message?.startsWith(
        'CORS blocked origin:'
      )
    ) {
      res.status(403).json({
        error:
          error.message,
      });

      return;
    }

    res.status(
      error?.status || 500
    ).json({
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

const PORT =
  Number(
    process.env.PORT
  ) || 4000;

const server =
  app.listen(
    PORT,
    () => {
      console.log(
        `Counselling Wallah API listening on port ${PORT}`
      );
    }
  );

/*
|--------------------------------------------------------------------------
| SHUTDOWN
|--------------------------------------------------------------------------
*/

const shutdown =
  async () => {
    console.log(
      'Shutting down server...'
    );

    server.close(
      async () => {
        try {
          await pool.end();

          console.log(
            'Database pool closed.'
          );

          process.exit(0);
        } catch (error) {
          console.error(
            'Shutdown error:',
            error
          );

          process.exit(1);
        }
      }
    );
  };

process.on(
  'SIGINT',
  shutdown
);

process.on(
  'SIGTERM',
  shutdown
);