const fs = require("fs");

const file = "./src/routes/colleges.js";
let s = fs.readFileSync(file, "utf8");

if (s.includes("sendCachedCollegeCatalog")) {
  console.log("Precompressed college catalog already exists.");
  process.exit(0);
}

const routerImportRegex =
  /import\s*\{\s*Router\s*\}\s*from\s*['"]express['"];\s*/;

const routerImportMatch =
  s.match(routerImportRegex);

if (!routerImportMatch) {
  throw new Error("Express Router import not found");
}

const importEnd =
  routerImportMatch.index +
  routerImportMatch[0].length;

s =
  s.slice(0, importEnd) +
  "import { gzipSync } from 'node:zlib';\n" +
  s.slice(importEnd);

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
}`
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

const oldInflightBlock = `        const payload =
          await collegesCatalogInFlight;

        return res.json(
          payload
        );`;

const newInflightBlock = `        const cacheEntry =
          await collegesCatalogInFlight;

        return sendCachedCollegeCatalog(
          req,
          res,
          cacheEntry
        );`;

if (!s.includes(oldInflightBlock)) {
  throw new Error("Catalog in-flight block not found");
}

s = s.replace(
  oldInflightBlock,
  newInflightBlock
);

const oldProducerBlock = `        collegesCatalogInFlight =
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

const newProducerBlock = `        collegesCatalogInFlight =
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

if (!s.includes(oldProducerBlock)) {
  throw new Error("Catalog producer block not found");
}

s = s.replace(
  oldProducerBlock,
  newProducerBlock
);

fs.writeFileSync(
  file,
  s,
  "utf8"
);

console.log(
  "Pre-serialized + pre-gzipped college catalog added."
);
