import { pool } from './src/db/pool.js';


const { rows } =
  await pool.query(`
    SELECT
      stage,
      version,
      classes,
      active,
      COUNT(*)::int AS count
    FROM career_questions
    WHERE version = 7
      AND (
        'class-11' = ANY(classes)
        OR
        'class-12' = ANY(classes)
      )
    GROUP BY
      stage,
      version,
      classes,
      active
    ORDER BY
      stage,
      classes,
      active DESC
  `);


console.log('');
console.log(
  '========================================'
);

console.log(
  'CLASS 11 / 12 V7 LOCATION AUDIT'
);

console.log(
  '========================================'
);

console.table(rows);


const { rows: counts } =
  await pool.query(`
    SELECT
      COUNT(*) FILTER (
        WHERE
          version = 7
          AND 'class-11' = ANY(classes)
      )::int AS class11,

      COUNT(*) FILTER (
        WHERE
          version = 7
          AND 'class-12' = ANY(classes)
      )::int AS class12

    FROM career_questions
  `);


console.log(
  'TOTALS:',
  counts[0]
);


await pool.end();
