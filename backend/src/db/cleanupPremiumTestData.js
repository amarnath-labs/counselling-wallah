import 'dotenv/config';
import { pool } from './pool.js';

try {
  await pool.query(
    `DELETE FROM college_quality_metrics
     WHERE college_id = '1'`
  );

  await pool.query(
    `DELETE FROM college_fees
     WHERE college_id = '1'`
  );

  console.log('Test premium rows removed.');
} catch (error) {
  console.error(
    'Cleanup failed:',
    error.message
  );
} finally {
  await pool.end();
}
