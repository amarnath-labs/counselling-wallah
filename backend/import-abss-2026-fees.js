import "dotenv/config";
import fs from "node:fs/promises";

import {
  pool
} from "./src/db/pool.js";


const PREVIEW_FILE =
  "./abss-2026-branch-fee-preview.json";

const NORMALIZED_FILE =
  "./abss-2026-normalized-preview.json";

const COLLEGE_ID =
  "uptac-abss-institute-of-technology-meerut-meerut";

const ACADEMIC_YEAR =
  2026;


/*
|--------------------------------------------------------------------------
| LOAD JSON
|--------------------------------------------------------------------------
*/

async function loadJson(file) {
  const raw =
    await fs.readFile(
      file,
      "utf8"
    );

  return JSON.parse(
    raw.replace(
      /^\uFEFF/,
      ""
    )
  );
}


/*
|--------------------------------------------------------------------------
| DETECT OPTIONAL year_of_study COLUMN
|--------------------------------------------------------------------------
*/

async function hasYearOfStudyColumn(
  client
) {
  const result =
    await client.query(
      `
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'fee_variants'
        AND column_name = 'year_of_study'
      `
    );

  return (
    result.rowCount > 0
  );
}


/*
|--------------------------------------------------------------------------
| INSERT ONE VARIANT
|--------------------------------------------------------------------------
*/

async function insertVariant(
  client,
  {
    branchFeeId,
    yearOfStudy,
    studentCategory,
    residenceType,
    roomType,
    tuitionFee,
    hostelFee,
    otherFee,
    totalFee,
    oneTimeIncluded,
    hasYearColumn
  }
) {
  if (
    hasYearColumn
  ) {
    await client.query(
      `
      INSERT INTO fee_variants (
        branch_fee_id,
        semester,
        year_of_study,
        fee_period,
        student_category,
        income_min,
        income_max,
        residence_type,
        room_type,
        tuition_fee,
        admission_fee,
        institute_fee,
        hostel_fee,
        mess_fee,
        caution_deposit,
        other_fee,
        total_fee,
        is_one_time_included,
        verification_status
      )
      VALUES (
        $1,
        NULL,
        $2,
        'annual',
        $3,
        NULL,
        NULL,
        $4,
        $5,
        $6,
        NULL,
        NULL,
        $7,
        NULL,
        NULL,
        $8,
        $9,
        $10,
        'verified'
      )
      `,
      [
        branchFeeId,
        yearOfStudy,
        studentCategory,
        residenceType,
        roomType,
        tuitionFee,
        hostelFee,
        otherFee,
        totalFee,
        oneTimeIncluded
      ]
    );

    return;
  }


  /*
  |--------------------------------------------------------------------------
  | Backward-compatible schema path
  |--------------------------------------------------------------------------
  */

  await client.query(
    `
    INSERT INTO fee_variants (
      branch_fee_id,
      semester,
      fee_period,
      student_category,
      income_min,
      income_max,
      residence_type,
      room_type,
      tuition_fee,
      admission_fee,
      institute_fee,
      hostel_fee,
      mess_fee,
      caution_deposit,
      other_fee,
      total_fee,
      is_one_time_included,
      verification_status
    )
    VALUES (
      $1,
      NULL,
      'annual',
      $2,
      NULL,
      NULL,
      $3,
      $4,
      $5,
      NULL,
      NULL,
      $6,
      NULL,
      NULL,
      $7,
      $8,
      $9,
      'verified'
    )
    `,
    [
      branchFeeId,
      studentCategory,
      residenceType,
      roomType,
      tuitionFee,
      hostelFee,
      otherFee,
      totalFee,
      oneTimeIncluded
    ]
  );
}


/*
|--------------------------------------------------------------------------
| MAIN
|--------------------------------------------------------------------------
*/

