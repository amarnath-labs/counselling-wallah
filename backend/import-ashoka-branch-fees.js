import "dotenv/config";
import fs from "node:fs/promises";
import { pool } from "./src/db/pool.js";

const INPUT =
  "./ashoka-branch-specific-db-preview.json";

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

function validatePreview(preview) {
  const errors = [];

  const branchFee =
    preview.branch_fee;

  const variants =
    preview.fee_variants || [];

  if (
    preview.preview_status !==
    "FINAL_READY_FOR_IMPORT"
  ) {
    errors.push(
      "preview_status is not FINAL_READY_FOR_IMPORT"
    );
  }

  if (
    !branchFee?.college_id
  ) {
    errors.push(
      "missing college_id"
    );
  }

  if (
    !branchFee?.branch_id
  ) {
    errors.push(
      "missing branch_id"
    );
  }

  if (
    branchFee?.fee_scope !==
    "branch_specific"
  ) {
    errors.push(
      "fee_scope must be branch_specific"
    );
  }

  if (
    !branchFee?.academic_year
  ) {
    errors.push(
      "missing academic_year"
    );
  }

  if (
    !branchFee?.source_url
  ) {
    errors.push(
      "missing source_url"
    );
  }

  if (
    variants.length !== 4
  ) {
    errors.push(
      `expected 4 variants, found ${variants.length}`
    );
  }

  for (
    const variant
    of variants
  ) {
    if (
      variant.verification_status !==
      "verified"
    ) {
      errors.push(
        `unverified variant year ${variant.year_of_study}`
      );
    }

    if (
      !Number.isFinite(
        variant.total_fee
      )
    ) {
      errors.push(
        `invalid total_fee year ${variant.year_of_study}`
      );
    }

    if (
      variant.residence_type !==
      "day_scholar"
    ) {
      errors.push(
        `unexpected residence_type year ${variant.year_of_study}`
      );
    }

    if (
      variant.room_type !==
      null
    ) {
      errors.push(
        `room_type must be null year ${variant.year_of_study}`
      );
    }
  }

  return errors;
}

