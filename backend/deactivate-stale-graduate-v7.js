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


  const { rows: candidates } =
    await pool.query(`
      SELECT
        id
      FROM career_questions
      WHERE
        version = 7
        AND stage = 'graduate'
        AND active = TRUE
      ORDER BY id
    `);


  const staleIds =
    candidates
      .map(row => row.id)
      .filter(
        id =>
          !sourceIds.has(id)
      );


  console.log(
    'STALE ACTIVE GRADUATE V7:',
    staleIds.length
  );


  if (
    staleIds.length !== 500
  ) {
    throw new Error(
      `Safety stop: expected 500 stale Graduate V7 rows, found ${staleIds.length}.`
    );
  }


  const client =
    await pool.connect();


  try {
    await client.query(
      'BEGIN'
    );


    const { rows: refs } =
      await client.query(
        `
          SELECT
            COUNT(*)::int AS count
          FROM career_assessment_answers
          WHERE
            question_id = ANY($1::text[])
        `,
        [staleIds]
      );


    const referenceCount =
      refs[0].count;


    console.log(
      'ANSWER REFERENCES:',
      referenceCount
    );


    if (
      referenceCount !== 0
    ) {
      throw new Error(
        `Safety stop: stale Graduate V7 questions have ${referenceCount} answer references.`
      );
    }


    const result =
      await client.query(
        `
          UPDATE career_questions
          SET
            active = FALSE,
            updated_at = NOW()
          WHERE
            id = ANY($1::text[])
            AND version = 7
            AND stage = 'graduate'
            AND active = TRUE
        `,
        [staleIds]
      );


    console.log(
      'DEACTIVATED:',
      result.rowCount
    );


    if (
      result.rowCount !==
      staleIds.length
    ) {
      throw new Error(
        `Safety stop: expected to deactivate ${staleIds.length}, changed ${result.rowCount}.`
      );
    }


    await client.query(
      'COMMIT'
    );

    console.log(
      'SUCCESS: stale Graduate V7 rows safely deactivated.'
    );
  } catch (error) {
    await client.query(
      'ROLLBACK'
    );

    throw error;
  } finally {
    client.release();
  }


  const { rows: summary } =
    await pool.query(`
      SELECT
        version,
        stage,
        classes,
        COUNT(*)::int AS count
      FROM career_questions
      WHERE
        active = TRUE
        AND version = 7
      GROUP BY
        version,
        stage,
        classes
      ORDER BY
        stage,
        classes
    `);


  console.table(summary);


  const { rows: total } =
    await pool.query(`
      SELECT
        COUNT(*)::int AS count
      FROM career_questions
      WHERE
        active = TRUE
        AND version = 7
    `);


  console.log(
    'TOTAL ACTIVE V7:',
    total[0].count
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
