const fs = require("fs");

const file = "./src/routes/colleges.js";
let s = fs.readFileSync(file, "utf8");

if (s.includes("function mapCollegeCatalog(")) {
  console.log("Catalog mapper already exists.");
  process.exit(0);
}

const marker = `function mapCollege(row) {
  return {
    id: row.id,
    name: row.name,
    city: row.city,
    state: row.state,
    type: row.type,
    established: row.established,
    website: row.website,
    portal: row.portal,
    branches: row.branches ?? [],
  };
}`;

if (!s.includes(marker)) {
  throw new Error("mapCollege function not found");
}

const replacement = `${marker}

function mapCollegeCatalog(row) {
  const college =
    mapCollege(row);

  return {
    ...college,

    branches:
      Array.isArray(college.branches)
        ? college.branches.map(
            (branch) => ({
              id:
                branch?.id ?? null,

              name:
                branch?.name ?? '',

              fees:
                branch?.fees ?? null,

              annualFee:
                branch?.annualFee ??
                branch?.fees ??
                null,

              openingRank:
                branch?.openingRank ??
                null,

              closingRank:
                branch?.closingRank ??
                null,

              median:
                branch?.median ??
                null,

              average:
                branch?.average ??
                null,

              highest:
                branch?.highest ??
                null,

              placement:
                branch?.placement ??
                null,
            })
          )
        : [],
  };
}`;

s = s.replace(
  marker,
  replacement
);

const oldMap = `rows.map(
                mapCollege
              ),`;

if (!s.includes(oldMap)) {
  throw new Error(
    "GET /api/colleges mapper block not found"
  );
}

s = s.replace(
  oldMap,
  `rows.map(
                mapCollegeCatalog
              ),`
);

fs.writeFileSync(
  file,
  s,
  "utf8"
);

console.log(
  "Lightweight college catalog mapper added."
);
