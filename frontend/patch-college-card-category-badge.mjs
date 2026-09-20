import fs from "node:fs";

const file =
  "./src/components/CollegeCard.jsx";

let source =
  fs.readFileSync(
    file,
    "utf8"
  );

if (
  source.includes(
    "Category:"
  )
) {
  console.log(
    "Category badge logic may already exist."
  );

  process.exit(0);
}


/*
|--------------------------------------------------------------------------
| Find quota badge
|--------------------------------------------------------------------------
*/

const quotaPatterns = [
  /<span[^>]*>\s*\{[^}]*quota[^}]*\}\s*<\/span>/m,
  /\{[^{}]*branch[^{}]*quota[^{}]*\}/m,
];

let match = null;

for (
  const pattern of quotaPatterns
) {
  match =
    source.match(
      pattern
    );

  if (match) {
    break;
  }
}

if (!match) {
  throw new Error(
    "Quota badge location not found in CollegeCard.jsx."
  );
}

const insertAt =
  match.index;

const categoryBadge =
`{(
  b?.category ||
  branch?.category ||
  row?.category
) && (
  <span
    className="tag"
    title="Category"
  >
    {
      b?.category ||
      branch?.category ||
      row?.category
    }
  </span>
)}

`;

source =
  source.slice(
    0,
    insertAt
  ) +
  categoryBadge +
  source.slice(
    insertAt
  );

fs.writeFileSync(
  file,
  source,
  "utf8"
);

console.log(
  "Category badge added to CollegeCard."
);
