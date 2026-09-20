import fs from 'node:fs';
import { pool } from './src/db/pool.js';

const NORMALIZED_INPUT =
  './josaa-2025-all-rounds-normalized.json';

const PLAN_INPUT =
  './josaa-2025-branch-resolution-plan.json';

const EXPECTED_TOTAL =
  71414;

function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function canonicalCollegeName(value) {
  const normalized =
    normalizeText(value);

  const aliases =
    new Map([
      [
        'indian institute of technology gandhinagar',
        'iit gandhinagar',
      ],
    ]);

  return aliases.get(normalized) ??
    normalized;
}

const normalized =
  JSON.parse(
    fs.readFileSync(
      NORMALIZED_INPUT,
      'utf8'
    )
  );

const planSource =
  JSON.parse(
    fs.readFileSync(
      PLAN_INPUT,
      'utf8'
    )
  );

const officialRows =
  normalized.rows.filter(
    row =>
      row.rankRecordType === 'STANDARD' &&
      row.usableForStandardPrediction === true
  );

if (
  officialRows.length !==
  EXPECTED_TOTAL
) {
  throw new Error(
    `Expected ${EXPECTED_TOTAL} standard rows, got ${officialRows.length}`
  );
}

const plan =
  planSource.plan ?? [];

const aliasPlan =
  plan.filter(
    row =>
      row.action === 'ALIAS'
  );

const createPlan =
  plan.filter(
    row =>
      row.action === 'CREATE_BRANCH'
  );

if (
  aliasPlan.length !== 10 ||
  createPlan.length !== 13
) {
  throw new Error(
    `Unexpected plan: aliases=${aliasPlan.length}, creates=${createPlan.length}`
  );
}

console.log(
  '\n========================================'
);

console.log(
  'JOSAA 2025 BRANCH RESOLUTION REHEARSAL'
);

console.log(
  '========================================\n'
);

console.log(
  'Official standard rows:',
  officialRows.length
);

console.log(
  'Approved aliases:',
  aliasPlan.length
);

console.log(
  'Historical branches to create:',
  createPlan.length
);

const client =
  await pool.connect();

let transactionStarted =
  false;

