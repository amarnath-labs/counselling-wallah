import { pool } from './src/db/pool.js';

const { rows } =
  await pool.query(`
    SELECT
      COUNT(*)::int AS total,

      COUNT(*) FILTER (
        WHERE cardinality(streams) > 0
      )::int AS stream_linked,

      COUNT(*) FILTER (
        WHERE cardinality(subjects) > 0
      )::int AS subject_linked,

      COUNT(*) FILTER (
        WHERE cardinality(entrance_exams) > 0
      )::int AS exam_linked,

      COUNT(*) FILTER (
        WHERE cardinality(target_courses) > 0
      )::int AS course_linked,

      COUNT(*) FILTER (
        WHERE cardinality(career_families) > 0
      )::int AS career_linked

    FROM career_questions
    WHERE active = TRUE
      AND stage = 'class-12'
  `);

console.table(
  rows
);

await pool.end();
