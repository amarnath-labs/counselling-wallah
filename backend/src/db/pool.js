import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

/*
|--------------------------------------------------------------------------
| POSTGRESQL CONNECTION POOL
|--------------------------------------------------------------------------
|
| Capacity-safe defaults.
|
| Environment variables can override these values later on Render without
| another code deployment.
|
*/

function positiveInteger(
  value,
  fallback
) {
  const parsed =
    Number.parseInt(
      String(
        value ?? ""
      ),
      10
    );

  return (
    Number.isInteger(parsed) &&
    parsed > 0
  )
    ? parsed
    : fallback;
}

const DB_POOL_MAX =
  positiveInteger(
    process.env.DB_POOL_MAX,
    10
  );

const DB_POOL_IDLE_TIMEOUT_MS =
  positiveInteger(
    process.env.DB_POOL_IDLE_TIMEOUT_MS,
    30_000
  );

const DB_POOL_CONNECTION_TIMEOUT_MS =
  positiveInteger(
    process.env.DB_POOL_CONNECTION_TIMEOUT_MS,
    10_000
  );

const DB_STATEMENT_TIMEOUT_MS =
  positiveInteger(
    process.env.DB_STATEMENT_TIMEOUT_MS,
    20_000
  );

const DB_QUERY_TIMEOUT_MS =
  positiveInteger(
    process.env.DB_QUERY_TIMEOUT_MS,
    25_000
  );


export const pool =
  new Pool({
    connectionString:
      process.env.DATABASE_URL,

    /*
    |--------------------------------------------------------------------------
    | CONNECTION LIMIT
    |--------------------------------------------------------------------------
    |
    | Do NOT blindly set this to 50 / 100.
    |
    | Every backend instance gets its own pool.
    |
    | Example:
    |
    | 4 Render instances × max 10
    | = up to 40 PostgreSQL connections
    |
    */

    max:
      DB_POOL_MAX,

    /*
    |--------------------------------------------------------------------------
    | CONNECTION LIFECYCLE
    |--------------------------------------------------------------------------
    */

    idleTimeoutMillis:
      DB_POOL_IDLE_TIMEOUT_MS,

    connectionTimeoutMillis:
      DB_POOL_CONNECTION_TIMEOUT_MS,

    /*
    |--------------------------------------------------------------------------
    | QUERY PROTECTION
    |--------------------------------------------------------------------------
    |
    | Prevent pathological SQL from occupying a DB connection indefinitely.
    |
    */

    statement_timeout:
      DB_STATEMENT_TIMEOUT_MS,

    query_timeout:
      DB_QUERY_TIMEOUT_MS,
  });


pool.on(
  "connect",
  (client) => {
    client.on(
      "error",
      (error) => {
        console.error(
          "PostgreSQL client error:",
          error
        );
      }
    );
  }
);


pool.on(
  "error",
  (error) => {
    console.error(
      "Unexpected PostgreSQL pool error:",
      error
    );
  }
);


/*
|--------------------------------------------------------------------------
| POOL TELEMETRY
|--------------------------------------------------------------------------
|
| Can be imported later by a health/admin endpoint.
|
*/

export function getPoolStats() {
  return {
    total:
      pool.totalCount,

    idle:
      pool.idleCount,

    waiting:
      pool.waitingCount,

    max:
      DB_POOL_MAX,
  };
}
