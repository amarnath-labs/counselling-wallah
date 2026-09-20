import { pool } from './src/db/pool.js';

async function main() {
  const result = await pool.query(`
    UPDATE college_fee_profiles
    SET
      total_course_fee = 244800,
      source_url = 'https://www.shiksha.com/college/amani-group-of-institutions-amroha-59319/fees',
      source_kind = 'shiksha',
      verification_status = 'review_recommended',
      updated_at = NOW()
    WHERE college_id =
      'uptac-amani-group-of-institutions-amroha'
      AND fee_year = 2026
    RETURNING
      college_id,
      total_course_fee,
      source_url,
      verification_status
  `);

  console.table(result.rows);
}

main()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
