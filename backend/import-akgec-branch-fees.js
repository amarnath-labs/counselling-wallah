import "dotenv/config";
import fs from "node:fs/promises";
import { pool } from "./src/db/pool.js";

const INPUT =
  "./akgec-2026-branch-fee-preview.json";

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

  const master =
    preview.branch_fee;

  const variants =
    preview.fee_variants || [];

  if (
    preview.preview_status !==
    "FINAL_READY_FOR_IMPORT"
  ) {
    errors.push(
      "preview not FINAL_READY_FOR_IMPORT"
    );
  }

  if (
    !master?.college_id
  ) {
    errors.push(
      "missing college_id"
    );
  }

  if (
    !master?.branch_id
  ) {
    errors.push(
      "missing branch_id"
    );
  }

  if (
    master?.fee_scope !==
    "branch_specific"
  ) {
    errors.push(
      "fee_scope must be branch_specific"
    );
  }

  if (
    master?.academic_year !==
    2026
  ) {
    errors.push(
      "academic_year must be 2026"
    );
  }

  if (
    !master?.source_url
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
      !Number.isFinite(
        variant.total_fee
      )
    ) {
      errors.push(
        `invalid total_fee for year ${variant.year_of_study}`
      );
    }

    if (
      variant.residence_type !==
      "day_scholar"
    ) {
      errors.push(
        "hostel variant unexpectedly present"
      );
    }

    if (
      variant.room_type !==
      null
    ) {
      errors.push(
        "room_type must be null"
      );
    }

    if (
      variant.verification_status !==
      "verified"
    ) {
      errors.push(
        `unverified variant year ${variant.year_of_study}`
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
    "AKGEC SAFE BRANCH FEE IMPORTER"
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
      "Preview file must contain an array."
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

          category:
            preview.fee_category,

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
      `Safety check failed for ${invalid.length} branch previews.`
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
      const master =
        preview.branch_fee;

      const variants =
        preview.fee_variants;

      console.log(
        "[IMPORT]",
        master.branch_name
      );

      /*
      |--------------------------------------------------------------------------
      | VERIFY COLLEGE
      |--------------------------------------------------------------------------
      */

      const collegeCheck =
        await client.query(
          `
          SELECT id
          FROM colleges
          WHERE id = $1
          `,
          [
            master.college_id
          ]
        );

      if (
        collegeCheck.rowCount === 0
      ) {
        throw new Error(
          `College not found: ${master.college_id}`
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
            name
          FROM branches
          WHERE id = $1
            AND college_id = $2
          `,
          [
            master.branch_id,
            master.college_id
          ]
        );

      if (
        branchCheck.rowCount === 0
      ) {
        throw new Error(
          `Invalid branch mapping: ${master.branch_id}`
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
            master.college_id,
            master.branch_id,
            master.program,
            master.fee_scope,
            master.academic_year
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

      const insertedMaster =
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
            master.college_id,
            master.branch_id,
            master.program,
            master.fee_scope,
            master.academic_year,
            master.source_label,
            master.source_url,
            master.verification_status
          ]
        );

      const branchFeeId =
        insertedMaster.rows[0].id;

      let insertedVariants = 0;

      /*
      |--------------------------------------------------------------------------
      | INSERT VARIANTS
      |--------------------------------------------------------------------------
      */

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

        insertedVariants++;
      }

      summary.push({
        branch_id:
          master.branch_id,

        branch:
          master.branch_name,

        category:
          preview.fee_category,

        replaced,

        variants:
          insertedVariants,

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
      "AKGEC academic fee import complete."
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