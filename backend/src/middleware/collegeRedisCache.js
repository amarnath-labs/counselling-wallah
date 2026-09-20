import {
  redisGetJson,
  redisSetJson,
  redisEnabled,
} from '../services/redisCache.js';


/*
|--------------------------------------------------------------------------
| COLLEGE REDIS CACHE
|--------------------------------------------------------------------------
|
| Supports both:
|
| - normal res.json(...)
| - optimized/pre-serialized res.send(...)
|
|--------------------------------------------------------------------------
*/

const CATALOG_CACHE_KEY =
  'cw:college:catalog:v2';


const DETAIL_CACHE_PREFIX =
  'cw:college:detail:v2:';


const CATALOG_TTL_SECONDS =
  Math.max(
    60,
    Number(
      process.env
        .COLLEGE_CATALOG_CACHE_TTL_SECONDS ||
      900
    )
  );


const DETAIL_TTL_SECONDS =
  Math.max(
    60,
    Number(
      process.env
        .COLLEGE_DETAIL_CACHE_TTL_SECONDS ||
      1800
    )
  );


/*
|--------------------------------------------------------------------------
| QUERY CHECK
|--------------------------------------------------------------------------
*/

function hasQueryParameters(
  req
) {
  return Boolean(
    req.query &&
    Object.keys(
      req.query
    ).length > 0
  );
}


/*
|--------------------------------------------------------------------------
| CACHE CONFIG
|--------------------------------------------------------------------------
*/

function getCacheConfig(
  req
) {

  /*
  |--------------------------------------------------------------------------
  | Full catalog
  |--------------------------------------------------------------------------
  */

  if (
    req.method === 'GET' &&
    req.path === '/' &&
    !hasQueryParameters(req)
  ) {
    return {
      key:
        CATALOG_CACHE_KEY,

      ttl:
        CATALOG_TTL_SECONDS,

      type:
        'catalog',
    };
  }


  /*
  |--------------------------------------------------------------------------
  | College detail
  |--------------------------------------------------------------------------
  */

  if (
    req.method === 'GET' &&
    /^\/[^/]+$/.test(req.path)
  ) {
    const segment =
      req.path
        .slice(1)
        .trim();


    const reserved =
      new Set([
        'search',
        'catalog',
        'states',
        'types',
        'featured',
        'health',
      ]);


    if (
      segment &&
      !reserved.has(
        segment.toLowerCase()
      )
    ) {
      return {
        key:
          DETAIL_CACHE_PREFIX +
          encodeURIComponent(
            segment
          ),

        ttl:
          DETAIL_TTL_SECONDS,

        type:
          'detail',
      };
    }
  }


  return null;
}


/*
|--------------------------------------------------------------------------
| NORMALIZE RESPONSE BODY FOR REDIS
|--------------------------------------------------------------------------
*/

function normalizeResponseBody(
  body
) {

  /*
  |--------------------------------------------------------------------------
  | Object/Array
  |--------------------------------------------------------------------------
  */

  if (
    body !== null &&
    typeof body === 'object' &&
    !Buffer.isBuffer(body)
  ) {
    return body;
  }


  /*
  |--------------------------------------------------------------------------
  | Serialized JSON string
  |--------------------------------------------------------------------------
  */

  if (
    typeof body === 'string'
  ) {
    try {
      return JSON.parse(body);
    } catch {
      return null;
    }
  }


  /*
  |--------------------------------------------------------------------------
  | Buffer
  |--------------------------------------------------------------------------
  |
  | Do NOT try to cache compressed gzip buffers here.
  |
  | The colleges route already has the original serialized path too.
  |
  |--------------------------------------------------------------------------
  */

  if (
    Buffer.isBuffer(body)
  ) {

    /*
    |--------------------------------------------------------------------------
    | Try only if buffer actually contains plain JSON
    |--------------------------------------------------------------------------
    */

    try {
      const text =
        body.toString('utf8');

      if (
        text.startsWith('{') ||
        text.startsWith('[')
      ) {
        return JSON.parse(text);
      }
    } catch {
      return null;
    }
  }


  return null;
}


