import {
  pool,
} from './src/db/pool.js';

import collegeQuestions from
  './src/data/careerQuestions/v7/collegeBatch01.js';


function arr(value) {
  return Array.isArray(value)
    ? value
    : [];
}


async function main() {
  console.log(
    'College V7 source questions:',
    collegeQuestions.length
  );

  if (
    collegeQuestions.length !== 500
  ) {
    throw new Error(
      `Expected 500 College V7 questions, found ${collegeQuestions.length}.`
    );
  }


  const client =
    await pool.connect();


  try {
    await client.query('BEGIN');

    let inserted = 0;
    let updated = 0;


    for (
      const question of
      collegeQuestions
    ) {
      const existing =
        await client.query(
          `
            SELECT id
            FROM career_questions
            WHERE id = $1
          `,
          [question.id]
        );


      const values = [
        question.id,
        'college',

        question.section ||
          'professional-direction',

        question.trait,

        question.purpose ||
          'measurement',

        question.text,

        JSON.stringify(
          question.options || []
        ),

        arr(question.degrees),
        arr(question.branches),
        arr(question.streams),
        arr(question.subjects),
        arr(question.skills),
        arr(question.goals),
        arr(question.tags),

        true,

        arr(question.classes),
        arr(question.boards),
        arr(question.interestClusters),
        arr(question.careerFamilies),
        arr(question.entranceExams),
        arr(question.targetCourses),
        arr(question.collegeYears),

        Number(
          question.difficulty || 3
        ),

        question.discriminatorGroup ||
          null,

        question.scenario ||
          null,

        question.scenarioFamily ||
          null,

        question.contextScope ||
          'college',

        question.minClass == null
          ? null
          : Number(question.minClass),

        question.maxClass == null
          ? null
          : Number(question.maxClass),

        question.responseFormat ||
          'likert-5',

        Number(
          question.priority || 3
        ),

        Number(
          question.weight || 1
        ),

        Number(
          question.version || 7
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
            college_years,
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
            $25,$26,$27,$28,$29,$30,$31,$32,
            $33
          )
          ON CONFLICT (id)
          DO UPDATE SET
            stage = EXCLUDED.stage,
            section = EXCLUDED.section,
            trait = EXCLUDED.trait,
            purpose = EXCLUDED.purpose,
            text = EXCLUDED.text,
            options_json = EXCLUDED.options_json,
            degrees = EXCLUDED.degrees,
            branches = EXCLUDED.branches,
            streams = EXCLUDED.streams,
            subjects = EXCLUDED.subjects,
            skills = EXCLUDED.skills,
            goals = EXCLUDED.goals,
            tags = EXCLUDED.tags,
            active = TRUE,
            classes = EXCLUDED.classes,
            boards = EXCLUDED.boards,
            interest_clusters =
              EXCLUDED.interest_clusters,
            career_families =
              EXCLUDED.career_families,
            entrance_exams =
              EXCLUDED.entrance_exams,
            target_courses =
              EXCLUDED.target_courses,
            college_years =
              EXCLUDED.college_years,
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
              EXCLUDED.version
        `,
        values
      );


      if (existing.rowCount) {
        updated += 1;
      } else {
        inserted += 1;
      }
    }


    await client.query('COMMIT');

    console.log(
      'Inserted:',
      inserted
    );

    console.log(
      'Updated:',
      updated
    );


    const { rows } =
      await client.query(`
        SELECT
          COUNT(*)::int AS count
        FROM career_questions
        WHERE active = TRUE
          AND stage = 'college'
          AND id LIKE 'v7_college_%'
      `);


    console.log(
      'Active College V7:',
      rows[0].count
    );
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}


main().catch(
  error => {
    console.error(error);
    process.exitCode = 1;
  }
);
