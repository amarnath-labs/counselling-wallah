import fs from "node:fs";

const path =
  "./src/pages/Results.jsx";

const backup =
  "./src/pages/Results.before-v2-force-attach.jsx";

const original =
  fs.readFileSync(
    path,
    "utf8"
  );

if (
  original.includes(
    "TRUMARG V2 FORCE ATTACH"
  )
) {
  throw new Error(
    "V2 force attach patch already applied."
  );
}

if (
  !original.includes(
    "applyPersonalizedV2Shadow"
  )
) {
  throw new Error(
    "applyPersonalizedV2Shadow import/function not found."
  );
}

const regex =
  /setRecommendationRows\s*\(\s*response\.data\s*\)\s*;/m;

if (
  !regex.test(
    original
  )
) {
  throw new Error(
    "setRecommendationRows(response.data) not found."
  );
}

const updated =
  original.replace(
    regex,
`/*
        | TRUMARG V2 FORCE ATTACH
        */

        const v2Rows =
          applyPersonalizedV2Shadow(
            response.data,
            profile
          );

        console.log(
          "[TRUMARG-V2]",
          {
            rows:
              Array.isArray(v2Rows)
                ? v2Rows.length
                : null,

            firstPersonalizedV2:
              Array.isArray(v2Rows)
                ? v2Rows[0]?.personalizedV2
                : null,

            firstPremium:
              Array.isArray(v2Rows)
                ? v2Rows[0]?.premium
                : null,
          }
        );

        setRecommendationRows(
          v2Rows
        );`
  );

fs.writeFileSync(
  backup,
  original,
  "utf8"
);

fs.writeFileSync(
  path,
  updated,
  "utf8"
);

console.log(
  "SUCCESS: Results now force-attaches Personalized V2 before rendering."
);

console.log(
  "Backup:",
  backup
);
