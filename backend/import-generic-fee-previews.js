import 'dotenv/config';
import fs from 'node:fs/promises';

import { pool } from './src/db/pool.js';

const INPUT =
  './fee-pilot-batch-01-db-previews-final-safe.json';


async function loadJson(file) {
  const raw =
    await fs.readFile(
      file,
      'utf8'
    );

  return JSON.parse(
    raw.replace(
      /^\uFEFF/,
      ''
    )
  );
}


function isAllowedRoomType(value) {
  return (
    value === null ||
    value === 'AC' ||
    value === 'non_AC' ||
    value === 'double_sharing' ||
    value === 'single_occupancy'
  );
}


function validatePreview(
  preview
) {
  const errors = [];

  const branchFee =
    preview.branch_fee;

  const variants =
    preview.fee_variants || [];


  /*
  |--------------------------------------------------------------------------
  | PREVIEW STATUS
  |--------------------------------------------------------------------------
  */

  if (
    preview.preview_status !==
    'FINAL_READY_FOR_IMPORT'
  ) {
    errors.push(
      'PREVIEW_NOT_FINAL_READY'
    );
  }


  /*
  |--------------------------------------------------------------------------
  | BRANCH FEE MASTER
  |--------------------------------------------------------------------------
  */

  if (
    !branchFee?.college_id
  ) {
    errors.push(
      'MISSING_COLLEGE_ID'
    );
  }


  if (
    !branchFee?.program
  ) {
    errors.push(
      'MISSING_PROGRAM'
    );
  }


  if (
    branchFee?.program !==
    'B.Tech'
  ) {
    errors.push(
      'PROGRAM_NOT_BTECH'
    );
  }


  /*
  |--------------------------------------------------------------------------
  | SCOPE / BRANCH SAFETY
  |--------------------------------------------------------------------------
  |
  | DB requires:
  |
  | all_btech_branches -> branch_id NULL
  | branch_specific    -> branch_id NOT NULL
  |--------------------------------------------------------------------------
  */

  if (
    branchFee?.fee_scope ===
      'all_btech_branches' &&
    branchFee?.branch_id !==
      null
  ) {
    errors.push(
      'ALL_BTECH_SCOPE_REQUIRES_NULL_BRANCH'
    );
  }


  if (
    branchFee?.fee_scope ===
      'branch_specific' &&
    (
      branchFee?.branch_id ===
        null ||
      branchFee?.branch_id ===
        undefined
    )
  ) {
    errors.push(
      'BRANCH_SPECIFIC_REQUIRES_BRANCH_ID'
    );
  }


  if (
    ![
      'all_btech_branches',
      'branch_specific'
    ].includes(
      branchFee?.fee_scope
    )
  ) {
    errors.push(
      'INVALID_FEE_SCOPE'
    );
  }


  /*
  |--------------------------------------------------------------------------
  | SOURCE
  |--------------------------------------------------------------------------
  */

  if (
    !branchFee?.source_url
  ) {
    errors.push(
      'MISSING_SOURCE_URL'
    );
  }


  if (
    !branchFee?.source_label
  ) {
    errors.push(
      'MISSING_SOURCE_LABEL'
    );
  }


  /*
  |--------------------------------------------------------------------------
  | YEAR
  |--------------------------------------------------------------------------
  */

  if (
    !Number.isInteger(
      branchFee?.academic_year
    )
  ) {
    errors.push(
      'INVALID_ACADEMIC_YEAR'
    );
  }


  /*
  |--------------------------------------------------------------------------
  | VARIANTS
  |--------------------------------------------------------------------------
  */

  if (
    !Array.isArray(
      variants
    ) ||
    variants.length ===
      0
  ) {
    errors.push(
      'NO_VARIANTS'
    );
  }


  /*
  |--------------------------------------------------------------------------
  | VARIANT VALIDATION
  |--------------------------------------------------------------------------
  */

  for (
    let index = 0;
    index < variants.length;
    index++
  ) {
    const variant =
      variants[index];


    if (
      variant.fee_period !== null &&
      ![
        'semester',
        'annual'
      ].includes(
        variant.fee_period
      )
    ) {
      errors.push(
        `INVALID_FEE_PERIOD_AT_${index}`
      );
    }


    if (
      variant.residence_type !== null &&
      ![
        'day_scholar',
        'hosteller'
      ].includes(
        variant.residence_type
      )
    ) {
      errors.push(
        `INVALID_RESIDENCE_AT_${index}`
      );
    }


    if (
      !isAllowedRoomType(
        variant.room_type
      )
    ) {
      errors.push(
        `INVALID_ROOM_TYPE_AT_${index}:${variant.room_type}`
      );
    }


    /*
    |--------------------------------------------------------------------------
    | DAY SCHOLAR MUST NOT HAVE ROOM TYPE
    |--------------------------------------------------------------------------
    */

    if (
      variant.residence_type ===
        'day_scholar' &&
      variant.room_type !==
        null
    ) {
      errors.push(
        `DAY_SCHOLAR_ROOM_TYPE_AT_${index}`
      );
    }


    /*
    |--------------------------------------------------------------------------
    | MONEY MUST NOT BE NEGATIVE
    |--------------------------------------------------------------------------
    */

    const moneyFields = [
      'tuition_fee',
      'admission_fee',
      'institute_fee',
      'hostel_fee',
      'mess_fee',
      'caution_deposit',
      'other_fee',
      'total_fee'
    ];


    for (
      const field
      of moneyFields
    ) {
      const value =
        variant[field];

      if (
        value !== null &&
        value !== undefined &&
        (
          !Number.isFinite(
            Number(value)
          ) ||
          Number(value) < 0
        )
      ) {
        errors.push(
          `INVALID_${field.toUpperCase()}_AT_${index}`
        );
      }
    }


    /*
    |--------------------------------------------------------------------------
    | FEE WAIVER
    |--------------------------------------------------------------------------
    */

    if (
      variant.student_category ===
        'FEE_WAIVER' &&
      Number(
        variant.tuition_fee
      ) !== 0
    ) {
      errors.push(
        `FEE_WAIVER_TUITION_NOT_ZERO_AT_${index}`
      );
    }


    /*
    |--------------------------------------------------------------------------
    | TOTAL >= TUITION
    |--------------------------------------------------------------------------
    */

    if (
      variant.total_fee !==
        null &&
      variant.tuition_fee !==
        null &&
      Number(
        variant.total_fee
      ) <
      Number(
        variant.tuition_fee
      )
    ) {
      errors.push(
        `TOTAL_BELOW_TUITION_AT_${index}`
      );
    }
  }


  return [
    ...new Set(
      errors
    )
  ];
}


