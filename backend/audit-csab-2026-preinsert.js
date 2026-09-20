import fs from 'node:fs';
import { pool } from './src/db/pool.js';

const MAP_FILE =
  './csab-2026-import-map.json';

if (!fs.existsSync(MAP_FILE)) {
  throw new Error(
    `Missing ${MAP_FILE}`
  );
}

const data =
  JSON.parse(
    fs.readFileSync(
      MAP_FILE,
      'utf8'
    )
  );

const mappedRows =
  data.mappedRows;

if (!Array.isArray(mappedRows)) {
  throw new Error(
    'mappedRows missing from CSAB import map.'
  );
}

if (mappedRows.length !== 11793) {
  throw new Error(
    `Expected 11793 mapped rows, got ${mappedRows.length}`
  );
}

const client =
  await pool.connect();

try {

  console.log(
    '\n========================================'
  );

  console.log(
    'CSAB 2026 PRE-INSERT DATABASE AUDIT'
  );

  console.log(
    '========================================'
  );


  /*
  |--------------------------------------------------------------------------
  | DATABASE INFO
  |--------------------------------------------------------------------------
  */

  const dbInfo =
    await client.query(`
      SELECT
        current_database() AS database_name,
        NOW() AS database_time
    `);

  console.log(
    '\nDATABASE'
  );

  console.table(
    dbInfo.rows
  );


  /*
  |--------------------------------------------------------------------------
  | CUTOFFS TABLE COLUMNS
  |--------------------------------------------------------------------------
  */

  const columns =
    await client.query(`
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'cutoffs'
      ORDER BY ordinal_position
    `);

  console.log(
    '\nCUTOFFS COLUMNS'
  );

  console.table(
    columns.rows
  );


  /*
  |--------------------------------------------------------------------------
  | CHECK CONSTRAINTS
  |--------------------------------------------------------------------------
  */

  const constraints =
    await client.query(`
      SELECT
        conname AS constraint_name,
        pg_get_constraintdef(oid) AS definition
      FROM pg_constraint
      WHERE conrelid = 'cutoffs'::regclass
      ORDER BY conname
    `);

  console.log(
    '\nCUTOFF CONSTRAINTS'
  );

  console.table(
    constraints.rows
  );


  /*
  |--------------------------------------------------------------------------
  | EXISTING CSAB 2026 DATA
  |--------------------------------------------------------------------------
  */

  const existing =
    await client.query(`
      SELECT
        counselling_type,
        year,
        round,
        source_label,
        verification_status,
        is_verified,
        COUNT(*)::int AS rows
      FROM cutoffs
      WHERE
        year = 2026
        AND UPPER(COALESCE(counselling_type, '')) = 'CSAB'
      GROUP BY
        counselling_type,
        year,
        round,
        source_label,
        verification_status,
        is_verified
      ORDER BY
        round,
        source_label
    `);

  console.log(
    '\nEXISTING CSAB 2026 ROWS'
  );

  if (existing.rows.length) {
    console.table(
      existing.rows
    );
  } else {
    console.log(
      '0 existing CSAB 2026 rows.'
    );
  }


  const existingTotal =
    await client.query(`
      SELECT
        COUNT(*)::int AS rows
      FROM cutoffs
      WHERE
        year = 2026
        AND UPPER(COALESCE(counselling_type, '')) = 'CSAB'
    `);

  console.log(
    'Existing CSAB 2026 total:',
    existingTotal.rows[0].rows
  );


  /*
  |--------------------------------------------------------------------------
  | ALL COUNSELLING TYPES CURRENTLY PRESENT
  |--------------------------------------------------------------------------
  */

  const types =
    await client.query(`
      SELECT
        counselling_type,
        COUNT(*)::int AS rows
      FROM cutoffs
      GROUP BY counselling_type
      ORDER BY counselling_type
    `);

  console.log(
    '\nCURRENT COUNSELLING TYPES'
  );

  console.table(
    types.rows
  );


  /*
  |--------------------------------------------------------------------------
  | VALIDATE COLLEGE IDS FROM MAP
  |--------------------------------------------------------------------------
  */

  const collegeIds =
    [
      ...new Set(
        mappedRows.map(
          row =>
            String(row.collegeId)
        )
      ),
    ];


  const collegeResult =
    await client.query(
      `
      SELECT
        id,
        name
      FROM colleges
      WHERE id = ANY($1::text[])
      `,
      [
        collegeIds,
      ]
    );


  const dbCollegeIds =
    new Set(
      collegeResult.rows.map(
        row =>
          String(row.id)
      )
    );


  const missingCollegeIds =
    collegeIds.filter(
      id =>
        !dbCollegeIds.has(id)
    );


  console.log(
    '\nCOLLEGE ID VALIDATION'
  );

  console.log(
    'Unique mapped college IDs:',
    collegeIds.length
  );

  console.log(
    'Found in DB:',
    dbCollegeIds.size
  );

  console.log(
    'Missing:',
    missingCollegeIds.length
  );


  if (missingCollegeIds.length) {
    console.log(
      missingCollegeIds
    );
  }


  /*
  |--------------------------------------------------------------------------
  | VALIDATE BRANCH IDS
  |--------------------------------------------------------------------------
  */

  const branchIds =
    [
      ...new Set(
        mappedRows.map(
          row =>
            String(row.branchId)
        )
      ),
    ];


  const branchResult =
    await client.query(
      `
      SELECT
        id,
        college_id,
        name
      FROM branches
      WHERE id::text = ANY($1::text[])
      `,
      [
        branchIds,
      ]
    );


  const dbBranches =
    new Map(
      branchResult.rows.map(
        row => [
          String(row.id),
          row,
        ]
      )
    );


  const missingBranchIds =
    branchIds.filter(
      id =>
        !dbBranches.has(id)
    );


  console.log(
    '\nBRANCH ID VALIDATION'
  );

  console.log(
    'Unique mapped branch IDs:',
    branchIds.length
  );

  console.log(
    'Found in DB:',
    dbBranches.size
  );

  console.log(
    'Missing:',
    missingBranchIds.length
  );


  /*
  |--------------------------------------------------------------------------
  | BRANCH → COLLEGE CONSISTENCY
  |--------------------------------------------------------------------------
  */

  const branchCollegeMismatch =
    [];


  for (const row of mappedRows) {

    const branch =
      dbBranches.get(
        String(row.branchId)
      );


    if (!branch) {
      continue;
    }


    if (
      String(branch.college_id) !==
      String(row.collegeId)
    ) {
      branchCollegeMismatch.push({
        branchId:
          row.branchId,

        mappedCollegeId:
          row.collegeId,

        dbCollegeId:
          branch.college_id,

        institute:
          row.institute,

        program:
          row.academicProgram,
      });
    }
  }


  console.log(
    '\nBRANCH/COLLEGE MISMATCHES:',
    branchCollegeMismatch.length
  );


  if (branchCollegeMismatch.length) {
    console.table(
      branchCollegeMismatch.slice(
        0,
        30
      )
    );
  }


  /*
  |--------------------------------------------------------------------------
  | FINAL PRE-FLIGHT
  |--------------------------------------------------------------------------
  */

  console.log(
    '\n========================================'
  );

  console.log(
    'PRE-INSERT SUMMARY'
  );

  console.log(
    '========================================'
  );

  console.log(
    'Mapped source rows:',
    mappedRows.length
  );

  console.log(
    'Existing CSAB 2026 rows:',
    existingTotal.rows[0].rows
  );

  console.log(
    'Missing colleges:',
    missingCollegeIds.length
  );

  console.log(
    'Missing branches:',
    missingBranchIds.length
  );

  console.log(
    'Branch/college mismatches:',
    branchCollegeMismatch.length
  );

  console.log(
    '\nDATABASE WAS NOT MODIFIED.'
  );


} finally {

  client.release();

  await pool.end();
}