import { pool } from './src/db/pool.js';

const repairs = [
  {
    college_id: 'mnit-jaipur',
    tuition_fee_per_semester: 62500,
    source_url:
      'https://www.mnit.ac.in/cms/uploads/2026/05/Fee_UG_2026-27.pdf',
    source_kind: 'official',
    verification_status: 'high_confidence'
  },

  {
    college_id:
      'rajiv-gandhi-national-aviation-university-fursatganj-amethi',
    academic_fee_per_semester: 95000,
    source_url:
      'https://www.rgnau.ac.in/en/btech-admission-notice-2026-27.html',
    source_kind: 'official',
    verification_status: 'high_confidence'
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

async function ensureProfile(repair) {

  const collegeResult =
    await pool.query(`
      SELECT id, name
      FROM colleges
      WHERE id = $1
      LIMIT 1
    `, [
      repair.college_id
    ]);

  if (!collegeResult.rows.length) {
    throw new Error(
      `COLLEGE_NOT_FOUND: ${repair.college_id}`
    );
  }

  const college =
    collegeResult.rows[0];

  const normalizedName =
    normalizeCollegeName(college.name);

  const existing =
    await pool.query(`
      SELECT college_id
      FROM college_fee_profiles
      WHERE college_id = $1
        AND fee_year = 2026
      LIMIT 1
    `, [
      repair.college_id
    ]);

  if (!existing.rows.length) {

    const inserted =
      await pool.query(`
        INSERT INTO college_fee_profiles (
          college_id,
          college_name_raw,
          college_name_normalized,
          fee_year,

          tuition_fee_per_semester,
          academic_fee_per_semester,

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

        RETURNING
          college_id,
          college_name_raw,
          college_name_normalized,
          fee_year,
          tuition_fee_per_semester,
          academic_fee_per_semester,
          source_kind,
          verification_status
      `, [
        repair.college_id,
        college.name,
        normalizedName,

        repair.tuition_fee_per_semester
          ?? null,

        repair.academic_fee_per_semester
          ?? null,

        repair.source_url,
        repair.source_kind,
        repair.verification_status
      ]);

    return {
      status: 'INSERTED',
      row: inserted.rows[0]
    };
  }

  const updated =
    await pool.query(`
      UPDATE college_fee_profiles
      SET
        college_name_raw =
          COALESCE(
            NULLIF(college_name_raw, ''),
            $2
          ),

        college_name_normalized =
          COALESCE(
            NULLIF(college_name_normalized, ''),
            $3
          ),

        annual_total_fee = NULL,
        annual_academic_fee = NULL,
        total_course_fee = NULL,
        first_semester_fee = NULL,

        tuition_fee_per_semester = $4,
        academic_fee_per_semester = $5,

        source_url = $6,
        source_kind = $7,
        verification_status = $8,

        updated_at = NOW()

      WHERE college_id = $1
        AND fee_year = 2026

      RETURNING
        college_id,
        college_name_raw,
        college_name_normalized,
        fee_year,
        tuition_fee_per_semester,
        academic_fee_per_semester,
        source_kind,
        verification_status
    `, [
      repair.college_id,
      college.name,
      normalizedName,

      repair.tuition_fee_per_semester
        ?? null,

      repair.academic_fee_per_semester
        ?? null,

      repair.source_url,
      repair.source_kind,
      repair.verification_status
    ]);

  return {
    status: 'UPDATED',
    row: updated.rows[0]
  };
}

async function main() {

  console.log('');
  console.log(
    '========================================'
  );
  console.log(
    'CW-REC MNIT + RGNAU REPAIR V16.2'
  );
  console.log(
    '========================================'
  );

  await pool.query('BEGIN');

  try {

    const summary = [];

    for (const repair of repairs) {

      const result =
        await ensureProfile(repair);

      const annualFee =
        repair.academic_fee_per_semester
          ? repair.academic_fee_per_semester * 2
          : repair.tuition_fee_per_semester * 2;

      summary.push({
        college_id:
          repair.college_id,

        status:
          result.status,

        college_name_raw:
          result.row.college_name_raw,

        expected_annual:
          annualFee,

        source_kind:
          result.row.source_kind,

        verification_status:
          result.row.verification_status
      });
    }

    await pool.query('COMMIT');

    console.log('');
    console.table(summary);

    console.log('');
    console.log(
      '✅ MNIT + RGNAU REPAIR COMMITTED'
    );

  } catch (error) {

    await pool.query('ROLLBACK');

    console.error('');
    console.error(
      '❌ REPAIR FAILED - ROLLED BACK'
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
