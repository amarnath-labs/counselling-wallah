import { pool } from './src/db/pool.js';

async function main() {

  console.log('\n=== BRANCH_FEES COLUMNS ===');

  const columns = await pool.query(`
    SELECT
      column_name,
      data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'branch_fees'
    ORDER BY ordinal_position
  `);

  console.table(columns.rows);


  console.log('\n=== SAMPLE BRANCH_FEE ROWS ===');

  const sample = await pool.query(`
    SELECT *
    FROM branch_fees
    ORDER BY id DESC
    LIMIT 10
  `);

  console.table(sample.rows);

}

main()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
