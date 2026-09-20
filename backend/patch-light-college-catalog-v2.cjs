const fs = require("fs");

const file = "./src/routes/colleges.js";
let s = fs.readFileSync(file, "utf8");

if (s.includes("function mapCollegeCatalog(")) {
  console.log("Catalog mapper already exists.");
  process.exit(0);
}

const mapRe =
  /function\s+mapCollege\s*\(\s*row\s*\)\s*\{[\s\S]*?\n\}/m;

const match = s.match(mapRe);

if (!match) {
  throw new Error("mapCollege function still not found");
}

const mapper = match[0];

const catalogMapper = `

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
}
`;

s = s.replace(
  mapper,
  mapper + catalogMapper
);

const listMapRe =
  /rows\.map\(\s*mapCollege\s*\)/m;

if (!listMapRe.test(s)) {
  throw new Error(
    "GET /api/colleges rows.map(mapCollege) not found"
  );
}

s = s.replace(
  listMapRe,
  `rows.map(
                mapCollegeCatalog
              )`
);

fs.writeFileSync(
  file,
  s,
  "utf8"
);

console.log(
  "Lightweight college catalog mapper added."
);
