import fs from "node:fs";

const file =
  "./backend/src/services/collegeDataResolver.js";

let src =
  fs.readFileSync(file, "utf8");

if (
  src.includes(
    "COLLEGE_DETAIL_CACHE_TTL_MS"
  )
) {
  console.log(
    "Capacity cache already present — no changes made."
  );
  process.exit(0);
}

const target =
  "export async function resolveCollegeData(";

if (!src.includes(target)) {
  throw new Error(
    "resolveCollegeData export not found. File left unchanged."
  );
}

/*
|--------------------------------------------------------------------------
| Preserve original resolver exactly
|--------------------------------------------------------------------------
|
| Only rename the existing exported function.
| Its database/business logic is not modified.
|
*/

src = src.replace(
  target,
  "async function resolveCollegeDataUncached("
);

const cacheLayer = `

/*
|--------------------------------------------------------------------------
| COLLEGE DETAIL CAPACITY CACHE
|--------------------------------------------------------------------------
|
| Performance layer only.
|
| Does NOT change:
| - college identity rules
| - branch data
| - fees
| - cutoffs
| - quality
| - reviews
| - response shape
|
| Benefits:
| - repeated college detail requests avoid DB work
| - simultaneous requests for the same college share one DB request
| - bounded cache prevents unlimited memory growth
|
*/

const COLLEGE_DETAIL_CACHE_TTL_MS =
  Math.max(
    30_000,
    Number(
      process.env.COLLEGE_DETAIL_CACHE_TTL_MS ??
      5 * 60 * 1000
    )
  );

const COLLEGE_DETAIL_CACHE_MAX_ENTRIES =
  Math.max(
    50,
    Number(
      process.env.COLLEGE_DETAIL_CACHE_MAX_ENTRIES ??
      500
    )
  );

const collegeDetailCache =
  new Map();

const collegeDetailInFlight =
  new Map();


function normalizeCacheKey(
  requestedCollegeId
) {
  return String(
    requestedCollegeId ?? ""
  ).trim();
}


function pruneCollegeDetailCache() {
  const now =
    Date.now();

  /*
  |--------------------------------------------------------------------------
  | Remove expired entries first
  |--------------------------------------------------------------------------
  */

  for (
    const [
      key,
      entry
    ] of collegeDetailCache
  ) {
    if (
      !entry ||
      entry.expiresAt <= now
    ) {
      collegeDetailCache.delete(
        key
      );
    }
  }


  /*
  |--------------------------------------------------------------------------
  | Enforce bounded cache
  |--------------------------------------------------------------------------
  |
  | Map insertion order gives us a simple LRU-style eviction policy.
  |
  */

  while (
    collegeDetailCache.size >
    COLLEGE_DETAIL_CACHE_MAX_ENTRIES
  ) {
    const oldestKey =
      collegeDetailCache
        .keys()
        .next()
        .value;

    if (
      oldestKey === undefined
    ) {
      break;
    }

    collegeDetailCache.delete(
      oldestKey
    );
  }
}


function getCachedCollegeDetail(
  key
) {
  const entry =
    collegeDetailCache.get(
      key
    );

  if (!entry) {
    return null;
  }

  if (
    entry.expiresAt <= Date.now()
  ) {
    collegeDetailCache.delete(
      key
    );

    return null;
  }

  /*
  |--------------------------------------------------------------------------
  | Refresh insertion position
  |--------------------------------------------------------------------------
  |
  | Makes Map behave like a lightweight LRU cache.
  |
  */

  collegeDetailCache.delete(
    key
  );

  collegeDetailCache.set(
    key,
    entry
  );

  return entry.value;
}


function setCachedCollegeDetail(
  key,
  value
) {
  collegeDetailCache.delete(
    key
  );

  collegeDetailCache.set(
    key,
    {
      value,

      expiresAt:
        Date.now() +
        COLLEGE_DETAIL_CACHE_TTL_MS,
    }
  );

  pruneCollegeDetailCache();
}


/*
|--------------------------------------------------------------------------
| Manual invalidation
|--------------------------------------------------------------------------
|
| Useful later from admin/import/update paths.
|
*/

export function clearCollegeDataCache(
  requestedCollegeId = null
) {
  if (
    requestedCollegeId == null
  ) {
    collegeDetailCache.clear();
    return;
  }

  const key =
    normalizeCacheKey(
      requestedCollegeId
    );

  collegeDetailCache.delete(
    key
  );
}


/*
|--------------------------------------------------------------------------
| PUBLIC RESOLVER
|--------------------------------------------------------------------------
*/

export async function resolveCollegeData(
  requestedCollegeId
) {
  const key =
    normalizeCacheKey(
      requestedCollegeId
    );

  if (!key) {
    return null;
  }


  /*
  |--------------------------------------------------------------------------
  | CACHE HIT
  |--------------------------------------------------------------------------
  */

  const cached =
    getCachedCollegeDetail(
      key
    );

  if (cached !== null) {
    return cached;
  }


  /*
  |--------------------------------------------------------------------------
  | REQUEST COALESCING
  |--------------------------------------------------------------------------
  |
  | Example:
  |
  | 100 students open IIT Delhi simultaneously.
  |
  | Before:
  | 100 resolver executions
  |
  | Now:
  | 1 resolver execution
  | 99 requests await the same Promise
  |
  */

  const existingRequest =
    collegeDetailInFlight.get(
      key
    );

  if (existingRequest) {
    return existingRequest;
  }


  const request =
    resolveCollegeDataUncached(
      key
    )
      .then(
        (resolved) => {
          /*
          |--------------------------------------------------------------------------
          | Cache successful records only
          |--------------------------------------------------------------------------
          */

          if (
            resolved !== null &&
            resolved !== undefined
          ) {
            setCachedCollegeDetail(
              key,
              resolved
            );
          }

          return resolved;
        }
      )
      .finally(
        () => {
          collegeDetailInFlight.delete(
            key
          );
        }
      );


  collegeDetailInFlight.set(
    key,
    request
  );


  return request;
}
`;

src =
  src.trimEnd() +
  cacheLayer +
  "\n";

fs.writeFileSync(
  file,
  src,
  "utf8"
);

console.log(
  "✅ collegeDataResolver capacity cache installed"
);
