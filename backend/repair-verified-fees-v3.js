import { pool } from './src/db/pool.js';

const updates = [
  {
    college_id:
      'uptac-ajay-kumar-garg-engg-college-ghaziabad',

    annual_academic_fee:
      142156,

    source_url:
      'https://www.akgec.ac.in/wp-content/uploads/2026/06/B-Tech-Ist-Year-2026-27_0001.pdf',

    verification_status:
      'high_confidence'
  },

  {
    college_id:
      'uptac-bundelkhand-institute-of-engineering-technology-jhansi',

    annual_academic_fee:
      61800,

    source_url:
      'https://bietjhs.ac.in/public/media/files/153609Fees-Structure-New_290626.pdf',

    verification_status:
      'high_confidence'
  },

  {
    college_id:
      'national-institute-of-technology-goa',

    tuition_fee_per_semester:
      62500,

    source_url:
      'https://www.nitgoa.ac.in/admissions/josaa.html',

    verification_status:
      'high_confidence'
  }
];

async function main() {
  console.log('');
  console.log('========================================');
  console.log('CW-REC VERIFIED DOCUMENT REPAIR V3');
  console.log('========================================');

  const summary = [];

  for (const item of updates) {

    if (
      item.annual_academic_fee !== undefined
    ) {
      const result =
        await pool.query(`
          UPDATE college_fee_profiles
          SET
            annual_academic_fee = $1,
            source_url = $2,
            source_kind = 'official',
            verification_status = $3,
            updated_at = NOW()
          WHERE college_id = $4
            AND fee_year = 2026
          RETURNING college_id
        `, [
          item.annual_academic_fee,
          item.source_url,
          item.verification_status,
          item.college_id
        ]);

      summary.push({
        college_id:
          item.college_id,

        status:
          result.rows.length
            ? 'UPDATED'
            : 'NOT_FOUND',

        annual_fee:
          item.annual_academic_fee
      });
    }

    if (
      item.tuition_fee_per_semester !== undefined
    ) {
      const result =
        await pool.query(`
          UPDATE college_fee_profiles
          SET
            tuition_fee_per_semester = $1,
            source_url = $2,
            source_kind = 'official',
            verification_status = $3,
            updated_at = NOW()
          WHERE college_id = $4
            AND fee_year = 2026
          RETURNING college_id
        `, [
          item.tuition_fee_per_semester,
          item.source_url,
          item.verification_status,
          item.college_id
        ]);

      summary.push({
        college_id:
          item.college_id,

        status:
          result.rows.length
            ? 'UPDATED'
            : 'NOT_FOUND',

        annual_fee:
          item.tuition_fee_per_semester * 2
      });
    }
  }

  console.table(summary);

  console.log('');
  console.log(
    '✅ VERIFIED DOCUMENT REPAIR V3 COMPLETE'
  );
}

main()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
