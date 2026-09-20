import fs from 'node:fs/promises';
import { pool } from './src/db/pool.js';

async function main() {
  const migrationUrl =
    new URL(
      './src/db/migrations/career-question-metadata-v6.sql',
      import.meta.url
    );

  const sql =
    await fs.readFile(
      migrationUrl,
      'utf8'
    );

  console.log(
    'Applying TruMarg career question metadata V6...'
  );

  await pool.query(sql);

  const result =
    await pool.query(`
      SELECT
        COUNT(*)::int AS total_questions,
        COUNT(*) FILTER (
          WHERE active = true
        )::int AS active_questions
      FROM career_questions
    `);

  console.log(
    'Migration complete:',
    result.rows[0]
  );
}

main()
  .catch((error) => {
    console.error(
      'Migration failed:',
      error
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
