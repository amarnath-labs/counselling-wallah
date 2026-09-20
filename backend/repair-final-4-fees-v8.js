import { pool } from './src/db/pool.js';

const repairs = [
  {
    college_id: 'central-university-of-haryana',

    // 2026 secondary-source academic course baseline:
    // Tuition 151200
    // + one-time 8860
    // + other academic fees 97480
    // = 257540
    // Hostel deliberately excluded.
    total_course_fee: 257540,

    source_url:
      'https://www.shiksha.com/university/central-university-of-haryana-haryana-other-32711/fees',

    source_kind: 'shiksha',
    verification_status: 'review_recommended'
  },

  {
    college_id:
      'uptac-centre-for-advance-studies-lucknow',

    // Latest usable published fee schedule:
    // Year 1 = 104775
    // Years 2-4 = 99775 each
    // Total = 404100
    total_course_fee: 404100,

    source_url:
      'https://bodmaseducation.com/colleges/engineering/uptac-counselling',

    // Keep this conservative because it is
    // not an official CAS/AKTU fee document.
    source_kind: 'secondary',
    verification_status: 'review_recommended'
  },

  {
    college_id:
      'uptac-chaudhary-beeri-singh-college-of-engineering-management-agra',

    // Published B.Tech tuition:
    // 72550 x 4 years = 290200
    total_course_fee: 290200,

    source_url:
      'https://collegedunia.com/college/13205-chaudhary-beeri-singh-college-of-engineering-and-management-cbs-agra/courses-fees',

    source_kind: 'collegedunia',
    verification_status: 'review_recommended'
  },

  {
    college_id: 'coep-pune',

    // Official COEP FY B.Tech 2026-27
    // OPEN CAP category payable fee.
    annual_total_fee: 171790,

    source_url:
      'https://www.coeptech.ac.in/wp-content/uploads/2026/07/F.Y.-Btech-and-B.Plann-all-Disciplines-AY2026-27-1.pdf',

    source_kind: 'official',
    verification_status: 'high_confidence'
  }
];

async function main() {
  console.log('');
  console.log('========================================');
  console.log('CW-REC FINAL 4 FEE REPAIR V8');
  console.log('========================================');

  const summary = [];

  await pool.query('BEGIN');

  try {
    for (const repair of repairs) {

      let result;

      if (repair.annual_total_fee !== undefined) {

        result = await pool.query(`
          UPDATE college_fee_profiles
          SET
            annual_total_fee = $1,

            -- Remove known bad/obsolete alternatives
            annual_academic_fee = NULL,
            total_course_fee = NULL,
            first_semester_fee = NULL,
            academic_fee_per_semester = NULL,
            tuition_fee_per_semester = NULL,

            source_url = $2,
            source_kind = $3,
            verification_status = $4,
            updated_at = NOW()

          WHERE college_id = $5
            AND fee_year = 2026

          RETURNING
            college_id,
            annual_total_fee,
            total_course_fee,
            source_kind,
            verification_status
        `, [
          repair.annual_total_fee,
          repair.source_url,
          repair.source_kind,
          repair.verification_status,
          repair.college_id
        ]);

      } else {

        result = await pool.query(`
          UPDATE college_fee_profiles
          SET
            total_course_fee = $1,

            -- Remove old garbage structured values.
            annual_total_fee = NULL,
            annual_academic_fee = NULL,
            first_semester_fee = NULL,
            academic_fee_per_semester = NULL,
            tuition_fee_per_semester = NULL,

            source_url = $2,
            source_kind = $3,
            verification_status = $4,
            updated_at = NOW()

          WHERE college_id = $5
            AND fee_year = 2026

          RETURNING
            college_id,
            annual_total_fee,
            total_course_fee,
            source_kind,
            verification_status
        `, [
          repair.total_course_fee,
          repair.source_url,
          repair.source_kind,
          repair.verification_status,
          repair.college_id
        ]);
      }

      if (!result.rows.length) {
        throw new Error(
          `PROFILE_NOT_FOUND: ${repair.college_id}`
        );
      }

      const row = result.rows[0];

      summary.push({
        college_id: row.college_id,

        status: 'UPDATED',

        stored_fee:
          row.annual_total_fee ??
          row.total_course_fee,

        expected_annual:
          row.annual_total_fee ??
          Math.round(
            Number(row.total_course_fee) / 4
          ),

        source_kind:
          row.source_kind,

        verification_status:
          row.verification_status
      });
    }

    await pool.query('COMMIT');

    console.log('');
    console.table(summary);

    console.log('');
    console.log(
      '✅ FINAL 4 FEE REPAIR COMMITTED'
    );

  } catch (error) {

    await pool.query('ROLLBACK');

    console.error('');
    console.error(
      '❌ REPAIR FAILED - TRANSACTION ROLLED BACK'
    );

    throw error;
  }
}

main()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
