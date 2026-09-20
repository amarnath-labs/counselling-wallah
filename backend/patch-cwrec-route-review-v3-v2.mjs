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

const regex =
  /(adaptedInput:\s*\r?\n\s*adapted,\s*\r?\n)/;

if (
  !regex.test(s)
) {
  throw new Error(
    "adaptedInput block not found"
  );
}

s =
  s.replace(
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

fs.writeFileSync(
  path,
  s,
  "utf8"
);

console.log(
  "SUCCESS: reviewIntelligenceV3 added to CW-REC response"
);
