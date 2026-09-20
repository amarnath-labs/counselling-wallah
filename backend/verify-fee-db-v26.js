import { pool } from "./src/db/pool.js";

const ids = [
  "national-institute-of-technology-karnataka-surathkal",
  "national-institute-of-technology-warangal"
];

async function main() {
  for (const collegeId of ids) {
    console.log("\n========================================");
    console.log(collegeId);
    console.log("========================================");

    const result = await pool.query(`
      SELECT
        college_id,
        college_name_raw,
        fee_year,
        tuition_fee_per_semester,
        academic_fee_per_semester,
        first_semester_fee,
        hostel_fee_per_semester,
        mess_fee_per_semester,
        other_fee,
        annual_academic_fee,
        annual_total_fee,
        total_course_fee,
        source_kind,
        verification_status,
        confidence_score,
        source_url,
        updated_at
      FROM college_fee_profiles
      WHERE college_id = $1
      ORDER BY fee_year DESC, updated_at DESC
    `, [collegeId]);

    console.table(result.rows);
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