async function main() {
  console.log("");
  console.log(
    "======================================="
  );
  console.log(
    "ASHOKA BRANCH-SPECIFIC FEE IMPORTER"
  );
  console.log(
    "======================================="
  );
  console.log("");

  const previews =
    await loadJson(
      INPUT
    );

  if (
    !Array.isArray(
      previews
    )
  ) {
    throw new Error(
      "Preview input must be an array."
    );
  }

  console.log(
    "PRE-IMPORT SAFETY CHECK"
  );

  const checks =
    previews.map(
      preview => {
        const errors =
          validatePreview(
            preview
          );

        return {
          branch_id:
            preview.branch_fee?.branch_id,

          branch:
            preview.branch_fee?.branch_name,

          scope:
            preview.branch_fee?.fee_scope,

          year:
            preview.branch_fee?.academic_year,

          variants:
            preview.fee_variants?.length || 0,

          errors:
            errors.join(" | "),

          valid:
            errors.length === 0
        };
      }
    );

  console.table(
    checks
  );

  const invalid =
    checks.filter(
      row =>
        !row.valid
    );

  if (
    invalid.length > 0
  ) {
    throw new Error(
      `Safety check failed for ${invalid.length} preview(s).`
    );
  }

  console.log("");
  console.log(
    "PRE-IMPORT SAFETY CHECK: PASS"
  );
  console.log("");

  const client =
    await pool.connect();

  const summary = [];

  try {
    await client.query(
      "BEGIN"
    );

    for (
      const preview
      of previews
    ) {
      const branchFee =
        preview.branch_fee;

      const variants =
        preview.fee_variants;

      console.log(
        "[IMPORT]",
        branchFee.branch_name
      );

      /*
      |--------------------------------------------------------------------------
      | VERIFY COLLEGE
      |--------------------------------------------------------------------------
      */

      const collegeCheck =
        await client.query(
          `
          SELECT
            id,
            name
          FROM colleges
          WHERE id = $1
          `,
          [
            branchFee.college_id
          ]
        );

      if (
        collegeCheck.rowCount === 0
      ) {
        throw new Error(
          `College not found: ${branchFee.college_id}`
        );
      }

      /*
      |--------------------------------------------------------------------------
      | VERIFY BRANCH BELONGS TO COLLEGE
      |--------------------------------------------------------------------------
      */

      const branchCheck =
        await client.query(
          `
          SELECT
            id,
            name,
            college_id
          FROM branches
          WHERE id = $1
            AND college_id = $2
          `,
          [
            branchFee.branch_id,
            branchFee.college_id
          ]
        );

      if (
        branchCheck.rowCount === 0
      ) {
        throw new Error(
          `Branch ${branchFee.branch_id} does not belong to ${branchFee.college_id}`
        );
      }

      /*
      |--------------------------------------------------------------------------
      | FIND EXISTING SAME MASTER
      |--------------------------------------------------------------------------
      */

      const existing =
        await client.query(
          `
          SELECT id
          FROM branch_fees
          WHERE college_id = $1
            AND branch_id = $2
            AND program = $3
            AND fee_scope = $4
            AND academic_year = $5
          `,
          [
            branchFee.college_id,
            branchFee.branch_id,
            branchFee.program,
            branchFee.fee_scope,
            branchFee.academic_year
          ]
        );

      let replaced = 0;

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

        replaced++;
      }

      /*
      |--------------------------------------------------------------------------
      | INSERT MASTER
      |--------------------------------------------------------------------------
      */

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
            $1,$2,$3,$4,$5,$6,$7,$8
          )
          RETURNING id
          `,
          [
            branchFee.college_id,
            branchFee.branch_id,
            branchFee.program,
            branchFee.fee_scope,
            branchFee.academic_year,
            branchFee.source_label,
            branchFee.source_url,
            branchFee.verification_status
          ]
        );

      const branchFeeId =
        master.rows[0].id;

      /*
      |--------------------------------------------------------------------------
      | INSERT VARIANTS
      |--------------------------------------------------------------------------
      */

      let inserted = 0;

      for (
        const variant
        of variants
      ) {
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
            $1,$2,$3,$4,$5,$6,$7,$8,$9,
            $10,$11,$12,$13,$14,$15,$16,
            $17,$18
          )
          `,
          [
            branchFeeId,
            variant.semester,
            variant.fee_period,
            variant.student_category,
            variant.income_min,
            variant.income_max,
            variant.residence_type,
            variant.room_type,
            variant.tuition_fee,
            variant.admission_fee,
            variant.institute_fee,
            variant.hostel_fee,
            variant.mess_fee,
            variant.caution_deposit,
            variant.other_fee,
            variant.total_fee,
            variant.is_one_time_included,
            variant.verification_status
          ]
        );

        inserted++;
      }

      summary.push({
        branch_id:
          branchFee.branch_id,

        branch:
          branchFee.branch_name,

        academic_year:
          branchFee.academic_year,

        replaced,

        variants:
          inserted,

        status:
          "imported"
      });
    }

    await client.query(
      "COMMIT"
    );

    console.log("");
    console.log(
      "---------------------------------------"
    );
    console.log(
      "IMPORT SUMMARY"
    );
    console.log(
      "---------------------------------------"
    );

    console.table(
      summary
    );

    console.log("");

    console.log(
      "Total branches imported:",
      summary.length
    );

    console.log(
      "Total variants imported:",
      summary.reduce(
        (
          sum,
          row
        ) =>
          sum +
          row.variants,
        0
      )
    );

    console.log("");

    console.log(
      "Ashoka branch-specific fee import complete."
    );

    console.log(
      "Fee-waiver branches NOT modified."
    );

    console.log(
      "NIRF data NOT modified."
    );

    console.log(
      "Placement data NOT modified."
    );

    console.log(
      "Branches NOT modified."
    );

    console.log(
      "Recommendation logic NOT modified."
    );

  } catch (error) {
    await client.query(
      "ROLLBACK"
    );

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

    process.exitCode = 1;
  }
);
