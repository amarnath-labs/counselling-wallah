import 'dotenv/config';

import {
  pool,
} from './src/db/pool.js';


async function main() {
  try {
    console.log(
      '\n=== UPTAC DATABASE INSPECTION ===\n'
    );


    const total =
      await pool.query(`
        SELECT COUNT(*)::int AS count
        FROM cutoffs
        WHERE counselling_type = 'UPTAC'
      `);

    console.log(
      'Total UPTAC rows:',
      total.rows[0]?.count
    );


    const verified =
      await pool.query(`
        SELECT COUNT(*)::int AS count
        FROM cutoffs
        WHERE counselling_type = 'UPTAC'
          AND verification_status = 'VERIFIED'
          AND is_verified = true
      `);

    console.log(
      'Verified UPTAC rows:',
      verified.rows[0]?.count
    );


    const years =
      await pool.query(`
        SELECT
          year,
          COUNT(*)::int AS count
        FROM cutoffs
        WHERE counselling_type = 'UPTAC'
        GROUP BY year
        ORDER BY year DESC
      `);

    console.log(
      '\nYears:'
    );

    console.table(
      years.rows
    );


    const rounds =
      await pool.query(`
        SELECT
          round,
          COUNT(*)::int AS count
        FROM cutoffs
        WHERE counselling_type = 'UPTAC'
        GROUP BY round
        ORDER BY round
      `);

    console.log(
      '\nRounds:'
    );

    console.table(
      rounds.rows
    );


    const categories =
      await pool.query(`
        SELECT
          category,
          COUNT(*)::int AS count
        FROM cutoffs
        WHERE counselling_type = 'UPTAC'
        GROUP BY category
        ORDER BY category
      `);

    console.log(
      '\nCategories:'
    );

    console.table(
      categories.rows
    );


    const exact =
      await pool.query(`
        SELECT COUNT(*)::int AS count
        FROM cutoffs
        WHERE counselling_type = 'UPTAC'
          AND year = 2025
          AND round = 'Round 1'
          AND category = 'OPEN'
          AND verification_status = 'VERIFIED'
          AND is_verified = true
      `);

    console.log(
      '\n2025 + Round 1 + OPEN + VERIFIED:',
      exact.rows[0]?.count
    );


    const rank50000 =
      await pool.query(`
        SELECT COUNT(*)::int AS count
        FROM cutoffs
        WHERE counselling_type = 'UPTAC'
          AND year = 2025
          AND round = 'Round 1'
          AND category = 'OPEN'
          AND verification_status = 'VERIFIED'
          AND is_verified = true
          AND closing_rank >= 50000
      `);

    console.log(
      'Same rows with closing_rank >= 50000:',
      rank50000.rows[0]?.count
    );


    const sample =
      await pool.query(`
        SELECT
          id,
          college_id,
          branch_id,
          year,
          round,
          category,
          quota,
          gender,
          opening_rank,
          closing_rank,
          counselling_type,
          verification_status,
          is_verified,
          source_label
        FROM cutoffs
        WHERE counselling_type = 'UPTAC'
        ORDER BY closing_rank DESC NULLS LAST
        LIMIT 10
      `);

    console.log(
      '\nTop 10 UPTAC sample rows:'
    );

    console.table(
      sample.rows
    );


    const exactSample =
      await pool.query(`
        SELECT
          id,
          college_id,
          branch_id,
          year,
          round,
          category,
          quota,
          gender,
          opening_rank,
          closing_rank,
          verification_status,
          is_verified
        FROM cutoffs
        WHERE counselling_type = 'UPTAC'
          AND year = 2025
          AND round = 'Round 1'
          AND category = 'OPEN'
        ORDER BY closing_rank DESC NULLS LAST
        LIMIT 10
      `);

    console.log(
      '\n2025 Round 1 OPEN sample:'
    );

    console.table(
      exactSample.rows
    );


  } catch (error) {
    console.error(
      '\nUPTAC INSPECTION ERROR:\n',
      error
    );

    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}


main();