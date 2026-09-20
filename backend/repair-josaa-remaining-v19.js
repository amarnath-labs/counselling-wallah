import { pool } from './src/db/pool.js';

const repairs = [
  {
    college_id:
      'indian-institute-of-information-technology-raichur-karnataka',

    total_course_fee: 1075000,

    source_url:
      'https://www.careers360.com/university/indian-institute-of-information-technology-raichur/fees',

    source_kind: 'careers360',
    verification_status: 'review_recommended'
  },

  {
    college_id:
      'pt-dwarka-prasad-mishra-indian-institute-of-information-technology-design-manufacture-jabalpur',

    tuition_fee_per_semester: 71750,

    source_url:
      'https://www.careers360.com/university/pdpm-indian-institute-of-information-technology-design-and-manufacturing-jabalpur/courses',

    source_kind: 'careers360',
    verification_status: 'review_recommended'
  },

  {
    college_id:
      'national-institute-of-electronics-and-information-technology-gorakhpur',

    tuition_fee_per_semester: 50000,

    source_url:
      'https://www.careers360.com/colleges/national-institute-of-electronics-and-information-technology-gorakhpur/courses',

    source_kind: 'careers360',
    verification_status: 'review_recommended'
  },

  {
    college_id:
      'national-institute-of-electronics-and-information-technology-kohima',

    tuition_fee_per_semester: 50000,

    source_url:
      'https://www.careers360.com/colleges/national-institute-of-electronics-and-information-technology-kohima',

    source_kind: 'careers360',
    verification_status: 'review_recommended'
  },

  {
    college_id:
      'national-institute-of-electronics-and-information-technology-imphal',

    total_course_fee: 400000,

    source_url:
      'https://www.careers360.com/colleges/national-institute-of-electronics-and-information-technology-imphal/fees',

    source_kind: 'careers360',
    verification_status: 'review_recommended'
  },

  {
    college_id:
      'national-institute-of-electronics-and-information-technology-ropar',

    total_course_fee: 400000,

    source_url:
      'https://www.careers360.com/university/national-institute-of-electronics-and-information-technology-ropar/fees',

    source_kind: 'careers360',
    verification_status: 'review_recommended'
  },

  {
    college_id:
      'national-institute-of-electronics-and-information-technology-srinagar',

    total_course_fee: 400000,

    source_url:
      'https://www.careers360.com/colleges/national-institute-of-electronics-and-information-technology-srinagar/fees',

    source_kind: 'careers360',
    verification_status: 'review_recommended'
  }
];

function normalizeCollegeName(value = '') {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function saveRepair(repair) {

  const collegeResult =
    await pool.query(`
      SELECT id, name
      FROM colleges
      WHERE id = $1
      LIMIT 1
    `, [repair.college_id]);

  if (!collegeResult.rows.length) {
    throw new Error(
      `COLLEGE_NOT_FOUND: ${repair.college_id}`
    );
  }

  const college =
    collegeResult.rows[0];

  const normalized =
    normalizeCollegeName(college.name);

  const existing =
    await pool.query(`
      SELECT id
      FROM college_fee_profiles
      WHERE college_id = $1
        AND fee_year = 2026
      LIMIT 1
    `, [repair.college_id]);

  const tuition =
    repair.tuition_fee_per_semester ?? null;

  const totalCourse =
    repair.total_course_fee ?? null;

  if (existing.rows.length) {

    const result =
      await pool.query(`
        UPDATE college_fee_profiles
        SET
          college_name_raw = $2,
          college_name_normalized = $3,

          annual_total_fee = NULL,
          annual_academic_fee = NULL,
          first_semester_fee = NULL,
          academic_fee_per_semester = NULL,

          tuition_fee_per_semester = $4,
          total_course_fee = $5,

          source_url = $6,
          source_kind = $7,
          verification_status = $8,

          updated_at = NOW()

        WHERE college_id = $1
          AND fee_year = 2026

        RETURNING *
      `, [
        repair.college_id,
        college.name,
        normalized,
        tuition,
        totalCourse,
        repair.source_url,
        repair.source_kind,
        repair.verification_status
      ]);

    return {
      status: 'UPDATED',
      row: result.rows[0]
    };
  }

  const result =
    await pool.query(`
      INSERT INTO college_fee_profiles (
        college_id,
        college_name_raw,
        college_name_normalized,

        fee_year,

        tuition_fee_per_semester,
        total_course_fee,

        source_url,
        source_kind,
        verification_status,

        updated_at
      )
      VALUES (
        $1,
        $2,
        $3,

        2026,

        $4,
        $5,

        $6,
        $7,
        $8,

        NOW()
      )

      RETURNING *
    `, [
      repair.college_id,
      college.name,
      normalized,
      tuition,
      totalCourse,
      repair.source_url,
      repair.source_kind,
      repair.verification_status
    ]);

  return {
    status: 'INSERTED',
    row: result.rows[0]
  };
}

async function main() {

  console.log('');
  console.log(
    '========================================'
  );
  console.log(
    'CW-REC JOSAA REMAINING BATCH V19'
  );
  console.log(
    '========================================'
  );

  await pool.query('BEGIN');

  try {

    const summary = [];

    for (const repair of repairs) {

      const result =
        await saveRepair(repair);

      const expectedAnnual =
        repair.tuition_fee_per_semester
          ? repair.tuition_fee_per_semester * 2
          : repair.total_course_fee / 4;

      summary.push({
        college_id:
          repair.college_id,

        status:
          result.status,

        expected_annual:
          expectedAnnual,

        source_kind:
          repair.source_kind,

        verification_status:
          repair.verification_status
      });
    }

    await pool.query('COMMIT');

    console.log('');
    console.table(summary);

    console.log('');
    console.log(
      '✅ JOSAA BATCH V19 COMMITTED'
    );

  } catch (error) {

    await pool.query('ROLLBACK');

    console.error('');
    console.error(
      '❌ V19 FAILED - ROLLED BACK'
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
