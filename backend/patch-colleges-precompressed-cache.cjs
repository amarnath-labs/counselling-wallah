const fs = require("fs");

const file = "./src/routes/colleges.js";
let s = fs.readFileSync(file, "utf8");

if (s.includes("sendCachedCollegeCatalog")) {
  console.log("Precompressed college catalog already added.");
  process.exit(0);
}

const importMarker =
  "import { Router } from 'express';";

if (!s.includes(importMarker)) {
  throw new Error("Router import marker not found");
}

s = s.replace(
  importMarker,
`${importMarker}
import { gzipSync } from 'node:zlib';`
);

const cacheMarker = `let collegesCatalogInFlight = null;`;

if (!s.includes(cacheMarker)) {
  throw new Error("Catalog cache marker not found");
}

const helpers = `${cacheMarker}

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

  res.type(
    'application/json'
  );

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
}`;

s = s.replace(
  cacheMarker,
  helpers
);

const oldCacheHit = `        return res.json(
          collegesCatalogCache.payload
        );`;

const newCacheHit = `        return sendCachedCollegeCatalog(
          req,
          res,
          collegesCatalogCache
        );`;

if (!s.includes(oldCacheHit)) {
  throw new Error("Catalog cache-hit block not found");
}

s = s.replace(
  oldCacheHit,
  newCacheHit
);

const oldInflight = `        const payload =
          await collegesCatalogInFlight;

        return res.json(
          payload
        );`;

const newInflight = `        const cacheEntry =
          await collegesCatalogInFlight;

        return sendCachedCollegeCatalog(
          req,
          res,
          cacheEntry
        );`;

if (!s.includes(oldInflight)) {
  throw new Error("Catalog in-flight block not found");
}

s = s.replace(
  oldInflight,
  newInflight
);

const oldProducer = `        collegesCatalogInFlight =
          executeCollegeQuery();

        try {

          const payload =
            await collegesCatalogInFlight;

          collegesCatalogCache = {
            payload,

            expiresAt:
              Date.now() +
              COLLEGES_CATALOG_CACHE_TTL_MS,
          };

          return res.json(
            payload
          );`;

const newProducer = `        collegesCatalogInFlight =
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
          );`;

if (!s.includes(oldProducer)) {
  throw new Error("Catalog producer block not found");
}

s = s.replace(
  oldProducer,
  newProducer
);

fs.writeFileSync(
  file,
  s,
  "utf8"
);

console.log(
  "Pre-serialized + pre-gzipped college catalog added."
);
