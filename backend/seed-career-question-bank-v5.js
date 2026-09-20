import { pool } from './src/db/pool.js';

import {
  CAREER_QUESTION_BANK,
  CAREER_QUESTION_BANK_STATS,
} from './src/data/careerQuestionBank.js';


function asTextArray(
  value
) {
  return Array.isArray(
    value
  )
    ? value
        .filter(
          (item) =>
            typeof item ===
              'string' &&
            item.trim()
        )
        .map(
          (item) =>
            item.trim()
        )
    : [];
}


function normalizePriority(
  value
) {
  const number =
    Number(value);


  if (
    !Number.isFinite(
      number
    )
  ) {
    return 3;
  }


  /*
  |--------------------------------------------------------------------------
  | SUPPORT OLD PRIORITY FORMAT
  |--------------------------------------------------------------------------
  |
  | Old bank may contain:
  | 0.82
  |
  | New DB expects integer:
  | 1..5
  |
  */

  if (
    number >= 0 &&
    number <= 1
  ) {
    return Math.max(
      1,

      Math.min(
        5,

        Math.round(
          number * 5
        )
      )
    );
  }


  return Math.max(
    1,

    Math.min(
      5,

      Math.round(
        number
      )
    )
  );
}


function normalizeWeight(
  value
) {
  const number =
    Number(value);


  return (
    Number.isFinite(
      number
    ) &&
    number > 0
  )
    ? number
    : 1;
}


/*
|--------------------------------------------------------------------------
| UPSERT ONE QUESTION
|--------------------------------------------------------------------------
*/

async function upsertQuestion(
  client,
  question
) {
  const sql = `
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
      $8,
      $9,
      $10,
      $11,
      $12,
      $13,
      $14,
      $15,
      $16,
      $17,
      $18,
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

      updated_at =
        NOW()
  `;


  const values = [
    String(
      question.id
    ),

    String(
      question.stage
    ),

    String(
      question.section ||
      'general'
    ),

    String(
      question.trait
    ),

    String(
      question.purpose ||
      'measurement'
    ),

    String(
      question.text
    ),

    JSON.stringify(
      question.options || [
        {
          label:
            'Strongly disagree',

          value: 1,
        },

        {
          label:
            'Disagree',

          value: 2,
        },

        {
          label:
            'Not sure',

          value: 3,
        },

        {
          label:
            'Agree',

          value: 4,
        },

        {
          label:
            'Strongly agree',

          value: 5,
        },
      ]
    ),

    asTextArray(
      question.degrees
    ),

    asTextArray(
      question.branches
    ),

    asTextArray(
      question.streams
    ),

    asTextArray(
      question.subjects
    ),

    asTextArray(
      question.skills
    ),

    asTextArray(
      question.goals
    ),

    asTextArray(
      question.tags
    ),

    normalizePriority(
      question.priority
    ),

    normalizeWeight(
      question.weight
    ),

    question.active !==
      false,

    Number.isInteger(
      Number(
        question.version
      )
    )
      ? Number(
          question.version
        )
      : 5,
  ];


  await client.query(
    sql,
    values
  );
}


/*
|--------------------------------------------------------------------------
| MAIN
|--------------------------------------------------------------------------
*/

async function main() {
  console.log(
    '========================================'
  );

  console.log(
    'TRUMARG CAREER QUESTION BANK V5 SEED'
  );

  console.log(
    '========================================'
  );


  console.log(
    'JS bank total:',
    CAREER_QUESTION_BANK_STATS
      .total
  );


  console.table(
    Object.entries(
      CAREER_QUESTION_BANK_STATS
        .byStage
    ).map(
      (
        [
          stage,
          questions,
        ]
      ) => ({
        stage,
        questions,
      })
    )
  );


  const client =
    await pool.connect();


  try {
    await client.query(
      'BEGIN'
    );


    let processed = 0;


    for (
      const question
      of CAREER_QUESTION_BANK
    ) {
      await upsertQuestion(
        client,
        question
      );


      processed += 1;


      if (
        processed % 50 ===
        0
      ) {
        console.log(
          `Upserted ${processed}/${CAREER_QUESTION_BANK.length}`
        );
      }
    }


    await client.query(
      'COMMIT'
    );


    const counts =
      await pool.query(
        `
        SELECT
          stage,
          COUNT(*)::int AS questions

        FROM career_questions

        WHERE active = true

        GROUP BY stage

        ORDER BY stage
        `
      );


    console.log(
      ''
    );


    console.log(
      'DATABASE ACTIVE COUNTS AFTER SEED'
    );


    console.table(
      counts.rows
    );


    const total =
      await pool.query(
        `
        SELECT
          COUNT(*)::int AS total

        FROM career_questions

        WHERE active = true
        `
      );


    console.log(
      'Total active DB questions:',
      total.rows[0]?.total ??
        0
    );
  } catch (
    error
  ) {
    await client
      .query(
        'ROLLBACK'
      )
      .catch(
        () => {}
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
        ''
      );

      console.error(
        'CAREER QUESTION SEED FAILED'
      );

      console.error(
        error?.stack ||
        error
      );


      process.exitCode =
        1;
    }
  )
  .finally(
    async () => {
      await pool
        .end()
        .catch(
          () => {}
        );
    }
  );
