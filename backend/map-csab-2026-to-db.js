import fs from 'node:fs';
import { pool } from './src/db/pool.js';

const CSAB_FILE =
  './csab-2026-standard-only.json';

const JOSAA_COLLEGE_MAP_FILE =
  './josaa-2026-db-mapping.json';

const EXPECTED_ROWS =
  11793;


function normalize(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}


/*
|--------------------------------------------------------------------------
| Branch normalization
|--------------------------------------------------------------------------
|
| Only deterministic formatting cleanup.
| We DO NOT perform fuzzy similarity matching here.
|
*/

function normalizeProgram(value) {
  return normalize(value);
}

if (!fs.existsSync(CSAB_FILE)) {
  throw new Error(
    `Missing ${CSAB_FILE}`
  );
}


if (
  !fs.existsSync(
    JOSAA_COLLEGE_MAP_FILE
  )
) {
  throw new Error(
    `Missing ${JOSAA_COLLEGE_MAP_FILE}`
  );
}


const csabRows =
  JSON.parse(
    fs.readFileSync(
      CSAB_FILE,
      'utf8'
    )
  );


const josaaCollegeMap =
  JSON.parse(
    fs.readFileSync(
      JOSAA_COLLEGE_MAP_FILE,
      'utf8'
    )
  );


if (!Array.isArray(csabRows)) {
  throw new Error(
    'CSAB file is not an array.'
  );
}


if (
  csabRows.length !==
  EXPECTED_ROWS
) {
  throw new Error(
    `Expected ${EXPECTED_ROWS} CSAB rows, got ${csabRows.length}`
  );
}


if (
  !Array.isArray(
    josaaCollegeMap
  )
) {
  throw new Error(
    'JoSAA college map is not an array.'
  );
}


console.log(
  '\n========================================'
);

console.log(
  'CSAB 2026 → DATABASE MAPPING DRY-RUN'
);

console.log(
  '========================================'
);

console.log(
  'CSAB rows:',
  csabRows.length
);

console.log(
  'JoSAA institute mappings:',
  josaaCollegeMap.length
);


/*
|--------------------------------------------------------------------------
| BUILD VERIFIED COLLEGE MAP
|--------------------------------------------------------------------------
*/

const collegeByName =
  new Map();


for (
  const mapping
  of josaaCollegeMap
) {

  if (
    !mapping?.matched ||
    !mapping?.college_id ||
    !mapping?.josaa_name
  ) {
    continue;
  }


  const key =
    normalize(
      mapping.josaa_name
    );


  if (
    collegeByName.has(key)
  ) {
    const previous =
      collegeByName.get(key);

    if (
      String(
        previous.college_id
      ) !==
      String(
        mapping.college_id
      )
    ) {
      throw new Error(
        `Conflicting college mapping for ${mapping.josaa_name}`
      );
    }
  }


  collegeByName.set(
    key,
    mapping
  );
}


console.log(
  'Usable verified college mappings:',
  collegeByName.size
);


/*
|--------------------------------------------------------------------------
| UNIQUE CSAB INSTITUTES
|--------------------------------------------------------------------------
*/

const csabInstitutes =
  [
    ...new Set(
      csabRows.map(
        row =>
          row.institute
      )
    ),
  ];


console.log(
  'Unique CSAB institutes:',
  csabInstitutes.length
);


const instituteResolution =
  new Map();

const missingInstitutes =
  [];


for (
  const institute
  of csabInstitutes
) {

  const key =
    normalize(
      institute
    );


  const mapping =
    collegeByName.get(key);


  if (!mapping) {

    missingInstitutes.push(
      institute
    );

    continue;
  }


  instituteResolution.set(
    institute,
    {
      collegeId:
        String(
          mapping.college_id
        ),

      collegeName:
        mapping.college_name,

      sourceName:
        mapping.josaa_name,
    }
  );
}


console.log(
  '\nCOLLEGE MAPPING'
);

console.log(
  'Mapped institutes:',
  instituteResolution.size
);

console.log(
  'Missing institutes:',
  missingInstitutes.length
);


