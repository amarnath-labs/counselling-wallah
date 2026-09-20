import 'dotenv/config';

import {
  pool,
} from './src/db/pool.js';


async function main() {
  try {
    const { rows } =
      await pool.query(`
        SELECT
          b.name AS branch_name,
          COUNT(*)::int AS cutoff_rows
        FROM cutoffs co

        INNER JOIN branches b
          ON b.id = co.branch_id

        WHERE
          co.counselling_type = 'UPTAC'
          AND co.year = 2025

        GROUP BY
          b.name

        ORDER BY
          cutoff_rows DESC,
          b.name ASC
      `);


    console.log(
      '\n=== UPTAC 2025 BRANCHES ==='
    );

    console.log(
      'Unique branch names:',
      rows.length
    );

    console.table(
      rows
    );

  } catch (error) {
    console.error(
      '\nBRANCH AUDIT ERROR:\n',
      error
    );

    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}


main();