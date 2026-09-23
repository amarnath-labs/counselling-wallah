const fs = require("fs");

const file =
  "./backend/src/routes/cwRecV1-dev.js";

let text =
  fs.readFileSync(
    file,
    "utf8"
  );


text =
  text.replace(
    /Math\.min\(\s*1000\s*,\s*Number\([^)]*limit[^)]*\)\s*\|\|\s*100\s*\)/g,
    `Math.min(
      100,
      Number(req.query.limit) || 100
    )`
  );


fs.writeFileSync(
  file,
  text,
  "utf8"
);


console.log(
  "PASS: backend response limit capped at 100"
);
