import { pool } from './src/db/pool.js';

async function main() {
  console.log('\n========================================');
  console.log('CW-REC COLLEGE QUALITY DATA AUDIT');
  console.log('========================================');

  const tables = await pool.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND (
        LOWER(table_name) LIKE '%nirf%'
        OR LOWER(table_name) LIKE '%placement%'
        OR LOWER(table_name) LIKE '%quality%'
        OR LOWER(table_name) LIKE '%college_profile%'
      )
    ORDER BY table_name
  `);

  console.log('\n=== QUALITY-RELATED TABLES ===');
  console.table(tables.rows);


  const columns = await pool.query(`
    SELECT
      table_name,
      column_name,
      data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND (
        LOWER(table_name) LIKE '%nirf%'
        OR LOWER(table_name) LIKE '%placement%'
        OR LOWER(table_name) LIKE '%quality%'
        OR LOWER(table_name) LIKE '%college_profile%'
      )
    ORDER BY table_name, ordinal_position
  `);

  console.log('\n=== QUALITY TABLE COLUMNS ===');
  console.table(columns.rows);


  const collegeColumns = await pool.query(`
    SELECT
      column_name,
      data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'colleges'
    ORDER BY ordinal_position
  `);

  console.log('\n=== COLLEGES TABLE COLUMNS ===');
  console.table(collegeColumns.rows);


  const branchCount = await pool.query(`
    SELECT
      COUNT(DISTINCT c.id)::int AS colleges_in_verified_josaa_2026
    FROM cutoffs co
    INNER JOIN branches b
      ON b.id = co.branch_id
    INNER JOIN colleges c
      ON c.id = b.college_id
    WHERE
      co.counselling_type = 'JOSAA'
      AND co.year = 2026
      AND co.verification_status = 'VERIFIED'
      AND co.is_verified = true
      AND co.opening_rank IS NOT NULL
      AND co.closing_rank IS NOT NULL
      AND co.opening_rank <= co.closing_rank
  `);

  console.log('\n=== VERIFIED JOSAA COLLEGE COUNT ===');
  console.table(branchCount.rows);


  console.log('\n========================================');
  console.log('✅ READ-ONLY QUALITY AUDIT COMPLETE');
  console.log('========================================');
}

main()
  .catch(error => {
    console.error('\nQUALITY AUDIT ERROR:\n', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
