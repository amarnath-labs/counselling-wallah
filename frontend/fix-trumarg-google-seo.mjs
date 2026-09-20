import fs from "node:fs";
import path from "node:path";

console.log("");
console.log("========================================");
console.log("TRUMARG SEARCH / GOOGLE SEO FIX");
console.log("========================================");
console.log("");

const ROOT = process.cwd();

const indexFile = path.join(ROOT, "index.html");
const publicDir = path.join(ROOT, "public");
const robotsFile = path.join(publicDir, "robots.txt");
const sitemapFile = path.join(publicDir, "sitemap.xml");

if (!fs.existsSync(indexFile)) {
  throw new Error(
    "frontend/index.html not found. Run this script inside frontend folder."
  );
}

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, {
    recursive: true,
  });
}


/*
|--------------------------------------------------------------------------
| 1. FIX index.html
|--------------------------------------------------------------------------
*/

let html = fs.readFileSync(
  indexFile,
  "utf8"
);


/*
|--------------------------------------------------------------------------
| Remove OLD favicon declarations
|--------------------------------------------------------------------------
*/

html = html.replace(
  /<link[^>]+rel=["'](?:shortcut\s+icon|icon)["'][^>]*>\s*/gi,
  ""
);

html = html.replace(
  /<link[^>]+rel=["']apple-touch-icon["'][^>]*>\s*/gi,
  ""
);


/*
|--------------------------------------------------------------------------
| Remove OLD canonical
|--------------------------------------------------------------------------
*/

html = html.replace(
  /<link[^>]+rel=["']canonical["'][^>]*>\s*/gi,
  ""
);


/*
|--------------------------------------------------------------------------
| Remove OLD homepage title
|--------------------------------------------------------------------------
*/

html = html.replace(
  /<title>[\s\S]*?<\/title>/i,
  ""
);


/*
|--------------------------------------------------------------------------
| Remove existing description
|--------------------------------------------------------------------------
*/

html = html.replace(
  /<meta\s+name=["']description["'][^>]*>\s*/gi,
  ""
);


/*
|--------------------------------------------------------------------------
| Remove existing application-name
|--------------------------------------------------------------------------
*/

html = html.replace(
  /<meta\s+name=["']application-name["'][^>]*>\s*/gi,
  ""
);

html = html.replace(
  /<meta\s+name=["']apple-mobile-web-app-title["'][^>]*>\s*/gi,
  ""
);


/*
|--------------------------------------------------------------------------
| Remove previous TRUMARG SEO marker block if present
|--------------------------------------------------------------------------
*/

html = html.replace(
  /<!-- TRUMARG GOOGLE SEARCH SEO START -->[\s\S]*?<!-- TRUMARG GOOGLE SEARCH SEO END -->\s*/gi,
  ""
);


/*
|--------------------------------------------------------------------------
| Add clean production SEO block
|--------------------------------------------------------------------------
*/

const seoBlock = `
  <!-- TRUMARG GOOGLE SEARCH SEO START -->

  <title>College Predictor, Counselling & Career Guidance | TruMarg</title>

  <meta
    name="description"
    content="TruMarg helps students predict colleges using rank, category, quota, home state and historical cutoffs. Explore JEE Main, JEE Advanced, UPTAC counselling and personalized college recommendations."
  />

  <meta
    name="application-name"
    content="TruMarg"
  />

  <meta
    name="apple-mobile-web-app-title"
    content="TruMarg"
  />

  <meta
    name="robots"
    content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
  />

  <link
    rel="canonical"
    href="https://www.trumarg.com/"
  />

  <link
    rel="icon"
    type="image/png"
    sizes="48x48"
    href="/favicon-48x48.png"
  />

  <link
    rel="icon"
    type="image/png"
    sizes="96x96"
    href="/favicon-96x96.png"
  />

  <link
    rel="icon"
    type="image/png"
    sizes="192x192"
    href="/favicon-192x192.png"
  />

  <link
    rel="apple-touch-icon"
    sizes="192x192"
    href="/favicon-192x192.png"
  />

  <meta
    property="og:site_name"
    content="TruMarg"
  />

  <meta
    property="og:title"
    content="College Predictor, Counselling & Career Guidance | TruMarg"
  />

  <meta
    property="og:description"
    content="Predict colleges using rank, category, quota, home state and historical cutoffs with TruMarg."
  />

  <meta
    property="og:url"
    content="https://www.trumarg.com/"
  />

  <meta
    property="og:type"
    content="website"
  />

  <meta
    property="og:image"
    content="https://www.trumarg.com/trumarg-logo.png"
  />

  <meta
    name="twitter:card"
    content="summary_large_image"
  />

  <meta
    name="twitter:title"
    content="TruMarg - College Predictor & Career Guidance"
  />

  <meta
    name="twitter:description"
    content="College prediction, counselling guidance and personalized career recommendations."
  />

  <meta
    name="twitter:image"
    content="https://www.trumarg.com/trumarg-logo.png"
  />

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://www.trumarg.com/#organization",
    "name": "TruMarg",
    "url": "https://www.trumarg.com/",
    "logo": {
      "@type": "ImageObject",
      "url": "https://www.trumarg.com/trumarg-logo.png"
    }
  }
  </script>

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": "https://www.trumarg.com/#website",
    "name": "TruMarg",
    "alternateName": [
      "TruMarg College Predictor",
      "TruMarg Career Guidance"
    ],
    "url": "https://www.trumarg.com/",
    "publisher": {
      "@id": "https://www.trumarg.com/#organization"
    }
  }
  </script>

  <!-- TRUMARG GOOGLE SEARCH SEO END -->

`;

const headClose =
  html.toLowerCase().indexOf(
    "</head>"
  );

if (headClose === -1) {
  throw new Error(
    "</head> not found in index.html"
  );
}

html =
  html.slice(
    0,
    headClose
  ) +
  seoBlock +
  html.slice(
    headClose
  );

fs.writeFileSync(
  indexFile,
  html,
  "utf8"
);

console.log(
  "OK: index.html SEO fixed"
);


/*
|--------------------------------------------------------------------------
| 2. robots.txt
|--------------------------------------------------------------------------
*/

const robots = `User-agent: *
Allow: /

User-agent: Googlebot
Allow: /

User-agent: Googlebot-Image
Allow: /

Sitemap: https://www.trumarg.com/sitemap.xml
`;

fs.writeFileSync(
  robotsFile,
  robots,
  "ascii"
);

console.log(
  "OK: robots.txt fixed"
);


/*
|--------------------------------------------------------------------------
| 3. sitemap.xml
|--------------------------------------------------------------------------
*/

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
>
  <url>
    <loc>https://www.trumarg.com/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>

  <url>
    <loc>https://www.trumarg.com/college-predictor</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>

  <url>
    <loc>https://www.trumarg.com/jee-main-college-predictor</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>

  <url>
    <loc>https://www.trumarg.com/uptac-college-predictor</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>
`;

fs.writeFileSync(
  sitemapFile,
  sitemap,
  "utf8"
);

console.log(
  "OK: sitemap.xml fixed"
);


/*
|--------------------------------------------------------------------------
| 4. Patch RouteSEO.jsx if it exists
|--------------------------------------------------------------------------
*/

const routeSeoFile =
  path.join(
    ROOT,
    "src",
    "components",
    "RouteSEO.jsx"
  );

if (
  fs.existsSync(
    routeSeoFile
  )
) {
  let source =
    fs.readFileSync(
      routeSeoFile,
      "utf8"
    );

  source =
    source.replaceAll(
      "College Predictor 2026 - JEE Main & UPTAC | TruMarg",
      "College Predictor 2026 - JEE Main, JEE Advanced & UPTAC | TruMarg"
    );

  source =
    source.replaceAll(
      "https://counselling-wallah-frontend.vercel.app",
      "https://www.trumarg.com"
    );

  fs.writeFileSync(
    routeSeoFile,
    source,
    "utf8"
  );

  console.log(
    "OK: RouteSEO.jsx patched"
  );
}


/*
|--------------------------------------------------------------------------
| 5. Patch SEO generator if it exists
|--------------------------------------------------------------------------
*/

const seoGenerator =
  path.join(
    ROOT,
    "scripts",
    "generate-seo-pages.mjs"
  );

if (
  fs.existsSync(
    seoGenerator
  )
) {
  let source =
    fs.readFileSync(
      seoGenerator,
      "utf8"
    );

  source =
    source.replaceAll(
      "College Predictor 2026 - JEE Main & UPTAC | TruMarg",
      "College Predictor 2026 - JEE Main, JEE Advanced & UPTAC | TruMarg"
    );

  source =
    source.replaceAll(
      "https://counselling-wallah-frontend.vercel.app",
      "https://www.trumarg.com"
    );

  fs.writeFileSync(
    seoGenerator,
    source,
    "utf8"
  );

  console.log(
    "OK: SEO generator patched"
  );
}


/*
|--------------------------------------------------------------------------
| 6. Replace old production hostname references in SAFE SEO files
|--------------------------------------------------------------------------
*/

const seoFiles = [
  indexFile,
  routeSeoFile,
  seoGenerator,
  robotsFile,
  sitemapFile,
];

for (
  const file of seoFiles
) {
  if (
    !fs.existsSync(file)
  ) {
    continue;
  }

  let source =
    fs.readFileSync(
      file,
      "utf8"
    );

  source =
    source.replaceAll(
      "https://counselling-wallah-frontend.vercel.app",
      "https://www.trumarg.com"
    );

  source =
    source.replaceAll(
      "http://counselling-wallah-frontend.vercel.app",
      "https://www.trumarg.com"
    );

  fs.writeFileSync(
    file,
    source,
    "utf8"
  );
}

console.log(
  "OK: old Vercel canonical references cleaned"
);


console.log("");
console.log("========================================");
console.log("SEO PATCH COMPLETE");
console.log("========================================");
console.log("");
