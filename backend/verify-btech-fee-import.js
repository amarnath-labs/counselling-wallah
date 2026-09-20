import 'dotenv/config';
import { pool } from './src/db/pool.js';

try {
  const result = await pool.query(`
    SELECT
      bf.college_id,
      bf.academic_year,
      COUNT(fv.id)::int AS variants
    FROM branch_fees bf
    LEFT JOIN fee_variants fv
      ON fv.branch_fee_id = bf.id
    GROUP BY
      bf.college_id,
      bf.academic_year
    ORDER BY
      bf.college_id
  `);

  console.table(result.rows);

} catch (error) {
  console.error(
    'FAILED:',
    error.message
  );

  process.exitCode = 1;

} finally {
  await pool.end();
}
