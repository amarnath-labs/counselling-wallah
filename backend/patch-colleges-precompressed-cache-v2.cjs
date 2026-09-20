const fs = require("fs");

const file = "./src/routes/colleges.js";
let s = fs.readFileSync(file, "utf8");

if (s.includes("sendCachedCollegeCatalog")) {
  console.log("Precompressed college catalog already exists.");
  process.exit(0);
}

const importMatch =
  s.match(
    /import\s*\{\s*Router\s*\}\s*from\s*['"]express['"];\s*/
  );

if (!importMatch) {
  throw new Error("Express Router import not found");
}

const importEnd =
  importMatch.index +
  importMatch[0].length;

s =
  s.slice(0, importEnd) +
  "import { gzipSync } from 'node:zlib';\n" +
  s.slice(importEnd);

const cacheMarker =
  "let collegesCatalogInFlight = null;";

const cacheIndex =
  s.indexOf(cacheMarker);

if (cacheIndex === -1) {
  throw new Error("Catalog cache marker not found");
}

const helperInsertPos =
  cacheIndex +
  cacheMarker.length;

const helpers = `

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
}
`;

s =
  s.slice(0, helperInsertPos) +
  helpers +
  s.slice(helperInsertPos);

const oldCacheHitRe =
  /return\s+res\.json\(\s*collegesCatalogCache\.payload\s*\);/;

if (!oldCacheHitRe.test(s)) {
  throw new Error("Catalog cache-hit response not found");
}

s = s.replace(
  oldCacheHitRe,
`return sendCachedCollegeCatalog(
          req,
          res,
          collegesCatalogCache
        );`
);

const oldInflightRe =
  /const\s+payload\s*=\s*await\s+collegesCatalogInFlight;\s*return\s+res\.json\(\s*payload\s*\);/;

if (!oldInflightRe.test(s)) {
  throw new Error("Catalog in-flight response not found");
}

s = s.replace(
  oldInflightRe,
`const cacheEntry =
          await collegesCatalogInFlight;

        return sendCachedCollegeCatalog(
          req,
          res,
          cacheEntry
        );`
);

const producerStartNeedle =
  "collegesCatalogInFlight =";

const producerStart =
  s.indexOf(
    producerStartNeedle,
    s.indexOf(
      "if (\n        isUnfilteredCatalogRequest"
    )
  );

if (producerStart === -1) {
  throw new Error("Catalog producer start not found");
}

const producerEndNeedle =
  "return res.json(\n            payload\n          );";

const producerEndStart =
  s.indexOf(
    producerEndNeedle,
    producerStart
  );

if (producerEndStart === -1) {
  throw new Error("Catalog producer response not found");
}

const producerEnd =
  producerEndStart +
  producerEndNeedle.length;

const newProducer = `collegesCatalogInFlight =
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

s =
  s.slice(0, producerStart) +
  newProducer +
  s.slice(producerEnd);

fs.writeFileSync(
  file,
  s,
  "utf8"
);

console.log(
  "Pre-serialized + pre-gzipped college catalog added."
);
