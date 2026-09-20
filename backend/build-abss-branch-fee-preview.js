import fs from "node:fs/promises";
import "dotenv/config";

import {
  pool
} from "./src/db/pool.js";


const NORMALIZED_FILE =
  "./abss-2026-normalized-preview.json";

const OUTPUT_FILE =
  "./abss-2026-branch-fee-preview.json";

const COLLEGE_ID =
  "uptac-abss-institute-of-technology-meerut-meerut";

const ACADEMIC_YEAR =
  2026;


async function main() {
  console.log("");

  console.log(
    "======================================="
  );

  console.log(
    "ABSS 2026 BRANCH FEE PREVIEW"
  );

  console.log(
    "======================================="
  );

  console.log("");


  /*
  |--------------------------------------------------------------------------
  | Load normalized verified source
  |--------------------------------------------------------------------------
  */

  const raw =
    await fs.readFile(
      NORMALIZED_FILE,
      "utf8"
    );

  const normalized =
    JSON.parse(
      raw.replace(
        /^\uFEFF/,
        ""
      )
    );


  if (
    normalized.normalization_status !==
    "AUTO_READY"
  ) {
    throw new Error(
      "ABSS normalization is not AUTO_READY."
    );
  }


  if (
    Number(
      normalized.academic_year
    ) !== ACADEMIC_YEAR
  ) {
    throw new Error(
      "Unexpected academic year."
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Read actual DB branches
  |--------------------------------------------------------------------------
  */

  const branchResult =
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


  if (
    branchResult.rows.length === 0
  ) {
    throw new Error(
      "No ABSS branches found."
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Safety: FW branches are NOT expected
  |--------------------------------------------------------------------------
  */

  const fwBranches =
    branchResult.rows.filter(
      row =>
        /\(\s*FW\s*\)/i.test(
          row.name
        )
    );


  if (
    fwBranches.length > 0
  ) {
    throw new Error(
      `Unexpected FW branches found: ${fwBranches.length}`
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Validate normalized years
  |--------------------------------------------------------------------------
  */

  const years =
    normalized.years;


  if (
    !Array.isArray(years) ||
    years.length !== 4
  ) {
    throw new Error(
      "Expected exactly 4 normalized academic years."
    );
  }


  const expected = [
    {
      year:
        1,

      session:
        "2026-27",

      tuition:
        55000,

      hostel:
        75000,

      base:
        130000,

      additional:
        12165,

      day:
        67165,

      hosteller:
        142165
    },

    {
      year:
        2,

      session:
        "2027-28",

      tuition:
        55000,

      hostel:
        75000,

      base:
        130000,

      additional:
        7865,

      day:
        62865,

      hosteller:
        137865
    },

    {
      year:
        3,

      session:
        "2028-29",

      tuition:
        55000,

      hostel:
        75000,

      base:
        130000,

      additional:
        7865,

      day:
        62865,

      hosteller:
        137865
    },

    {
      year:
        4,

      session:
        "2029-30",

      tuition:
        55000,

      hostel:
        75000,

      base:
        130000,

      additional:
        7865,

      day:
        62865,

      hosteller:
        137865
    }
  ];


  for (
    let i = 0;
    i < years.length;
    i++
  ) {
    const actual =
      years[i];

    const exp =
      expected[i];


    if (
      Number(
        actual.year_of_study
      ) !== exp.year ||
      actual.session !==
        exp.session ||
      Number(
        actual.tuition_fee
      ) !== exp.tuition ||
      Number(
        actual.hostel_fee
      ) !== exp.hostel ||
      Number(
        actual.source_base_hosteller_total
      ) !== exp.base ||
      Number(
        actual.additional_fee_total
      ) !== exp.additional ||
      Number(
        actual.effective_day_scholar_total
      ) !== exp.day ||
      Number(
        actual.effective_hosteller_total
      ) !== exp.hosteller
    ) {
      throw new Error(
        `Normalized fee validation failed for year ${exp.year}.`
      );
    }
  }


  /*
  |--------------------------------------------------------------------------
  | Build branch-specific academic fee masters
  |--------------------------------------------------------------------------
  |
  | IMPORTANT:
  |
  | Hostel is kept separate.
  |
  | Academic branch total uses effective DAY-SCHOLAR amount:
  |
  | Year 1 = 55,000 + 2,300 + 7,865 + 2,000
  |        = 67,165
  |
  | Year 2-4 = 55,000 + 7,865
  |          = 62,865
  |
  |--------------------------------------------------------------------------
  */

  const preview = [];


  for (
    const branch
    of branchResult.rows
  ) {
    const variants =
      years.map(
        year => ({
          year_of_study:
            Number(
              year.year_of_study
            ),

          session:
            year.session,

          student_category:
            "GENERAL",

          tuition_fee:
            Number(
              year.tuition_fee
            ),

          pre_enrollment_fee:
            year.pre_enrollment_fee === null
              ? 0
              : Number(
                  year.pre_enrollment_fee
                ),

          exam_fee:
            Number(
              year.exam_fee
            ),

          blazer_id_fee:
            year.blazer_id_fee === null
              ? 0
              : Number(
                  year.blazer_id_fee
                ),

          other_fee:
            Number(
              year.additional_fee_total
            ),

          /*
          | Academic total excludes hostel.
          */
          total_fee:
            Number(
              year.effective_day_scholar_total
            ),

          verification_status:
            "verified_official_source"
        })
      );


    preview.push({
      college_id:
        COLLEGE_ID,

      college_name:
        normalized.college_name,

      branch_id:
        String(
          branch.id
        ),

      branch_name:
        branch.name,

      academic_year:
        ACADEMIC_YEAR,

      fee_scope:
        "branch_specific",

      student_category:
        "GENERAL",

      source_url:
        normalized.source_url,

      source_type:
        "official_pdf",

      variants,

      status:
        "FINAL_READY_FOR_IMPORT"
    });
  }


  /*
  |--------------------------------------------------------------------------
  | Final safety validation
  |--------------------------------------------------------------------------
  */

  const bad =
    preview.filter(
      row =>
        row.variants.length !== 4 ||
        row.variants.some(
          variant =>
            !Number.isFinite(
              variant.total_fee
            ) ||
            variant.total_fee <= 0
        )
    );


  if (
    bad.length > 0
  ) {
    throw new Error(
      "Preview safety validation failed."
    );
  }


  await fs.writeFile(
    OUTPUT_FILE,

    JSON.stringify(
      preview,
      null,
      2
    ),

    "utf8"
  );


  /*
  |--------------------------------------------------------------------------
  | Display
  |--------------------------------------------------------------------------
  */

  console.table(
    preview.map(
      row => ({
        branch_id:
          row.branch_id,

        branch:
          row.branch_name,

        category:
          row.student_category,

        scope:
          row.fee_scope,

        year:
          row.academic_year,

        variants:
          row.variants.length,

        min_total:
          Math.min(
            ...row.variants.map(
              variant =>
                variant.total_fee
            )
          ),

        max_total:
          Math.max(
            ...row.variants.map(
              variant =>
                variant.total_fee
            )
          ),

        status:
          row.status
      })
    )
  );


  console.log("");

  console.log(
    "Normal branches:",
    preview.length
  );

  console.log(
    "FW branches:",
    0
  );

  console.log(
    "Total academic variants:",
    preview.reduce(
      (
        sum,
        row
      ) =>
        sum +
        row.variants.length,
      0
    )
  );


  console.log("");

  console.log(
    "ACADEMIC TOTALS"
  );

  console.table(
    years.map(
      year => ({
        year:
          year.year_of_study,

        session:
          year.session,

        tuition:
          year.tuition_fee,

        additional:
          year.additional_fee_total,

        academic_total:
          year.effective_day_scholar_total
      })
    )
  );


  console.log("");

  console.log(
    "HOSTEL SOURCE VALUE:",
    "75000 per year"
  );

  console.log(
    "Hostel intentionally NOT mixed into academic total."
  );


  console.log("");

  console.log(
    "Saved:",
    OUTPUT_FILE
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

    process.exitCode =
      1;
  }
);