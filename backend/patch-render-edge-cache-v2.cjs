const fs = require("fs");

const serverFile = "./src/server.js";
const collegesFile = "./src/routes/colleges.js";

let server = fs.readFileSync(serverFile, "utf8");
let colleges = fs.readFileSync(collegesFile, "utf8");

/*
|--------------------------------------------------------------------------
| 1. SERVER DEFAULT: no edge cache for dynamic APIs
|--------------------------------------------------------------------------
*/

if (!server.includes("RENDER EDGE CACHE SAFETY")) {
  const compressionRegex =
    /app\.use\(\s*compression\(\{\s*threshold:\s*1024,\s*\}\)\s*\);/;

  if (!compressionRegex.test(server)) {
    throw new Error("Compression block not found");
  }

  server = server.replace(
    compressionRegex,
`app.use(
  compression({
    threshold: 1024,
  })
);

/*
|--------------------------------------------------------------------------
| RENDER EDGE CACHE SAFETY
|--------------------------------------------------------------------------
*/

app.use((req, res, next) => {
  res.set(
    'CDN-Cache-Control',
    'no-store'
  );

  next();
});`
  );
}

/*
|--------------------------------------------------------------------------
| 2. COLLEGES: only unfiltered catalog edge-cacheable
|--------------------------------------------------------------------------
*/

if (!colleges.includes("s-maxage=300")) {
  const catalogRegex =
    /(const\s+isUnfilteredCatalogRequest\s*=\s*!req\.query\.state\s*&&\s*!req\.query\.type\s*&&\s*!req\.query\.q\s*;)/;

  if (!catalogRegex.test(colleges)) {
    throw new Error("Unfiltered catalog condition not found");
  }

  colleges = colleges.replace(
    catalogRegex,
`$1

      if (
        isUnfilteredCatalogRequest
      ) {
        res.set(
          'CDN-Cache-Control',
          'public, s-maxage=300, stale-while-revalidate=60'
        );
      }`
  );
}

/*
|--------------------------------------------------------------------------
| WRITE ONLY AFTER ALL CHECKS PASSED
|--------------------------------------------------------------------------
*/

fs.writeFileSync(
  serverFile,
  server,
  "utf8"
);

fs.writeFileSync(
  collegesFile,
  colleges,
  "utf8"
);

console.log(
  "Render edge caching configured safely."
);
