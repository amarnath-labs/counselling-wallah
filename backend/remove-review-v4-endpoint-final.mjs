import fs from "node:fs";

const file =
  "./src/routes/counselling.js";

let source =
  fs.readFileSync(
    file,
    "utf8"
  );

const title =
  "TRUMARG REVIEW INTELLIGENCE V4 ENDPOINT";

const titleIndex =
  source.indexOf(
    title
  );

if (titleIndex === -1) {
  console.log(
    "V4 endpoint title not found. Nothing to remove."
  );

  process.exit(0);
}


/*
|--------------------------------------------------------------------------
| Find beginning of comment block containing V4 endpoint
|--------------------------------------------------------------------------
*/

const blockStart =
  source.lastIndexOf(
    "/*",
    titleIndex
  );

if (blockStart === -1) {
  throw new Error(
    "Could not find start of V4 comment block."
  );
}


/*
|--------------------------------------------------------------------------
| Find router export after V4 endpoint
|--------------------------------------------------------------------------
*/

const exportMarker =
  "export default router;";

const exportIndex =
  source.indexOf(
    exportMarker,
    titleIndex
  );

if (exportIndex === -1) {
  throw new Error(
    "Could not find export default router after V4 endpoint."
  );
}


/*
|--------------------------------------------------------------------------
| Remove complete V4 endpoint but KEEP export default router
|--------------------------------------------------------------------------
*/

source =
  source.slice(
    0,
    blockStart
  ).trimEnd() +
  "\n\n\n" +
  source.slice(
    exportIndex
  );


fs.writeFileSync(
  file,
  source,
  "utf8"
);

console.log(
  "Review Intelligence V4 endpoint removed cleanly."
);
