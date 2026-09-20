import {
  pool,
} from './src/db/pool.js';


async function main() {
  try {
    console.log(
      'Adding scenario_family metadata...'
    );


    await pool.query(`
      ALTER TABLE career_questions
      ADD COLUMN IF NOT EXISTS
        scenario_family TEXT;
    `);


    await pool.query(`
      CREATE INDEX IF NOT EXISTS
        idx_career_questions_scenario_family
      ON career_questions (
        scenario_family
      )
      WHERE
        active = TRUE
        AND scenario_family IS NOT NULL;
    `);


    await pool.query(`
      CREATE INDEX IF NOT EXISTS
        idx_career_questions_trait_scenario_family
      ON career_questions (
        trait,
        scenario_family
      )
      WHERE
        active = TRUE
        AND scenario_family IS NOT NULL;
    `);


    const result =
      await pool.query(`
        SELECT
          column_name,
          data_type,
          is_nullable
        FROM information_schema.columns
        WHERE
          table_name =
            'career_questions'
          AND column_name =
            'scenario_family'
      `);


    console.table(
      result.rows
    );


    if (
      result.rows.length !== 1
    ) {
      throw new Error(
        'scenario_family column missing'
      );
    }


    console.log(
      '\n✅ SCENARIO FAMILY MIGRATION PASSED'
    );
  }
  finally {
    await pool.end();
  }
}


main().catch(
  (error) => {
    console.error(
      '\n❌ SCENARIO FAMILY MIGRATION FAILED'
    );

    console.error(
      error
    );

    process.exitCode = 1;
  }
);
