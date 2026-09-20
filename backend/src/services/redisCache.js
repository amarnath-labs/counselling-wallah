const REDIS_REST_URL =
  String(
    process.env.UPSTASH_REDIS_REST_URL ||
      ''
  )
    .trim()
    .replace(/\/+$/, '');

const REDIS_REST_TOKEN =
  String(
    process.env.UPSTASH_REDIS_REST_TOKEN ||
      ''
  ).trim();

const parsedTimeoutMs =
  Number(
    process.env.REDIS_TIMEOUT_MS ||
      1000
  );

const REDIS_TIMEOUT_MS =
  Number.isFinite(parsedTimeoutMs)
    ? Math.max(
        250,
        Math.floor(parsedTimeoutMs)
      )
    : 1000;


/*
|--------------------------------------------------------------------------
| Redis configuration
|--------------------------------------------------------------------------
*/

function isRedisConfigured() {
  return Boolean(
    REDIS_REST_URL &&
      REDIS_REST_TOKEN
  );
}


/*
|--------------------------------------------------------------------------
| Normalize Redis key
|--------------------------------------------------------------------------
*/

function normalizeKey(key) {
  const normalized =
    String(key || '').trim();

  if (!normalized) {
    return null;
  }

  return normalized;
}


/*
|--------------------------------------------------------------------------
| Normalize TTL
|--------------------------------------------------------------------------
*/

function normalizeTtl(
  ttlSeconds,
  fallback = 60
) {
  const parsed =
    Number(ttlSeconds);

  if (
    !Number.isFinite(parsed) ||
    parsed <= 0
  ) {
    return Math.max(
      1,
      Math.floor(fallback)
    );
  }

  return Math.max(
    1,
    Math.floor(parsed)
  );
}


/*
|--------------------------------------------------------------------------
| Generic Redis command
|--------------------------------------------------------------------------
|
| Uses Upstash Redis REST API.
|
| IMPORTANT:
| This function intentionally fails open.
|
| Redis is treated as:
| - cache
| - rate-limit coordination
| - temporary distributed state
|
| A temporary Redis outage must not crash the API.
|
*/

export async function redisCommand(
  command
) {
  if (!isRedisConfigured()) {
    return null;
  }

  if (
    !Array.isArray(command) ||
    command.length === 0
  ) {
    console.warn(
      '[REDIS] invalid command'
    );

    return null;
  }

  if (
    typeof fetch !== 'function'
  ) {
    console.warn(
      '[REDIS] global fetch is unavailable'
    );

    return null;
  }

  const controller =
    new AbortController();

  const timer =
    setTimeout(
      () => {
        controller.abort();
      },
      REDIS_TIMEOUT_MS
    );

  try {
    const response =
      await fetch(
        REDIS_REST_URL,
        {
          method: 'POST',

          headers: {
            Authorization:
              `Bearer ${REDIS_REST_TOKEN}`,

            'Content-Type':
              'application/json',
          },

          body:
            JSON.stringify(
              command
            ),

          signal:
            controller.signal,
        }
      );

    if (!response.ok) {
      let details = '';

      try {
        details =
          await response.text();
      } catch {
        details = '';
      }

      throw new Error(
        [
          `Redis HTTP ${response.status}`,
          details
            ? `- ${details}`
            : '',
        ]
          .filter(Boolean)
          .join(' ')
      );
    }

    let data;

    try {
      data =
        await response.json();
    } catch {
      throw new Error(
        'Redis returned invalid JSON'
      );
    }

    return (
      data?.result ??
      null
    );
  } catch (error) {
    /*
    |--------------------------------------------------------------------------
    | FAIL OPEN
    |--------------------------------------------------------------------------
    |
    | Redis is not allowed to crash the API.
    |
    */

    const isAbort =
      error?.name ===
      'AbortError';

    console.warn(
      isAbort
        ? `[REDIS] command timed out after ${REDIS_TIMEOUT_MS}ms`
        : '[REDIS] command failed:',
      isAbort
        ? ''
        : (
            error?.message ||
            error
          )
    );

    return null;
  } finally {
    clearTimeout(timer);
  }
}