/*
|--------------------------------------------------------------------------
| CACHE RESPONSE
|--------------------------------------------------------------------------
*/

function writeCacheSafely(
  config,
  body
) {

  const normalized =
    normalizeResponseBody(
      body
    );


  if (
    normalized === null
  ) {
    return;
  }


  void redisSetJson(
    config.key,
    normalized,
    config.ttl
  )
    .then(
      (success) => {

        if (!success) {
          console.warn(
            '[COLLEGE REDIS CACHE] Redis write returned false'
          );
        }
      }
    )
    .catch(
      (error) => {

        console.warn(
          '[COLLEGE REDIS CACHE] write failed:',
          error?.message ||
          error
        );
      }
    );
}


/*
|--------------------------------------------------------------------------
| MIDDLEWARE
|--------------------------------------------------------------------------
*/

export async function collegeRedisCache(
  req,
  res,
  next
) {

  try {

    const config =
      getCacheConfig(
        req
      );


    if (!config) {
      return next();
    }


    /*
    |--------------------------------------------------------------------------
    | Redis unavailable
    |--------------------------------------------------------------------------
    */

    if (!redisEnabled()) {

      res.set(
        'X-CW-Redis-Cache',
        'DISABLED'
      );


      return next();
    }


    /*
    |--------------------------------------------------------------------------
    | REDIS READ
    |--------------------------------------------------------------------------
    */

    const cached =
      await redisGetJson(
        config.key
      );


    if (
      cached !== null
    ) {

      res.set(
        'X-CW-Redis-Cache',
        'HIT'
      );


      res.set(
        'X-CW-Cache-Type',
        config.type
      );


      /*
      |--------------------------------------------------------------------------
      | Allow normal compression middleware to compress Redis hit
      |--------------------------------------------------------------------------
      */

      return res.json(
        cached
      );
    }


    /*
    |--------------------------------------------------------------------------
    | MISS
    |--------------------------------------------------------------------------
    */

    res.set(
      'X-CW-Redis-Cache',
      'MISS'
    );


    res.set(
      'X-CW-Cache-Type',
      config.type
    );


    /*
    |--------------------------------------------------------------------------
    | WRAP res.json
    |--------------------------------------------------------------------------
    */

    const originalJson =
      res.json.bind(
        res
      );


    const originalSend =
      res.send.bind(
        res
      );


    let cacheWriteStarted =
      false;


    res.json =
      function redisCachedJson(
        body
      ) {

        /*
        |--------------------------------------------------------------------------
        | Cache original object
        |--------------------------------------------------------------------------
        */

        if (
          !cacheWriteStarted &&
          res.statusCode >= 200 &&
          res.statusCode < 300
        ) {

          cacheWriteStarted =
            true;


          writeCacheSafely(
            config,
            body
          );
        }


        return originalJson(
          body
        );
      };


    /*
    |--------------------------------------------------------------------------
    | WRAP res.send
    |--------------------------------------------------------------------------
    |
    | Important:
    |
    | Current optimized college catalog route sends:
    |
    | res.send(entry.serialized)
    |
    | or:
    |
    | res.send(entry.gzipped)
    |
    |--------------------------------------------------------------------------
    */

    res.send =
      function redisCachedSend(
        body
      ) {

        if (
          !cacheWriteStarted &&
          res.statusCode >= 200 &&
          res.statusCode < 300
        ) {

          const normalized =
            normalizeResponseBody(
              body
            );


          if (
            normalized !== null
          ) {

            cacheWriteStarted =
              true;


            writeCacheSafely(
              config,
              normalized
            );
          }
        }


        return originalSend(
          body
        );
      };


    return next();

  } catch (error) {

    /*
    |--------------------------------------------------------------------------
    | FAIL OPEN
    |--------------------------------------------------------------------------
    */

    console.warn(
      '[COLLEGE REDIS CACHE] middleware failed:',
      error?.message ||
      error
    );


    return next();
  }
}


export default collegeRedisCache;
