const fs = require("fs");

const file =
  "./frontend/src/components/CollegeCard.jsx";

let text =
  fs.readFileSync(file, "utf8");

text = text
  .replaceAll(
    "\u00e2\u2020\u2018",
    "\u2191"
  )
  .replaceAll(
    "\u00e2\u2020\u201c",
    "\u2193"
  )
  .replaceAll(
    "\u00e2\u2020\u2019",
    "\u2192"
  );

fs.writeFileSync(
  file,
  text,
  "utf8"
);

console.log(
  "Special character fix applied."
);
