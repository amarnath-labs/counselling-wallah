import fs from "node:fs";

const file =
  "./src/services/cwRecDataV1.js";

const backup =
  "./src/services/cwRecDataV1.js.before-nirf-rank-wire";

let source =
  fs.readFileSync(
    file,
    "utf8"
  );

fs.copyFileSync(
  file,
  backup
);


/*
|--------------------------------------------------------------------------
| 1. ADD nirf_rank TO QUALITY SUBQUERY
|--------------------------------------------------------------------------
*/

const oldQualitySelect =
`        qm.nirf_score,

        qm.placement_rate,`;

const newQualitySelect =
`        qm.nirf_rank,

        qm.nirf_score,

        qm.placement_rate,`;

if (
  !source.includes(
    oldQualitySelect
  )
) {
  console.error(
    "❌ Quality subquery anchor not found"
  );
  process.exit(1);
}

source =
  source.replace(
    oldQualitySelect,
    newQualitySelect
  );


/*
|--------------------------------------------------------------------------
| 2. EXPOSE nirfRank IN MAIN SELECT
|--------------------------------------------------------------------------
*/

const oldMainSelect =
`      quality_data.nirf_score
        AS "nirfScore",

      quality_data.placement_rate`;

const newMainSelect =
`      quality_data.nirf_rank
        AS "nirfRank",

      quality_data.nirf_score
        AS "nirfScore",

      quality_data.placement_rate`;

if (
  !source.includes(
    oldMainSelect
  )
) {
  console.error(
    "❌ Main SELECT anchor not found"
  );
  process.exit(1);
}

source =
  source.replace(
    oldMainSelect,
    newMainSelect
  );


fs.writeFileSync(
  file,
  source,
  "utf8"
);

console.log(
  "✅ nirfRank wired into CW-REC response"
);

console.log(
  "✅ Existing scoring untouched"
);

console.log(
  "✅ Female / HS eligibility untouched"
);

console.log(
  "✅ Dream/Target/Safe/Backup untouched"
);