if (
  missingInstitutes.length
) {

  console.log(
    '\nMISSING INSTITUTES'
  );

  console.table(
    missingInstitutes.map(
      institute => ({
        institute,
      })
    )
  );
}


/*
|--------------------------------------------------------------------------
| LOAD BRANCHES FROM DATABASE
|--------------------------------------------------------------------------
*/

const client =
  await pool.connect();


try {

  const branchResult =
    await client.query(
      `
      SELECT
        id,
        college_id,
        name
      FROM branches
      ORDER BY
        college_id,
        id
      `
    );


  const branches =
    branchResult.rows;


  console.log(
    '\nDB branches:',
    branches.length
  );


  /*
  |--------------------------------------------------------------------------
  | BRANCH LOOKUP PER COLLEGE
  |--------------------------------------------------------------------------
  */

  const branchLookup =
    new Map();


  for (
    const branch
    of branches
  ) {

    const collegeId =
      String(
        branch.college_id
      );


    if (
      !branchLookup.has(
        collegeId
      )
    ) {
      branchLookup.set(
        collegeId,
        new Map()
      );
    }


    const normalizedName =
      normalizeProgram(
        branch.name
      );


    const map =
      branchLookup.get(
        collegeId
      );


    if (
      !map.has(
        normalizedName
      )
    ) {
      map.set(
        normalizedName,
        []
      );
    }


    map.get(
      normalizedName
    ).push(
      branch
    );
  }


  /*
  |--------------------------------------------------------------------------
  | MAP EVERY CSAB ROW
  |--------------------------------------------------------------------------
  */

  const mappedRows =
    [];

  const unresolvedRows =
    [];

  const ambiguousRows =
    [];


  for (
    const row
    of csabRows
  ) {

    const institute =
      instituteResolution.get(
        row.institute
      );


    if (!institute) {

      unresolvedRows.push({
        reason:
          'MISSING_COLLEGE',

        ...row,
      });

      continue;
    }


    const normalizedProgram =
      normalizeProgram(
        row.academicProgram
      );


    const collegeBranches =
      branchLookup.get(
        institute.collegeId
      );


    const candidates =
      collegeBranches?.get(
        normalizedProgram
      ) ??
      [];


    if (
      candidates.length === 0
    ) {

      unresolvedRows.push({
        reason:
          'MISSING_BRANCH',

        collegeId:
          institute.collegeId,

        collegeName:
          institute.collegeName,

        normalizedProgram,

        ...row,
      });

      continue;
    }


    if (
      candidates.length > 1
    ) {

      ambiguousRows.push({
        collegeId:
          institute.collegeId,

        collegeName:
          institute.collegeName,

        normalizedProgram,

        candidateBranches:
          candidates.map(
            candidate => ({
              id:
                candidate.id,

              name:
                candidate.name,
            })
          ),

        ...row,
      });

      continue;
    }


    mappedRows.push({
      ...row,

      collegeId:
        institute.collegeId,

      collegeName:
        institute.collegeName,

      branchId:
        candidates[0].id,

      branchName:
        candidates[0].name,
    });
  }


  /*
  |--------------------------------------------------------------------------
  | UNIQUE MISSING PROGRAMS
  |--------------------------------------------------------------------------
  */

  const missingBranchMap =
    new Map();


  for (
    const row
    of unresolvedRows
  ) {

    if (
      row.reason !==
      'MISSING_BRANCH'
    ) {
      continue;
    }


    const key =
      [
        row.collegeId,
        row.academicProgram,
      ].join('||');


    if (
      !missingBranchMap.has(
        key
      )
    ) {

      missingBranchMap.set(
        key,
        {
          collegeId:
            row.collegeId,

          collegeName:
            row.collegeName,

          academicProgram:
            row.academicProgram,

          normalizedProgram:
            row.normalizedProgram,

          rows:
            0,
        }
      );
    }


    missingBranchMap.get(
      key
    ).rows += 1;
  }


  const missingBranches =
    [
      ...missingBranchMap.values(),
    ]
      .sort(
        (a, b) =>
          b.rows - a.rows
      );


  /*
  |--------------------------------------------------------------------------
  | DUPLICATE IDENTITY AUDIT
  |--------------------------------------------------------------------------
  */

  const identityCounts =
    new Map();


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
      ].join('||');


    identityCounts.set(
      key,
      (
        identityCounts.get(
          key
        ) ??
        0
      ) + 1
    );
  }


  const duplicateIdentities =
    [
      ...identityCounts.entries(),
    ]
      .filter(
        ([, count]) =>
          count > 1
      );


  /*
  |--------------------------------------------------------------------------
  | ROUND AUDIT
  |--------------------------------------------------------------------------
  */

  const roundAudit =
    {};


  for (
    const row
    of csabRows
  ) {

    const round =
      String(
        row.round
      );


    if (
      !roundAudit[round]
    ) {

      roundAudit[round] = {
        official:
          0,

        mapped:
          0,

        unresolved:
          0,

        ambiguous:
          0,
      };
    }


    roundAudit[
      round
    ].official += 1;
  }


  for (
    const row
    of mappedRows
  ) {

    roundAudit[
      String(
        row.round
      )
    ].mapped += 1;
  }


  for (
    const row
    of unresolvedRows
  ) {

    roundAudit[
      String(
        row.round
      )
    ].unresolved += 1;
  }


  for (
    const row
    of ambiguousRows
  ) {

    roundAudit[
      String(
        row.round
      )
    ].ambiguous += 1;
  }


  console.log(
    '\nROUND MAPPING'
  );

  console.table(
    Object.entries(
      roundAudit
    ).map(
      ([round, value]) => ({
        round,
        ...value,
      })
    )
  );


  console.log(
    '\n========================================'
  );

  console.log(
    'CSAB 2026 MAPPING SUMMARY'
  );

  console.log(
    '========================================'
  );


  console.log(
    'Official CSAB rows:',
    csabRows.length
  );

  console.log(
    'Mapped rows:',
    mappedRows.length
  );

  console.log(
    'Unresolved rows:',
    unresolvedRows.length
  );

  console.log(
    'Ambiguous rows:',
    ambiguousRows.length
  );

  console.log(
    'Missing college names:',
    missingInstitutes.length
  );

  console.log(
    'Missing branch mappings:',
    missingBranches.length
  );

  console.log(
    'Duplicate mapped identities:',
    duplicateIdentities.length
  );


  if (
    missingBranches.length
  ) {

    console.log(
      '\nMISSING BRANCH MAPPINGS'
    );

    console.table(
      missingBranches
    );
  }


  if (
    ambiguousRows.length
  ) {

    console.log(
      '\nAMBIGUOUS SAMPLE'
    );

    console.dir(
      ambiguousRows.slice(
        0,
        20
      ),
      {
        depth:
          null,
      }
    );
  }


  /*
  |--------------------------------------------------------------------------
  | SAVE DRY-RUN ARTIFACT
  |--------------------------------------------------------------------------
  */

  const output = {
    generatedAt:
      new Date()
        .toISOString(),

    readOnly:
      true,

    databaseModified:
      false,

    summary: {
      officialRows:
        csabRows.length,

      mappedRows:
        mappedRows.length,

      unresolvedRows:
        unresolvedRows.length,

      ambiguousRows:
        ambiguousRows.length,

      missingCollegeNames:
        missingInstitutes.length,

      missingBranchMappings:
        missingBranches.length,

      duplicateIdentities:
        duplicateIdentities.length,
    },

    roundAudit,

    missingInstitutes,

    missingBranches,

    ambiguousRows,

    mappedRows,

    unresolvedRows,
  };


  fs.writeFileSync(
    './csab-2026-import-map.json',
    JSON.stringify(
      output,
      null,
      2
    ),
    'utf8'
  );


  console.log(
    '\nSaved:'
  );

  console.log(
    './csab-2026-import-map.json'
  );


  console.log(
    '\nDATABASE WAS NOT MODIFIED.'
  );


} finally {

  client.release();

  await pool.end();
}