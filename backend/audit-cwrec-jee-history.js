import { pool } from './src/db/pool.js';

async function main() {
  const years = await pool.query(`
    SELECT
      year,
      counselling_type,
      COUNT(*)::int AS rows,
      COUNT(DISTINCT branch_id)::int AS branches
    FROM cutoffs
    WHERE counselling_type IN (
      'JOSAA',
      'CSAB_SPECIAL',
      'CSAB_SUPERNUMERARY',
      'CSAB_NEUT'
    )
    GROUP BY year, counselling_type
    ORDER BY year DESC, counselling_type
  `);

  console.log('\n=== JEE HISTORICAL YEARS ===');
  console.table(years.rows);

  const josaaYears = await pool.query(`
    SELECT
      year,
      COUNT(*)::int AS rows,
      COUNT(DISTINCT branch_id)::int AS branches,
      COUNT(DISTINCT round)::int AS rounds,
      COUNT(DISTINCT category)::int AS categories
    FROM cutoffs
    WHERE counselling_type = 'JOSAA'
    GROUP BY year
    ORDER BY year DESC
  `);

  console.log('\n=== JOSAA COVERAGE ===');
  console.table(josaaYears.rows);

  const genders = await pool.query(`
    SELECT
      year,
      gender,
      COUNT(*)::int AS rows
    FROM cutoffs
    WHERE counselling_type = 'JOSAA'
    GROUP BY year, gender
    ORDER BY year DESC, rows DESC
  `);

  console.log('\n=== JOSAA GENDER DISTRIBUTION ===');
  console.table(genders.rows);

  console.log('\n✅ JEE READ-ONLY AUDIT COMPLETE');
}

main()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
