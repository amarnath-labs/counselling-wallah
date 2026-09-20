const fs = require("fs");

const file = "./src/routes/colleges.js";
let s = fs.readFileSync(file, "utf8");

if (s.includes("sendCachedCollegeCatalog")) {
  console.log("Precompressed college catalog already exists.");
  process.exit(0);
}

/*
|--------------------------------------------------------------------------
| 1. Add gzip import
|--------------------------------------------------------------------------
*/

const importRegex =
  /(import\s*\{\s*Router\s*\}\s*from\s*['"]express['"];\r?\n)/;

if (!importRegex.test(s)) {
  throw new Error("Express Router import not found");
}

s = s.replace(
  importRegex,
  `$1import { gzipSync } from 'node:zlib';\n`
);

/*
|--------------------------------------------------------------------------
| 2. Add cache helpers
|--------------------------------------------------------------------------
*/

const cacheMarker =
  "let collegesCatalogInFlight = null;";

if (!s.includes(cacheMarker)) {
  throw new Error("Catalog cache marker not found");
}

s = s.replace(
  cacheMarker,
`${cacheMarker}

function buildCollegeCatalogCacheEntry(
  payload
) {
  const serialized =
    JSON.stringify(payload);

  const gzipped =
    gzipSync(
      serialized,
      {
        level: 1,
      }
    );

  return {
    payload,
    serialized,
    gzipped,

    expiresAt:
      Date.now() +
      COLLEGES_CATALOG_CACHE_TTL_MS,
  };
}

function sendCachedCollegeCatalog(
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
}`
);

/*
|--------------------------------------------------------------------------
| 3. Replace warm cache hit
|--------------------------------------------------------------------------
*/

const cacheHitRegex =
  /return\s+res\.json\(\s*collegesCatalogCache\.payload\s*\);/;

if (!cacheHitRegex.test(s)) {
  throw new Error("Catalog cache-hit block not found");
}

s = s.replace(
  cacheHitRegex,
`return sendCachedCollegeCatalog(
          req,
          res,
          collegesCatalogCache
        );`
);

/*
|--------------------------------------------------------------------------
| 4. Replace in-flight waiter
|--------------------------------------------------------------------------
*/

const inflightRegex =
  /const\s+payload\s*=\s*await\s+collegesCatalogInFlight;\s*return\s+res\.json\(\s*payload\s*\);/;

if (!inflightRegex.test(s)) {
  throw new Error("Catalog in-flight block not found");
}

s = s.replace(
  inflightRegex,
`const cacheEntry =
          await collegesCatalogInFlight;

        return sendCachedCollegeCatalog(
          req,
          res,
          cacheEntry
        );`
);

/*
|--------------------------------------------------------------------------
| 5. Replace cache producer
|--------------------------------------------------------------------------
*/

const producerRegex =
  /collegesCatalogInFlight\s*=\s*executeCollegeQuery\(\);\s*try\s*\{\s*const\s+payload\s*=\s*await\s+collegesCatalogInFlight;\s*collegesCatalogCache\s*=\s*\{\s*payload,\s*expiresAt:\s*Date\.now\(\)\s*\+\s*COLLEGES_CATALOG_CACHE_TTL_MS,\s*\};\s*return\s+res\.json\(\s*payload\s*\);/;

if (!producerRegex.test(s)) {
  throw new Error("Catalog producer block not found");
}

s = s.replace(
  producerRegex,
`collegesCatalogInFlight =
          (async () => {
            const payload =
              await executeCollegeQuery();

            const cacheEntry =
              buildCollegeCatalogCacheEntry(
                payload
              );

            collegesCatalogCache =
              cacheEntry;

            return cacheEntry;
          })();

        try {

          const cacheEntry =
            await collegesCatalogInFlight;

          return sendCachedCollegeCatalog(
            req,
            res,
            cacheEntry
          );`
);

/*
|--------------------------------------------------------------------------
| WRITE ONLY AFTER ALL CHECKS PASSED
|--------------------------------------------------------------------------
*/

fs.writeFileSync(
  file,
  s,
  "utf8"
);

console.log(
  "Pre-serialized + pre-gzipped college catalog added."
);
