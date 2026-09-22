import {
  pool,
} from './src/db/pool.js';


async function run() {
  try {

    await pool.query(`
      INSERT INTO exams (
        id,
        name,
        description,
        active
      )
      VALUES
        (
          'cuet',
          'CUET',
          'Common University Entrance Test for participating universities.',
          true
        ),
        (
          'neet',
          'NEET UG',
          'National Eligibility cum Entrance Test for undergraduate medical admissions.',
          true
        )
      ON CONFLICT (id)
      DO UPDATE SET
        name =
          EXCLUDED.name,

        description =
          EXCLUDED.description,

        active =
          true,

        updated_at =
          NOW();
    `);


    const {
      rows,
    } =
      await pool.query(`
        SELECT
          id,
          name,
          active
        FROM exams
        WHERE id IN (
          'jee-main',
          'jee-advanced',
          'uptac',
          'cuet',
          'neet'
        )
        ORDER BY id;
      `);


    console.log(
      '\n===== ACTIVE TARGET EXAMS ====='
    );

    console.table(
      rows
    );

  } finally {

    await pool.end();

  }
}


run().catch(
  error => {

    console.error(
      '\nCUET / NEET ENABLE ERROR:'
    );

    console.error(
      error
    );

    process.exit(
      1
    );

  }
);
