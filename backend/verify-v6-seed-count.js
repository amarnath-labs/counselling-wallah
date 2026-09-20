import { pool } from './src/db/pool.js';

try {
  const { rows } = await pool.query(`
    SELECT
      version,
      stage,
      classes,
      COUNT(*)::int AS count
    FROM career_questions
    WHERE version = 6
      AND active = TRUE
    GROUP BY
      version,
      stage,
      classes
    ORDER BY
      stage,
      classes
  `);

  console.table(rows);

  const total = rows.reduce(
    (sum, row) =>
      sum + Number(row.count),
    0
  );

  console.log(
    'TOTAL ACTIVE V6 QUESTIONS:',
    total
  );

  if (total !== 30) {
    throw new Error(
      `Expected 30 V6 questions, found ${total}`
    );
  }

  console.log(
    '✅ V6 SEED COUNT PASSED'
  );
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
