import 'dotenv/config';

import { pool } from './src/db/pool.js';

async function main() {
  console.log('');

  console.log(
    '======================================='
  );

  console.log(
    'BRANCH FEES CONSTRAINT INSPECTOR'
  );

  console.log(
    '======================================='
  );

  console.log('');

  const client =
    await pool.connect();

  try {
    const result =
      await client.query(
        `
        SELECT
          con.conname AS constraint_name,
          pg_get_constraintdef(
            con.oid
          ) AS definition
        FROM pg_constraint con
        JOIN pg_class rel
          ON rel.oid = con.conrelid
        JOIN pg_namespace nsp
          ON nsp.oid = rel.relnamespace
        WHERE rel.relname = 'branch_fees'
          AND con.contype = 'c'
        ORDER BY
          con.conname
        `
      );

    console.table(
      result.rows
    );

    console.log('');

    console.log(
      'Existing fee_scope values:'
    );

    const scopes =
      await client.query(
        `
        SELECT
          fee_scope,
          branch_id IS NULL AS branch_is_null,
          COUNT(*)::int AS rows
        FROM branch_fees
        GROUP BY
          fee_scope,
          branch_id IS NULL
        ORDER BY
          fee_scope,
          branch_id IS NULL
        `
      );

    console.table(
      scopes.rows
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

main().catch(
  error => {
    console.error(
      'FAILED:',
      error.message
    );

    process.exitCode = 1;
  }
);
