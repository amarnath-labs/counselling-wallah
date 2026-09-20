import fs from "node:fs";

const file = "./index.html";

let html =
  fs.readFileSync(
    file,
    "utf8"
  );

const START =
  "<!-- TRUMARG GOOGLE SEARCH SEO START -->";

const END =
  "<!-- TRUMARG GOOGLE SEARCH SEO END -->";

const startIndex =
  html.indexOf(START);

const endIndex =
  html.indexOf(END);

if (
  startIndex === -1 ||
  endIndex === -1
) {
  throw new Error(
    "TRUMARG GOOGLE SEARCH SEO block not found."
  );
}

const blockEnd =
  endIndex +
  END.length;

const seoBlock =
  html.slice(
    startIndex,
    blockEnd
  );

let before =
  html.slice(
    0,
    startIndex
  );

let after =
  html.slice(
    blockEnd
  );


/*
|--------------------------------------------------------------------------
| REMOVE OLD TITLE
|--------------------------------------------------------------------------
*/

before =
  before.replace(
    /<title>[\s\S]*?<\/title>\s*/gi,
    ""
  );


/*
|--------------------------------------------------------------------------
| REMOVE OLD DESCRIPTION
|--------------------------------------------------------------------------
*/

before =
  before.replace(
    /<meta\s+name=["']description["'][^>]*>\s*/gi,
    ""
  );


/*
|--------------------------------------------------------------------------
| REMOVE OLD ROBOTS
|--------------------------------------------------------------------------
*/

before =
  before.replace(
    /<meta\s+name=["']robots["'][^>]*>\s*/gi,
    ""
  );


/*
|--------------------------------------------------------------------------
| REMOVE OLD CANONICAL
|--------------------------------------------------------------------------
*/

before =
  before.replace(
    /<link[^>]+rel=["']canonical["'][^>]*>\s*/gi,
    ""
  );


/*
|--------------------------------------------------------------------------
| REMOVE OLD ICON DECLARATIONS
|--------------------------------------------------------------------------
*/

before =
  before.replace(
    /<link[^>]+rel=["'](?:icon|shortcut\s+icon|apple-touch-icon)["'][^>]*>\s*/gi,
    ""
  );


/*
|--------------------------------------------------------------------------
| REMOVE OLD APPLICATION NAME
|--------------------------------------------------------------------------
*/

before =
  before.replace(
    /<meta\s+name=["']application-name["'][^>]*>\s*/gi,
    ""
  );

before =
  before.replace(
    /<meta\s+name=["']apple-mobile-web-app-title["'][^>]*>\s*/gi,
    ""
  );


/*
|--------------------------------------------------------------------------
| REMOVE OLD OG META
|--------------------------------------------------------------------------
*/

before =
  before.replace(
    /<meta\s+property=["']og:[^"']+["'][^>]*>\s*/gi,
    ""
  );


/*
|--------------------------------------------------------------------------
| REMOVE OLD TWITTER META
|--------------------------------------------------------------------------
*/

before =
  before.replace(
    /<meta\s+name=["']twitter:[^"']+["'][^>]*>\s*/gi,
    ""
  );


/*
|--------------------------------------------------------------------------
| REMOVE OLD ORGANIZATION / WEBSITE JSON-LD
|--------------------------------------------------------------------------
*/

before =
  before.replace(
    /<script\s+type=["']application\/ld\+json["']>\s*\{[\s\S]*?"@type"\s*:\s*"Organization"[\s\S]*?<\/script>\s*/gi,
    ""
  );

before =
  before.replace(
    /<script\s+type=["']application\/ld\+json["']>\s*\{[\s\S]*?"@type"\s*:\s*"WebSite"[\s\S]*?<\/script>\s*/gi,
    ""
  );


/*
|--------------------------------------------------------------------------
| REMOVE OLD EMPTY SEARCH BRAND MARKER
|--------------------------------------------------------------------------
*/

before =
  before.replace(
    /<!--\s*TRUMARG SEARCH BRAND\s*-->\s*/gi,
    ""
  );


/*
|--------------------------------------------------------------------------
| CLEAN ACCIDENTAL EXCESS BLANK LINES
|--------------------------------------------------------------------------
*/

before =
  before.replace(
    /\n{4,}/g,
    "\n\n\n"
  );

after =
  after.replace(
    /\n{4,}/g,
    "\n\n\n"
  );


/*
|--------------------------------------------------------------------------
| REBUILD FILE
|--------------------------------------------------------------------------
*/

html =
  before +
  "\n" +
  seoBlock +
  "\n" +
  after;

fs.writeFileSync(
  file,
  html,
  "utf8"
);

console.log("");
console.log(
  "========================================"
);

console.log(
  "TRUMARG DUPLICATE SEO CLEANUP COMPLETE"
);

console.log(
  "========================================"
);

console.log("");
