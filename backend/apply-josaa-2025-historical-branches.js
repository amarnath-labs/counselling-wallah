import fs from 'node:fs';
import { pool } from './src/db/pool.js';

const PLAN_INPUT =
  './josaa-2025-branch-resolution-plan.json';

const EXPECTED_BEFORE =
  2604;

const EXPECTED_CREATE =
  13;

const EXPECTED_AFTER =
  EXPECTED_BEFORE +
  EXPECTED_CREATE;


if (
  !fs.existsSync(
    PLAN_INPUT
  )
) {
  throw new Error(
    `Missing plan file: ${PLAN_INPUT}`
  );
}


const planSource =
  JSON.parse(
    fs.readFileSync(
      PLAN_INPUT,
      'utf8'
    )
  );


const createPlan =
  (planSource.plan ?? [])
    .filter(
      row =>
        row.action ===
        'CREATE_BRANCH'
    );


if (
  createPlan.length !==
  EXPECTED_CREATE
) {
  throw new Error(
    `Expected ${EXPECTED_CREATE} CREATE_BRANCH items, found ${createPlan.length}`
  );
}


console.log(
  '\n========================================'
);

console.log(
  'APPLY JOSAA 2025 HISTORICAL BRANCHES'
);

console.log(
  '========================================\n'
);


console.log(
  'Branches to create:',
  createPlan.length
);


const client =
  await pool.connect();

let transactionStarted =
  false;


try {

  /*
  |--------------------------------------------------------------------------
  | PRE-CHECK
  |--------------------------------------------------------------------------
  */

  const before =
    await client.query(`
      SELECT
        COUNT(*)::int AS branch_count,
        MAX(id) AS max_id
      FROM branches
    `);


  console.log(
    '\nBEFORE'
  );

  console.table(
    before.rows
  );


  if (
    before.rows[0].branch_count !==
    EXPECTED_BEFORE
  ) {
    throw new Error(
      `Unexpected branch count before commit. Expected ${EXPECTED_BEFORE}, got ${before.rows[0].branch_count}`
    );
  }


  /*
  |--------------------------------------------------------------------------
  | ENSURE NONE ALREADY EXISTS
  |--------------------------------------------------------------------------
  */

  const existingConflicts =
    [];


  for (
    const item
    of createPlan
  ) {

    const existing =
      await client.query(
        `
        SELECT
          id,
          college_id,
          name
        FROM branches
        WHERE college_id = $1
          AND name = $2
        `,
        [
          item.collegeId,
          item.officialProgram,
        ]
      );


    if (
      existing.rows.length >
      0
    ) {
      existingConflicts.push({
        collegeId:
          item.collegeId,

        name:
          item.officialProgram,

        existingId:
          existing.rows[0].id,
      });
    }
  }


  if (
    existingConflicts.length >
    0
  ) {

    console.table(
      existingConflicts
    );

    throw new Error(
      'One or more historical branches already exist. Commit aborted.'
    );
  }


  /*
  |--------------------------------------------------------------------------
  | BEGIN
  |--------------------------------------------------------------------------
  */

  await client.query(
    'BEGIN'
  );

  transactionStarted =
    true;


  console.log(
    '\nBEGIN transaction'
  );


  /*
  |--------------------------------------------------------------------------
  | INSERT
  |--------------------------------------------------------------------------
  */

  const inserted =
    [];


  for (
    const item
    of createPlan
  ) {

    const result =
      await client.query(
        `
        INSERT INTO branches (
          college_id,
          name
        )
        VALUES ($1, $2)
        RETURNING
          id,
          college_id,
          name
        `,
        [
          item.collegeId,
          item.officialProgram,
        ]
      );


    inserted.push(
      result.rows[0]
    );
  }


  console.log(
    '\nINSERTED BRANCHES'
  );

  console.table(
    inserted
  );


  if (
    inserted.length !==
    EXPECTED_CREATE
  ) {
    throw new Error(
      `Expected ${EXPECTED_CREATE} inserted branches, got ${inserted.length}`
    );
  }


  /*
  |--------------------------------------------------------------------------
  | IN-TRANSACTION VERIFY
  |--------------------------------------------------------------------------
  */

  const during =
    await client.query(`
      SELECT
        COUNT(*)::int AS branch_count,
        MAX(id) AS max_id
      FROM branches
    `);


  console.log(
    '\nIN-TRANSACTION STATE'
  );

  console.table(
    during.rows
  );


  if (
    during.rows[0].branch_count !==
    EXPECTED_AFTER
  ) {
    throw new Error(
      `Unexpected branch count in transaction. Expected ${EXPECTED_AFTER}, got ${during.rows[0].branch_count}`
    );
  }


  /*
  |--------------------------------------------------------------------------
  | VERIFY ALL 13 EXACTLY EXIST
  |--------------------------------------------------------------------------
  */

  let verified =
    0;


  for (
    const item
    of createPlan
  ) {

    const result =
      await client.query(
        `
        SELECT
          COUNT(*)::int AS count
        FROM branches
        WHERE college_id = $1
          AND name = $2
        `,
        [
          item.collegeId,
          item.officialProgram,
        ]
      );


    if (
      result.rows[0].count !==
      1
    ) {
      throw new Error(
        `Verification failed for ${item.collegeId} / ${item.officialProgram}`
      );
    }

    verified += 1;
  }


  if (
    verified !==
    EXPECTED_CREATE
  ) {
    throw new Error(
      `Verified ${verified}/${EXPECTED_CREATE}`
    );
  }


  /*
  |--------------------------------------------------------------------------
  | COMMIT
  |--------------------------------------------------------------------------
  */

  await client.query(
    'COMMIT'
  );

  transactionStarted =
    false;


  console.log(
    '\nCOMMIT completed.'
  );


  /*
  |--------------------------------------------------------------------------
  | POST-COMMIT VERIFY
  |--------------------------------------------------------------------------
  */

  const after =
    await client.query(`
      SELECT
        COUNT(*)::int AS branch_count,
        MAX(id) AS max_id
      FROM branches
    `);


  console.log(
    '\nAFTER COMMIT'
  );

  console.table(
    after.rows
  );


  if (
    after.rows[0].branch_count !==
    EXPECTED_AFTER
  ) {
    throw new Error(
      `Post-commit count mismatch. Expected ${EXPECTED_AFTER}, got ${after.rows[0].branch_count}`
    );
  }


  fs.writeFileSync(
    './josaa-2025-historical-branches-committed.json',
    JSON.stringify(
      {
        committedAt:
          new Date()
            .toISOString(),

        insertedCount:
          inserted.length,

        inserted,
      },
      null,
      2
    ),
    'utf8'
  );


  console.log(
    '\n========================================'
  );

  console.log(
    'JOSAA 2025 HISTORICAL BRANCH COMMIT PASSED'
  );

  console.log(
    '========================================'
  );

  console.log(
    'Inserted branches:',
    inserted.length
  );

  console.log(
    'Final branch count:',
    after.rows[0].branch_count
  );

  console.log(
    'Saved audit:'
  );

  console.log(
    './josaa-2025-historical-branches-committed.json'
  );

} catch (error) {

  if (
    transactionStarted
  ) {

    try {

      await client.query(
        'ROLLBACK'
      );

      console.error(
        '\nROLLBACK completed.'
      );

    } catch (
      rollbackError
    ) {

      console.error(
        'ROLLBACK ERROR:',
        rollbackError
      );
    }
  }

  throw error;

} finally {

  client.release();

  await pool.end();
}