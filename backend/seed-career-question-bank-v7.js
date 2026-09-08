import { pool } from './src/db/pool.js';

import {
  CAREER_QUESTION_BANK_V7,
} from './src/data/careerQuestions/v7/index.js';


async function main() {
  const questions =
    CAREER_QUESTION_BANK_V7.filter(
      (question) =>
        Number(question.version) === 7
    );


  console.log(
    'V7 questions to seed:',
    questions.length
  );


  if (!questions.length) {
    throw new Error(
      'No V7 questions found'
    );
  }


  const client =
    await pool.connect();


  try {
    await client.query('BEGIN');


    for (
      const question
      of questions
    ) {
      await client.query(
        `
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
          scenario,
          scenario_family,
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
          $29,
          $30,
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

          scenario =
            EXCLUDED.scenario,

          scenario_family =
            EXCLUDED.scenario_family,

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
        `,
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

          question.degrees || [],
          question.branches || [],
          question.streams || [],
          question.subjects || [],
          question.skills || [],
          question.goals || [],
          question.tags || [],

          Number(
            question.priority || 3
          ),

          Number(
            question.weight || 1
          ),

          question.active !== false,

          Number(
            question.version
          ),

          question.classes || [],
          question.boards || [],

          question.interestClusters ||
            [],

          question.careerFamilies ||
            [],

          Number(
            question.difficulty || 2
          ),

          question.discriminatorGroup ||
            null,

          question.scenario ||
            null,

          question.scenarioFamily ||
            null,

          question.contextScope ||
            'universal',

          question.minClass ??
            null,

          question.maxClass ??
            null,

          question.responseFormat ||
            'likert-5',
        ]
      );
    }


    const result =
      await client.query(
        `
        SELECT
          version,
          stage,
          classes,
          COUNT(*)::int AS count,
          COUNT(scenario)::int
            AS with_scenario,

          COUNT(scenario_family)::int
            AS with_scenario_family
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
        `
      );


    await client.query(
      'COMMIT'
    );


    console.table(
      result.rows
    );


    const total =
      result.rows.reduce(
        (sum, row) =>
          sum +
          Number(row.count),
        0
      );


    console.log(
      '\nTOTAL ACTIVE V7 QUESTIONS:',
      total
    );


    if (
      total !==
      questions.length
    ) {
      throw new Error(
        `Expected ${questions.length} active V7 questions, found ${total}`
      );
    }


    console.log(
      '\n✅ V7 SEED PASSED'
    );
  }
  catch (error) {
    await client.query(
      'ROLLBACK'
    );

    throw error;
  }
  finally {
    client.release();

    await pool.end();
  }
}


main()
  .catch(
    (error) => {
      console.error(
        '\n❌ V7 SEED FAILED'
      );

      console.error(
        error
      );

      process.exitCode = 1;
    }
  );
