import fs from "node:fs";

const path =
  "./src/routes/cwRecV1-dev.js";

let s =
  fs.readFileSync(
    path,
    "utf8"
  );

const marker =
  "/* ===========================\n                 DEBUG / INPUT\n              =========================== */";

const markerIndex =
  s.lastIndexOf(marker);

if (markerIndex === -1) {
  throw new Error(
    "RECOMMENDATION DEBUG/INPUT BLOCK NOT FOUND"
  );
}

const tail =
  s.slice(markerIndex);

if (
  tail.includes(
    "reviewIntelligenceV3:"
  )
) {
  console.log(
    "Recommendation response already has reviewIntelligenceV3"
  );

  process.exit(0);
}

const regex =
  /(adaptedInput:\s*\r?\n\s*adapted,\s*\r?\n)/;

if (
  !regex.test(tail)
) {
  throw new Error(
    "Recommendation adaptedInput block not found"
  );
}

const patchedTail =
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
  s.slice(
    0,
    markerIndex
  ) +
  patchedTail;

fs.writeFileSync(
  path,
  s,
  "utf8"
);

console.log(
  "SUCCESS: V3 added to recommendation response"
);
