import { pool } from './src/db/pool.js';
import {
  resolveCollegeAnnualFee
} from './src/services/feeResolver.js';

async function main() {
  console.log('');
  console.log('========================================');
  console.log('CW-REC FEE CONFLICT INSPECTOR V4');
  console.log('========================================');

  const result = await pool.query(`
    SELECT
      fp.*,
      c.name AS college
    FROM college_fee_profiles fp
    INNER JOIN colleges c
      ON c.id = fp.college_id
    ORDER BY c.name
  `);

  const conflicts = [];
  const rejected = [];

  for (const row of result.rows) {
    const resolved =
      resolveCollegeAnnualFee(row);

    if (
      resolved.reason ===
      'CONFLICTING_FEE_VALUES'
    ) {
      conflicts.push({
        college_id: row.college_id,
        college: row.college,

        fee_year: row.fee_year,

        annual_total_fee:
          row.annual_total_fee,

        annual_academic_fee:
          row.annual_academic_fee,

        total_course_fee:
          row.total_course_fee,

        first_semester_fee:
          row.first_semester_fee,

        academic_fee_per_semester:
          row.academic_fee_per_semester,

        tuition_fee_per_semester:
          row.tuition_fee_per_semester,

        resolved_annual_fee:
          resolved.annualFee,

        selected_method:
          resolved.method,

        source_kind:
          row.source_kind,

        verification_status:
          row.verification_status,

        source_url:
          row.source_url
      });
    }

    if (
      resolved.reason ===
      'NO_PLAUSIBLE_ANNUAL_FEE'
    ) {
      rejected.push({
        college_id: row.college_id,
        college: row.college,

        fee_year: row.fee_year,

        annual_total_fee:
          row.annual_total_fee,

        annual_academic_fee:
          row.annual_academic_fee,

        total_course_fee:
          row.total_course_fee,

        first_semester_fee:
          row.first_semester_fee,

        academic_fee_per_semester:
          row.academic_fee_per_semester,

        tuition_fee_per_semester:
          row.tuition_fee_per_semester,

        source_kind:
          row.source_kind,

        verification_status:
          row.verification_status,

        source_url:
          row.source_url
      });
    }
  }

  console.log('');
  console.log(
    '=== TRUE CONFLICTING FEE PROFILES ==='
  );
  console.table(conflicts);

  console.log('');
  console.log(
    'Conflict count:',
    conflicts.length
  );

  console.log('');
  console.log(
    '=== REJECTED / NEED NEW FEE DATA ==='
  );
  console.table(rejected);

  console.log('');
  console.log(
    'Rejected count:',
    rejected.length
  );

  console.log('');
  console.log('========================================');
  console.log(
    '✅ FEE CONFLICT INSPECTOR V4 COMPLETE'
  );
  console.log('========================================');
}

main()
  .catch(error => {
    console.error(
      '\nFEE V4 ERROR:\n',
      error
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
