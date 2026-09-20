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
        id,
        stage,
        classes
      FROM career_questions
      WHERE
        active = TRUE
        AND version = 7
      ORDER BY id
    `);


  const dbIds =
    new Set(
      rows.map(row => row.id)
    );


  const onlyInDb =
    rows.filter(
      row =>
        !sourceIds.has(row.id)
    );


  const onlyInSource =
    bank.filter(
      q =>
        Number(q.version) === 7 &&
        !dbIds.has(q.id)
    );


  console.log(
    'SOURCE V7:',
    sourceIds.size
  );

  console.log(
    'DB ACTIVE V7:',
    dbIds.size
  );

  console.log(
    'ONLY IN DB:',
    onlyInDb.length
  );

  console.log(
    'ONLY IN SOURCE:',
    onlyInSource.length
  );


  console.log('');
  console.log(
    'ONLY-IN-DB BY STAGE'
  );

  const counts = {};

  for (const row of onlyInDb) {
    const key =
      `${row.stage} | ${
        JSON.stringify(row.classes)
      }`;

    counts[key] =
      (counts[key] || 0) + 1;
  }

  console.table(
    Object.entries(counts)
      .map(
        ([group, count]) => ({
          group,
          count,
        })
      )
  );


  console.log('');
  console.log(
    'FIRST 20 ONLY-IN-DB IDS'
  );

  console.table(
    onlyInDb.slice(0, 20)
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
