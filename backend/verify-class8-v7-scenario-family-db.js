import {
  pool,
} from './src/db/pool.js';


try {
  const result =
    await pool.query(`
      SELECT
        COUNT(*)::int
          AS total,

        COUNT(scenario)::int
          AS with_scenario,

        COUNT(
          scenario_family
        )::int
          AS with_scenario_family,

        COUNT(
          DISTINCT scenario
        )::int
          AS unique_scenarios,

        COUNT(
          DISTINCT scenario_family
        )::int
          AS unique_scenario_families

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
    row.with_scenario_family !== 96 ||
    row.unique_scenarios !== 96
  ) {
    throw new Error(
      'Class-8 V7 scenario-family integrity check failed: ' +
      JSON.stringify(row)
    );
  }


  console.log(
    '\n✅ CLASS-8 V7 SCENARIO-FAMILY DATABASE CHECK PASSED'
  );
}
finally {
  await pool.end();
}
