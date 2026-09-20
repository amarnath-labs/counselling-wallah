import 'dotenv/config';
import fs from 'node:fs/promises';
import { pool } from './src/db/pool.js';

const INPUT =
  './nit-delhi-fee-preview.json';

async function main() {
  console.log('');
  console.log('=======================================');
  console.log('IMPORT NIT DELHI FEE VARIANTS');
  console.log('=======================================');
  console.log('');

  const raw =
    await fs.readFile(
      INPUT,
      'utf8'
    );

  const data =
    JSON.parse(
      raw.replace(/^\uFEFF/, '')
    );

  const client =
    await pool.connect();

  try {
    await client.query('BEGIN');

    /*
    ---------------------------------------
    REMOVE OLD PILOT RECORD ONLY
    ---------------------------------------
    */

    const oldRows =
      await client.query(
        `
        SELECT id
        FROM branch_fees
        WHERE college_id = $1
          AND program = $2
          AND fee_scope = $3
          AND academic_year = $4
        `,
        [
          data.branch_fee.college_id,
          data.branch_fee.program,
          data.branch_fee.fee_scope,
          data.branch_fee.academic_year
        ]
      );

    for (const row of oldRows.rows) {
      await client.query(
        `
        DELETE FROM branch_fees
        WHERE id = $1
        `,
        [row.id]
      );
    }

    /*
    ---------------------------------------
    MASTER RECORD
    ---------------------------------------
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
          data.branch_fee.college_id,
          data.branch_fee.branch_id,
          data.branch_fee.program,
          data.branch_fee.fee_scope,
          data.branch_fee.academic_year,
          data.branch_fee.source_label,
          data.branch_fee.source_url,
          data.branch_fee.verification_status
        ]
      );

    const branchFeeId =
      master.rows[0].id;

    let insertedVariants = 0;

    /*
    ---------------------------------------
    VARIANTS
    ---------------------------------------
    */

    for (
      const variant
      of data.fee_variants
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

    await client.query('COMMIT');

    console.log('');
    console.log('---------------------------------------');
    console.log('IMPORT SUMMARY');
    console.log('---------------------------------------');

    console.table([
      {
        status: 'Branch fee master',
        count: 1
      },
      {
        status: 'Fee variants inserted',
        count: insertedVariants
      }
    ]);

    console.log('');
    console.log(
      'NIT Delhi pilot import complete.'
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
    await client.query('ROLLBACK');

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
