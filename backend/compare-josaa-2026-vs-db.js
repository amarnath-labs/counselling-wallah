import fs from 'node:fs';

const INPUT =
  './josaa-2026-all-rounds-normalized.json';

const YEAR =
  2026;

const COUNSELLING_TYPE =
  'JOSAA';


/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}


function normalizeCategory(value) {
  return normalizeText(value)
    .replace(
      /\bobc ncl\b/g,
      'obc ncl'
    );
}


function normalizeRound(value) {
  const text =
    String(value ?? '')
      .trim();

  const matches =
    text.match(/\d+/g);

  if (!matches?.length) {
    return text;
  }

  return String(
    Number(
      matches[
        matches.length - 1
      ]
    )
  );
}


function officialKey(row) {
  return [
    normalizeText(row.institute),
    normalizeText(row.academicProgram),
    normalizeRound(row.round),
    normalizeCategory(row.seatType),
    normalizeText(row.quota),
    normalizeText(row.gender),
  ].join('|');
}


function dbKey(row) {
  return [
    normalizeText(row.college_name),
    normalizeText(row.branch_name),
    normalizeRound(row.round),
    normalizeCategory(row.category),
    normalizeText(row.quota),
    normalizeText(row.gender),
  ].join('|');
}


function collegeKey(value) {
  return normalizeText(value);
}


function branchKey(
  college,
  branch
) {
  return [
    normalizeText(college),
    normalizeText(branch),
  ].join('|');
}


function quoteIdent(value) {
  return (
    '"' +
    String(value)
      .replace(
        /"/g,
        '""'
      ) +
    '"'
  );
}


function chooseColumn(
  columns,
  candidates,
  label
) {
  for (
    const candidate
    of candidates
  ) {
    if (
      columns.includes(
        candidate
      )
    ) {
      return candidate;
    }
  }

  throw new Error(
    `Could not identify ${label}. ` +
    `Available columns: ${columns.join(', ')}`
  );
}


/*
|--------------------------------------------------------------------------
| LOAD FILE
|--------------------------------------------------------------------------
*/

if (
  !fs.existsSync(
    INPUT
  )
) {
  throw new Error(
    `Missing input file: ${INPUT}`
  );
}


const source =
  JSON.parse(
    fs.readFileSync(
      INPUT,
      'utf8'
    )
  );


if (
  !Array.isArray(
    source.rows
  )
) {
  throw new Error(
    'Normalized JSON has no rows[] array.'
  );
}


/*
|--------------------------------------------------------------------------
| STANDARD RECORDS ONLY
|--------------------------------------------------------------------------
|
| Preparatory ranks are intentionally excluded.
|
*/

const officialRows =
  source.rows.filter(
    row =>
      row.rankRecordType ===
        'STANDARD' &&
      row.usableForStandardPrediction ===
        true
  );


console.log(
  '\n========================================'
);

console.log(
  'TRUMARG JOSAA 2026 VS DATABASE AUDIT'
);

console.log(
  '========================================\n'
);

console.log(
  'Official normalized rows:',
  source.rows.length
);

console.log(
  'Standard rows being compared:',
  officialRows.length
);

console.log(
  'Preparatory rows excluded:',
  source.rows.length -
    officialRows.length
);


/*
|--------------------------------------------------------------------------
| IMPORT EXISTING DATABASE POOL
|--------------------------------------------------------------------------
*/

const poolModule =
  await import(
    './src/db/pool.js'
  );


const pool =
  poolModule.pool ??
  poolModule.default ??
  poolModule.db ??
  null;


if (
  !pool ||
  typeof pool.query !==
    'function'
) {
  throw new Error(
    'Could not resolve PostgreSQL pool from ./src/db/pool.js'
  );
}


