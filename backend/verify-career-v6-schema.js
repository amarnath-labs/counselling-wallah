import { pool } from './src/db/pool.js';

try {
  const result = await pool.query(`
    SELECT
      column_name,
      data_type
    FROM information_schema.columns
    WHERE table_name = 'career_questions'
      AND column_name IN (
        'classes',
        'boards',
        'interest_clusters',
        'career_families',
        'difficulty',
        'discriminator_group',
        'context_scope',
        'min_class',
        'max_class',
        'response_format'
      )
    ORDER BY ordinal_position
  `);

  console.table(result.rows);
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