async function main() {
  console.log('');

  console.log(
    '======================================='
  );

  console.log(
    'GENERIC BTECH FEE IMPORTER - SAFE'
  );

  console.log(
    '======================================='
  );

  console.log('');


  /*
  |--------------------------------------------------------------------------
  | LOAD SAFE PREVIEWS
  |--------------------------------------------------------------------------
  */

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
      'Input JSON must contain an array.'
    );
  }


  if (
    previews.length ===
    0
  ) {
    throw new Error(
      'Input preview file is empty.'
    );
  }


  /*
  |--------------------------------------------------------------------------
  | PRE-IMPORT VALIDATION
  |--------------------------------------------------------------------------
  */

  console.log(
    'PRE-IMPORT SAFETY CHECK'
  );

  console.log('');


  const validationSummary =
    previews.map(
      preview => {
        const errors =
          validatePreview(
            preview
          );

        return {
          college:
            preview.college_name,

          scope:
            preview.branch_fee
              ?.fee_scope,

          branch_id:
            preview.branch_fee
              ?.branch_id,

          year:
            preview.branch_fee
              ?.academic_year,

          variants:
            preview.fee_variants
              ?.length || 0,

          errors:
            errors.join(','),

          valid:
            errors.length ===
              0
        };
      }
    );


  console.table(
    validationSummary
  );


  const invalidPreviews =
    validationSummary.filter(
      row =>
        !row.valid
    );


  if (
    invalidPreviews.length >
    0
  ) {
    throw new Error(
      `${invalidPreviews.length} preview(s) failed pre-import validation.`
    );
  }


  console.log('');

  console.log(
    'PRE-IMPORT SAFETY CHECK: PASS'
  );

  console.log('');


  /*
  |--------------------------------------------------------------------------
  | DATABASE TRANSACTION
  |--------------------------------------------------------------------------
  */

  const client =
    await pool.connect();


  const summary = [];


  try {
    await client.query(
      'BEGIN'
    );


    for (
      const preview
      of previews
    ) {
      const branchFee =
        preview.branch_fee;

      const variants =
        preview.fee_variants ||
        [];


      console.log(
        '[IMPORT]',
        preview.college_name
      );


      /*
      |--------------------------------------------------------------------------
      | CONFIRM COLLEGE EXISTS
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
        collegeCheck.rowCount ===
        0
      ) {
        throw new Error(
          `College not found in DB: ${branchFee.college_id}`
        );
      }


      /*
      |--------------------------------------------------------------------------
      | FIND SAME EXISTING MASTER
      |--------------------------------------------------------------------------
      */

      const existing =
        await client.query(
          `
          SELECT
            id
          FROM branch_fees
          WHERE college_id = $1
            AND program = $2
            AND fee_scope = $3
            AND academic_year = $4
            AND (
              branch_id = $5
              OR (
                branch_id IS NULL
                AND $5::BIGINT IS NULL
              )
            )
          `,
          [
            branchFee.college_id,
            branchFee.program,
            branchFee.fee_scope,
            branchFee.academic_year,
            branchFee.branch_id
          ]
        );


      let replaced = 0;


      /*
      |--------------------------------------------------------------------------
      | REPLACE ONLY SAME COLLEGE/PROGRAM/YEAR/SCOPE
      |--------------------------------------------------------------------------
      */

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
        college_id:
          branchFee.college_id,

        college:
          preview.college_name,

        academic_year:
          branchFee.academic_year,

        fee_scope:
          branchFee.fee_scope,

        status:
          'imported',

        replaced,

        variants:
          inserted
      });
    }


    /*
    |--------------------------------------------------------------------------
    | COMMIT
    |--------------------------------------------------------------------------
    */

    await client.query(
      'COMMIT'
    );


    console.log('');

    console.log(
      '---------------------------------------'
    );

    console.log(
      'IMPORT SUMMARY'
    );

    console.log(
      '---------------------------------------'
    );


    console.table(
      summary
    );


    console.log('');


    console.log(
      'Total colleges imported:',
      summary.length
    );


    console.log(
      'Total variants imported:',
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


    console.log('');


    console.log(
      'Generic B.Tech fee import complete.'
    );


    console.log(
      'NIRF data NOT modified.'
    );


    console.log(
      'Placement data NOT modified.'
    );


    console.log(
      'Branches NOT modified.'
    );


    console.log(
      'Recommendation logic NOT modified.'
    );


  } catch (error) {

    await client.query(
      'ROLLBACK'
    );


    console.log('');

    console.log(
      'TRANSACTION ROLLED BACK.'
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
      'FAILED:',
      error.message
    );


    process.exitCode = 1;
  }
);