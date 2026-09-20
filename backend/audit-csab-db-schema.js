import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.DB_URL;

if (!connectionString) {
  throw new Error(
    'No DATABASE_URL / POSTGRES_URL / DB_URL found in environment.'
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


async function showColumns(
  client,
  tableName
) {
  const result =
    await client.query(
      `
      SELECT
        ordinal_position,
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = $1
      ORDER BY ordinal_position
      `,
      [tableName]
    );

  console.log(
    `\n===== ${tableName.toUpperCase()} COLUMNS =====`
  );

  console.table(
    result.rows
  );
}


async function showConstraints(
  client,
  tableName
) {
  const result =
    await client.query(
      `
      SELECT
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name
      FROM information_schema.table_constraints tc
      LEFT JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
       AND tc.table_schema = kcu.table_schema
       AND tc.table_name = kcu.table_name
      WHERE tc.table_schema = 'public'
        AND tc.table_name = $1
      ORDER BY
        tc.constraint_type,
        tc.constraint_name,
        kcu.ordinal_position
      `,
      [tableName]
    );

  console.log(
    `\n===== ${tableName.toUpperCase()} CONSTRAINTS =====`
  );

  console.table(
    result.rows
  );
}


async function main() {
  const client =
    await pool.connect();

  try {
    console.log(
      '\n========================================'
    );

    console.log(
      'CSAB DB MAPPING SCHEMA AUDIT'
    );

    console.log(
      'READ ONLY'
    );

    console.log(
      '========================================'
    );


    /*
    |--------------------------------------------------------------------------
    | Confirm tables
    |--------------------------------------------------------------------------
    */

    const tables =
      await client.query(
        `
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name IN (
            'colleges',
            'branches',
            'cutoffs'
          )
        ORDER BY table_name
        `
      );

    console.log(
      '\n===== REQUIRED TABLES ====='
    );

    console.table(
      tables.rows
    );


    /*
    |--------------------------------------------------------------------------
    | Exact schema
    |--------------------------------------------------------------------------
    */

    await showColumns(
      client,
      'colleges'
    );

    await showColumns(
      client,
      'branches'
    );

    await showColumns(
      client,
      'cutoffs'
    );


    /*
    |--------------------------------------------------------------------------
    | Constraints
    |--------------------------------------------------------------------------
    */

    await showConstraints(
      client,
      'colleges'
    );

    await showConstraints(
      client,
      'branches'
    );

    await showConstraints(
      client,
      'cutoffs'
    );


    /*
    |--------------------------------------------------------------------------
    | Counts
    |--------------------------------------------------------------------------
    */

    const counts =
      await client.query(
        `
        SELECT
          (SELECT COUNT(*) FROM colleges)
            AS colleges,

          (SELECT COUNT(*) FROM branches)
            AS branches,

          (SELECT COUNT(*) FROM cutoffs)
            AS cutoffs
        `
      );

    console.log(
      '\n===== CURRENT COUNTS ====='
    );

    console.table(
      counts.rows
    );


    /*
    |--------------------------------------------------------------------------
    | Counselling types currently present
    |--------------------------------------------------------------------------
    */

    const counsellingTypes =
      await client.query(
        `
        SELECT
          counselling_type,
          COUNT(*)::bigint AS rows
        FROM cutoffs
        GROUP BY counselling_type
        ORDER BY counselling_type
        `
      );

    console.log(
      '\n===== EXISTING COUNSELLING TYPES ====='
    );

    console.table(
      counsellingTypes.rows
    );


    /*
    |--------------------------------------------------------------------------
    | College samples
    |--------------------------------------------------------------------------
    */

    const collegeColumns =
      await client.query(
        `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'colleges'
        `
      );

    const collegeColumnSet =
      new Set(
        collegeColumns.rows.map(
          row =>
            row.column_name
        )
      );


    const collegeNameColumn =
      [
        'name',
        'college_name',
        'institute_name',
      ].find(
        column =>
          collegeColumnSet.has(
            column
          )
      );


    if (collegeNameColumn) {
      const samples =
        await client.query(
          `
          SELECT
            id,
            ${collegeNameColumn} AS name
          FROM colleges
          ORDER BY ${collegeNameColumn}
          LIMIT 40
          `
        );

      console.log(
        '\n===== COLLEGE SAMPLE ====='
      );

      console.table(
        samples.rows
      );
    } else {
      console.log(
        '\nNo obvious college-name column detected.'
      );
    }


    /*
    |--------------------------------------------------------------------------
    | Branch samples
    |--------------------------------------------------------------------------
    */

    const branchColumns =
      await client.query(
        `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'branches'
        `
      );

    const branchColumnSet =
      new Set(
        branchColumns.rows.map(
          row =>
            row.column_name
        )
      );


    const branchNameColumn =
      [
        'name',
        'branch_name',
        'program_name',
      ].find(
        column =>
          branchColumnSet.has(
            column
          )
      );


    if (
      branchNameColumn &&
      branchColumnSet.has(
        'college_id'
      )
    ) {
      const samples =
        await client.query(
          `
          SELECT
            id,
            college_id,
            ${branchNameColumn} AS name
          FROM branches
          ORDER BY ${branchNameColumn}
          LIMIT 40
          `
        );

      console.log(
        '\n===== BRANCH SAMPLE ====='
      );

      console.table(
        samples.rows
      );
    } else {
      console.log(
        '\nNo obvious branch-name / college_id columns detected.'
      );
    }


    console.log(
      '\n========================================'
    );

    console.log(
      'SCHEMA AUDIT COMPLETE'
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
      '\nSCHEMA AUDIT FAILED'
    );

    console.error(
      error
    );

    process.exitCode = 1;
  }
);
