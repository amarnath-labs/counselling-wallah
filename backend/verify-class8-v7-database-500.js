import {
  pool,
} from './src/db/pool.js';


try {
  const result =
    await pool.query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(scenario)::int AS with_scenario,
        COUNT(scenario_family)::int AS with_scenario_family,
        COUNT(DISTINCT scenario)::int AS unique_scenarios,
        COUNT(DISTINCT scenario_family)::int AS unique_scenario_families,
        COUNT(DISTINCT trait)::int AS traits
      FROM career_questions
      WHERE active = TRUE
        AND version = 7
        AND classes @> ARRAY['class-8']::text[]
    `);


  console.table(
    result.rows
  );


  const traitCounts =
    await pool.query(`
      SELECT
        trait,
        COUNT(*)::int AS count
      FROM career_questions
      WHERE active = TRUE
        AND version = 7
        AND classes @> ARRAY['class-8']::text[]
      GROUP BY trait
      ORDER BY trait
    `);


  console.table(
    traitCounts.rows
  );


  const row =
    result.rows[0];


  if (
    row.total !== 500 ||
    row.with_scenario !== 500 ||
    row.with_scenario_family !== 500 ||
    row.traits !== 16
  ) {
    throw new Error(
      'Class-8 V7 database verification failed'
    );
  }


  console.log(
    '\nCLASS-8 V7 DATABASE CHECK PASSED'
  );
}
finally {
  await pool.end();
}
