import { pool } from './src/db/pool.js';


async function main() {
  const queries = [
    {
      name: 'ALL ACTIVE SENIOR SECONDARY',
      sql: `
        SELECT COUNT(*)::int AS count
        FROM career_questions
        WHERE active = TRUE
          AND stage = 'senior-secondary'
      `,
    },

    {
      name: 'VERSION 7 SENIOR SECONDARY',
      sql: `
        SELECT COUNT(*)::int AS count
        FROM career_questions
        WHERE active = TRUE
          AND stage = 'senior-secondary'
          AND version = 7
      `,
    },

    {
      name: 'CLASS 12 SENIOR SECONDARY - ANY VERSION',
      sql: `
        SELECT COUNT(*)::int AS count
        FROM career_questions
        WHERE active = TRUE
          AND stage = 'senior-secondary'
          AND 'class-12' = ANY(classes)
      `,
    },

    {
      name: 'VERSION 7 + CLASS 12',
      sql: `
        SELECT COUNT(*)::int AS count
        FROM career_questions
        WHERE active = TRUE
          AND stage = 'senior-secondary'
          AND version = 7
          AND 'class-12' = ANY(classes)
      `,
    },
  ];


  for (const item of queries) {
    const { rows } =
      await pool.query(item.sql);

    console.log(
      `${item.name}:`,
      rows[0].count
    );
  }


  const { rows: sample } =
    await pool.query(`
      SELECT
        id,
        version,
        stage,
        classes,
        streams,
        entrance_exams,
        target_courses
      FROM career_questions
      WHERE active = TRUE
        AND stage = 'senior-secondary'
      ORDER BY
        version DESC,
        priority DESC,
        id ASC
      LIMIT 30
    `);


  console.log('');
  console.log('SAMPLE ROWS');
  console.table(sample);
}


main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
