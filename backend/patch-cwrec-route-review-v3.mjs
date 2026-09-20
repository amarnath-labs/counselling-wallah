import fs from "node:fs";

const path =
  "./src/routes/cwRecV1-dev.js";

let s =
  fs.readFileSync(
    path,
    "utf8"
  );

if (
  s.includes(
    "reviewIntelligenceV3:"
  )
) {
  console.log(
    "reviewIntelligenceV3 already present"
  );

  process.exit(0);
}

const anchor =
`              adaptedInput:
                adapted,


              /* ===========================
                 SCORING
              =========================== */`;

if (
  !s.includes(anchor)
) {
  throw new Error(
    "ADAPTED INPUT ANCHOR NOT FOUND"
  );
}

const replacement =
`              adaptedInput:
                adapted,


              /* ===========================
                 REVIEW INTELLIGENCE V3
              =========================== */

              reviewIntelligenceV3:
                row.reviewIntelligenceV3 ??
                null,


              /* ===========================
                 SCORING
              =========================== */`;

s =
  s.replace(
    anchor,
    replacement
  );

fs.writeFileSync(
  path,
  s,
  "utf8"
);

console.log(
  "SUCCESS: reviewIntelligenceV3 added to CW-REC response"
);
