import fs from "node:fs";

const file =
  "./src/pages/Exams.jsx";

if (!fs.existsSync(file)) {
  throw new Error(
    "src/pages/Exams.jsx not found."
  );
}

let source =
  fs.readFileSync(
    file,
    "utf8"
  );

const importLine = `
import {
  filterEnabledExams,
} from "../config/enabledExams.js";
`;

if (
  !source.includes(
    "../config/enabledExams.js"
  )
) {
  const matches =
    [...source.matchAll(
      /^import .*?;$/gm
    )];

  if (matches.length > 0) {
    const last =
      matches[
        matches.length - 1
      ];

    const insertAt =
      last.index +
      last[0].length;

    source =
      source.slice(
        0,
        insertAt
      ) +
      "\n" +
      importLine +
      source.slice(
        insertAt
      );
  } else {
    source =
      importLine +
      "\n" +
      source;
  }
}

fs.writeFileSync(
  file,
  source,
  "utf8"
);

console.log(
  "enabledExams import added to Exams.jsx"
);
