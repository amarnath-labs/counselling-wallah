import { pool } from './src/db/pool.js';

try {

  console.log(
    '\n========================================'
  );

  console.log(
    'IIT GANDHINAGAR BRANCH AUDIT'
  );

  console.log(
    '========================================\n'
  );

  const result =
    await pool.query(`
      SELECT
        c.id AS college_id,
        c.name AS college_name,
        b.id AS branch_id,
        b.name AS branch_name
      FROM colleges c
      JOIN branches b
        ON b.college_id = c.id
      WHERE c.id = 'iit-gandhinagar'
         OR LOWER(c.name) LIKE '%iit gandhinagar%'
         OR LOWER(c.name) LIKE '%technology gandhinagar%'
      ORDER BY
        b.name
    `);

  console.log(
    'Branches found:',
    result.rows.length
  );

  console.table(
    result.rows
  );

  console.log(
    '\nNO DATABASE CHANGES MADE.'
  );

} finally {
  await pool.end();
}