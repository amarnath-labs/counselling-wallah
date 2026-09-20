import 'dotenv/config';
import fs from 'node:fs/promises';

import { pool } from './src/db/pool.js';

const FILES = [
  './nit-delhi-fee-preview.json',
  './iit-mandi-fee-preview.json',
  './abv-iiitm-gwalior-fee-preview.json',
  './iiit-allahabad-fee-preview.json',
  './iiitdm-kancheepuram-fee-preview.json',
  './nit-mizoram-fee-preview.json',
  './nit-sikkim-fee-preview.json',
  './nit-rourkela-fee-preview.json',
  './iit-goa-fee-preview.json'
];

async function loadJson(file) {
  const raw =
    await fs.readFile(
      file,
      'utf8'
    );

  return JSON.parse(
    raw.replace(/^\uFEFF/, '')
  );
}

async function main() {
  console.log('');
  console.log(
    '======================================='
  );

  console.log(
    'BTECH FEE PREVIEW IMPORTER'
  );

  console.log(
    '======================================='
  );

  console.log('');

  const client =
    await pool.connect();

  const summary = [];

  try {
    await client.query(
      'BEGIN'
    );

    for (const file of FILES) {
      console.log(
        `[IMPORT] Reading ${file}`
      );

      const data =
        await loadJson(file);

      const branchFee =
        data.branch_fee;

      const variants =
        data.fee_variants || [];

      /*
      |--------------------------------------------------------------------------
      | SKIP EMPTY / INVALID PREVIEWS
      |--------------------------------------------------------------------------
      */

      if (
        !branchFee ||
        variants.length === 0
      ) {
        summary.push({
          college_id:
            branchFee?.college_id ||
            file,

          academic_year:
            branchFee?.academic_year ||
            null,

          status:
            'skipped_no_variants',

          replaced:
            0,

          variants:
            0
        });

        continue;
      }

      /*
      |--------------------------------------------------------------------------
      | BASIC MASTER VALIDATION
      |--------------------------------------------------------------------------
      */

      if (!branchFee.college_id) {
        throw new Error(
          `college_id missing in ${file}`
        );
      }

      if (!branchFee.program) {
        throw new Error(
          `program missing in ${file}`
        );
      }

      if (!branchFee.fee_scope) {
        throw new Error(
          `fee_scope missing in ${file}`
        );
      }

      if (!branchFee.academic_year) {
        throw new Error(
          `academic_year missing in ${file}`
        );
      }

      /*
      |--------------------------------------------------------------------------
      | DELETE SAME COLLEGE + PROGRAM + YEAR + SCOPE ONLY
      |--------------------------------------------------------------------------
      |
      | This keeps importer idempotent.
      | Existing same preview is replaced instead of duplicated.
      |--------------------------------------------------------------------------
      */

      const existing =
        await client.query(
          `
          SELECT id
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

      let deletedExisting = 0;

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

        deletedExisting++;
      }

      /*
      |--------------------------------------------------------------------------
      | INSERT BRANCH FEE MASTER
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
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8
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

      let inserted = 0;

      /*
      |--------------------------------------------------------------------------
      | INSERT VARIANTS
      |--------------------------------------------------------------------------
      */

      for (
        const variant
        of variants
      ) {
        /*
        |--------------------------------------------------------------------------
        | SEMESTER VALIDATION
        |--------------------------------------------------------------------------
        */

        if (
          variant.semester !== null &&
          variant.semester !== undefined
        ) {
          const semester =
            Number(
              variant.semester
            );

          if (
            !Number.isInteger(
              semester
            ) ||
            semester < 1 ||
            semester > 12
          ) {
            throw new Error(
              `Invalid semester ${variant.semester} in ${file}`
            );
          }
        }

        /*
        |--------------------------------------------------------------------------
        | MONEY VALIDATION
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
            value !== undefined
          ) {
            const numericValue =
              Number(value);

            if (
              !Number.isFinite(
                numericValue
              ) ||
              numericValue < 0
            ) {
              throw new Error(
                `Invalid ${field}=${value} in ${file}`
              );
            }
          }
        }

        /*
        |--------------------------------------------------------------------------
        | INCOME VALIDATION
        |--------------------------------------------------------------------------
        */

        if (
          variant.income_min !== null &&
          variant.income_min !== undefined &&
          Number(
            variant.income_min
          ) < 0
        ) {
          throw new Error(
            `Invalid income_min in ${file}`
          );
        }

        if (
          variant.income_max !== null &&
          variant.income_max !== undefined &&
          Number(
            variant.income_max
          ) < 0
        ) {
          throw new Error(
            `Invalid income_max in ${file}`
          );
        }

        if (
          variant.income_min !== null &&
          variant.income_min !== undefined &&
          variant.income_max !== null &&
          variant.income_max !== undefined &&
          Number(
            variant.income_min
          ) >
          Number(
            variant.income_max
          )
        ) {
          throw new Error(
            `income_min > income_max in ${file}`
          );
        }

        /*
        |--------------------------------------------------------------------------
        | INSERT VARIANT
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
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8,
            $9,
            $10,
            $11,
            $12,
            $13,
            $14,
            $15,
            $16,
            $17,
            $18
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

      /*
      |--------------------------------------------------------------------------
      | SUMMARY
      |--------------------------------------------------------------------------
      */

      summary.push({
        college_id:
          branchFee.college_id,

        academic_year:
          branchFee.academic_year,

        status:
          'imported',

        replaced:
          deletedExisting,

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

    const totalVariants =
      summary.reduce(
        (
          sum,
          row
        ) =>
          sum +
          Number(
            row.variants || 0
          ),
        0
      );

    console.log('');

    console.log(
      'Total variants imported:',
      totalVariants
    );

    console.log('');

    console.log(
      'B.Tech fee preview import complete.'
    );

    console.log(
      'Existing same college/program/year/scope records were replaced.'
    );

    console.log(
      'Existing NIRF data NOT modified.'
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
    /*
    |--------------------------------------------------------------------------
    | ROLLBACK EVERYTHING IF ANY FILE FAILS
    |--------------------------------------------------------------------------
    */

    await client.query(
      'ROLLBACK'
    );

    console.error('');

    console.error(
      'IMPORT ROLLED BACK.'
    );

    throw error;

  } finally {
    client.release();
  }
}

main()
  .catch(
    error => {
      console.error(
        'FAILED:',
        error.message
      );

      process.exitCode = 1;
    }
  )
  .finally(
    async () => {
      await pool.end();
    }
  );