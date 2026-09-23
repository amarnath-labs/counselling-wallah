import fs from "node:fs";

const file =
  "./src/db/extractGoogleCollegeReviews.js";

let s =
  fs.readFileSync(
    file,
    "utf8"
  );

const backup =
  "./src/db/extractGoogleCollegeReviews.before-josaa-only.js";

fs.copyFileSync(
  file,
  backup
);

if (
  s.includes(
    "TRUMARG JOSAA-ONLY GOOGLE REVIEW EXTRACTION"
  )
) {
  console.log(
    "JoSAA-only Google filter already applied."
  );

  process.exit(0);
}

const oldBlock =
`async function getColleges() {
  const result =
    await pool.query(\`
      SELECT
        id,
        name,
        city,
        state
      FROM colleges
      ORDER BY name
    \`);

  return result.rows;
}`;

const newBlock =
`async function getColleges() {
  /*
  |--------------------------------------------------------------------------
  | TRUMARG JOSAA-ONLY GOOGLE REVIEW EXTRACTION
  |--------------------------------------------------------------------------
  |
  | Only:
  | IIT
  | NIT
  | IIIT
  | GFTI
  |
  |--------------------------------------------------------------------------
  */

  const result =
    await pool.query(\`
      SELECT DISTINCT
        id,
        name,
        city,
        state,
        LOWER(
          COALESCE(
            type,
            ''
          )
        ) AS type

      FROM colleges

      WHERE
        LOWER(
          COALESCE(
            type,
            ''
          )
        ) IN (
          'iit',
          'nit',
          'iiit',
          'gfti',
          'gftis'
        )

        OR LOWER(name)
          LIKE
          'indian institute of technology%'

        OR LOWER(name)
          LIKE
          'iit %'

        OR LOWER(name)
          LIKE
          'national institute of technology%'

        OR LOWER(name)
          LIKE
          '%indian institute of information technology%'

      ORDER BY
        name
    \`);

  return result.rows;
}`;

if (
  !s.includes(oldBlock)
) {
  throw new Error(
    "Current getColleges() block not found. No changes written."
  );
}

s =
  s.replace(
    oldBlock,
    newBlock
  );

fs.writeFileSync(
  file,
  s,
  "utf8"
);

console.log("");
console.log(
  "=============================================="
);
console.log(
  "JOSAA-ONLY GOOGLE EXTRACTION ENABLED"
);
console.log(
  "=============================================="
);
console.log(
  "IIT + NIT + IIIT + GFTI only"
);
console.log(
  "Backup:",
  backup
);
