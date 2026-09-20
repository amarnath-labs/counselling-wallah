import fs from "node:fs";

const path =
  "./src/services/career/questionRanker.js";

let content =
  fs.readFileSync(
    path,
    "utf8"
  );

if (
  content.includes(
    "function canonicalArray("
  )
) {
  console.log(
    "canonicalArray already exists."
  );

  process.exit(0);
}

const marker =
  "function fuzzyMatch(";

const index =
  content.indexOf(
    marker
  );

if (
  index === -1
) {
  throw new Error(
    "fuzzyMatch marker not found. No changes made."
  );
}

const helper = `function canonicalArray(
  values = []
) {
  return [
    ...new Set(
      (
        Array.isArray(values)
          ? values
          : [values]
      )
        .map(normalize)
        .filter(Boolean)
    ),
  ].sort(
    (left, right) =>
      left.localeCompare(right)
  );
}


`;

content =
  content.slice(
    0,
    index
  ) +
  helper +
  content.slice(
    index
  );

fs.writeFileSync(
  path,
  content,
  "utf8"
);

console.log(
  "SUCCESS: canonicalArray helper inserted."
);
