import { pool } from './src/db/pool.js';

async function main() {
  const result = await pool.query(`
    UPDATE college_fee_profiles
    SET
      annual_academic_fee = 55000,
      source_url = 'https://www.abss.edu.in/pdfs/Indian-fee-structure-2026-27.pdf',
      source_kind = 'official',
      verification_status = 'high_confidence',
      updated_at = NOW()
    WHERE college_id =
      'uptac-abss-institute-of-technology-meerut-meerut'
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
