import { pool } from "./src/db/pool.js";

try {
  const result = await pool.query(`
    SELECT
      college_id,
      fee_year,
      tuition_fee_per_semester,
      annual_academic_fee,
      annual_total_fee,
      total_course_fee,
      source_kind,
      verification_status,
      confidence_score,
      source_url
    FROM college_fee_profiles
    WHERE college_id = 'national-institute-of-technology-warangal'
  `);

  console.table(result.rows);
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
