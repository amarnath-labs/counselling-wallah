import { pool } from './src/db/pool.js';

try {

  console.log(
    '\n========================================'
  );

  console.log(
    'BRANCHES SEQUENCE SAFETY AUDIT'
  );

  console.log(
    '========================================\n'
  );


  const stats =
    await pool.query(`
      SELECT
        COUNT(*)::int AS total_rows,
        MIN(id) AS min_id,
        MAX(id) AS max_id
      FROM branches
    `);


  console.log(
    'NUMERIC BRANCH ID STATS'
  );

  console.table(
    stats.rows
  );


  const sequence =
    await pool.query(`
      SELECT
        last_value,
        is_called
      FROM branches_id_seq
    `);


  console.log(
    '\nSEQUENCE STATE'
  );

  console.table(
    sequence.rows
  );


  const maxId =
    Number(
      stats.rows[0].max_id
    );

  const lastValue =
    Number(
      sequence.rows[0].last_value
    );

  const isCalled =
    sequence.rows[0].is_called;


  const nextExpected =
    isCalled
      ? lastValue + 1
      : lastValue;


  console.log(
    '\nMax branch id:',
    maxId
  );

  console.log(
    'Sequence last_value:',
    lastValue
  );

  console.log(
    'Sequence is_called:',
    isCalled
  );

  console.log(
    'Expected next sequence id:',
    nextExpected
  );


  if (
    nextExpected <=
    maxId
  ) {

    console.log(
      '\nWARNING: sequence is behind existing branch IDs.'
    );

    console.log(
      'DO NOT INSERT NEW BRANCHES YET.'
    );

  } else {

    console.log(
      '\nSEQUENCE SAFETY: PASSED'
    );

    console.log(
      'Next generated ID is above current MAX(id).'
    );
  }


  console.log(
    '\nNO DATABASE CHANGES MADE.'
  );

} finally {

  await pool.end();
}