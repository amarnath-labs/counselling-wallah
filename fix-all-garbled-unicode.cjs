const fs = require("fs");

const files = [
  "./frontend/src/components/CollegeCard.jsx",
  "./frontend/src/components/RecommendationSlide.jsx",
  "./frontend/src/services/cwRecRecommendationService.js"
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;

  let text = fs.readFileSync(file, "utf8");

  text = text
    .replaceAll("\u00e2\u02c6\u2019", "\u2212")
    .replaceAll("\u00e2\u20ac\u201c", "\u2013")
    .replaceAll("\u00e2\u20ac\u201d", "\u2014")
    .replaceAll("\u00e2\u2020\u2018", "\u2191")
    .replaceAll("\u00e2\u2020\u201c", "\u2193")
    .replaceAll("\u00e2\u2020\u2019", "\u2192");

  fs.writeFileSync(file, text, "utf8");

  console.log("Fixed:", file);
}
