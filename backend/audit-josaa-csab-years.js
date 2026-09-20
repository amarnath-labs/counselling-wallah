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
      'JOSAA + CSAB YEAR COVERAGE AUDIT'
    );

    console.log(
      'READ ONLY'
    );

    console.log(
      '========================================'
    );


    const byYearRound =
      await client.query(
        `
        SELECT
          counselling_type,
          year,
          round,
          COUNT(*)::integer AS rows
        FROM cutoffs
        WHERE counselling_type IN (
          'JOSAA',
          'CSAB_SPECIAL'
        )
        GROUP BY
          counselling_type,
          year,
          round
        ORDER BY
          counselling_type,
          year,
          round
        `
      );


    console.log(
      '\n===== YEAR + ROUND ====='
    );

    console.table(
      byYearRound.rows
    );


    const byYear =
      await client.query(
        `
        SELECT
          counselling_type,
          year,
          COUNT(*)::integer AS rows,
          COUNT(
            DISTINCT round
          )::integer AS rounds
        FROM cutoffs
        WHERE counselling_type IN (
          'JOSAA',
          'CSAB_SPECIAL'
        )
        GROUP BY
          counselling_type,
          year
        ORDER BY
          counselling_type,
          year
        `
      );


    console.log(
      '\n===== YEAR TOTALS ====='
    );

    console.table(
      byYear.rows
    );


    const summary =
      await client.query(
        `
        SELECT
          counselling_type,
          MIN(year)::integer
            AS first_year,
          MAX(year)::integer
            AS latest_year,
          COUNT(
            DISTINCT year
          )::integer
            AS total_years,
          COUNT(*)::integer
            AS total_rows
        FROM cutoffs
        WHERE counselling_type IN (
          'JOSAA',
          'CSAB_SPECIAL'
        )
        GROUP BY
          counselling_type
        ORDER BY
          counselling_type
        `
      );


    console.log(
      '\n===== FINAL COVERAGE ====='
    );

    console.table(
      summary.rows
    );


    const years =
      await client.query(
        `
        SELECT
          counselling_type,
          ARRAY_AGG(
            DISTINCT year
            ORDER BY year
          ) AS years
        FROM cutoffs
        WHERE counselling_type IN (
          'JOSAA',
          'CSAB_SPECIAL'
        )
        GROUP BY
          counselling_type
        ORDER BY
          counselling_type
        `
      );


    console.log(
      '\n===== AVAILABLE YEARS ====='
    );

    console.table(
      years.rows
    );


    console.log(
      '\n========================================'
    );

    console.log(
      'AUDIT COMPLETE'
    );

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
      '\nAUDIT FAILED'
    );

    console.error(
      error
    );

    process.exitCode = 1;
  }
);
