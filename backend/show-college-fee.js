import { pool } from "./src/db/pool.js";

const collegeId = "national-institute-of-technology-tiruchirappalli";

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
    annual_academic_fee,
    annual_total_fee,
    total_course_fee,
    source_kind,
    verification_status,
    source_url
  FROM college_fee_profiles
  WHERE college_id = $1
  ORDER BY fee_year DESC
`, [collegeId]);

console.table(result.rows);

await pool.end();
