import {
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
          `
            SELECT
              current_database()
                AS database_name,
              NOW()
                AS database_time
          `
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
