import { pool } from './src/db/pool.js';

import bank from
  './src/data/careerQuestions/v7/index.js';


async function main() {
  const sourceIds =
    new Set(
      bank
        .filter(
          q =>
            Number(q.version) === 7
        )
        .map(q => q.id)
    );


  const { rows } =
    await pool.query(`
      SELECT
        q.id,
        COUNT(a.question_id)::int
          AS answer_references
      FROM career_questions q
      LEFT JOIN career_assessment_answers a
        ON a.question_id = q.id
      WHERE
        q.version = 7
        AND q.stage = 'graduate'
        AND q.active = TRUE
      GROUP BY q.id
      ORDER BY q.id
    `);


  const obsolete =
    rows.filter(
      row =>
        !sourceIds.has(row.id)
    );


  const referenced =
    obsolete.filter(
      row =>
        row.answer_references > 0
    );


  const totalReferences =
    obsolete.reduce(
      (sum, row) =>
        sum +
        Number(
          row.answer_references || 0
        ),
      0
    );


  console.log(
    'OBSOLETE GRADUATE ROWS:',
    obsolete.length
  );

  console.log(
    'ROWS WITH ANSWERS:',
    referenced.length
  );

  console.log(
    'TOTAL ANSWER REFERENCES:',
    totalReferences
  );

  console.log('');
  console.log(
    'REFERENCED SAMPLE:'
  );

  console.table(
    referenced.slice(0, 20)
  );
}


main()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
