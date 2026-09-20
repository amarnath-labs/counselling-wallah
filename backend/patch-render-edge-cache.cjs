const fs = require("fs");

const serverFile = "./src/server.js";
const collegesFile = "./src/routes/colleges.js";

let server = fs.readFileSync(serverFile, "utf8");
let colleges = fs.readFileSync(collegesFile, "utf8");

/*
|--------------------------------------------------------------------------
| SERVER: default Render CDN protection
|--------------------------------------------------------------------------
*/

if (!server.includes("CDN-Cache-Control")) {
  const compressionRegex =
    /app\.use\(\s*compression\(\{\s*threshold:\s*1024,\s*\}\)\s*\);/;

  if (!compressionRegex.test(server)) {
    throw new Error("Compression block not found in server.js");
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
|
| Dynamic API responses must never be cached by default.
| Individual public endpoints may explicitly override this header.
|
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
| COLLEGES: only public unfiltered catalog is edge-cacheable
|--------------------------------------------------------------------------
*/

if (!colleges.includes("s-maxage=300")) {
  const catalogMarker = `      const isUnfilteredCatalogRequest =
        !req.query.state &&
        !req.query.type &&
        !req.query.q;`;

  if (!colleges.includes(catalogMarker)) {
    throw new Error(
      "Unfiltered catalog marker not found in colleges.js"
    );
  }

  colleges = colleges.replace(
    catalogMarker,
`${catalogMarker}

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
