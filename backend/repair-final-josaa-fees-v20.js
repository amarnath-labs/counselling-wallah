import { pool } from './src/db/pool.js';

const repairs = [
  {
    college_id:
      'national-institute-of-electronics-and-information-technology-ajmer',

    // Careers360 2026:
    // B.Tech = 50,000 / semester
    tuition_fee_per_semester: 50000,

    source_url:
      'https://www.careers360.com/colleges/national-institute-of-electronics-and-information-technology-ajmer/courses',

    source_kind: 'careers360',
    verification_status: 'review_recommended'
  },

  {
    college_id:
      'institute-of-chemical-technology-mumbai-indian-oil-odisha-campus-bhubaneswar',

    // Shiksha 2026:
    // B.Tech tuition ~= 5.11 lakh for 5 years.
    // Schema has no duration field, so store
    // normalized annual academic fee directly:
    // 511000 / 5 = 102200.
    annual_academic_fee: 102200,

    source_url:
      'https://www.shiksha.com/college/indianoil-odisha-campus-bhubaneswar-institute-of-chemical-technology-mumbai-156219/fees',

    source_kind: 'shiksha',
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

  const annualAcademic =
    repair.annual_academic_fee ?? null;

  if (existing.rows.length) {

    const result =
      await pool.query(`
        UPDATE college_fee_profiles
        SET
          college_name_raw = $2,
          college_name_normalized = $3,

          annual_total_fee = NULL,
          annual_academic_fee = $4,

          total_course_fee = NULL,
          first_semester_fee = NULL,
          academic_fee_per_semester = NULL,

          tuition_fee_per_semester = $5,

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
        annualAcademic,
        tuition,
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

        annual_academic_fee,
        tuition_fee_per_semester,

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
      annualAcademic,
      tuition,
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
  console.log('========================================');
  console.log('CW-REC FINAL JOSAA FEE REPAIR V20.1');
  console.log('========================================');

  await pool.query('BEGIN');

  try {

    const summary = [];

    for (const repair of repairs) {

      const result =
        await saveRepair(repair);

      const expectedAnnual =
        repair.annual_academic_fee ??
        (
          repair.tuition_fee_per_semester
            ? repair.tuition_fee_per_semester * 2
            : null
        );

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
      '✅ FINAL JOSAA FEE REPAIR V20.1 COMMITTED'
    );

  } catch (error) {

    await pool.query('ROLLBACK');

    console.error('');
    console.error(
      '❌ V20.1 FAILED - ROLLED BACK'
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
