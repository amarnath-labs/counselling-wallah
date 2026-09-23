import fs from "node:fs";

const file =
  "./src/components/RecommendationSlide.jsx";

let s =
  fs.readFileSync(
    file,
    "utf8"
  );

/* =========================================================
   1. INSERT DEDUPE HELPERS
========================================================= */

if (
  !s.includes(
    "function dedupeRecommendationRows("
  )
) {
  const marker =
    "export default function";

  const pos =
    s.lastIndexOf(
      marker
    );

  if (
    pos === -1
  ) {
    throw new Error(
      "Default export function not found"
    );
  }

  const helpers =
`
function normalizeRecommendationIdentity(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\\s+/g, ' ')
    .trim();
}

function recommendationUniqueKey(row) {
  const college =
    row?.collegeId ??
    row?.college?.id ??
    row?.college_id ??
    row?.collegeName ??
    row?.college?.name ??
    row?.college_name ??
    '';

  const branch =
    row?.branch?.id ??
    row?.branchId ??
    row?.branch_id ??
    row?.branch?.name ??
    row?.branchName ??
    row?.branch_name ??
    '';

  return [
    normalizeRecommendationIdentity(college),
    normalizeRecommendationIdentity(branch),
  ].join('::');
}

function dedupeRecommendationRows(rows) {
  const seen = new Set();
  const out = [];

  for (const row of rows || []) {
    if (!row) continue;

    const key =
      recommendationUniqueKey(row);

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    out.push(row);
  }

  return out;
}


`;

  s =
    s.slice(0, pos) +
    helpers +
    s.slice(pos);
}


/* =========================================================
   2. FIX VISIBLE SERIAL BADGE
========================================================= */

s =
  s.replace(
    /#\{\s*row\?\.ranking\?\.globalRank\s*\?\?\s*row\?\.premium\?\.ranking\?\.globalRank\s*\?\?\s*index\s*\+\s*1\s*\}/m,
    "#{index + 1}"
  );


/* =========================================================
   3. FIND THE ARRAY THAT IS MAPPED INTO RecommendationCard
========================================================= */

const mapRegex =
  /([A-Za-z_$][A-Za-z0-9_$]*)\.map\s*\(\s*\(\s*row\s*,\s*(?:index|i)\s*\)\s*=>[\s\S]{0,900}?<RecommendationCard/m;

const match =
  s.match(
    mapRegex
  );

if (
  !match
) {
  throw new Error(
    "Could not identify RecommendationCard list variable"
  );
}

const listVar =
  match[1];

console.log(
  "Detected rendered list:",
  listVar
);


/* =========================================================
   4. WRAP THAT LIST WITH DEDUPE
========================================================= */

const mapStartPattern =
  new RegExp(
    `\\{${listVar.replace(
      /[$]/g,
      "\\$&"
    )}\\.map\\s*\\(`
  );

if (
  mapStartPattern.test(
    s
  )
) {
  s =
    s.replace(
      mapStartPattern,
      `{dedupeRecommendationRows(${listVar}).map(`
    );
}
else {
  const plainPattern =
    new RegExp(
      `${listVar.replace(
        /[$]/g,
        "\\$&"
      )}\\.map\\s*\\(`
    );

  if (
    !plainPattern.test(
      s
    )
  ) {
    throw new Error(
      "Detected list variable, but map call could not be patched"
    );
  }

  s =
    s.replace(
      plainPattern,
      `dedupeRecommendationRows(${listVar}).map(`
    );
}


/* =========================================================
   5. STABLE KEY
========================================================= */

s =
  s.replace(
    /key=\{\s*`\$\{collegeId\}-\$\{branchName\}-\$\{(?:index|i)\}`\s*\}/gm,
    `key={recommendationUniqueKey(row)}`
  );

s =
  s.replace(
    /key=\{\s*row\?\.id\s*\|\|\s*`\$\{row\?\.college\?\.name\}-\$\{row\?\.branch\?\.name\}-\$\{(?:index|i)\}`\s*\}/gm,
    `key={recommendationUniqueKey(row)}`
  );


fs.writeFileSync(
  file,
  s,
  "utf8"
);

console.log("");
console.log(
  "SERIAL + DEDUPE V3 PATCH APPLIED"
);
