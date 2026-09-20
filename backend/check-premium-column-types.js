import 'dotenv/config';
import { pool } from './src/db/pool.js';

try {
  const sql = `
    SELECT
      table_name,
      column_name,
      data_type
    FROM information_schema.columns
    WHERE table_name IN (
      'college_quality_metrics',
      'college_fees',
      'college_reviews'
    )
    AND column_name = 'college_id'
    ORDER BY table_name
  `;

  const result = await pool.query(sql);

  console.table(result.rows);
} catch (error) {
  console.error(
    'CHECK FAILED:',
    error.message
  );
} finally {
  await pool.end();
}