try {

  /*
  |--------------------------------------------------------------------------
  | DATABASE IDENTITY
  |--------------------------------------------------------------------------
  */

  const identity =
    await pool.query(`
      SELECT
        current_database() AS database_name,
        current_schema() AS schema_name,
        NOW() AS database_time
    `);

  console.log(
    '\nDATABASE CONNECTION'
  );

  console.table(
    identity.rows
  );


  /*
  |--------------------------------------------------------------------------
  | DISCOVER TABLE COLUMNS
  |--------------------------------------------------------------------------
  */

  const schemaResult =
    await pool.query(
      `
      SELECT
        table_name,
        column_name
      FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name = ANY($1::text[])
      ORDER BY
        table_name,
        ordinal_position
      `,
      [
        [
          'cutoffs',
          'branches',
          'colleges',
        ],
      ]
    );


  const tableColumns = {
    cutoffs: [],
    branches: [],
    colleges: [],
  };


  for (
    const row
    of schemaResult.rows
  ) {
    tableColumns[
      row.table_name
    ]?.push(
      row.column_name
    );
  }


  console.log(
    '\nSCHEMA DISCOVERY'
  );

  console.log(
    'cutoffs columns:',
    tableColumns.cutoffs.join(', ')
  );

  console.log(
    'branches columns:',
    tableColumns.branches.join(', ')
  );

  console.log(
    'colleges columns:',
    tableColumns.colleges.join(', ')
  );


  /*
  |--------------------------------------------------------------------------
  | IDENTIFY NAME / FK COLUMNS
  |--------------------------------------------------------------------------
  */

  const branchNameColumn =
    chooseColumn(
      tableColumns.branches,
      [
        'name',
        'branch_name',
        'program_name',
        'title',
      ],
      'branch name column'
    );


  const collegeNameColumn =
    chooseColumn(
      tableColumns.colleges,
      [
        'name',
        'college_name',
        'institute_name',
        'title',
      ],
      'college name column'
    );


  const branchCollegeIdColumn =
    chooseColumn(
      tableColumns.branches,
      [
        'college_id',
        'institute_id',
      ],
      'branch → college foreign key'
    );


  console.log(
    '\nResolved branch name column:',
    branchNameColumn
  );

  console.log(
    'Resolved college name column:',
    collegeNameColumn
  );

  console.log(
    'Resolved branch college FK:',
    branchCollegeIdColumn
  );


  /*
  |--------------------------------------------------------------------------
  | READ CURRENT JOSAA 2026 DATABASE ROWS
  |--------------------------------------------------------------------------
  |
  | READ ONLY.
  |
  */

  const sql = `
    SELECT
      co.id AS cutoff_id,
      co.branch_id,
      co.year,
      co.round::text AS round,
      co.category,
      co.quota,
      co.gender,
      co.opening_rank,
      co.closing_rank,
      co.counselling_type,

      b.${quoteIdent(
        branchNameColumn
      )} AS branch_name,

      c.id AS college_id,

      c.${quoteIdent(
        collegeNameColumn
      )} AS college_name

    FROM cutoffs co

    JOIN branches b
      ON b.id =
         co.branch_id

    JOIN colleges c
      ON c.id =
         b.${quoteIdent(
           branchCollegeIdColumn
         )}

    WHERE co.year = $1
      AND UPPER(
        COALESCE(
          co.counselling_type,
          ''
        )
      ) = $2

    ORDER BY
      co.id
  `;


  const dbResult =
    await pool.query(
      sql,
      [
        YEAR,
        COUNSELLING_TYPE,
      ]
    );


  const dbRows =
    dbResult.rows;


  console.log(
    '\nCurrent DB JoSAA 2026 rows:',
    dbRows.length
  );


  /*
  |--------------------------------------------------------------------------
  | CURRENT DB ROUND COUNTS
  |--------------------------------------------------------------------------
  */

  const dbRoundCounts =
    {};

  for (
    const row
    of dbRows
  ) {

    const round =
      normalizeRound(
        row.round
      );

    dbRoundCounts[
      round
    ] =
      (
        dbRoundCounts[
          round
        ] ||
        0
      ) + 1;
  }


  console.log(
    '\nCURRENT DB ROUND COUNTS'
  );

  console.table(
    Object.entries(
      dbRoundCounts
    )
      .map(
        ([round, rows]) => ({
          round,
          rows,
        })
      )
      .sort(
        (a, b) =>
          Number(a.round) -
          Number(b.round)
      )
  );


  /*
  |--------------------------------------------------------------------------
  | BUILD DATABASE MAP
  |--------------------------------------------------------------------------
  */

  const dbMap =
    new Map();

  const duplicateDbKeys =
    [];


  for (
    const row
    of dbRows
  ) {

    const key =
      dbKey(
        row
      );

    if (
      dbMap.has(
        key
      )
    ) {

      duplicateDbKeys.push({
        key,
        first:
          dbMap.get(key),
        duplicate:
          row,
      });

      continue;
    }

    dbMap.set(
      key,
      row
    );
  }


  /*
  |--------------------------------------------------------------------------
  | OFFICIAL COLLEGE / BRANCH COVERAGE
  |--------------------------------------------------------------------------
  */

  const dbCollegeSet =
    new Set(
      dbRows.map(
        row =>
          collegeKey(
            row.college_name
          )
      )
    );


  const dbBranchSet =
    new Set(
      dbRows.map(
        row =>
          branchKey(
            row.college_name,
            row.branch_name
          )
      )
    );


  const officialColleges =
    new Map();

  const officialBranches =
    new Map();


  for (
    const row
    of officialRows
  ) {

    const ck =
      collegeKey(
        row.institute
      );

    if (
      !officialColleges.has(
        ck
      )
    ) {

      officialColleges.set(
        ck,
        row.institute
      );
    }


    const bk =
      branchKey(
        row.institute,
        row.academicProgram
      );

    if (
      !officialBranches.has(
        bk
      )
    ) {

      officialBranches.set(
        bk,
        {
          institute:
            row.institute,

          academicProgram:
            row.academicProgram,
        }
      );
    }
  }


  const missingColleges =
    [];

  for (
    const [
      key,
      name,
    ]
    of officialColleges
  ) {

    if (
      !dbCollegeSet.has(
        key
      )
    ) {

      missingColleges.push(
        name
      );
    }
  }


  const missingBranches =
    [];

  for (
    const [
      key,
      value,
    ]
    of officialBranches
  ) {

    if (
      !dbBranchSet.has(
        key
      )
    ) {

      missingBranches.push(
        value
      );
    }
  }


  /*
  |--------------------------------------------------------------------------
  | COMPARE EXACT PROFILE KEYS
  |--------------------------------------------------------------------------
  */

  const exactMatches =
    [];

  const rankMismatches =
    [];

  const missingOfficialRows =
    [];

  const officialKeySet =
    new Set();


  for (
    const official
    of officialRows
  ) {

    const key =
      officialKey(
        official
      );

    officialKeySet.add(
      key
    );


    const db =
      dbMap.get(
        key
      );


    if (!db) {

      missingOfficialRows.push(
        official
      );

      continue;
    }


    const dbOpening =
      db.opening_rank ===
        null
        ? null
        : Number(
            db.opening_rank
          );


    const dbClosing =
      db.closing_rank ===
        null
        ? null
        : Number(
            db.closing_rank
          );


    const openingSame =
      dbOpening ===
        official.openingRank;


    const closingSame =
      dbClosing ===
        official.closingRank;


    if (
      openingSame &&
      closingSame
    ) {

      exactMatches.push({
        official,
        db,
      });

    } else {

      rankMismatches.push({
        institute:
          official.institute,

        academicProgram:
          official.academicProgram,

        round:
          official.round,

        quota:
          official.quota,

        seatType:
          official.seatType,

        gender:
          official.gender,

        officialOpening:
          official.openingRank,

        dbOpening,

        officialClosing:
          official.closingRank,

        dbClosing,

        cutoffId:
          db.cutoff_id,
      });
    }
  }


  /*
  |--------------------------------------------------------------------------
  | EXTRA DATABASE ROWS
  |--------------------------------------------------------------------------
  */

  const extraDbRows =
    [];


  for (
    const row
    of dbRows
  ) {

    const key =
      dbKey(
        row
      );

    if (
      !officialKeySet.has(
        key
      )
    ) {

      extraDbRows.push(
        row
      );
    }
  }


  /*
  |--------------------------------------------------------------------------
  | OFFICIAL ROUND SUMMARY
  |--------------------------------------------------------------------------
  */

  const officialRoundSummary =
    [];


  for (
    const round
    of [
      '1',
      '2',
      '3',
      '4',
      '5',
    ]
  ) {

    const roundRows =
      officialRows.filter(
        row =>
          normalizeRound(
            row.round
          ) ===
          round
      );


    const missing =
      missingOfficialRows.filter(
        row =>
          normalizeRound(
            row.round
          ) ===
          round
      );


    const mismatches =
      rankMismatches.filter(
        row =>
          normalizeRound(
            row.round
          ) ===
          round
      );


    const matched =
      roundRows.length -
      missing.length -
      mismatches.length;


    officialRoundSummary.push({
      round,
      official:
        roundRows.length,

      exactMatch:
        matched,

      rankMismatch:
        mismatches.length,

      missingInDb:
        missing.length,
    });
  }


  /*
  |--------------------------------------------------------------------------
  | OUTPUT
  |--------------------------------------------------------------------------
  */

  console.log(
    '\n========================================'
  );

  console.log(
    'ROUND COMPARISON'
  );

  console.log(
    '========================================'
  );

  console.table(
    officialRoundSummary
  );


  console.log(
    '\n========================================'
  );

  console.log(
    'FINAL AUDIT SUMMARY'
  );

  console.log(
    '========================================'
  );


  const summary = {
    officialTotalRows:
      source.rows.length,

    officialStandardRows:
      officialRows.length,

    officialPreparatoryExcluded:
      source.rows.length -
      officialRows.length,

    currentDbRows:
      dbRows.length,

    exactMatches:
      exactMatches.length,

    rankMismatches:
      rankMismatches.length,

    missingInDb:
      missingOfficialRows.length,

    extraDbRows:
      extraDbRows.length,

    duplicateDbKeys:
      duplicateDbKeys.length,

    uniqueOfficialColleges:
      officialColleges.size,

    missingCollegeMappings:
      missingColleges.length,

    uniqueOfficialCollegeBranches:
      officialBranches.size,

    missingBranchMappings:
      missingBranches.length,
  };


  console.table(
    summary
  );


  console.log(
    '\nFIRST 20 MISSING COLLEGES'
  );

  console.table(
    missingColleges
      .slice(
        0,
        20
      )
      .map(
        name => ({
          college:
            name,
        })
      )
  );


  console.log(
    '\nFIRST 20 MISSING BRANCH MAPPINGS'
  );

  console.table(
    missingBranches
      .slice(
        0,
        20
      )
  );


  console.log(
    '\nFIRST 20 RANK MISMATCHES'
  );

  console.table(
    rankMismatches
      .slice(
        0,
        20
      )
  );


  console.log(
    '\nFIRST 20 OFFICIAL ROWS MISSING IN DB'
  );

  console.table(
    missingOfficialRows
      .slice(
        0,
        20
      )
      .map(
        row => ({
          round:
            row.round,

          institute:
            row.institute,

          program:
            row.academicProgram,

          quota:
            row.quota,

          category:
            row.seatType,

          gender:
            row.gender,

          opening:
            row.openingRank,

          closing:
            row.closingRank,
        })
      )
  );


  /*
  |--------------------------------------------------------------------------
  | SAVE COMPLETE AUDIT
  |--------------------------------------------------------------------------
  */

  const auditOutput = {
    generatedAt:
      new Date()
        .toISOString(),

    readOnly:
      true,

    summary,

    roundSummary:
      officialRoundSummary,

    missingColleges,

    missingBranches,

    rankMismatches,

    missingOfficialRows,

    extraDbRows,

    duplicateDbKeys,
  };


  fs.writeFileSync(
    './josaa-2026-vs-db-audit.json',
    JSON.stringify(
      auditOutput,
      null,
      2
    ),
    'utf8'
  );


  console.log(
    '\nSaved: ./josaa-2026-vs-db-audit.json'
  );

  console.log(
    '\nNO INSERT / UPDATE / DELETE WAS EXECUTED.'
  );

} finally {

  if (
    typeof pool.end ===
    'function'
  ) {
    await pool.end();
  }
}