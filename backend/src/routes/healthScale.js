import {
  Router,
} from 'express';

import {
  pool,
  getPoolStats,
} from '../db/pool.js';

import {
  redisCommand,
  redisEnabled,
} from '../services/redisCache.js';


const router =
  Router();


/*
|--------------------------------------------------------------------------
| LIVENESS
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| No database call here.
| Load balancer can call this frequently.
|--------------------------------------------------------------------------
*/

router.get(
  '/live',
  (
    _req,
    res
  ) => {
    return res.json({
      ok:
        true,

      service:
        'trumarg-api',

      status:
        'live',

      uptimeSeconds:
        Math.floor(
          process.uptime()
        ),

      time:
        new Date()
          .toISOString(),
    });
  }
);


/*
|--------------------------------------------------------------------------
| READINESS
|--------------------------------------------------------------------------
|
| PostgreSQL is required.
| Redis is performance/distributed-state infrastructure.
|
| Current TruMarg Redis implementation is fail-open,
| therefore temporary Redis failure does not immediately
| remove the API instance from service.
|--------------------------------------------------------------------------
*/

router.get(
  '/ready',
  async (
    _req,
    res
  ) => {

    const startedAt =
      Date.now();

    try {

      /*
      |--------------------------------------------------------------------------
      | DATABASE
      |--------------------------------------------------------------------------
      */

      await pool.query(
        'SELECT 1 AS ok'
      );


      /*
      |--------------------------------------------------------------------------
      | REDIS
      |--------------------------------------------------------------------------
      */

      let redisStatus =
        'disabled';

      if (
        redisEnabled()
      ) {

        const redisResult =
          await redisCommand([
            'PING',
          ]);

        redisStatus =
          redisResult === 'PONG'
            ? 'ready'
            : 'degraded';
      }


      return res.json({
        ok:
          true,

        status:
          redisStatus ===
          'degraded'
            ? 'degraded'
            : 'ready',

        postgres:
          'ready',

        redis:
          redisStatus,

        pool:
          getPoolStats(),

        durationMs:
          Date.now() -
          startedAt,

        time:
          new Date()
            .toISOString(),
      });

    } catch (error) {

      console.error(
        '[READINESS ERROR]',
        error?.message ||
        error
      );

      return res
        .status(503)
        .json({
          ok:
            false,

          status:
            'not-ready',

          postgres:
            'unavailable',

          pool:
            getPoolStats(),

          durationMs:
            Date.now() -
            startedAt,

          time:
            new Date()
              .toISOString(),
        });
    }
  }
);


/*
|--------------------------------------------------------------------------
| POOL TELEMETRY
|--------------------------------------------------------------------------
*/

router.get(
  '/pool',
  (
    _req,
    res
  ) => {
    return res.json({
      ok:
        true,

      pool:
        getPoolStats(),

      time:
        new Date()
          .toISOString(),
    });
  }
);


export default router;
