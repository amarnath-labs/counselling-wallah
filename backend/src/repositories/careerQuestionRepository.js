import { pool } from '../db/pool.js';


function mapQuestion(row) {
  return {
    id: row.id,

    stage: row.stage,

    section: row.section,

    trait: row.trait,

    purpose: row.purpose,

    text: row.text,

    options:
      row.options_json || [],

    degrees:
      row.degrees || [],

    branches:
      row.branches || [],

    streams:
      row.streams || [],

    subjects:
      row.subjects || [],

    skills:
      row.skills || [],

    goals:
      row.goals || [],

    tags:
      row.tags || [],

    /*
    |--------------------------------------------------------------------------
    | V6 / V7 targeting metadata
    |--------------------------------------------------------------------------
    */

    classes:
      row.classes || [],

    boards:
      row.boards || [],

    interestClusters:
      row.interest_clusters || [],

    careerFamilies:
      row.career_families || [],

    entranceExams:
      row.entrance_exams || [],

    targetCourses:
      row.target_courses || [],

    difficulty:
      Number(
        row.difficulty || 2
      ),

    discriminatorGroup:
      row.discriminator_group ||
      null,

    scenario:
      row.scenario ||
      null,

    scenarioFamily:
      row.scenario_family ||
      null,

    contextScope:
      row.context_scope ||
      'universal',

    minClass:
      row.min_class == null
        ? null
        : Number(
            row.min_class
          ),

    maxClass:
      row.max_class == null
        ? null
        : Number(
            row.max_class
          ),

    responseFormat:
      row.response_format ||
      'likert-5',

    priority:
      Number(
        row.priority || 3
      ),

    weight:
      Number(
        row.weight || 1
      ),

    version:
      Number(
        row.version || 1
      ),

    active:
      Boolean(
        row.active
      ),
  };
}


/*
|--------------------------------------------------------------------------
| Normalize exact school class
|--------------------------------------------------------------------------
*/

function normalizeClassKey(value) {
  const normalized =
    String(value ?? '')
      .trim()
      .toLowerCase()
      .replace(
        /[_\s]+/g,
        '-'
      );


  const match =
    normalized.match(
      /(?:class-?)?(\d{1,2})/
    );


  if (!match) {
    return null;
  }


  const number =
    Number(
      match[1]
    );


  if (
    !Number.isInteger(number) ||
    number < 1 ||
    number > 12
  ) {
    return null;
  }


  return `class-${number}`;
}


/*
|--------------------------------------------------------------------------
| Get one question
|--------------------------------------------------------------------------
*/

export async function getQuestionById(
  id
) {
  if (!id) {
    return null;
  }


  const { rows } =
    await pool.query(
      `
        SELECT *
        FROM career_questions
        WHERE id = $1
        LIMIT 1
      `,
      [
        id,
      ]
    );


  if (!rows.length) {
    return null;
  }


  return mapQuestion(
    rows[0]
  );
}


/*
|--------------------------------------------------------------------------
| Get questions by IDs
|--------------------------------------------------------------------------
*/

export async function getQuestionByIds(
  ids = []
) {
  if (!ids.length) {
    return [];
  }


  const { rows } =
    await pool.query(
      `
        SELECT *
        FROM career_questions
        WHERE id =
          ANY($1::text[])
      `,
      [
        ids,
      ]
    );


  const mapped =
    rows.map(
      mapQuestion
    );


  /*
  |--------------------------------------------------------------------------
  | Preserve input ID order
  |--------------------------------------------------------------------------
  */

  const questionMap =
    new Map(
      mapped.map(
        question => [
          question.id,
          question,
        ]
      )
    );


  return ids
    .map(
      id =>
        questionMap.get(id)
    )
    .filter(Boolean);
}


/*
|--------------------------------------------------------------------------
| Candidate retrieval
|--------------------------------------------------------------------------
|
| PostgreSQL performs hard safety filtering:
|
| - active questions only
| - exact canonical stage
| - unanswered IDs excluded
| - optional version lock
| - optional exact school class isolation
|
| Board / subject / interest / career relevance remains handled by the
| adaptive retrieval layer.
|
|--------------------------------------------------------------------------
*/

export async function getCandidateQuestions({
  stage,
  excludeIds = [],
  limit = 500,
  version = null,
  currentClass = null,
}) {
  if (!stage) {
    return [];
  }


  const safeLimit =
    Math.max(
      1,
      Math.min(
        Number(limit) || 500,
        2000
      )
    );


  const classKey =
    normalizeClassKey(
      currentClass
    );


  const safeExcludeIds =
    Array.isArray(
      excludeIds
    )
      ? excludeIds
      : [];


  const params = [
    stage,
    safeExcludeIds,
  ];


  const conditions = [
    `active = TRUE`,
    `stage = $1`,
    `NOT (
      id = ANY($2::text[])
    )`,
  ];


  /*
  |--------------------------------------------------------------------------
  | Optional version lock
  |--------------------------------------------------------------------------
  |
  | V7 assessment code should pass:
  |
  |   version: 7
  |
  | Legacy callers can omit this until their migration is completed.
  |
  |--------------------------------------------------------------------------
  */

  if (
    version != null
  ) {
    const numericVersion =
      Number(version);


    if (
      !Number.isFinite(
        numericVersion
      )
    ) {
      throw new Error(
        `Invalid career question version: ${version}`
      );
    }


    params.push(
      numericVersion
    );


    conditions.push(
      `version = $${params.length}`
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Exact school-class isolation
  |--------------------------------------------------------------------------
  |
  | Foundation stage is shared by Class 8 and Class 9.
  |
  | Therefore:
  |
  | Class 8 -> classes contains class-8
  | Class 9 -> classes contains class-9
  |
  | The same protection also works for Class 10 / 11 / 12 when their V7
  | rows carry class metadata.
  |
  |--------------------------------------------------------------------------
  */

  if (
    classKey
  ) {
    params.push(
      classKey
    );


    conditions.push(
      `$${params.length} = ANY(classes)`
    );
  }


  params.push(
    safeLimit
  );


  const limitParam =
    `$${params.length}`;


  const { rows } =
    await pool.query(
      `
        SELECT *
        FROM career_questions
        WHERE
          ${conditions.join(
            '\n          AND '
          )}
        ORDER BY
          priority DESC,
          id ASC
        LIMIT ${limitParam}
      `,
      params
    );


  return rows.map(
    mapQuestion
  );
}


/*
|--------------------------------------------------------------------------
| Get question map
|--------------------------------------------------------------------------
*/

export async function getQuestionMap(
  ids = []
) {
  const questions =
    await getQuestionByIds(
      ids
    );


  return new Map(
    questions.map(
      question => [
        question.id,
        question,
      ]
    )
  );
}


export default {
  getQuestionById,
  getQuestionByIds,
  getCandidateQuestions,
  getQuestionMap,
};