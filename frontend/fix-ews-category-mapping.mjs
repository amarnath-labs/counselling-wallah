import fs from "node:fs";

const file =
  "./src/services/cwRecRecommendationService.js";

let source =
  fs.readFileSync(
    file,
    "utf8"
  );

source =
  source.replace(
    /EWS:\s*'GEN-EWS'/g,
    "EWS: 'EWS'"
  );

source =
  source.replace(
    /'GEN-EWS':\s*'GEN-EWS'/g,
    "'GEN-EWS': 'EWS'"
  );

fs.writeFileSync(
  file,
  source,
  "utf8"
);

console.log(
  "EWS category mapping fixed to DB value EWS."
);
