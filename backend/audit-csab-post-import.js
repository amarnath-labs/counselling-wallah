import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.DB_URL;

if (!connectionString) {
  throw new Error(
    'Database connection string not found.'
  );
}

const pool =
  new Pool({
    connectionString,

    ssl:
      connectionString.includes('localhost') ||
      connectionString.includes('127.0.0.1')
        ? false
        : {
            rejectUnauthorized: false,
          },
  });


async function main() {

  const client =
    await pool.connect();

  try {

    console.log(
      '\n========================================'
    );

    console.log(
      'CSAB POST-IMPORT AUDIT'
    );

    console.log(
      'READ ONLY'
    );

    console.log(
      '========================================'
    );


    /*
    |--------------------------------------------------------------------------
    | 1. YEAR / ROUND COUNTS
    |--------------------------------------------------------------------------
    */

    const counts =
      await client.query(
        `
        SELECT
          year,
          round,
          COUNT(*)::integer AS rows
        FROM cutoffs
        WHERE counselling_type =
          'CSAB_SPECIAL'
          AND year BETWEEN 2024 AND 2026
        GROUP BY
          year,
          round
        ORDER BY
          year,
          round
        `
      );


    console.log(
      '\n===== YEAR / ROUND COUNTS ====='
    );

    console.table(
      counts.rows
    );


    /*
    |--------------------------------------------------------------------------
    | 2. YEAR TOTALS
    |--------------------------------------------------------------------------
    */

    const totals =
      await client.query(
        `
        SELECT
          year,
          COUNT(*)::integer AS rows
        FROM cutoffs
        WHERE counselling_type =
          'CSAB_SPECIAL'
          AND year BETWEEN 2024 AND 2026
        GROUP BY year
        ORDER BY year
        `
      );


    console.log(
      '\n===== YEAR TOTALS ====='
    );

    console.table(
      totals.rows
    );


    /*
    |--------------------------------------------------------------------------
    | 3. TOTAL
    |--------------------------------------------------------------------------
    */

    const total =
      await client.query(
        `
        SELECT
          COUNT(*)::integer AS rows
        FROM cutoffs
        WHERE counselling_type =
          'CSAB_SPECIAL'
          AND year BETWEEN 2024 AND 2026
        `
      );


    console.log(
      '\n3-year total:',
      total.rows[0].rows
    );


    /*
    |--------------------------------------------------------------------------
    | 4. NULL / INVALID RANK CHECK
    |--------------------------------------------------------------------------
    */

    const badRanks =
      await client.query(
        `
        SELECT
          COUNT(*)::integer AS rows
        FROM cutoffs
        WHERE counselling_type =
          'CSAB_SPECIAL'
          AND year BETWEEN 2024 AND 2026
          AND (
            opening_rank IS NULL
            OR closing_rank IS NULL
            OR opening_rank <= 0
            OR closing_rank <= 0
            OR opening_rank > closing_rank
          )
        `
      );


    console.log(
      'Invalid rank rows:',
      badRanks.rows[0].rows
    );


    /*
    |--------------------------------------------------------------------------
    | 5. DUPLICATE IDENTITY CHECK
    |--------------------------------------------------------------------------
    */

    const duplicates =
      await client.query(
        `
        SELECT
          COUNT(*)::integer AS groups
        FROM (
          SELECT
            branch_id,
            year,
            round,
            category,
            quota,
            gender,
            counselling_type,
            COUNT(*)
          FROM cutoffs
          WHERE counselling_type =
            'CSAB_SPECIAL'
            AND year BETWEEN 2024 AND 2026
          GROUP BY
            branch_id,
            year,
            round,
            category,
            quota,
            gender,
            counselling_type
          HAVING COUNT(*) > 1
        ) x
        `
      );


    console.log(
      'Duplicate identity groups:',
      duplicates.rows[0].groups
    );


    /*
    |--------------------------------------------------------------------------
    | 6. SOURCE / VERIFICATION CHECK
    |--------------------------------------------------------------------------
    */

    const verification =
      await client.query(
        `
        SELECT
          verification_status,
          is_verified,
          COUNT(*)::integer AS rows
        FROM cutoffs
        WHERE counselling_type =
          'CSAB_SPECIAL'
          AND year BETWEEN 2024 AND 2026
        GROUP BY
          verification_status,
          is_verified
        ORDER BY
          verification_status,
          is_verified
        `
      );


    console.log(
      '\n===== VERIFICATION ====='
    );

    console.table(
      verification.rows
    );


    /*
    |--------------------------------------------------------------------------
    | 7. QUOTA COVERAGE
    |--------------------------------------------------------------------------
    */

    const quotas =
      await client.query(
        `
        SELECT
          quota,
          COUNT(*)::integer AS rows
        FROM cutoffs
        WHERE counselling_type =
          'CSAB_SPECIAL'
          AND year BETWEEN 2024 AND 2026
        GROUP BY quota
        ORDER BY quota
        `
      );


    console.log(
      '\n===== QUOTAS ====='
    );

    console.table(
      quotas.rows
    );


    /*
    |--------------------------------------------------------------------------
    | 8. CATEGORY COVERAGE
    |--------------------------------------------------------------------------
    */

    const categories =
      await client.query(
        `
        SELECT
          category,
          COUNT(*)::integer AS rows
        FROM cutoffs
        WHERE counselling_type =
          'CSAB_SPECIAL'
          AND year BETWEEN 2024 AND 2026
        GROUP BY category
        ORDER BY category
        `
      );


    console.log(
      '\n===== CATEGORIES ====='
    );

    console.table(
      categories.rows
    );


    /*
    |--------------------------------------------------------------------------
    | 9. COLLEGE / BRANCH COVERAGE
    |--------------------------------------------------------------------------
    */

    const coverage =
      await client.query(
        `
        SELECT
          COUNT(
            DISTINCT b.college_id
          )::integer
            AS colleges,

          COUNT(
            DISTINCT c.branch_id
          )::integer
            AS branches
        FROM cutoffs c
        JOIN branches b
          ON b.id =
             c.branch_id
        WHERE c.counselling_type =
          'CSAB_SPECIAL'
          AND c.year BETWEEN
              2024 AND 2026
        `
      );


    console.log(
      '\n===== COVERAGE ====='
    );

    console.table(
      coverage.rows
    );


    /*
    |--------------------------------------------------------------------------
    | STRICT EXPECTATIONS
    |--------------------------------------------------------------------------
    */

    const yearMap =
      new Map(
        totals.rows.map(
          row => [
            Number(row.year),
            Number(row.rows),
          ]
        )
      );


    const ok =
      yearMap.get(2024) === 9734 &&
      yearMap.get(2025) === 13454 &&
      yearMap.get(2026) === 11793 &&
      Number(
        total.rows[0].rows
      ) === 34981 &&
      Number(
        badRanks.rows[0].rows
      ) === 0 &&
      Number(
        duplicates.rows[0].groups
      ) === 0;


    console.log(
      '\n========================================'
    );


    if (ok) {

      console.log(
        'CSAB DATABASE AUDIT PASSED'
      );

    } else {

      console.log(
        'CSAB DATABASE AUDIT NEEDS REVIEW'
      );
    }


    console.log(
      'NO DATABASE CHANGES MADE'
    );

    console.log(
      '========================================'
    );


  } finally {

    client.release();

    await pool.end();
  }
}


main().catch(
  error => {

    console.error(
      '\nPOST-IMPORT AUDIT FAILED'
    );

    console.error(
      error
    );

    process.exitCode = 1;
  }
);
