import 'dotenv/config';
import { pool } from './src/db/pool.js';

try {
  const result = await pool.query(`
    SELECT
      cq.college_id,
      c.name AS college_name,
      cq.nirf_rank,
      cq.nirf_score,
      cq.academic_year,
      cq.source_label,
      cq.verification_status
    FROM college_quality_metrics cq
    JOIN colleges c
      ON c.id = cq.college_id
    WHERE
      cq.source_label ILIKE '%NIRF%'
      OR cq.source_url ILIKE '%nirfindia%'
    ORDER BY cq.nirf_rank ASC
  `);

  console.log('');
  console.log('=======================================');
  console.log('NIRF DATABASE VERIFICATION');
  console.log('=======================================');
  console.log('');
  console.log('Total NIRF rows:', result.rowCount);
  console.log('');

  console.table(
    result.rows.map((row) => ({
      rank: row.nirf_rank,
      college: row.college_name,
      score: row.nirf_score,
      year: row.academic_year,
      status: row.verification_status
    }))
  );
} catch (error) {
  console.error('VERIFY FAILED:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
