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
      AND table_name = 'fee_variants'
    ORDER BY ordinal_position
  `);

  console.table(result.rows);

  const count = await pool.query(`
    SELECT COUNT(*)::int AS total_rows
    FROM fee_variants
  `);

  console.log('');
  console.log('CURRENT ROW COUNT');
  console.table(count.rows);

} finally {
  await pool.end();
}
