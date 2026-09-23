const fs = require("fs");

const file =
  "./frontend/src/services/cwRecRecommendationService.js";

let text =
  fs.readFileSync(
    file,
    "utf8"
  );


text =
  text.replace(
    "`${API_BASE_URL}/dev/cw-rec/recommendations?${params.toString()}`",
    "`${API_BASE_URL}/v1/recommendations?${params.toString()}`"
  );


fs.writeFileSync(
  file,
  text,
  "utf8"
);


console.log(
  "PASS: frontend now calls /api/v1/recommendations"
);
