import { pool } from './src/db/pool.js';

async function main() {
  try {
    console.log('Adding V7 scenario metadata...');

    await pool.query(`
      ALTER TABLE career_questions
      ADD COLUMN IF NOT EXISTS scenario TEXT;
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS
      idx_career_questions_scenario
      ON career_questions (scenario)
      WHERE active = TRUE;
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS
      idx_career_questions_trait_scenario
      ON career_questions (trait, scenario)
      WHERE active = TRUE
        AND scenario IS NOT NULL;
    `);

    const result = await pool.query(`
      SELECT
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns
      WHERE
        table_name = 'career_questions'
        AND column_name = 'scenario';
    `);

    console.table(result.rows);

    if (result.rows.length !== 1) {
      throw new Error(
        'scenario column was not created'
      );
    }

    console.log(
      '\n✅ CAREER QUESTION SCENARIO MIGRATION PASSED'
    );
  }
  finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(
    '\n❌ SCENARIO MIGRATION FAILED'
  );

  console.error(error);

  process.exitCode = 1;
});
