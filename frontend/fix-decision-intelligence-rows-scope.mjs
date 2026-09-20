import fs from "node:fs";

const file =
  "./src/components/RecommendationSlide.jsx";

let source =
  fs.readFileSync(
    file,
    "utf8"
  );

const before =
  source;

source =
  source.replace(
    /allRows=\{rankedRows\}/g,
    "allRows={rows}"
  );

if (
  source === before
) {
  console.log(
    "No allRows={rankedRows} reference found."
  );

  process.exit(0);
}

fs.writeFileSync(
  file,
  source,
  "utf8"
);

console.log(
  "Fixed Decision Intelligence rows scope."
);
