const fs = require("fs");

const file =
  "./frontend/src/services/cwRecRecommendationService.js";

let text =
  fs.readFileSync(
    file,
    "utf8"
  );


const pattern =
  /Math\.min\(\s*1000\s*,\s*Number\(limit\)\s*\|\|\s*100\s*\)/m;


if (
  !pattern.test(
    text
  )
) {
  throw new Error(
    "Recommendation limit clamp not found"
  );
}


text =
  text.replace(
    pattern,
    `Math.min(
          100,
          Number(limit) || 100
        )`
  );


fs.writeFileSync(
  file,
  text,
  "utf8"
);


console.log(
  "PASS: frontend recommendation limit capped at 100"
);
