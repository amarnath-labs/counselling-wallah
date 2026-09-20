import { pool } from './src/db/pool.js';

try {
  console.log('');
  console.log(
    '========================================'
  );
  console.log(
    'TRUMARG PGVECTOR SETUP'
  );
  console.log(
    '========================================'
  );

  await pool.query(`
    CREATE EXTENSION IF NOT EXISTS vector;
  `);

  console.log(
    'pgvector extension: READY'
  );


  await pool.query(`
    ALTER TABLE career_questions
    ADD COLUMN IF NOT EXISTS embedding vector(384);
  `);

  console.log(
    'embedding column: READY'
  );


  const { rows } =
    await pool.query(`
      SELECT
        column_name,
        udt_name
      FROM information_schema.columns
      WHERE table_name = 'career_questions'
        AND column_name = 'embedding';
    `);


  console.table(rows);


  const { rows: counts } =
    await pool.query(`
      SELECT
        COUNT(*)::int AS total_v7,
        COUNT(embedding)::int AS embedded_v7
      FROM career_questions
      WHERE version = 7
        AND active = TRUE;
    `);


  console.log(
    'V7 embedding status:',
    counts[0]
  );
} finally {
  await pool.end();
}
