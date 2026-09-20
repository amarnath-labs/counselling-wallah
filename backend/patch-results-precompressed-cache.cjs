const fs = require("fs");

const file = "./src/routes/counselling.js";
let s = fs.readFileSync(file, "utf8");

if (s.includes("gzipSync")) {
  console.log("Precompressed results cache already exists.");
  process.exit(0);
}

const importMarker =
  "import { pool } from '../db/pool.js';";

if (!s.includes(importMarker)) {
  throw new Error("Import marker not found");
}

s = s.replace(
  importMarker,
`${importMarker}
import { gzipSync } from 'node:zlib';`
);

const oldRead = `function readResultsCache(key) {
  const entry = resultsCache.get(key);

  if (!entry) return null;

  if (
    Date.now() - entry.createdAt >
    RESULTS_CACHE_TTL_MS
  ) {
    resultsCache.delete(key);
    return null;
  }

  return entry.payload;
}`;

const newRead = `function readResultsCache(key) {
  const entry = resultsCache.get(key);

  if (!entry) return null;

  if (
    Date.now() - entry.createdAt >
    RESULTS_CACHE_TTL_MS
  ) {
    resultsCache.delete(key);
    return null;
  }

  return entry;
}`;

if (!s.includes(oldRead)) {
  throw new Error("readResultsCache block not found");
}

s = s.replace(
  oldRead,
  newRead
);

const oldSet = `  resultsCache.set(key, {
    createdAt: Date.now(),
    payload,
  });
}`;

const newSet = `  const serialized =
    JSON.stringify(payload);

  const gzipped =
    gzipSync(
      serialized,
      {
        level: 1,
      }
    );

  resultsCache.set(key, {
    createdAt:
      Date.now(),

    payload,

    serialized,

    gzipped,
  });
}`;

if (!s.includes(oldSet)) {
  throw new Error("resultsCache.set block not found");
}

s = s.replace(
  oldSet,
  newSet
);

const helperMarker = `}


/*
|--------------------------------------------------------------------------
| HELPERS`;

const sendHelper = `}

function sendCachedResults(
  req,
  res,
  entry
) {
  const acceptEncoding =
    String(
      req.headers[
        'accept-encoding'
      ] || ''
    ).toLowerCase();

  res.type('application/json');

  res.vary(
    'Accept-Encoding'
  );

  if (
    acceptEncoding.includes(
      'gzip'
    )
  ) {
    res.set(
      'Content-Encoding',
      'gzip'
    );

    res.set(
      'Content-Length',
      String(
        entry.gzipped.length
      )
    );

    return res.send(
      entry.gzipped
    );
  }

  res.set(
    'Content-Length',
    String(
      Buffer.byteLength(
        entry.serialized
      )
    )
  );

  return res.send(
    entry.serialized
  );
}


/*
|--------------------------------------------------------------------------
| HELPERS`;

if (!s.includes(helperMarker)) {
  throw new Error("Helper insertion marker not found");
}

s = s.replace(
  helperMarker,
  sendHelper
);

const oldHit = `      const cachedPayload =
        readResultsCache(
          resultsCacheKey
        );

      if (cachedPayload) {
        return res.json(
          cachedPayload
        );
      }`;

const newHit = `      const cachedEntry =
        readResultsCache(
          resultsCacheKey
        );

      if (cachedEntry) {
        return sendCachedResults(
          req,
          res,
          cachedEntry
        );
      }`;

if (!s.includes(oldHit)) {
  throw new Error("Cache-hit block not found");
}

s = s.replace(
  oldHit,
  newHit
);

fs.writeFileSync(
  file,
  s,
  "utf8"
);

console.log(
  "Pre-serialized + pre-gzipped results cache added."
);
