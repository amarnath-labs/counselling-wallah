import { pool } from './src/db/pool.js';

for (const table of [
  'cutoffs',
  'branches',
  'colleges'
]) {
  const result = await pool.query(`
    SELECT
      column_name,
      data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = $1
    ORDER BY ordinal_position
  `, [table]);

  console.log(`\n===== ${table.toUpperCase()} =====`);
  console.table(result.rows);
}

await pool.end();
