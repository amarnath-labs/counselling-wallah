import { pool } from './src/db/pool.js';

async function main() {
  const result = await pool.query(`
    UPDATE college_fee_profiles
    SET
      source_url = 'https://www.nitgoa.ac.in/admissions/josaa.html',
      source_kind = 'official',
      verification_status = 'review_recommended',
      updated_at = NOW()
    WHERE college_id = 'national-institute-of-technology-goa'
      AND fee_year = 2026
    RETURNING college_id, source_url, source_kind
  `);

  console.table(result.rows);
}

main()
  .catch(console.error)
  .finally(async () => {
    await pool.end();
  });