async function main() {
  console.log("");

  console.log(
    "======================================="
  );

  console.log(
    "ABSS 2026 FINAL FEE IMPORTER"
  );

  console.log(
    "======================================="
  );

  console.log("");


  const preview =
    await loadJson(
      PREVIEW_FILE
    );

  const normalized =
    await loadJson(
      NORMALIZED_FILE
    );


  /*
  |--------------------------------------------------------------------------
  | PRE-IMPORT FILE CHECKS
  |--------------------------------------------------------------------------
  */

  if (
    !Array.isArray(preview) ||
    preview.length !== 2
  ) {
    throw new Error(
      `Expected 2 ABSS branch previews, found ${preview?.length}`
    );
  }


  if (
    normalized.normalization_status !==
    "AUTO_READY"
  ) {
    throw new Error(
      "ABSS normalization is not AUTO_READY."
    );
  }


  if (
    !Array.isArray(
      normalized.years
    ) ||
    normalized.years.length !== 4
  ) {
    throw new Error(
      "Expected 4 normalized years."
    );
  }


  for (
    const row
    of preview
  ) {
    if (
      row.status !==
      "FINAL_READY_FOR_IMPORT"
    ) {
      throw new Error(
        `${row.branch_name} is not final-ready.`
      );
    }


    if (
      row.college_id !==
      COLLEGE_ID
    ) {
      throw new Error(
        "Unexpected college_id in preview."
      );
    }


    if (
      row.variants.length !== 4
    ) {
      throw new Error(
        `${row.branch_name} does not have 4 variants.`
      );
    }
  }


  /*
  |--------------------------------------------------------------------------
  | SOURCE VALUES
  |--------------------------------------------------------------------------
  */

  const expectedAcademicTotals =
    [
      67165,
      62865,
      62865,
      62865
    ];


  const expectedHostelFee =
    75000;


  for (
    let i = 0;
    i < normalized.years.length;
    i++
  ) {
    const row =
      normalized.years[i];


    if (
      Number(
        row.effective_day_scholar_total
      ) !==
      expectedAcademicTotals[i]
    ) {
      throw new Error(
        `Academic total mismatch for Year ${i + 1}`
      );
    }


    if (
      Number(
        row.hostel_fee
      ) !==
      expectedHostelFee
    ) {
      throw new Error(
        `Hostel fee mismatch for Year ${i + 1}`
      );
    }
  }


  console.log(
    "PRE-IMPORT SAFETY CHECK: PASS"
  );

  console.log("");


  const client =
    await pool.connect();


  try {
    await client.query(
      "BEGIN"
    );


    /*
    |--------------------------------------------------------------------------
    | VERIFY COLLEGE
    |--------------------------------------------------------------------------
    */

    const college =
      await client.query(
        `
        SELECT id, name
        FROM colleges
        WHERE id = $1
        `,
        [
          COLLEGE_ID
        ]
      );


    if (
      college.rowCount === 0
    ) {
      throw new Error(
        "ABSS college not found in database."
      );
    }


    console.log(
      "College:",
      college.rows[0].name
    );


    /*
    |--------------------------------------------------------------------------
    | CHECK SCHEMA
    |--------------------------------------------------------------------------
    */

    const hasYearColumn =
      await hasYearOfStudyColumn(
        client
      );


    console.log(
      "fee_variants.year_of_study:",
      hasYearColumn
        ? "AVAILABLE"
        : "NOT AVAILABLE"
    );


    console.log("");


    /*
    |--------------------------------------------------------------------------
    | IMPORT BRANCH-SPECIFIC ACADEMIC FEES
    |--------------------------------------------------------------------------
    */

    let academicMasters =
      0;

    let academicVariants =
      0;

    let replacedAcademic =
      0;


    for (
      const branchPreview
      of preview
    ) {
      /*
      |--------------------------------------------------------------------------
      | Verify branch ownership
      |--------------------------------------------------------------------------
      */

      const branch =
        await client.query(
          `
          SELECT id, name
          FROM branches
          WHERE id = $1
            AND college_id = $2
          `,
          [
            branchPreview.branch_id,
            COLLEGE_ID
          ]
        );


      if (
        branch.rowCount === 0
      ) {
        throw new Error(
          `Invalid ABSS branch: ${branchPreview.branch_id}`
        );
      }


      /*
      |--------------------------------------------------------------------------
      | Replace only same branch/year/scope master
      |--------------------------------------------------------------------------
      */

      const existing =
        await client.query(
          `
          SELECT id
          FROM branch_fees
          WHERE college_id = $1
            AND branch_id = $2
            AND program = 'B.Tech'
            AND fee_scope = 'branch_specific'
            AND academic_year = $3
          `,
          [
            COLLEGE_ID,
            branchPreview.branch_id,
            ACADEMIC_YEAR
          ]
        );


      for (
        const row
        of existing.rows
      ) {
        await client.query(
          `
          DELETE FROM branch_fees
          WHERE id = $1
          `,
          [
            row.id
          ]
        );

        replacedAcademic++;
      }


      const master =
        await client.query(
          `
          INSERT INTO branch_fees (
            college_id,
            branch_id,
            program,
            fee_scope,
            academic_year,
            source_label,
            source_url,
            verification_status
          )
          VALUES (
            $1,
            $2,
            'B.Tech',
            'branch_specific',
            $3,
            $4,
            $5,
            'verified'
          )
          RETURNING id
          `,
          [
            COLLEGE_ID,
            branchPreview.branch_id,
            ACADEMIC_YEAR,
            "ABSS Official B.Tech Fee Structure 2026-27",
            normalized.source_url
          ]
        );


      const branchFeeId =
        master.rows[0].id;


      for (
        const variant
        of branchPreview.variants
      ) {
        await insertVariant(
          client,
          {
            branchFeeId,

            yearOfStudy:
              variant.year_of_study,

            studentCategory:
              "GENERAL",

            residenceType:
              "day_scholar",

            roomType:
              null,

            tuitionFee:
              Number(
                variant.tuition_fee
              ),

            hostelFee:
              null,

            /*
            |--------------------------------------------------------------------------
            | Includes exam fee + one-time fees where applicable.
            |--------------------------------------------------------------------------
            */

            otherFee:
              Number(
                variant.other_fee
              ),

            totalFee:
              Number(
                variant.total_fee
              ),

            oneTimeIncluded:
              variant.year_of_study ===
              1,

            hasYearColumn
          }
        );


        academicVariants++;
      }


      academicMasters++;
    }


    /*
    |--------------------------------------------------------------------------
    | IMPORT HOSTEL MASTER
    |--------------------------------------------------------------------------
    |
    | Source gives only annual Hostel Fee = 75000.
    | No room type is supplied.
    |
    | Therefore:
    | room_type = NULL
    |--------------------------------------------------------------------------
    */

    const existingHostel =
      await client.query(
        `
        SELECT id
        FROM branch_fees
        WHERE college_id = $1
          AND branch_id IS NULL
          AND program = 'B.Tech'
          AND fee_scope =
            'all_btech_branches'
          AND academic_year = $2
        `,
        [
          COLLEGE_ID,
          ACADEMIC_YEAR
        ]
      );


    let replacedHostel =
      0;


    for (
      const row
      of existingHostel.rows
    ) {
      await client.query(
        `
        DELETE FROM branch_fees
        WHERE id = $1
        `,
        [
          row.id
        ]
      );

      replacedHostel++;
    }


    const hostelMaster =
      await client.query(
        `
        INSERT INTO branch_fees (
          college_id,
          branch_id,
          program,
          fee_scope,
          academic_year,
          source_label,
          source_url,
          verification_status
        )
        VALUES (
          $1,
          NULL,
          'B.Tech',
          'all_btech_branches',
          $2,
          $3,
          $4,
          'verified'
        )
        RETURNING id
        `,
        [
          COLLEGE_ID,
          ACADEMIC_YEAR,
          "ABSS Official B.Tech Hostel Fee 2026-27",
          normalized.source_url
        ]
      );


    const hostelMasterId =
      hostelMaster.rows[0].id;


    let hostelVariants =
      0;


    for (
      const year
      of normalized.years
    ) {
      await insertVariant(
        client,
        {
          branchFeeId:
            hostelMasterId,

          yearOfStudy:
            Number(
              year.year_of_study
            ),

          studentCategory:
            "GENERAL",

          residenceType:
            "hosteller",

          roomType:
            null,

          tuitionFee:
            null,

          hostelFee:
            75000,

          otherFee:
            null,

          totalFee:
            75000,

          oneTimeIncluded:
            false,

          hasYearColumn
        }
      );


      hostelVariants++;
    }


    /*
    |--------------------------------------------------------------------------
    | VERIFY BEFORE COMMIT
    |--------------------------------------------------------------------------
    */

    const academicVerify =
      await client.query(
        `
        SELECT
          COUNT(DISTINCT bf.id)::int
            AS masters,
          COUNT(fv.id)::int
            AS variants
        FROM branch_fees bf

        LEFT JOIN fee_variants fv
          ON fv.branch_fee_id =
             bf.id

        WHERE bf.college_id = $1
          AND bf.branch_id IS NOT NULL
          AND bf.fee_scope =
            'branch_specific'
          AND bf.academic_year = $2
        `,
        [
          COLLEGE_ID,
          ACADEMIC_YEAR
        ]
      );


    const hostelVerify =
      await client.query(
        `
        SELECT
          COUNT(DISTINCT bf.id)::int
            AS masters,
          COUNT(fv.id)::int
            AS variants
        FROM branch_fees bf

        LEFT JOIN fee_variants fv
          ON fv.branch_fee_id =
             bf.id

        WHERE bf.college_id = $1
          AND bf.branch_id IS NULL
          AND bf.fee_scope =
            'all_btech_branches'
          AND bf.academic_year = $2
        `,
        [
          COLLEGE_ID,
          ACADEMIC_YEAR
        ]
      );


    if (
      Number(
        academicVerify.rows[0].masters
      ) !== 2 ||
      Number(
        academicVerify.rows[0].variants
      ) !== 8
    ) {
      throw new Error(
        "Academic post-insert verification failed."
      );
    }


    if (
      Number(
        hostelVerify.rows[0].masters
      ) !== 1 ||
      Number(
        hostelVerify.rows[0].variants
      ) !== 4
    ) {
      throw new Error(
        "Hostel post-insert verification failed."
      );
    }


    await client.query(
      "COMMIT"
    );


    console.log(
      "======================================="
    );

    console.log(
      "ABSS FEE IMPORT COMPLETE"
    );

    console.log(
      "======================================="
    );

    console.log("");


    console.log(
      "Academic masters:",
      academicMasters
    );

    console.log(
      "Academic variants:",
      academicVariants
    );

    console.log(
      "Academic masters replaced:",
      replacedAcademic
    );


    console.log("");

    console.log(
      "Hostel masters:",
      1
    );

    console.log(
      "Hostel variants:",
      hostelVariants
    );

    console.log(
      "Hostel masters replaced:",
      replacedHostel
    );


    console.log("");

    console.log(
      "TOTAL MASTERS:",
      academicMasters +
      1
    );

    console.log(
      "TOTAL VARIANTS:",
      academicVariants +
      hostelVariants
    );


    console.log("");

    console.log(
      "Expected: 3 masters / 12 variants"
    );


    console.log("");

    console.log(
      "ABSS FEES COMPLETE."
    );


  } catch (error) {
    try {
      await client.query(
        "ROLLBACK"
      );
    } catch {}


    throw error;

  } finally {
    client.release();

    await pool.end();
  }
}


main().catch(
  error => {
    console.error(
      "FAILED:",
      error.message
    );

    process.exitCode =
      1;
  }
);