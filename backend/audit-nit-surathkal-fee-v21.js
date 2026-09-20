import { pool } from "./src/db/pool.js";

const pageId =
  "national-institute-of-technology-karnataka-surathkal";

console.log("\n=== COLLEGE FROM PAGE ID ===");

const college = await pool.query(`
  SELECT id, name
  FROM colleges
  WHERE id = $1
`, [pageId]);

console.table(college.rows);

console.log("\n=== EXACT FEE PROFILE ===");

const exactFee = await pool.query(`
  SELECT
    college_id,
    college_name_raw,
    fee_year,
    tuition_fee_per_semester,
    academic_fee_per_semester,
    first_semester_fee,
    annual_academic_fee,
    annual_total_fee,
    total_course_fee,
    source_kind,
    verification_status
  FROM college_fee_profiles
  WHERE college_id = $1
  ORDER BY fee_year DESC
`, [pageId]);

console.table(exactFee.rows);

console.log("\n=== POSSIBLE SURATHKAL / KARNATAKA FEE IDS ===");

const similar = await pool.query(`
  SELECT
    college_id,
    college_name_raw,
    fee_year,
    tuition_fee_per_semester,
    annual_academic_fee,
    annual_total_fee,
    total_course_fee
  FROM college_fee_profiles
  WHERE
    LOWER(college_id) LIKE '%surath%'
    OR LOWER(college_id) LIKE '%karnataka%'
    OR LOWER(COALESCE(college_name_raw,'')) LIKE '%surath%'
  ORDER BY college_id
`);

console.table(similar.rows);

await pool.end();
