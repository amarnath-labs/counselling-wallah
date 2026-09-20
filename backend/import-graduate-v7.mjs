import { pool } from './src/db/pool.js';

import questions from
  './src/data/careerQuestions/v7/graduateBatch01.js';


function arrayValue(value) {
  return Array.isArray(value)
    ? value
    : [];
}


async function main() {
  console.log(
    'Graduate V7 source questions:',
    questions.length
  );


  if (
    questions.length !== 500
  ) {
    throw new Error(
      `Expected 500 Graduate V7 questions, found ${questions.length}.`
    );
  }


  const invalidStage =
    questions.filter(
      question =>
        question.stage !==
        'graduate'
    );


  if (
    invalidStage.length
  ) {
    throw new Error(
      `Found ${invalidStage.length} non-graduate questions in Graduate V7 source.`
    );
  }


  const uniqueIds =
    new Set(
      questions.map(
        question =>
          question.id
      )
    );


  if (
    uniqueIds.size !==
    questions.length
  ) {
    throw new Error(
      'Duplicate Graduate V7 question IDs found.'
    );
  }


  const client =
    await pool.connect();


  let inserted = 0;
  let updated = 0;


  try {
    await client.query(
      'BEGIN'
    );


    /*
    |--------------------------------------------------------------------------
    | Disable all previous Graduate question-bank versions
    |--------------------------------------------------------------------------
    |
    | Old version 1 / 5 questions must not remain active alongside V7.
    |
    */

    const oldResult =
      await client.query(
        `
          UPDATE career_questions
          SET
            active = FALSE,
            updated_at = NOW()
          WHERE stage = 'graduate'
            AND version <> 7
            AND active = TRUE
        `
      );


    console.log(
      'Old Graduate rows deactivated:',
      oldResult.rowCount
    );


    /*
    |--------------------------------------------------------------------------
    | Import Graduate V7
    |--------------------------------------------------------------------------
    */

    for (
      const question of
      questions
    ) {
      const existing =
        await client.query(
          `
            SELECT id
            FROM career_questions
            WHERE id = $1
            LIMIT 1
          `,
          [
            question.id,
          ]
        );


      const values = [
        question.id,

        'graduate',

        question.section ||
          'career-discovery',

        question.trait,

        question.purpose ||
          'career-discovery',

        question.text,

        JSON.stringify(
          question.options ||
          []
        ),

        arrayValue(
          question.degrees
        ),

        arrayValue(
          question.branches
        ),

        arrayValue(
          question.streams
        ),

        arrayValue(
          question.subjects
        ),

        arrayValue(
          question.skills
        ),

        arrayValue(
          question.goals
        ),

        arrayValue(
          question.tags
        ),

        true,

        arrayValue(
          question.classes
        ),

        arrayValue(
          question.boards
        ),

        arrayValue(
          question.interestClusters
        ),

        arrayValue(
          question.careerFamilies
        ),

        arrayValue(
          question.entranceExams
        ),

        arrayValue(
          question.targetCourses
        ),

        Number(
          question.difficulty ??
          3
        ),

        question.discriminatorGroup ||
          null,

        question.scenario ||
          null,

        question.scenarioFamily ||
          null,

        question.contextScope ||
          'professional',

        question.minClass == null
          ? null
          : Number(
              question.minClass
            ),

        question.maxClass == null
          ? null
          : Number(
              question.maxClass
            ),

        question.responseFormat ||
          'likert-5',

        Number(
          question.priority ??
          3
        ),

        Number(
          question.weight ??
          1
        ),

        Number(
          question.version ??
          7
        ),
      ];


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
            active,
            classes,
            boards,
            interest_clusters,
            career_families,
            entrance_exams,
            target_courses,
            difficulty,
            discriminator_group,
            scenario,
            scenario_family,
            context_scope,
            min_class,
            max_class,
            response_format,
            priority,
            weight,
            version
          )
          VALUES (
            $1,$2,$3,$4,$5,$6,$7,$8,
            $9,$10,$11,$12,$13,$14,$15,$16,
            $17,$18,$19,$20,$21,$22,$23,$24,
            $25,$26,$27,$28,$29,$30,$31,$32
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

            active =
              TRUE,

            classes =
              EXCLUDED.classes,

            boards =
              EXCLUDED.boards,

            interest_clusters =
              EXCLUDED.interest_clusters,

            career_families =
              EXCLUDED.career_families,

            entrance_exams =
              EXCLUDED.entrance_exams,

            target_courses =
              EXCLUDED.target_courses,

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

            priority =
              EXCLUDED.priority,

            weight =
              EXCLUDED.weight,

            version =
              EXCLUDED.version,

            updated_at =
              NOW()
        `,
        values
      );


      if (
        existing.rowCount
      ) {
        updated += 1;
      } else {
        inserted += 1;
      }
    }


    /*
    |--------------------------------------------------------------------------
    | Verification before commit
    |--------------------------------------------------------------------------
    */

    const {
      rows:
        activeVersionRows,
    } =
      await client.query(
        `
          SELECT
            version,
            COUNT(*)::int AS count
          FROM career_questions
          WHERE stage = 'graduate'
            AND active = TRUE
          GROUP BY version
          ORDER BY version
        `
      );


    console.table(
      activeVersionRows
    );


    const {
      rows:
        activeV7Rows,
    } =
      await client.query(
        `
          SELECT
            COUNT(*)::int AS count
          FROM career_questions
          WHERE stage = 'graduate'
            AND version = 7
            AND active = TRUE
        `
      );


    const activeV7Count =
      Number(
        activeV7Rows[0]?.count ||
        0
      );


    if (
      activeV7Count !==
      500
    ) {
      throw new Error(
        `Expected 500 active Graduate V7 questions after import, found ${activeV7Count}.`
      );
    }


    const {
      rows:
        oldActiveRows,
    } =
      await client.query(
        `
          SELECT
            COUNT(*)::int AS count
          FROM career_questions
          WHERE stage = 'graduate'
            AND version <> 7
            AND active = TRUE
        `
      );


    const oldActiveCount =
      Number(
        oldActiveRows[0]?.count ||
        0
      );


    if (
      oldActiveCount !== 0
    ) {
      throw new Error(
        `Expected 0 active legacy Graduate questions, found ${oldActiveCount}.`
      );
    }


    await client.query(
      'COMMIT'
    );


    console.log('');
    console.log(
      '========================================'
    );
    console.log(
      'GRADUATE V7 IMPORT COMPLETE'
    );
    console.log(
      '========================================'
    );
    console.log(
      'Inserted:',
      inserted
    );
    console.log(
      'Updated:',
      updated
    );
    console.log(
      'Active Graduate V7:',
      activeV7Count
    );
    console.log(
      'Active legacy Graduate:',
      oldActiveCount
    );
  } catch (error) {
    await client.query(
      'ROLLBACK'
    );

    console.error('');
    console.error(
      'Graduate V7 import failed.'
    );

    console.error(
      error
    );

    process.exitCode = 1;
  } finally {
    client.release();

    await pool.end();
  }
}


main();