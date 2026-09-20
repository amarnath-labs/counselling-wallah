import {
  pool,
} from './src/db/pool.js';

try {
  const result =
    await pool.query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(scenario)::int
          AS with_scenario,
        COUNT(DISTINCT scenario)::int
          AS unique_scenarios
      FROM career_questions
      WHERE
        active = TRUE
        AND version = 7
        AND classes @>
          ARRAY['class-8']::text[]
    `);

  console.table(
    result.rows
  );

  const row =
    result.rows[0];

  if (
    row.total !== 96 ||
    row.with_scenario !== 96 ||
    row.unique_scenarios !== 96
  ) {
    throw new Error(
      `Expected 96/96/96, got ` +
      `${row.total}/${row.with_scenario}/${row.unique_scenarios}`
    );
  }

  console.log(
    '\n✅ CLASS-8 V7 SCENARIO DATABASE CHECK PASSED'
  );
}
finally {
  await pool.end();
}
