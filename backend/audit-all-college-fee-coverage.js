import 'dotenv/config';
import fs from 'node:fs/promises';

import { pool } from './src/db/pool.js';

const OUTPUT =
  './all-college-fee-coverage.json';

const MISSING_OUTPUT =
  './all-colleges-missing-fees.json';

async function main() {
  console.log('');
  console.log(
    '======================================='
  );

  console.log(
    'ALL COLLEGE FEE COVERAGE AUDIT'
  );

  console.log(
    '======================================='
  );

  console.log('');

  const client =
    await pool.connect();

  try {
    /*
    |--------------------------------------------------------------------------
    | GET ALL COLLEGES + FEE COVERAGE
    |--------------------------------------------------------------------------
    */

    const result =
      await client.query(
        `
        SELECT
          c.id AS college_id,
          c.name AS college_name,

          COUNT(
            DISTINCT bf.id
          )::int AS fee_masters,

          COUNT(
            DISTINCT fv.id
          )::int AS fee_variants,

          MAX(
            bf.academic_year
          ) AS latest_fee_year,

          BOOL_OR(
            bf.verification_status = 'verified'
          ) AS has_verified_fee

        FROM colleges c

        LEFT JOIN branch_fees bf
          ON bf.college_id = c.id

        LEFT JOIN fee_variants fv
          ON fv.branch_fee_id = bf.id

        GROUP BY
          c.id,
          c.name

        ORDER BY
          c.name
        `
      );

    const rows =
      result.rows;

    /*
    |--------------------------------------------------------------------------
    | CLASSIFY
    |--------------------------------------------------------------------------
    */

    const coverage =
      rows.map(
        row => {
          const feeMasters =
            Number(
              row.fee_masters || 0
            );

          const feeVariants =
            Number(
              row.fee_variants || 0
            );

          let status;

          if (
            feeMasters > 0 &&
            feeVariants > 0 &&
            row.has_verified_fee === true
          ) {
            status =
              'COMPLETE_VERIFIED';

          } else if (
            feeMasters > 0 &&
            feeVariants > 0
          ) {
            status =
              'HAS_FEE_PENDING_REVIEW';

          } else {
            status =
              'MISSING_FEE';
          }

          return {
            college_id:
              row.college_id,

            college_name:
              row.college_name,

            fee_masters:
              feeMasters,

            fee_variants:
              feeVariants,

            latest_fee_year:
              row.latest_fee_year,

            has_verified_fee:
              row.has_verified_fee === true,

            status
          };
        }
      );

    const missing =
      coverage.filter(
        row =>
          row.status ===
          'MISSING_FEE'
      );

    const verified =
      coverage.filter(
        row =>
          row.status ===
          'COMPLETE_VERIFIED'
      );

    const pending =
      coverage.filter(
        row =>
          row.status ===
          'HAS_FEE_PENDING_REVIEW'
      );

    /*
    |--------------------------------------------------------------------------
    | SAVE FILES
    |--------------------------------------------------------------------------
    */

    await fs.writeFile(
      OUTPUT,
      JSON.stringify(
        coverage,
        null,
        2
      ),
      'utf8'
    );

    await fs.writeFile(
      MISSING_OUTPUT,
      JSON.stringify(
        missing,
        null,
        2
      ),
      'utf8'
    );

    /*
    |--------------------------------------------------------------------------
    | SUMMARY
    |--------------------------------------------------------------------------
    */

    console.log(
      'FEE COVERAGE SUMMARY'
    );

    console.table([
      {
        status:
          'Total colleges',

        count:
          coverage.length
      },

      {
        status:
          'Complete verified',

        count:
          verified.length
      },

      {
        status:
          'Has fee pending review',

        count:
          pending.length
      },

      {
        status:
          'Missing fee',

        count:
          missing.length
      }
    ]);

    console.log('');

    console.log(
      'COLLEGES WITH FEE'
    );

    console.table(
      coverage
        .filter(
          row =>
            row.fee_variants > 0
        )
        .map(
          row => ({
            college:
              row.college_name,

            year:
              row.latest_fee_year,

            variants:
              row.fee_variants,

            verified:
              row.has_verified_fee,

            status:
              row.status
          })
        )
    );

    console.log('');

    console.log(
      'Saved:',
      OUTPUT
    );

    console.log(
      'Saved:',
      MISSING_OUTPUT
    );

    console.log('');

    console.log(
      'DATABASE HAS NOT BEEN MODIFIED.'
    );

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
