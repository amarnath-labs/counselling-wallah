import fs from "node:fs";
import path from "node:path";

function normalizeSource(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function readJson(file) {
  if (!fs.existsSync(file)) {
    throw new Error(
      `Input file not found: ${file}`
    );
  }

  return JSON.parse(
    fs.readFileSync(
      file,
      "utf8"
    )
  );
}

const input =
  process.argv[2];

if (!input) {
  throw new Error(
    "Usage: node prepare-review-imports.js <batch.json>"
  );
}

const payload =
  readJson(input);

const collegeId =
  String(
    payload?.collegeId ||
    payload?.college_id ||
    ""
  ).trim();

if (!collegeId) {
  throw new Error(
    "collegeId missing in batch"
  );
}

const reviews =
  Array.isArray(payload)
    ? payload
    : Array.isArray(
        payload?.reviews
      )
      ? payload.reviews
      : [];

if (!reviews.length) {
  throw new Error(
    "No reviews found"
  );
}

const grouped =
  new Map();

for (const review of reviews) {
  const source =
    String(
      review?.source ||
      ""
    ).trim();

  if (!source) {
    console.warn(
      "Skipping review without source:",
      review?.sourceReviewId ||
      review?.text?.slice?.(0, 50)
    );

    continue;
  }

  const key =
    normalizeSource(source);

  if (!grouped.has(key)) {
    grouped.set(
      key,
      []
    );
  }

  grouped.get(key).push(
    review
  );
}

let written = 0;

for (
  const [sourceKey, rows]
  of grouped
) {
  const dir =
    path.resolve(
      process.cwd(),
      "review-imports",
      sourceKey
    );

  fs.mkdirSync(
    dir,
    {
      recursive: true,
    }
  );

  const file =
    path.join(
      dir,
      `${collegeId}.json`
    );

  fs.writeFileSync(
    file,
    JSON.stringify(
      rows,
      null,
      2
    ),
    "utf8"
  );

  written += rows.length;

  console.log(
    `${sourceKey}: ${rows.length}`
  );

  console.log(
    `  -> ${file}`
  );
}

console.log("");
console.log(
  "=============================================="
);
console.log(
  "REVIEW IMPORT PREPARATION COMPLETE"
);
console.log(
  "=============================================="
);
console.log(
  "College:",
  collegeId
);
console.log(
  "Reviews written:",
  written
);
console.log(
  "Sources:",
  grouped.size
);
