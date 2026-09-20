import fs from "node:fs";

const path =
  "./src/routes/cwRecV1-dev.js";

let s =
  fs.readFileSync(
    path,
    "utf8"
  );

/*
|--------------------------------------------------------------------------
| FIND LAST adaptedInput
|--------------------------------------------------------------------------
*/

const lastIndex =
  s.lastIndexOf(
    "adaptedInput:"
  );

if (
  lastIndex === -1
) {
  throw new Error(
    "No adaptedInput block found"
  );
}

const before =
  s.slice(
    0,
    lastIndex
  );

let tail =
  s.slice(
    lastIndex
  );

/*
|--------------------------------------------------------------------------
| DO NOT DUPLICATE
|--------------------------------------------------------------------------
*/

const scoringIndex =
  tail.indexOf(
    "...scoring"
  );

const localBlock =
  scoringIndex >= 0
    ? tail.slice(
        0,
        scoringIndex
      )
    : tail.slice(
        0,
        500
      );

if (
  localBlock.includes(
    "reviewIntelligenceV3:"
  )
) {
  console.log(
    "Recommendation response already contains reviewIntelligenceV3"
  );

  process.exit(0);
}

/*
|--------------------------------------------------------------------------
| PATCH LAST adaptedInput BLOCK
|--------------------------------------------------------------------------
*/

const regex =
  /(adaptedInput:\s*\r?\n\s*adapted,\s*)/;

if (
  !regex.test(tail)
) {
  throw new Error(
    "Last adaptedInput structure not recognized"
  );
}

tail =
  tail.replace(
    regex,
`$1

              /* ===========================
                 REVIEW INTELLIGENCE V3
              =========================== */

              reviewIntelligenceV3:
                row.reviewIntelligenceV3 ??
                null,

`
  );

s =
  before +
  tail;

fs.writeFileSync(
  path,
  s,
  "utf8"
);

console.log(
  "SUCCESS: recommendation response now exposes Review Intelligence V3"
);
