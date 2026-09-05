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

const REDIS_TIMEOUT_MS =
  Math.max(
    250,
    Number(
      process.env.REDIS_TIMEOUT_MS ||
      1000
    )
  );

function isRedisConfigured() {
  return Boolean(
    REDIS_REST_URL &&
    REDIS_REST_TOKEN
  );
}

async function redisCommand(
  command
) {
  if (!isRedisConfigured()) {
    return null;
  }

  const controller =
    new AbortController();

  const timer =
    setTimeout(
      () => controller.abort(),
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
      throw new Error(
        `Redis HTTP ${response.status}`
      );
    }

    const data =
      await response.json();

    return data?.result ?? null;

  } catch (error) {
    /*
    |--------------------------------------------------------------------------
    | FAIL OPEN
    |--------------------------------------------------------------------------
    |
    | Redis is a performance layer only.
    | A Redis outage must never take the API down.
    |
    */

    console.warn(
      '[REDIS] command failed:',
      error?.message ||
      error
    );

    return null;

  } finally {
    clearTimeout(timer);
  }
}

export async function redisGetJson(
  key
) {
  const value =
    await redisCommand([
      'GET',
      key,
    ]);

  if (
    typeof value !== 'string' ||
    !value
  ) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export async function redisSetJson(
  key,
  value,
  ttlSeconds
) {
  const serialized =
    JSON.stringify(value);

  const ttl =
    Math.max(
      1,
      Math.floor(
        Number(ttlSeconds) ||
        60
      )
    );

  const result =
    await redisCommand([
      'SET',
      key,
      serialized,
      'EX',
      ttl,
    ]);

  return result === 'OK';
}

export function redisEnabled() {
  return isRedisConfigured();
}
