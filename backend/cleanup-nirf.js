import 'dotenv/config';
import { pool } from './src/db/pool.js';

try {
  const result = await pool.query(`
    DELETE FROM college_quality_metrics
    WHERE academic_year = 2025
      AND (
        source_label ILIKE '%NIRF%'
        OR source_url ILIKE '%nirfindia%'
      )
  `);

  console.log('NIRF rows deleted:', result.rowCount);
} catch (error) {
  console.error('DELETE FAILED:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
