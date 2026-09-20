import { pool } from './src/db/pool.js';

async function main() {
  const result = await pool.query(`
    UPDATE college_fee_profiles
    SET
      annual_academic_fee = 57300,
      source_url = 'https://recbasti.ac.in/wp-content/uploads/2026/07/Fee-structure-2026-27.pdf',
      source_kind = 'official',
      verification_status = 'high_confidence',
      updated_at = NOW()
    WHERE college_id =
      'uptac-bharat-ratna-sardar-vallabhbhai-patel-rajkiya-engineering-college-basti'
      AND fee_year = 2026
    RETURNING
      college_id,
      annual_academic_fee,
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
