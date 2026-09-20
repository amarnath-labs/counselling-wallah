import {
  redisCommand,
  redisEnabled,
} from './redisCache.js';


/*
|--------------------------------------------------------------------------
| Distributed Redis Rate Limit Store
|--------------------------------------------------------------------------
|
| Normal production architecture:
|
| Backend #1 ─┐
| Backend #2 ─┼── Shared Upstash Redis counter
| Backend #3 ─┘
|
| If Redis becomes temporarily unavailable:
|
| Each backend instance automatically falls back
| to its own local in-memory protection.
|
*/


export class RedisRateLimitStore {
  constructor({
    prefix = 'cw:rate-limit:',
  } = {}) {
    this.prefix =
      prefix;

    this.windowMs =
      15 * 60 * 1000;

    /*
    |--------------------------------------------------------------------------
    | Local fallback
    |--------------------------------------------------------------------------
    */

    this.local =
      new Map();

    /*
    |--------------------------------------------------------------------------
    | express-rate-limit store flag
    |--------------------------------------------------------------------------
    |
    | false because the primary storage is Redis,
    | which is shared between processes / instances.
    |
    */

    this.localKeys =
      false;
  }


  /*
  |--------------------------------------------------------------------------
  | Initialize store
  |--------------------------------------------------------------------------
  |
  | express-rate-limit calls init() with its configuration.
  |
  */

  init(options) {
    if (
      Number.isFinite(
        options?.windowMs
      ) &&
      options.windowMs > 0
    ) {
      this.windowMs =
        options.windowMs;
    }
  }


  /*
  |--------------------------------------------------------------------------
  | Build Redis key
  |--------------------------------------------------------------------------
  */

  buildKey(key) {
    return (
      `${this.prefix}${key}`
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Local fallback increment
  |--------------------------------------------------------------------------
  */

  incrementLocal(key) {
    const now =
      Date.now();

    const existing =
      this.local.get(key);

    if (
      !existing ||
      existing.resetAt <= now
    ) {
      const resetAt =
        now +
        this.windowMs;

      this.local.set(
        key,
        {
          count: 1,
          resetAt,
        }
      );

      return {
        totalHits: 1,

        resetTime:
          new Date(
            resetAt
          ),
      };
    }

    existing.count += 1;

    return {
      totalHits:
        existing.count,

      resetTime:
        new Date(
          existing.resetAt
        ),
    };
  }


  /*
  |--------------------------------------------------------------------------
  | Local fallback decrement
  |--------------------------------------------------------------------------
  */

  decrementLocal(key) {
    const entry =
      this.local.get(key);

    if (!entry) {
      return;
    }

    if (
      entry.resetAt <=
      Date.now()
    ) {
      this.local.delete(
        key
      );

      return;
    }

    if (entry.count > 0) {
      entry.count -= 1;
    }
  }


  /*
  |--------------------------------------------------------------------------
  | Increment
  |--------------------------------------------------------------------------
  |
  | Lua script provides an atomic Redis operation.
  |
  | It:
  |
  | 1. increments the counter
  | 2. attaches expiry on first hit
  | 3. retrieves remaining TTL
  |
  */

  async increment(key) {
    if (!redisEnabled()) {
      return (
        this.incrementLocal(
          key
        )
      );
    }

    const redisKey =
      this.buildKey(key);

    const script = `
      local count = redis.call(
        'INCR',
        KEYS[1]
      )

      if count == 1 then
        redis.call(
          'PEXPIRE',
          KEYS[1],
          ARGV[1]
        )
      end

      local ttl = redis.call(
        'PTTL',
        KEYS[1]
      )

      return {
        count,
        ttl
      }
    `;

    const result =
      await redisCommand([
        'EVAL',
        script,
        '1',
        redisKey,
        String(
          Math.max(
            1,
            Math.floor(
              this.windowMs
            )
          )
        ),
      ]);

    /*
    |--------------------------------------------------------------------------
    | Redis unavailable / unexpected response
    |--------------------------------------------------------------------------
    */

    if (
      !Array.isArray(result) ||
      result.length < 2
    ) {
      return (
        this.incrementLocal(
          key
        )
      );
    }

    const totalHits =
      Number(
        result[0]
      );

    const ttlMs =
      Number(
        result[1]
      );

    if (
      !Number.isFinite(
        totalHits
      ) ||
      totalHits < 1
    ) {
      return (
        this.incrementLocal(
          key
        )
      );
    }

    const safeTtlMs =
      Number.isFinite(
        ttlMs
      ) &&
      ttlMs > 0
        ? ttlMs
        : this.windowMs;

    return {
      totalHits,

      resetTime:
        new Date(
          Date.now() +
            safeTtlMs
        ),
    };
  }


  /*
  |--------------------------------------------------------------------------
  | Decrement
  |--------------------------------------------------------------------------
  |
  | express-rate-limit may use this when skipSuccessfulRequests
  | or similar behaviour is enabled.
  |
  */

  async decrement(key) {
    if (!redisEnabled()) {
      this.decrementLocal(
        key
      );

      return;
    }

    const redisKey =
      this.buildKey(key);

    const script = `
      local value = redis.call(
        'GET',
        KEYS[1]
      )

      if not value then
        return 0
      end

      local count =
        tonumber(value)

      if not count or count <= 0 then
        return 0
      end

      return redis.call(
        'DECR',
        KEYS[1]
      )
    `;

    const result =
      await redisCommand([
        'EVAL',
        script,
        '1',
        redisKey,
      ]);

    /*
    |--------------------------------------------------------------------------
    | Redis failed
    |--------------------------------------------------------------------------
    */

    if (result === null) {
      this.decrementLocal(
        key
      );
    }
  }


  /*
  |--------------------------------------------------------------------------
  | Reset one key
  |--------------------------------------------------------------------------
  */

  async resetKey(key) {
    this.local.delete(
      key
    );

    if (!redisEnabled()) {
      return;
    }

    await redisCommand([
      'DEL',
      this.buildKey(key),
    ]);
  }


  /*
  |--------------------------------------------------------------------------
  | Reset local fallback state
  |--------------------------------------------------------------------------
  |
  | Intentionally does NOT perform Redis SCAN/DELETE.
  |
  */

  async resetAll() {
    this.local.clear();
  }
}


export default RedisRateLimitStore;