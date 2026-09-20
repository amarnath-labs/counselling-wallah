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
      'JOSAA / CSAB FILTER VALUE AUDIT'
    );

    console.log(
      'READ ONLY'
    );

    console.log(
      '========================================'
    );


    const quotas =
      await client.query(
        `
        SELECT
          counselling_type,
          quota,
          COUNT(*)::integer AS rows
        FROM cutoffs
        WHERE counselling_type IN (
          'JOSAA',
          'CSAB_SPECIAL'
        )
        AND year BETWEEN 2024 AND 2026
        GROUP BY
          counselling_type,
          quota
        ORDER BY
          counselling_type,
          quota
        `
      );

    console.log(
      '\n===== QUOTAS ====='
    );

    console.table(
      quotas.rows
    );


    const categories =
      await client.query(
        `
        SELECT
          counselling_type,
          category,
          COUNT(*)::integer AS rows
        FROM cutoffs
        WHERE counselling_type IN (
          'JOSAA',
          'CSAB_SPECIAL'
        )
        AND year BETWEEN 2024 AND 2026
        GROUP BY
          counselling_type,
          category
        ORDER BY
          counselling_type,
          category
        `
      );

    console.log(
      '\n===== CATEGORIES ====='
    );

    console.table(
      categories.rows
    );


    const genders =
      await client.query(
        `
        SELECT
          counselling_type,
          gender,
          COUNT(*)::integer AS rows
        FROM cutoffs
        WHERE counselling_type IN (
          'JOSAA',
          'CSAB_SPECIAL'
        )
        AND year BETWEEN 2024 AND 2026
        GROUP BY
          counselling_type,
          gender
        ORDER BY
          counselling_type,
          gender
        `
      );

    console.log(
      '\n===== GENDERS ====='
    );

    console.table(
      genders.rows
    );


    console.log(
      '\n========================================'
    );

    console.log(
      'FILTER AUDIT COMPLETE'
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
