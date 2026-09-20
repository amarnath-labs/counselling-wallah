import fs from "node:fs";

const file =
  "./src/components/CollegeCard.jsx";

let source =
  fs.readFileSync(
    file,
    "utf8"
  );

const marker =
  "{branch?.quota && (";

const index =
  source.indexOf(
    marker
  );

if (index === -1) {
  throw new Error(
    "Quota JSX block not found."
  );
}

if (
  source.includes(
    "CW CATEGORY BADGE"
  )
) {
  console.log(
    "Category badge already installed."
  );

  process.exit(0);
}

const categoryBlock =
`{/* CW CATEGORY BADGE */}
          {branch?.category && (
            <span className="meta-chip">
              {branch.category}
            </span>
          )}

          `;

source =
  source.slice(
    0,
    index
  ) +
  categoryBlock +
  source.slice(
    index
  );

fs.writeFileSync(
  file,
  source,
  "utf8"
);

console.log(
  "Category badge inserted correctly."
);
