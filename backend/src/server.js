import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import examsRouter from './routes/exams.js';
import collegesRouter from './routes/colleges.js';
import counsellingRouter from './routes/counselling.js';
import paymentsRouter from './routes/payments.js';

const app = express();

const PORT = Number(process.env.PORT) || 4000;

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://counselling-wallah-frontend.vercel.app',
  'https://counselling-wallah-frontend-jdw4lkxu2.vercel.app',
];

const configuredOrigin =
  process.env.CORS_ORIGIN?.trim();

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    if (
      allowedOrigins.includes(origin) ||
      origin === configuredOrigin
    ) {
      return callback(null, true);
    }

    console.warn(
      `[CORS] Blocked origin: ${origin}`
    );

    return callback(
      new Error(
        `CORS blocked origin: ${origin}`
      )
    );
  },

  credentials: true,

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

  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

app.use(
  express.json({
    limit: '100kb',
  })
);

app.use(cookieParser());

console.log(
  '[CORS] Production origin: https://counselling-wallah-frontend.vercel.app'
);

console.log(
  `[CORS] Configured origin: ${
    configuredOrigin || 'not set'
  }`
);

console.log(
  `[SERVER] Environment: ${
    process.env.NODE_ENV || 'not set'
  }`
);

console.log(
  `[SERVER] PORT: ${PORT}`
);

app.get('/api', (_req, res) => {
  res.json({
    name: 'Counselling Wallah API',
    phase: 2,
    status: 'development',
  });
});

app.use(
  '/api/health',
  healthRouter
);

app.use(
  '/api/auth',
  authRouter
);

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

app.use(
  '/api/payments',
  paymentsRouter
);

app.use(
  (req, res) => {
    console.warn(
      `[404] ${req.method} ${req.originalUrl}`
    );

    res.status(404).json({
      error: 'Route not found',
      path: req.originalUrl,
      method: req.method,
    });
  }
);

app.use(
  (
    err,
    req,
    res,
    _next
  ) => {
    console.error(
      '========================================'
    );

    console.error('[API ERROR]');
    console.error('Method:', req.method);
    console.error('URL:', req.originalUrl);
    console.error('Message:', err?.message);
    console.error('Name:', err?.name);
    console.error('Stack:', err?.stack);

    if (err?.code) {
      console.error('Code:', err.code);
    }

    if (err?.detail) {
      console.error('Detail:', err.detail);
    }

    if (err?.hint) {
      console.error('Hint:', err.hint);
    }

    console.error(
      '========================================'
    );

    res.status(500).json({
      error: 'Internal server error',
    });
  }
);

app.listen(
  PORT,
  '0.0.0.0',
  () => {
    console.log(
      `Counselling Wallah API listening on 0.0.0.0:${PORT}`
    );
  }
);

