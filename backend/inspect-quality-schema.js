import 'dotenv/config';
import { pool } from './src/db/pool.js';

try {
  const result = await pool.query(`
    SELECT
      column_name,
      data_type,
      is_nullable,
      column_default
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'college_quality_metrics'
    ORDER BY ordinal_position
  `);

  console.table(result.rows);
} catch (error) {
  console.error('FAILED:', error.message);
} finally {
  await pool.end();
}
