import { pool } from './src/db/pool.js';

const { rows } = await pool.query(`
  SELECT
    stage,
    version,
    classes,
    COUNT(*)::int AS count
  FROM career_questions
  WHERE version = 7
    AND active = TRUE
    AND (
      'class-11' = ANY(classes)
      OR 'class-12' = ANY(classes)
    )
  GROUP BY stage, version, classes
  ORDER BY stage, classes
`);

console.table(rows);

await pool.end();
