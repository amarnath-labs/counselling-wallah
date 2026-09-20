import 'dotenv/config';
import { pool } from './src/db/pool.js';

try {
  const result =
    await pool.query(`
      SELECT
        bf.id AS branch_fee_id,
        bf.college_id,
        bf.program,
        bf.fee_scope,
        bf.academic_year,
        fv.semester,
        fv.student_category,
        fv.income_min,
        fv.income_max,
        fv.residence_type,
        fv.room_type,
        fv.tuition_fee,
        fv.hostel_fee,
        fv.total_fee,
        fv.verification_status
      FROM branch_fees bf
      JOIN fee_variants fv
        ON fv.branch_fee_id = bf.id
      WHERE bf.college_id =
        'national-institute-of-technology-delhi'
      ORDER BY
        fv.tuition_fee DESC,
        fv.residence_type,
        fv.room_type
    `);

  console.table(result.rows);

} finally {
  await pool.end();
}
