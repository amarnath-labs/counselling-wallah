import fs from "node:fs/promises";
import "dotenv/config";

import {
  pool
} from "./src/db/pool.js";


const OUTPUT =
  "./accurate-2026-branch-fee-preview.json";

const COLLEGE_ID =
  "uptac-accurate-institute-of-management-technology-gautam-buddh-nagar";

const COLLEGE_NAME =
  "ACCURATE INSTITUTE OF MANAGEMENT & TECHNOLOGY,GAUTAM BUDDH NAGAR";

const SOURCE_URL =
  "https://www.accurate.in/program/engineering/btech/fee-structure/";

const ACADEMIC_YEAR =
  2026;


const YEAR_FEES = [
  {
    year_of_study: 1,
    session: "2026-27",
    total_fee: 149000
  },
  {
    year_of_study: 2,
    session: "2027-28",
    total_fee: 140000
  },
  {
    year_of_study: 3,
    session: "2028-29",
    total_fee: 140000
  },
  {
    year_of_study: 4,
    session: "2029-30",
    total_fee: 140000
  }
];


async function main() {
  console.log("");

  console.log(
    "======================================="
  );

  console.log(
    "ACCURATE 2026 BRANCH FEE PREVIEW"
  );

  console.log(
    "======================================="
  );

  console.log("");


  /*
  |--------------------------------------------------------------------------
  | Validate source arithmetic
  |--------------------------------------------------------------------------
  */

  const fourYearTotal =
    YEAR_FEES.reduce(
      (sum, row) =>
        sum +
        row.total_fee,
      0
    );


  if (
    fourYearTotal !==
    569000
  ) {
    throw new Error(
      `4-year fee mismatch: ${fourYearTotal}`
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Load actual DB branches
  |--------------------------------------------------------------------------
  */

  const result =
    await pool.query(
      `
      SELECT
        id,
        name
      FROM branches
      WHERE college_id = $1
      ORDER BY name
      `,
      [
        COLLEGE_ID
      ]
    );


  const normal =
    result.rows.filter(
      row =>
        !/\(\s*FW\s*\)/i.test(
          row.name
        )
    );


  const fw =
    result.rows.filter(
      row =>
        /\(\s*FW\s*\)/i.test(
          row.name
        )
    );


  if (
    normal.length !== 6
  ) {
    throw new Error(
      `Expected 6 normal branches, found ${normal.length}`
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Build preview ONLY for normal branches
  |--------------------------------------------------------------------------
  |
  | Source gives total course fee only.
  | Do NOT invent tuition/institute/hostel breakup.
  |--------------------------------------------------------------------------
  */

  const previews =
    normal.map(
      branch => ({
        college_id:
          COLLEGE_ID,

        college_name:
          COLLEGE_NAME,

        branch_id:
          String(
            branch.id
          ),

        branch_name:
          branch.name,

        academic_year:
          ACADEMIC_YEAR,

        program:
          "B.Tech",

        fee_scope:
          "branch_specific",

        student_category:
          "GENERAL",

        source_url:
          SOURCE_URL,

        source_type:
          "official_html",

        source_label:
          "Accurate Institute Official B.Tech Fee Structure",

        variants:
          YEAR_FEES.map(
            row => ({
              year_of_study:
                row.year_of_study,

              session:
                row.session,

              semester:
                null,

              fee_period:
                "annual",

              student_category:
                "GENERAL",

              income_min:
                null,

              income_max:
                null,

              residence_type:
                "day_scholar",

              room_type:
                null,

              tuition_fee:
                null,

              admission_fee:
                null,

              institute_fee:
                null,

              hostel_fee:
                null,

              mess_fee:
                null,

              caution_deposit:
                null,

              other_fee:
                null,

              total_fee:
                row.total_fee,

              is_one_time_included:
                row.year_of_study ===
                1,

              verification_status:
                "verified"
            })
          ),

        status:
          "FINAL_READY_FOR_IMPORT"
      })
    );


  await fs.writeFile(
    OUTPUT,

    JSON.stringify(
      previews,
      null,
      2
    ),

    "utf8"
  );


  console.table(
    previews.map(
      row => ({
        branch_id:
          row.branch_id,

        branch:
          row.branch_name,

        category:
          row.student_category,

        variants:
          row.variants.length,

        min_total:
          Math.min(
            ...row.variants.map(
              v => v.total_fee
            )
          ),

        max_total:
          Math.max(
            ...row.variants.map(
              v => v.total_fee
            )
          ),

        status:
          row.status
      })
    )
  );


  console.log("");

  console.log(
    "YEAR-WISE FEES"
  );


  console.table(
    YEAR_FEES
  );


  console.log("");

  console.log(
    "4-year total:",
    fourYearTotal
  );


  console.log(
    "Normal branches ready:",
    normal.length
  );


  console.log(
    "FW branches held:",
    fw.length
  );


  console.log(
    "Total ready variants:",
    previews.reduce(
      (sum, row) =>
        sum +
        row.variants.length,
      0
    )
  );


  console.log("");

  console.log(
    "FW branches intentionally NOT imported because no official FW-specific fee source is available."
  );


  console.log(
    "Hostel fee NOT available in verified source."
  );


  console.log("");

  console.log(
    "Saved:",
    OUTPUT
  );


  console.log("");

  console.log(
    "DATABASE HAS NOT BEEN MODIFIED."
  );


  await pool.end();
}


main().catch(
  async error => {
    console.error(
      "FAILED:",
      error.message
    );

    try {
      await pool.end();
    } catch {}

    process.exitCode = 1;
  }
);