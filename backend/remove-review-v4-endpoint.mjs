import fs from "node:fs";

const file =
  "./src/routes/counselling.js";

let source =
  fs.readFileSync(
    file,
    "utf8"
  );

const marker =
  "TRUMARG REVIEW INTELLIGENCE V4 ENDPOINT";

const markerIndex =
  source.indexOf(
    marker
  );

if (markerIndex === -1) {
  console.log(
    "V4 endpoint already removed."
  );

  process.exit(0);
}

/*
|--------------------------------------------------------------------------
| Find beginning of comment containing V4 marker
|--------------------------------------------------------------------------
*/

const commentStart =
  source.lastIndexOf(
    "/*",
    markerIndex
  );

if (commentStart === -1) {
  throw new Error(
    "Could not find V4 comment start."
  );
}

/*
|--------------------------------------------------------------------------
| Find EXPORT section after V4 endpoint
|--------------------------------------------------------------------------
*/

const exportMarker =
  "| EXPORT";

const exportMarkerIndex =
  source.indexOf(
    exportMarker,
    markerIndex
  );

if (exportMarkerIndex === -1) {
  throw new Error(
    "Could not find EXPORT section after V4 endpoint."
  );
}

const exportCommentStart =
  source.lastIndexOf(
    "/*",
    exportMarkerIndex
  );

if (
  exportCommentStart === -1 ||
  exportCommentStart <= commentStart
) {
  throw new Error(
    "Could not safely locate EXPORT comment."
  );
}

source =
  source.slice(
    0,
    commentStart
  ) +
  source.slice(
    exportCommentStart
  );

fs.writeFileSync(
  file,
  source,
  "utf8"
);

console.log(
  "Review Intelligence V4 endpoint removed cleanly."
);
