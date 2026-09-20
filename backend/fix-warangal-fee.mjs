import { pool } from "./src/db/pool.js";

const client = await pool.connect();

try {
  await client.query("BEGIN");

  const result = await client.query(`
    UPDATE college_fee_profiles
    SET
      total_course_fee = NULL,
      confidence_score = 95,
      updated_at = NOW()
    WHERE college_id = 'national-institute-of-technology-warangal'
      AND source_kind = 'official'
    RETURNING
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
  `);

  console.table(result.rows);

  await client.query("COMMIT");
} catch (error) {
  await client.query("ROLLBACK");
  console.error(error);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
