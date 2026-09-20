import { pool } from './src/db/pool.js';

try {

  console.log(
    '\n========================================'
  );

  console.log(
    'BRANCHES SCHEMA SAFETY AUDIT'
  );

  console.log(
    '========================================\n'
  );


  const columns =
    await pool.query(`
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default,
        identity_generation
      FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name = 'branches'
      ORDER BY ordinal_position
    `);


  console.log(
    'BRANCHES COLUMNS'
  );

  console.table(
    columns.rows
  );


  const constraints =
    await pool.query(`
      SELECT
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name
      FROM information_schema.table_constraints tc
      LEFT JOIN information_schema.key_column_usage kcu
        ON kcu.constraint_name = tc.constraint_name
       AND kcu.constraint_schema = tc.constraint_schema
       AND kcu.table_name = tc.table_name
      WHERE tc.table_schema = current_schema()
        AND tc.table_name = 'branches'
      ORDER BY
        tc.constraint_type,
        tc.constraint_name,
        kcu.ordinal_position
    `);


  console.log(
    '\nBRANCHES CONSTRAINTS'
  );

  console.table(
    constraints.rows
  );


  const indexes =
    await pool.query(`
      SELECT
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = current_schema()
        AND tablename = 'branches'
      ORDER BY indexname
    `);


  console.log(
    '\nBRANCHES INDEXES'
  );

  console.table(
    indexes.rows
  );


  const idStats =
    await pool.query(`
      SELECT
        COUNT(*)::int AS total_rows,
        MIN(id::text) AS min_id,
        MAX(id::text) AS max_id
      FROM branches
    `);


  console.log(
    '\nBRANCH ID STATS'
  );

  console.table(
    idStats.rows
  );


  console.log(
    '\nNO DATABASE CHANGES MADE.'
  );

} finally {

  await pool.end();
}