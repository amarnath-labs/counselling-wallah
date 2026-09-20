import { pool } from './src/db/pool.js';

const { rows } =
  await pool.query(`
    SELECT
      COUNT(*)::int AS total,

      COUNT(*) FILTER (
        WHERE cardinality(degrees) > 0
      )::int AS degree_linked,

      COUNT(*) FILTER (
        WHERE cardinality(branches) > 0
      )::int AS branch_linked,

      COUNT(*) FILTER (
        WHERE cardinality(college_years) > 0
      )::int AS year_linked,

      COUNT(*) FILTER (
        WHERE cardinality(goals) > 0
      )::int AS goal_linked,

      COUNT(*) FILTER (
        WHERE cardinality(skills) > 0
      )::int AS skill_linked,

      COUNT(*) FILTER (
        WHERE cardinality(career_families) > 0
      )::int AS career_linked

    FROM career_questions
    WHERE active = TRUE
      AND stage = 'college'
      AND id LIKE 'v7_college_%'
  `);

console.table(rows);

await pool.end();