/*
|--------------------------------------------------------------------------
| GET JSON
|--------------------------------------------------------------------------
*/

export async function redisGetJson(
  key
) {
  const redisKey =
    normalizeKey(key);

  if (!redisKey) {
    return null;
  }

  const value =
    await redisCommand([
      'GET',
      redisKey,
    ]);

  if (
    typeof value !== 'string' ||
    value.length === 0
  ) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    console.warn(
      `[REDIS] invalid JSON for key "${redisKey}":`,
      error?.message ||
        error
    );

    return null;
  }
}


/*
|--------------------------------------------------------------------------
| SET JSON
|--------------------------------------------------------------------------
*/

export async function redisSetJson(
  key,
  value,
  ttlSeconds = 60
) {
  const redisKey =
    normalizeKey(key);

  if (!redisKey) {
    return false;
  }

  let serialized;

  try {
    serialized =
      JSON.stringify(value);
  } catch (error) {
    console.warn(
      `[REDIS] unable to serialize value for key "${redisKey}":`,
      error?.message ||
        error
    );

    return false;
  }

  if (
    typeof serialized !== 'string'
  ) {
    return false;
  }

  const ttl =
    normalizeTtl(
      ttlSeconds,
      60
    );

  const result =
    await redisCommand([
      'SET',
      redisKey,
      serialized,
      'EX',
      ttl,
    ]);

  return result === 'OK';
}


/*
|--------------------------------------------------------------------------
| DELETE KEY
|--------------------------------------------------------------------------
*/

export async function redisDelete(
  key
) {
  const redisKey =
    normalizeKey(key);

  if (!redisKey) {
    return false;
  }

  const result =
    await redisCommand([
      'DEL',
      redisKey,
    ]);

  return (
    Number(result) >= 0
  );
}


/*
|--------------------------------------------------------------------------
| GET RAW VALUE
|--------------------------------------------------------------------------
*/

export async function redisGet(
  key
) {
  const redisKey =
    normalizeKey(key);

  if (!redisKey) {
    return null;
  }

  return redisCommand([
    'GET',
    redisKey,
  ]);
}


/*
|--------------------------------------------------------------------------
| SET RAW VALUE
|--------------------------------------------------------------------------
*/

export async function redisSet(
  key,
  value,
  ttlSeconds = 60
) {
  const redisKey =
    normalizeKey(key);

  if (!redisKey) {
    return false;
  }

  const ttl =
    normalizeTtl(
      ttlSeconds,
      60
    );

  const result =
    await redisCommand([
      'SET',
      redisKey,
      String(value),
      'EX',
      ttl,
    ]);

  return result === 'OK';
}


/*
|--------------------------------------------------------------------------
| INCREMENT
|--------------------------------------------------------------------------
*/

export async function redisIncrement(
  key
) {
  const redisKey =
    normalizeKey(key);

  if (!redisKey) {
    return null;
  }

  const result =
    await redisCommand([
      'INCR',
      redisKey,
    ]);

  const numericResult =
    Number(result);

  return Number.isFinite(
    numericResult
  )
    ? numericResult
    : null;
}


/*
|--------------------------------------------------------------------------
| EXPIRE
|--------------------------------------------------------------------------
*/

export async function redisExpire(
  key,
  ttlSeconds
) {
  const redisKey =
    normalizeKey(key);

  if (!redisKey) {
    return false;
  }

  const ttl =
    normalizeTtl(
      ttlSeconds,
      60
    );

  const result =
    await redisCommand([
      'EXPIRE',
      redisKey,
      ttl,
    ]);

  return (
    Number(result) === 1
  );
}


/*
|--------------------------------------------------------------------------
| Redis enabled
|--------------------------------------------------------------------------
*/

export function redisEnabled() {
  return isRedisConfigured();
}


/*
|--------------------------------------------------------------------------
| Redis diagnostics
|--------------------------------------------------------------------------
*/

export function getRedisStatus() {
  return {
    enabled:
      isRedisConfigured(),

    urlConfigured:
      Boolean(
        REDIS_REST_URL
      ),

    tokenConfigured:
      Boolean(
        REDIS_REST_TOKEN
      ),

    timeoutMs:
      REDIS_TIMEOUT_MS,
  };
}