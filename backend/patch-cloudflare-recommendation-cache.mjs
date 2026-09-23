import fs from "node:fs";

const file =
  "./src/routes/cwRecV1-dev.js";

const backup =
  "./src/routes/cwRecV1-dev.before-cloudflare-cache.js";

let s =
  fs.readFileSync(
    file,
    "utf8"
  );

fs.copyFileSync(
  file,
  backup
);


const marker =
`router.get(
  '/recommendations',
  async (
    req,
    res
  ) => {
    try {`;


if (!s.includes(marker)) {
  throw new Error(
    "recommendations route marker not found"
  );
}


const replacement =
`router.get(
  '/recommendations',
  async (
    req,
    res
  ) => {
    try {

      /*
      |--------------------------------------------------------------------------
      | CLOUDFLARE / CDN CACHE
      |--------------------------------------------------------------------------
      |
      | Public GET endpoint.
      | Full query string remains part of the cache key.
      |
      | Browser: revalidate
      | Edge: 5 minutes
      | Stale: 10 minutes
      |--------------------------------------------------------------------------
      */

      res.set(
        'Cache-Control',
        'public, max-age=0, must-revalidate'
      );

      res.set(
        'CDN-Cache-Control',
        'public, s-maxage=300, stale-while-revalidate=600'
      );

      res.set(
        'Cloudflare-CDN-Cache-Control',
        'public, max-age=300, stale-while-revalidate=600'
      );`;


s =
  s.replace(
    marker,
    replacement
  );


fs.writeFileSync(
  file,
  s,
  "utf8"
);


console.log(
  "Cloudflare recommendation cache headers added."
);
console.log(
  "Admission logic: UNCHANGED"
);
console.log(
  "Ranking logic: UNCHANGED"
);
console.log(
  "Review logic: UNCHANGED"
);
