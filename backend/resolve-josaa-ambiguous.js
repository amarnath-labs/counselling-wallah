import fs from "node:fs";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const DB =
  process.env.DATABASE_URL ||
  process.env.DB_URL ||
  process.env.POSTGRES_URL;

if (!DB) {
  throw new Error("Database connection string missing");
}

const pool = new Pool({
  connectionString: DB
});

const FILE =
  "./josaa-2026-db-mapping.json";

const mapping =
  JSON.parse(
    fs.readFileSync(FILE, "utf8")
  );

/*
  Explicit safe resolutions.

  111:
  DB apparently uses short alias IIT Gandhinagar.

  303 / 309 / 321:
  Prefer full canonical names over short aliases.

  421:
  University of Hyderabad is NOT IIT Hyderabad
  and NOT IIIT Hyderabad.
*/
const desired = {
  "111":
    "IIT Gandhinagar",

  "303":
    "Indian Institute of Information Technology Guwahati",

  "309":
    "Indian Institute of Information Technology, Allahabad",

  "321":
    "Indian Institute of Information Technology (IIIT) Pune",

  "421":
    "University of Hyderabad"
};

const dbResult =
  await pool.query(`
    SELECT
      id::text AS college_id,
      name AS college_name,
      website
    FROM colleges
  `);

const colleges =
  dbResult.rows;

function norm(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

for (const row of mapping) {

  const wanted =
    desired[row.josaa_code];

  if (!wanted)
    continue;

  const dbRow =
    colleges.find(
      x =>
        norm(x.college_name) ===
        norm(wanted)
    );

  /*
    University of Hyderabad:
    only accept actual University of Hyderabad.
  */
  if (!dbRow) {

    row.matched = false;
    row.ambiguous = false;

    row.college_id = null;
    row.college_name = null;
    row.website = null;

    row.manual_resolution =
      "NO_CORRECT_DB_COLLEGE";

    console.log(
      `❌ ${row.josaa_code} ${row.josaa_name} -> correct DB row not found`
    );

    continue;
  }

  row.matched = true;
  row.ambiguous = false;

  row.college_id =
    dbRow.college_id;

  row.college_name =
    dbRow.college_name;

  row.website =
    dbRow.website;

  row.score = 1;

  row.manual_resolution =
    "VERIFIED_ALIAS_MAPPING";

  console.log(
    `✅ ${row.josaa_code} ${row.josaa_name} -> ${dbRow.college_name}`
  );
}

fs.writeFileSync(
  FILE,
  JSON.stringify(
    mapping,
    null,
    2
  ),
  "utf8"
);

const matched =
  mapping.filter(x => x.matched);

const missing =
  mapping.filter(x => !x.matched);

const ambiguous =
  mapping.filter(x => x.ambiguous);

console.log("");
console.log(
  "========================================"
);
console.log(
  "FINAL JOSAA MAPPING"
);
console.log(
  "========================================"
);

console.log(
  "Official JoSAA:",
  mapping.length
);

console.log(
  "Mapped:",
  matched.length
);

console.log(
  "Missing from DB:",
  missing.length
);

console.log(
  "Ambiguous:",
  ambiguous.length
);

console.table(
  missing.map(x => ({
    code: x.josaa_code,
    institute: x.josaa_name
  }))
);

await pool.end();
