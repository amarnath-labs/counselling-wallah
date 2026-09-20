import "dotenv/config";
import fs from "node:fs/promises";

import {
  pool
} from "./src/db/pool.js";


const INPUT =
  "./accurate-2026-branch-fee-preview.json";

const COLLEGE_ID =
  "uptac-accurate-institute-of-management-technology-gautam-buddh-nagar";

const ACADEMIC_YEAR =
  2026;


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


async function insertVariant(
  client,
  {
    branchFeeId,
    variant,
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
        $3,
        $4,
        NULL,
        NULL,
        $5,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        $6,
        $7,
        'verified'
      )
      `,
      [
        branchFeeId,
        variant.year_of_study,
        variant.fee_period,
        variant.student_category,
        variant.residence_type,
        variant.total_fee,
        variant.is_one_time_included
      ]
    );

    return;
  }


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
      $2,
      $3,
      NULL,
      NULL,
      $4,
      NULL,
      NULL,
      NULL,
      NULL,
      NULL,
      NULL,
      NULL,
      NULL,
      $5,
      $6,
      'verified'
    )
    `,
    [
      branchFeeId,
      variant.fee_period,
      variant.student_category,
      variant.residence_type,
      variant.total_fee,
      variant.is_one_time_included
    ]
  );
}


async function main() {
  console.log("");

  console.log(
    "======================================="
  );

  console.log(
    "ACCURATE 2026 SAFE FEE IMPORTER"
  );

  console.log(
    "======================================="
  );

  console.log("");


  const preview =
    await loadJson(
      INPUT
    );


  if (
    !Array.isArray(
      preview
    ) ||
    preview.length !== 6
  ) {
    throw new Error(
      `Expected 6 normal branch previews, found ${preview?.length}`
    );
  }


  for (
    const row
    of preview
  ) {
    if (
      row.college_id !==
      COLLEGE_ID
    ) {
      throw new Error(
        "Unexpected college_id."
      );
    }

    if (
      row.status !==
      "FINAL_READY_FOR_IMPORT"
    ) {
      throw new Error(
        `${row.branch_name} is not final-ready.`
      );
    }

    if (
      row.variants.length !== 4
    ) {
      throw new Error(
        `${row.branch_name} does not have 4 variants.`
      );
    }

    if (
      /\(\s*FW\s*\)/i.test(
        row.branch_name
      )
    ) {
      throw new Error(
        `FW branch unexpectedly included: ${row.branch_name}`
      );
    }
  }


  const allTotals =
    preview.flatMap(
      row =>
        row.variants.map(
          variant =>
            variant.total_fee
        )
    );


  const validTotals =
    allTotals.every(
      value =>
        [
          149000,
          140000
        ].includes(
          Number(
            value
          )
        )
    );


  if (
    !validTotals
  ) {
    throw new Error(
      "Unexpected Accurate fee total found."
    );
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
        "Accurate college not found."
      );
    }


    console.log(
      "College:",
      college.rows[0].name
    );


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


    let mastersInserted =
      0;

    let variantsInserted =
      0;

    let mastersReplaced =
      0;


    for (
      const row
      of preview
    ) {
      const branchCheck =
        await client.query(
          `
          SELECT id, name
          FROM branches
          WHERE id = $1
            AND college_id = $2
          `,
          [
            row.branch_id,
            COLLEGE_ID
          ]
        );


      if (
        branchCheck.rowCount === 0
      ) {
        throw new Error(
          `Invalid branch mapping: ${row.branch_id}`
        );
      }


      if (
        /\(\s*FW\s*\)/i.test(
          branchCheck.rows[0].name
        )
      ) {
        throw new Error(
          `Refusing to import FW branch: ${branchCheck.rows[0].name}`
        );
      }


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
            row.branch_id,
            ACADEMIC_YEAR
          ]
        );


      for (
        const old
        of existing.rows
      ) {
        await client.query(
          `
          DELETE FROM branch_fees
          WHERE id = $1
          `,
          [
            old.id
          ]
        );

        mastersReplaced++;
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
            row.branch_id,
            ACADEMIC_YEAR,
            row.source_label,
            row.source_url
          ]
        );


      const branchFeeId =
        master.rows[0].id;


      for (
        const variant
        of row.variants
      ) {
        await insertVariant(
          client,
          {
            branchFeeId,
            variant,
            hasYearColumn
          }
        );

        variantsInserted++;
      }


      mastersInserted++;
    }


    /*
    |--------------------------------------------------------------------------
    | POST-INSERT VERIFY
    |--------------------------------------------------------------------------
    */

    const verify =
      await client.query(
        `
        SELECT
          COUNT(DISTINCT bf.id)::int
            AS masters,

          COUNT(fv.id)::int
            AS variants,

          MIN(fv.total_fee)
            AS min_total,

          MAX(fv.total_fee)
            AS max_total

        FROM branch_fees bf

        LEFT JOIN fee_variants fv
          ON fv.branch_fee_id =
             bf.id

        WHERE bf.college_id = $1
          AND bf.branch_id IS NOT NULL
          AND bf.program = 'B.Tech'
          AND bf.fee_scope =
            'branch_specific'
          AND bf.academic_year = $2
        `,
        [
          COLLEGE_ID,
          ACADEMIC_YEAR
        ]
      );


    const summary =
      verify.rows[0];


    if (
      Number(
        summary.masters
      ) !== 6 ||
      Number(
        summary.variants
      ) !== 24
    ) {
      throw new Error(
        `Post-import verification failed: masters=${summary.masters}, variants=${summary.variants}`
      );
    }


    await client.query(
      "COMMIT"
    );


    console.log(
      "======================================="
    );

    console.log(
      "ACCURATE FEE IMPORT COMPLETE"
    );

    console.log(
      "======================================="
    );

    console.log("");


    console.log(
      "Masters inserted:",
      mastersInserted
    );

    console.log(
      "Masters replaced:",
      mastersReplaced
    );

    console.log(
      "Variants inserted:",
      variantsInserted
    );


    console.log("");

    console.log(
      "Verified DB masters:",
      summary.masters
    );

    console.log(
      "Verified DB variants:",
      summary.variants
    );

    console.log(
      "Min total:",
      summary.min_total
    );

    console.log(
      "Max total:",
      summary.max_total
    );


    console.log("");

    console.log(
      "FW branches NOT modified."
    );

    console.log(
      "Hostel fees NOT imported."
    );

    console.log(
      "NIRF data NOT modified."
    );

    console.log(
      "Placement data NOT modified."
    );

    console.log(
      "Recommendation logic NOT modified."
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