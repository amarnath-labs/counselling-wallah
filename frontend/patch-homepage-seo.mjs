import fs from "node:fs";

const file =
  "./index.html";

let html =
  fs.readFileSync(
    file,
    "utf8"
  );

html =
  html.replace(
    /<title>[\s\S]*?<\/title>/i,
    `<title>College Predictor, Counselling & Career Guidance | TruMarg</title>`
  );

html =
  html.replace(
    /<meta\s+name="description"[\s\S]*?>/i,
    `<meta name="description" content="Use TruMarg to explore colleges using rank, category, quota, home state and historical cutoffs. Get college prediction, counselling guidance and personalized career recommendations." />`
  );

fs.writeFileSync(
  file,
  html,
  "utf8"
);

console.log(
  "Homepage SEO metadata updated."
);
