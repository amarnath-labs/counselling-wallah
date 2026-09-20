import { pool } from './src/db/pool.js';

function normalizeCollegeName(value = '') {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function main() {

  const collegeId =
    'national-institute-of-electronics-and-information-technology-patna';

  const collegeResult =
    await pool.query(`
      SELECT id, name
      FROM colleges
      WHERE id = $1
      LIMIT 1
    `, [collegeId]);

  if (!collegeResult.rows.length) {
    throw new Error(
      `COLLEGE_NOT_FOUND: ${collegeId}`
    );
  }

  const college =
    collegeResult.rows[0];

  const normalized =
    normalizeCollegeName(
      college.name
    );

  await pool.query('BEGIN');

  try {

    const existing =
      await pool.query(`
        SELECT id
        FROM college_fee_profiles
        WHERE college_id = $1
          AND fee_year = 2026
        LIMIT 1
      `, [collegeId]);

    let result;

    if (existing.rows.length) {

      result =
        await pool.query(`
          UPDATE college_fee_profiles
          SET
            college_name_raw = $2,
            college_name_normalized = $3,

            annual_total_fee = NULL,
            annual_academic_fee = NULL,
            total_course_fee = NULL,
            first_semester_fee = NULL,
            academic_fee_per_semester = NULL,

            tuition_fee_per_semester = 50000,

            source_url =
              'https://www.nielit.gov.in/sites/default/files/Patna/NDU%20Notice%20Semester%20Fee.pdf',

            source_kind =
              'official',

            verification_status =
              'review_recommended',

            updated_at = NOW()

          WHERE college_id = $1
            AND fee_year = 2026

          RETURNING *
        `, [
          collegeId,
          college.name,
          normalized
        ]);

    } else {

      result =
        await pool.query(`
          INSERT INTO college_fee_profiles (
            college_id,
            college_name_raw,
            college_name_normalized,
            fee_year,

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

            50000,

            'https://www.nielit.gov.in/sites/default/files/Patna/NDU%20Notice%20Semester%20Fee.pdf',

            'official',
            'review_recommended',

            NOW()
          )

          RETURNING *
        `, [
          collegeId,
          college.name,
          normalized
        ]);
    }

    await pool.query('COMMIT');

    console.table([
      {
        college_id:
          result.rows[0].college_id,

        tuition_per_semester:
          result.rows[0]
            .tuition_fee_per_semester,

        expected_annual:
          Number(
            result.rows[0]
              .tuition_fee_per_semester
          ) * 2,

        source_kind:
          result.rows[0].source_kind,

        verification_status:
          result.rows[0]
            .verification_status
      }
    ]);

    console.log('');
    console.log(
      '✅ NIELIT PATNA FEE PROFILE SAVED'
    );

  } catch (error) {

    await pool.query('ROLLBACK');
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