try {

  /*
  |--------------------------------------------------------------------------
  | CURRENT COUNTS
  |--------------------------------------------------------------------------
  */

  const before =
    await client.query(`
      SELECT
        COUNT(*)::int AS branches,
        MAX(id) AS max_id
      FROM branches
    `);

  console.log(
    '\nBEFORE REHEARSAL'
  );

  console.table(
    before.rows
  );


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
  | CREATE 13 HISTORICAL BRANCHES
  |--------------------------------------------------------------------------
  */

  const createdBranches =
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
        LIMIT 1
        `,
        [
          item.collegeId,
          item.officialProgram,
        ]
      );


    if (
      existing.rows.length > 0
    ) {

      createdBranches.push({
        action:
          'ALREADY_EXISTS',

        collegeId:
          item.collegeId,

        name:
          item.officialProgram,

        branchId:
          existing.rows[0].id,
      });

      continue;
    }


    const inserted =
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


    createdBranches.push({
      action:
        'CREATED',

      collegeId:
        inserted.rows[0].college_id,

      name:
        inserted.rows[0].name,

      branchId:
        inserted.rows[0].id,
    });
  }


  console.log(
    '\nHISTORICAL BRANCH CREATION'
  );

  console.table(
    createdBranches
  );


  const actuallyCreated =
    createdBranches.filter(
      row =>
        row.action === 'CREATED'
    ).length;


  if (
    actuallyCreated !== 13
  ) {
    throw new Error(
      `Expected to create 13 branches in rehearsal, created ${actuallyCreated}`
    );
  }


  /*
  |--------------------------------------------------------------------------
  | LOAD FRESH COLLEGE / BRANCH MAP
  |--------------------------------------------------------------------------
  */

  const collegesResult =
    await client.query(`
      SELECT
        id,
        name
      FROM colleges
    `);


  const branchesResult =
    await client.query(`
      SELECT
        b.id,
        b.college_id,
        b.name AS branch_name,
        c.name AS college_name
      FROM branches b
      JOIN colleges c
        ON c.id = b.college_id
    `);


  const collegeMap =
    new Map();


  for (
    const college
    of collegesResult.rows
  ) {

    collegeMap.set(
      normalizeText(
        college.name
      ),
      college
    );
  }


  const branchMap =
    new Map();


  for (
    const branch
    of branchesResult.rows
  ) {

    const key =
      [
        normalizeText(
          branch.college_name
        ),
        normalizeText(
          branch.branch_name
        ),
      ].join('|');


    branchMap.set(
      key,
      branch
    );
  }


  /*
  |--------------------------------------------------------------------------
  | APPROVED ALIAS MAP
  |--------------------------------------------------------------------------
  */

  const approvedAliases =
    new Map();


  for (
    const item
    of aliasPlan
  ) {

    const lookup =
      [
        item.collegeId,
        normalizeText(
          item.officialProgram
        ),
      ].join('|');


    approvedAliases.set(
      lookup,
      {
        branchId:
          String(
            item.existingBranchId
          ),

        branchName:
          item.existingBranch,
      }
    );
  }


  /*
  |--------------------------------------------------------------------------
  | MAP ALL 2025 STANDARD ROWS
  |--------------------------------------------------------------------------
  */

  const mappedRows =
    [];

  const missingColleges =
    [];

  const missingBranches =
    [];


  for (
    const row
    of officialRows
  ) {

    const college =
      collegeMap.get(
        canonicalCollegeName(
          row.institute
        )
      );


    if (!college) {

      missingColleges.push(
        row
      );

      continue;
    }


    const exactBranchKey =
      [
        normalizeText(
          college.name
        ),
        normalizeText(
          row.academicProgram
        ),
      ].join('|');


    let branch =
      branchMap.get(
        exactBranchKey
      );


    /*
    |--------------------------------------------------------------------------
    | IIT Gandhinagar aliases retained
    |--------------------------------------------------------------------------
    */

    if (
      !branch &&
      college.id ===
        'iit-gandhinagar'
    ) {

      const gandhinagarAliases =
        new Map([
          [
            'computer science and engineering 4 years bachelor of technology',
            'cse',
          ],
          [
            'electrical engineering 4 years bachelor of technology',
            'electrical',
          ],
          [
            'mechanical engineering 4 years bachelor of technology',
            'mechanical',
          ],
        ]);


      const aliasName =
        gandhinagarAliases.get(
          normalizeText(
            row.academicProgram
          )
        );


      if (aliasName) {

        branch =
          branchMap.get(
            [
              normalizeText(
                college.name
              ),
              normalizeText(
                aliasName
              ),
            ].join('|')
          );
      }
    }


    /*
    |--------------------------------------------------------------------------
    | 2025 approved aliases
    |--------------------------------------------------------------------------
    */

    if (!branch) {

      const alias =
        approvedAliases.get(
          [
            college.id,
            normalizeText(
              row.academicProgram
            ),
          ].join('|')
        );


      if (alias) {

        branch =
          branchesResult.rows.find(
            candidate =>
              String(
                candidate.id
              ) ===
              String(
                alias.branchId
              )
          ) ?? null;
      }
    }


    if (!branch) {

      missingBranches.push({
        collegeId:
          college.id,

        college:
          college.name,

        program:
          row.academicProgram,

        round:
          row.round,
      });

      continue;
    }


    mappedRows.push({
      ...row,

      collegeId:
        college.id,

      branchId:
        branch.id,

      dbCollegeName:
        college.name,

      dbBranchName:
        branch.branch_name,
    });
  }


  /*
  |--------------------------------------------------------------------------
  | SUMMARY
  |--------------------------------------------------------------------------
  */

  const roundSummary =
    ['1','2','3','4','5','6']
      .map(
        round => ({
          round,

          official:
            officialRows.filter(
              row =>
                row.round === round
            ).length,

          mapped:
            mappedRows.filter(
              row =>
                row.round === round
            ).length,
        })
      );


  console.log(
    '\nROUND MAPPING SUMMARY'
  );

  console.table(
    roundSummary
  );


  const summary = {
    officialStandardRows:
      officialRows.length,

    mappedRows:
      mappedRows.length,

    unmappedRows:
      officialRows.length -
      mappedRows.length,

    missingColleges:
      missingColleges.length,

    missingBranches:
      missingBranches.length,

    branchesCreatedInTransaction:
      actuallyCreated,
  };


  console.log(
    '\nFINAL REHEARSAL SUMMARY'
  );

  console.table(
    summary
  );


  if (
    mappedRows.length !==
    EXPECTED_TOTAL
  ) {

    console.log(
      '\nFIRST 30 MISSING BRANCHES'
    );

    console.table(
      missingBranches.slice(
        0,
        30
      )
    );

    throw new Error(
      `Mapping incomplete: ${mappedRows.length}/${EXPECTED_TOTAL}`
    );
  }


  if (
    missingColleges.length !== 0 ||
    missingBranches.length !== 0
  ) {
    throw new Error(
      'Unexpected unmapped rows remain.'
    );
  }


  /*
  |--------------------------------------------------------------------------
  | DUPLICATE IDENTITY AUDIT
  |--------------------------------------------------------------------------
  */

  const identities =
    new Set();

  let duplicateIdentities =
    0;


  for (
    const row
    of mappedRows
  ) {

    const key =
      [
        row.branchId,
        row.year,
        row.round,
        row.seatType,
        row.quota,
        row.gender,
      ]
        .map(
          value =>
            String(value ?? '')
              .trim()
              .toLowerCase()
        )
        .join('|');


    if (
      identities.has(
        key
      )
    ) {
      duplicateIdentities += 1;
    } else {
      identities.add(
        key
      );
    }
  }


  console.log(
    '\nDuplicate mapped identities:',
    duplicateIdentities
  );


  if (
    duplicateIdentities !== 0
  ) {
    throw new Error(
      'Duplicate identity validation failed.'
    );
  }


  /*
  |--------------------------------------------------------------------------
  | SAVE REHEARSAL MAP
  |--------------------------------------------------------------------------
  */

  fs.writeFileSync(
    './josaa-2025-import-map-rehearsed.json',
    JSON.stringify(
      {
        generatedAt:
          new Date()
            .toISOString(),

        rehearsal:
          true,

        summary,

        roundSummary,

        createdBranches,

        mappedRows,
      },
      null,
      2
    ),
    'utf8'
  );


  /*
  |--------------------------------------------------------------------------
  | ALWAYS ROLLBACK
  |--------------------------------------------------------------------------
  */

  await client.query(
    'ROLLBACK'
  );

  transactionStarted =
    false;


  console.log(
    '\nROLLBACK completed.'
  );


  /*
  |--------------------------------------------------------------------------
  | VERIFY DATABASE RESTORED
  |--------------------------------------------------------------------------
  */

  const after =
    await client.query(`
      SELECT
        COUNT(*)::int AS branches,
        MAX(id) AS max_id
      FROM branches
    `);


  console.log(
    '\nAFTER ROLLBACK'
  );

  console.table(
    after.rows
  );


  if (
    after.rows[0].branches !==
      before.rows[0].branches ||
    String(
      after.rows[0].max_id
    ) !==
      String(
        before.rows[0].max_id
      )
  ) {
    throw new Error(
      'Rollback verification failed.'
    );
  }


  console.log(
    '\n========================================'
  );

  console.log(
    'REHEARSAL PASSED'
  );

  console.log(
    '========================================'
  );

  console.log(
    'Mapped rows:',
    mappedRows.length
  );

  console.log(
    'Unmapped rows: 0'
  );

  console.log(
    'Duplicate identities: 0'
  );

  console.log(
    'Created historical branches in rehearsal:',
    actuallyCreated
  );

  console.log(
    'Database restored after rollback: YES'
  );

  console.log(
    '\nDATABASE WAS NOT MODIFIED.'
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
        '\nEmergency ROLLBACK completed.'
      );

    } catch (
      rollbackError
    ) {

      console.error(
        '\nROLLBACK ERROR:',
        rollbackError
      );
    }
  }

  throw error;

} finally {

  client.release();

  await pool.end();
}