import 'dotenv/config';
import { pool } from './src/db/pool.js';

try {
  const result = await pool.query(`
    DELETE FROM college_quality_metrics
    WHERE source_label = 'NIRF 2025 Engineering'
  `);

  console.log(
    'Removed NIRF rows:',
    result.rowCount
  );
} catch (error) {
  console.error(
    'Cleanup failed:',
    error.message
  );
} finally {
  await pool.end();
}
