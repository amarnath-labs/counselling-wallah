import { pool } from './src/db/pool.js';

import questions from
  './src/data/careerQuestions/v7/class9Batch01.js';


function arrayValue(value) {
  return Array.isArray(value)
    ? value
    : [];
}


async function main() {
  console.log(
    'Class 9 V7 source questions:',
    questions.length
  );


  if (
    questions.length !== 500
  ) {
    throw new Error(
      `Expected 500 Class 9 V7 questions, found ${questions.length}.`
    );
  }


  const invalidQuestions =
    questions.filter(
      question =>
        question.stage !== 'foundation' ||
        !Array.isArray(question.classes) ||
        !question.classes.includes('class-9')
    );


  if (
    invalidQuestions.length
  ) {
    console.error(
      invalidQuestions
        .slice(0, 10)
        .map(q => ({
          id: q.id,
          stage: q.stage,
          classes: q.classes,
        }))
    );

    throw new Error(
      `Found ${invalidQuestions.length} invalid Class 9 V7 questions.`
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
      'Duplicate Class 9 V7 question IDs found.'
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
    | IMPORTANT
    |--------------------------------------------------------------------------
    |
    | Legacy Class 9 V6 rows are intentionally NOT updated/deactivated here.
    |
    | Some legacy rows contain metadata values that were inserted before the
    | current database CHECK constraints existed. PostgreSQL allows those old
    | rows to remain because the constraint is NOT VALID, but touching them
    | with UPDATE causes the current constraints to be checked again.
    |
    | Therefore:
    |
    | - Import V7 safely.
    | - Do not mutate legacy Class 9 rows in this importer.
    | - Runtime retrieval will later be restricted to version = 7.
    |
    |--------------------------------------------------------------------------
    */


    /*
    |--------------------------------------------------------------------------
    | Import Class 9 V7
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

        'foundation',

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

        ['class-9'],

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
          'school',

        question.minClass == null
          ? 9
          : Number(
              question.minClass
            ),

        question.maxClass == null
          ? 9
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
    | Verify Class 9 V7
    |--------------------------------------------------------------------------
    */

    const {
      rows,
    } =
      await client.query(
        `
          SELECT
            COUNT(*)::int AS count
          FROM career_questions
          WHERE stage = 'foundation'
            AND version = 7
            AND active = TRUE
            AND 'class-9' = ANY(classes)
        `
      );


    const class9V7Count =
      Number(
        rows[0]?.count ||
        0
      );


    if (
      class9V7Count !== 500
    ) {
      throw new Error(
        `Expected 500 active Class 9 V7 questions, found ${class9V7Count}.`
      );
    }


    /*
    |--------------------------------------------------------------------------
    | Verify Class 8 bank was not affected
    |--------------------------------------------------------------------------
    */

    const {
      rows:
        class8Rows,
    } =
      await client.query(
        `
          SELECT
            COUNT(*)::int AS count
          FROM career_questions
          WHERE stage = 'foundation'
            AND version = 7
            AND active = TRUE
            AND 'class-8' = ANY(classes)
        `
      );


    const class8V7Count =
      Number(
        class8Rows[0]?.count ||
        0
      );


    if (
      class8V7Count !== 500
    ) {
      throw new Error(
        `Class 8 V7 safety check failed. Expected 500, found ${class8V7Count}.`
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
      'CLASS 9 V7 IMPORT COMPLETE'
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
      'Active Class 8 V7:',
      class8V7Count
    );

    console.log(
      'Active Class 9 V7:',
      class9V7Count
    );

    console.log(
      'Legacy Class 9 rows:',
      'left untouched intentionally'
    );
  } catch (error) {
    await client.query(
      'ROLLBACK'
    );

    console.error('');
    console.error(
      'Class 9 V7 import failed.'
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