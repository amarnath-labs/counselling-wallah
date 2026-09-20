import 'dotenv/config';

import { pool } from './src/db/pool.js';

async function main() {

  console.log('');
  console.log('=======================================');
  console.log('FEE VARIANTS CONSTRAINT INSPECTOR');
  console.log('=======================================');
  console.log('');

  const client = await pool.connect();

  try {

    const constraints = await client.query(`
      SELECT
        con.conname AS constraint_name,
        pg_get_constraintdef(con.oid) AS definition
      FROM pg_constraint con
      JOIN pg_class rel
        ON rel.oid = con.conrelid
      JOIN pg_namespace nsp
        ON nsp.oid = rel.relnamespace
      WHERE rel.relname = 'fee_variants'
        AND con.contype = 'c'
      ORDER BY con.conname;
    `);

    console.log('CHECK CONSTRAINTS');
    console.table(
      constraints.rows
    );

    console.log('');

    const roomTypes = await client.query(`
      SELECT
        room_type,
        residence_type,
        COUNT(*)::int AS rows
      FROM fee_variants
      GROUP BY
        room_type,
        residence_type
      ORDER BY
        residence_type,
        room_type;
    `);

    console.log('EXISTING ROOM / RESIDENCE VALUES');
    console.table(
      roomTypes.rows
    );

    console.log('');

    const columns = await client.query(`
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'fee_variants'
        AND column_name IN (
          'room_type',
          'residence_type',
          'fee_period',
          'student_category'
        )
      ORDER BY column_name;
    `);

    console.log('RELEVANT COLUMN DEFINITIONS');
    console.table(
      columns.rows
    );

    console.log('');

    console.log(
      'DATABASE HAS NOT BEEN MODIFIED.'
    );

  } finally {

    client.release();

    await pool.end();
  }
}

main().catch(error => {

  console.error(
    'FAILED:',
    error.message
  );

  process.exitCode = 1;
});
