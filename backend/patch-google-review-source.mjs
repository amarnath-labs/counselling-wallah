import fs from "node:fs";

const file =
  "./src/services/reviewEnrichment/multiSourceReviewCollector.js";

let s =
  fs.readFileSync(
    file,
    "utf8"
  );

fs.copyFileSync(
  file,
  "./src/services/reviewEnrichment/multiSourceReviewCollector.before-google-bridge.js"
);

if (
  s.includes(
    '"Google Places"'
  )
) {
  console.log(
    "Google Places already registered."
  );
  process.exit(0);
}

const oldBlock =
`const SOURCE_ORDER = [
  "Shiksha",
  "Collegedunia",
  "Careers360",
  "Quora",
  "GetMyUni",
  "Zollege",
  "CollegeBatch",
  "CollegeDekho",
];`;

const newBlock =
`const SOURCE_ORDER = [
  "Google Places",
  "Shiksha",
  "Collegedunia",
  "Careers360",
  "Quora",
  "GetMyUni",
  "Zollege",
  "CollegeBatch",
  "CollegeDekho",
];`;

if (
  !s.includes(oldBlock)
) {
  throw new Error(
    "SOURCE_ORDER block not found. No changes written."
  );
}

s =
  s.replace(
    oldBlock,
    newBlock
  );

fs.writeFileSync(
  file,
  s,
  "utf8"
);

console.log(
  "Google Places added to review enrichment sources."
);
