import { pool } from './src/db/pool.js';

const updates = [
  {
    college_id:
      'uptac-abss-institute-of-technology-meerut-meerut',
    source_url:
      'https://www.abss.edu.in/content.php?c=l&id=38',
    source_kind:
      'official'
  },

  {
    college_id:
      'uptac-ajay-kumar-garg-engg-college-ghaziabad',
    source_url:
      'https://www.akgec.ac.in/fee-new-students/',
    source_kind:
      'official'
  },

  {
    college_id:
      'uptac-bundelkhand-institute-of-engineering-technology-jhansi',
    source_url:
      'https://bietjhs.ac.in/pages/student-corner',
    source_kind:
      'official'
  },

  {
    college_id:
      'coep-pune',
    source_url:
      'https://www.coeptech.ac.in/useful-links/university-sections/ac-section/fees-structure-1/',
    source_kind:
      'official'
  },

  {
    college_id:
      'national-institute-of-technology-goa',
    source_url:
      'https://iitgoa.ac.in/btech_fee_structure/',
    source_kind:
      'official'
  }
];

async function main() {
  console.log('');
  console.log('========================================');
  console.log('CW-REC SOURCE REPAIR V2');
  console.log('========================================');

  const summary = [];

  for (const item of updates) {
    const result = await pool.query(`
      UPDATE college_fee_profiles
      SET
        source_url = $1,
        source_kind = $2,
        verification_status = 'review_recommended',
        updated_at = NOW()
      WHERE college_id = $3
        AND fee_year = 2026
      RETURNING
        college_id,
        source_url,
        source_kind
    `, [
      item.source_url,
      item.source_kind,
      item.college_id
    ]);

    if (result.rows.length) {
      summary.push({
        college_id: item.college_id,
        status: 'UPDATED',
        source_kind: item.source_kind,
        source_url: item.source_url
      });
    } else {
      summary.push({
        college_id: item.college_id,
        status: 'NOT_FOUND'
      });
    }
  }

  console.table(summary);

  console.log('');
  console.log('✅ SOURCE REPAIR V2 COMPLETE');
}

main()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
