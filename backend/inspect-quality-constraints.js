import 'dotenv/config';
import { pool } from './src/db/pool.js';

try {
  const result = await pool.query(`
    SELECT
      tc.constraint_name,
      tc.constraint_type,
      kcu.column_name
    FROM information_schema.table_constraints tc
    LEFT JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    WHERE tc.table_schema = 'public'
      AND tc.table_name = 'college_quality_metrics'
    ORDER BY tc.constraint_name, kcu.ordinal_position
  `);

  console.table(result.rows);
} catch (error) {
  console.error('FAILED:', error.message);
} finally {
  await pool.end();
}
