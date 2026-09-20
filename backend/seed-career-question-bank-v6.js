import {
  CAREER_QUESTION_BANK_V6,
  CAREER_QUESTION_BANK_V6_STATS,
} from './src/data/careerQuestionBankV6.js';

import {
  pool,
} from './src/db/pool.js';


const SQL = `
  INSERT INTO career_questions (
    id,
    stage,
    section,
    trait,
    purpose,
    text,
    options_json,
    degrees,
    branches,
    streams,
    subjects,
    skills,
    goals,
    tags,
    priority,
    weight,
    active,
    version,
    classes,
    boards,
    interest_clusters,
    career_families,
    difficulty,
    discriminator_group,
    context_scope,
    min_class,
    max_class,
    response_format,
    updated_at
  )
  VALUES (
    $1,
    $2,
    $3,
    $4,
    $5,
    $6,
    $7::jsonb,
    $8::text[],
    $9::text[],
    $10::text[],
    $11::text[],
    $12::text[],
    $13::text[],
    $14::text[],
    $15,
    $16,
    $17,
    $18,
    $19::text[],
    $20::text[],
    $21::text[],
    $22::text[],
    $23,
    $24,
    $25,
    $26,
    $27,
    $28,
    NOW()
  )

  ON CONFLICT (id)
  DO UPDATE SET
    stage =
      EXCLUDED.stage,

    section =
      EXCLUDED.section,

    trait =
      EXCLUDED.trait,

    purpose =
      EXCLUDED.purpose,

    text =
      EXCLUDED.text,

    options_json =
      EXCLUDED.options_json,

    degrees =
      EXCLUDED.degrees,

    branches =
      EXCLUDED.branches,

    streams =
      EXCLUDED.streams,

    subjects =
      EXCLUDED.subjects,

    skills =
      EXCLUDED.skills,

    goals =
      EXCLUDED.goals,

    tags =
      EXCLUDED.tags,

    priority =
      EXCLUDED.priority,

    weight =
      EXCLUDED.weight,

    active =
      EXCLUDED.active,

    version =
      EXCLUDED.version,

    classes =
      EXCLUDED.classes,

    boards =
      EXCLUDED.boards,

    interest_clusters =
      EXCLUDED.interest_clusters,

    career_families =
      EXCLUDED.career_families,

    difficulty =
      EXCLUDED.difficulty,

    discriminator_group =
      EXCLUDED.discriminator_group,

    context_scope =
      EXCLUDED.context_scope,

    min_class =
      EXCLUDED.min_class,

    max_class =
      EXCLUDED.max_class,

    response_format =
      EXCLUDED.response_format,

    updated_at =
      NOW()
`;


async function main() {
  console.log(
    'TruMarg V6 pilot bank stats:'
  );

  console.table(
    CAREER_QUESTION_BANK_V6_STATS
      .byClass
  );

  console.log(
    'Total V6 pilot questions:',
    CAREER_QUESTION_BANK_V6_STATS
      .total
  );


  const client =
    await pool.connect();

  try {
    await client.query(
      'BEGIN'
    );

    for (
      const question
      of CAREER_QUESTION_BANK_V6
    ) {
      await client.query(
        SQL,
        [
          question.id,

          question.stage,

          question.section,

          question.trait,

          question.purpose,

          question.text,

          JSON.stringify(
            question.options
          ),

          question.degrees,

          question.branches,

          question.streams,

          question.subjects,

          question.skills,

          question.goals,

          question.tags,

          question.priority,

          question.weight,

          question.active,

          question.version,

          question.classes,

          question.boards,

          question.interestClusters,

          question.careerFamilies,

          question.difficulty,

          question.discriminatorGroup,

          question.contextScope,

          question.minClass,

          question.maxClass,

          question.responseFormat,
        ]
      );
    }

    await client.query(
      'COMMIT'
    );


    const {
      rows,
    } =
      await client.query(`
        SELECT
          classes,
          COUNT(*)::int AS count
        FROM career_questions
        WHERE version = 6
          AND active = TRUE
        GROUP BY classes
        ORDER BY classes
      `);

    console.log(
      '\nSeed complete.'
    );

    console.table(
      rows
    );
  } catch (error) {
    await client.query(
      'ROLLBACK'
    );

    throw error;
  } finally {
    client.release();
  }
}


main()
  .catch(
    (error) => {
      console.error(
        'V6 seed failed:',
        error
      );

      process.exitCode = 1;
    }
  )
  .finally(
    async () => {
      await pool.end();
    }
  );
