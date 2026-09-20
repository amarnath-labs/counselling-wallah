import { pool } from './src/db/pool.js';

import bank from
  './src/data/careerQuestions/v7/index.js';


async function main() {
  const sourceGraduate =
    bank.filter(
      q =>
        Number(q.version) === 7 &&
        q.stage === 'graduate'
    );


  const sourceIds =
    new Set(
      sourceGraduate.map(
        q => q.id
      )
    );


  const { rows: dbGraduate } =
    await pool.query(`
      SELECT
        id,
        active,
        created_at,
        updated_at
      FROM career_questions
      WHERE
        version = 7
        AND stage = 'graduate'
      ORDER BY id
    `);


  const currentRows =
    dbGraduate.filter(
      row =>
        sourceIds.has(row.id)
    );


  const obsoleteRows =
    dbGraduate.filter(
      row =>
        !sourceIds.has(row.id)
    );


  console.log(
    'SOURCE GRADUATE V7:',
    sourceGraduate.length
  );

  console.log(
    'DB GRADUATE V7:',
    dbGraduate.length
  );

  console.log(
    'CURRENT SOURCE-MATCHED:',
    currentRows.length
  );

  console.log(
    'OBSOLETE / NOT IN SOURCE:',
    obsoleteRows.length
  );


  console.log('');
  console.log(
    'CURRENT SOURCE IDS SAMPLE'
  );

  console.table(
    sourceGraduate
      .slice(0, 15)
      .map(
        q => ({
          id: q.id,
          trait: q.trait,
          contextScope:
            q.contextScope,
        })
      )
  );


  console.log('');
  console.log(
    'OBSOLETE DB IDS SAMPLE'
  );

  console.table(
    obsoleteRows.slice(0, 15)
  );


  const { rows: references } =
    await pool.query(`
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name
          AS referenced_table,
        ccu.column_name
          AS referenced_column
      FROM
        information_schema.table_constraints tc
      JOIN
        information_schema.key_column_usage kcu
          ON
            tc.constraint_name =
              kcu.constraint_name
            AND
            tc.constraint_schema =
              kcu.constraint_schema
      JOIN
        information_schema.constraint_column_usage ccu
          ON
            ccu.constraint_name =
              tc.constraint_name
            AND
            ccu.constraint_schema =
              tc.constraint_schema
      WHERE
        tc.constraint_type =
          'FOREIGN KEY'
        AND
        ccu.table_name =
          'career_questions'
        AND
        ccu.column_name =
          'id'
      ORDER BY
        tc.table_name,
        kcu.column_name
    `);


  console.log('');
  console.log(
    'FOREIGN KEYS REFERENCING career_questions.id'
  );

  console.table(references);
}


main()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
