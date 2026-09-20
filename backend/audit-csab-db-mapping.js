import 'dotenv/config';
import fs from 'node:fs/promises';
import pg from 'pg';

const { Pool } = pg;

const DATA_FILE =
  './tmp/csab/combined/csab-2024-2026-all.json';

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.DB_URL;

if (!connectionString) {
  throw new Error(
    'DATABASE_URL / POSTGRES_URL / DB_URL not found.'
  );
}

const pool =
  new Pool({
    connectionString,

    ssl:
      connectionString.includes('localhost') ||
      connectionString.includes('127.0.0.1')
        ? false
        : {
            rejectUnauthorized: false,
          },
  });


function normalizeName(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/\bprogramme\b/g, 'program')
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}


function normalizeProgram(value = '') {
  return normalizeName(value)
    .replace(
      /\b4 years bachelor of technology\b/g,
      ''
    )
    .replace(
      /\b5 years bachelor and master of technology dual degree\b/g,
      ''
    )
    .replace(
      /\b5 years integrated master of technology\b/g,
      ''
    )
    .replace(
      /\s+/g,
      ' '
    )
    .trim();
}


function uniqueBy(
  rows,
  keyFn
) {
  const map =
    new Map();

  for (const row of rows) {
    const key =
      keyFn(row);

    if (!map.has(key)) {
      map.set(
        key,
        row
      );
    }
  }

  return [
    ...map.values(),
  ];
}


async function main() {

  const sourceRows =
    JSON.parse(
      await fs.readFile(
        DATA_FILE,
        'utf8'
      )
    );

  console.log(
    '\n========================================'
  );

  console.log(
    'CSAB DB MAPPING AUDIT'
  );

  console.log(
    'READ ONLY'
  );

  console.log(
    '========================================'
  );

  console.log(
    'Source rows:',
    sourceRows.length
  );


  const client =
    await pool.connect();

  try {

    /*
    |--------------------------------------------------------------------------
    | 1. Exact counselling constraint
    |--------------------------------------------------------------------------
    */

    const constraint =
      await client.query(
        `
        SELECT
          conname,
          pg_get_constraintdef(oid)
            AS definition
        FROM pg_constraint
        WHERE conrelid =
          'public.cutoffs'::regclass
          AND conname =
            'cutoffs_counselling_type_check'
        `
      );

    console.log(
      '\n===== COUNSELLING TYPE CONSTRAINT ====='
    );

    console.table(
      constraint.rows
    );


    /*
    |--------------------------------------------------------------------------
    | 2. Existing CSAB rows by year / round
    |--------------------------------------------------------------------------
    */

    const existingCsab =
      await client.query(
        `
        SELECT
          year,
          round,
          COUNT(*)::bigint AS rows,
          COUNT(
            DISTINCT branch_id
          )::bigint AS branches
        FROM cutoffs
        WHERE counselling_type =
          'CSAB_SPECIAL'
        GROUP BY
          year,
          round
        ORDER BY
          year DESC,
          round
        `
      );

    console.log(
      '\n===== EXISTING CSAB_SPECIAL ====='
    );

    console.table(
      existingCsab.rows
    );


    /*
    |--------------------------------------------------------------------------
    | 3. Load existing colleges / branches
    |--------------------------------------------------------------------------
    */

    const collegesResult =
      await client.query(
        `
        SELECT
          id,
          name,
          type,
          institute_code,
          csab_participating,
          csab_special
        FROM colleges
        ORDER BY name
        `
      );

    const branchesResult =
      await client.query(
        `
        SELECT
          id,
          college_id,
          name
        FROM branches
        ORDER BY college_id, name
        `
      );


    const colleges =
      collegesResult.rows;

    const branches =
      branchesResult.rows;


    /*
    |--------------------------------------------------------------------------
    | 4. College indexes
    |--------------------------------------------------------------------------
    */

    const exactCollege =
      new Map();

    const normalizedCollege =
      new Map();


    for (
      const college
      of colleges
    ) {

      exactCollege.set(
        college.name.trim(),
        college
      );


      const key =
        normalizeName(
          college.name
        );


      if (
        !normalizedCollege.has(
          key
        )
      ) {
        normalizedCollege.set(
          key,
          []
        );
      }


      normalizedCollege
        .get(key)
        .push(
          college
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Unique source institutes
    |--------------------------------------------------------------------------
    */

    const sourceInstitutes =
      uniqueBy(
        sourceRows,
        row =>
          row.institute_name
      )
      .map(
        row =>
          row.institute_name
      )
      .sort();


    const collegeMappings =
      [];

    const instituteToCollege =
      new Map();


    for (
      const instituteName
      of sourceInstitutes
    ) {

      const exact =
        exactCollege.get(
          instituteName
        );


      if (exact) {

        collegeMappings.push({
          source:
            instituteName,

          match_type:
            'EXACT',

          college_id:
            exact.id,

          db_name:
            exact.name,
        });


        instituteToCollege.set(
          instituteName,
          exact
        );

        continue;
      }


      const normalized =
        normalizeName(
          instituteName
        );


      const candidates =
        normalizedCollege.get(
          normalized
        ) || [];


      if (
        candidates.length === 1
      ) {

        collegeMappings.push({
          source:
            instituteName,

          match_type:
            'NORMALIZED',

          college_id:
            candidates[0].id,

          db_name:
            candidates[0].name,
        });


        instituteToCollege.set(
          instituteName,
          candidates[0]
        );

      } else if (
        candidates.length > 1
      ) {

        collegeMappings.push({
          source:
            instituteName,

          match_type:
            'AMBIGUOUS',

          college_id:
            null,

          db_name:
            candidates
              .map(
                item =>
                  item.name
              )
              .join(' || '),
        });

      } else {

        collegeMappings.push({
          source:
            instituteName,

          match_type:
            'UNMATCHED',

          college_id:
            null,

          db_name:
            null,
        });
      }
    }


    /*
    |--------------------------------------------------------------------------
    | 5. Branch index scoped by college
    |--------------------------------------------------------------------------
    */

    const branchesByCollege =
      new Map();


    for (
      const branch
      of branches
    ) {

      if (
        !branchesByCollege.has(
          branch.college_id
        )
      ) {
        branchesByCollege.set(
          branch.college_id,
          []
        );
      }


      branchesByCollege
        .get(
          branch.college_id
        )
        .push(
          branch
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Unique institute + program combinations
    |--------------------------------------------------------------------------
    */

    const sourcePrograms =
      uniqueBy(
        sourceRows,
        row =>
          `${row.institute_name}|||${row.program_name}`
      );


    const programMappings =
      [];


    for (
      const row
      of sourcePrograms
    ) {

      const college =
        instituteToCollege.get(
          row.institute_name
        );


      if (!college) {

        programMappings.push({
          institute:
            row.institute_name,

          program:
            row.program_name,

          college_id:
            null,

          branch_id:
            null,

          match_type:
            'COLLEGE_UNMATCHED',

          db_branch:
            null,
        });

        continue;
      }


      const available =
        branchesByCollege.get(
          college.id
        ) || [];


      const exact =
        available.find(
          branch =>
            branch.name.trim() ===
            row.program_name.trim()
        );


      if (exact) {

        programMappings.push({
          institute:
            row.institute_name,

          program:
            row.program_name,

          college_id:
            college.id,

          branch_id:
            exact.id,

          match_type:
            'EXACT',

          db_branch:
            exact.name,
        });

        continue;
      }


      const normalizedSource =
        normalizeProgram(
          row.program_name
        );


      const normalizedMatches =
        available.filter(
          branch =>
            normalizeProgram(
              branch.name
            ) ===
            normalizedSource
        );


      if (
        normalizedMatches.length ===
        1
      ) {

        programMappings.push({
          institute:
            row.institute_name,

          program:
            row.program_name,

          college_id:
            college.id,

          branch_id:
            normalizedMatches[0].id,

          match_type:
            'NORMALIZED',

          db_branch:
            normalizedMatches[0].name,
        });

      } else if (
        normalizedMatches.length > 1
      ) {

        programMappings.push({
          institute:
            row.institute_name,

          program:
            row.program_name,

          college_id:
            college.id,

          branch_id:
            null,

          match_type:
            'AMBIGUOUS',

          db_branch:
            normalizedMatches
              .map(
                item =>
                  item.name
              )
              .join(' || '),
        });

      } else {

        programMappings.push({
          institute:
            row.institute_name,

          program:
            row.program_name,

          college_id:
            college.id,

          branch_id:
            null,

          match_type:
            'UNMATCHED',

          db_branch:
            null,
        });
      }
    }


    /*
    |--------------------------------------------------------------------------
    | 6. Row coverage
    |--------------------------------------------------------------------------
    */

    const programMap =
      new Map(
        programMappings.map(
          mapping => [
            `${mapping.institute}|||${mapping.program}`,
            mapping,
          ]
        )
      );


    let mappedRows =
      0;

    let unmappedCollegeRows =
      0;

    let unmappedBranchRows =
      0;


    for (
      const row
      of sourceRows
    ) {

      const mapping =
        programMap.get(
          `${row.institute_name}|||${row.program_name}`
        );


      if (
        mapping?.branch_id
      ) {
        mappedRows++;
      } else if (
        mapping?.match_type ===
        'COLLEGE_UNMATCHED'
      ) {
        unmappedCollegeRows++;
      } else {
        unmappedBranchRows++;
      }
    }


    /*
    |--------------------------------------------------------------------------
    | 7. Summaries
    |--------------------------------------------------------------------------
    */

    function countTypes(rows) {

      const result = {};

      for (
        const row
        of rows
      ) {

        result[
          row.match_type
        ] =
          (
            result[
              row.match_type
            ] || 0
          ) + 1;
      }

      return result;
    }


    const collegeSummary =
      countTypes(
        collegeMappings
      );


    const programSummary =
      countTypes(
        programMappings
      );


    console.log(
      '\n===== COLLEGE MAPPING SUMMARY ====='
    );

    console.table(
      collegeSummary
    );


    console.log(
      '\n===== PROGRAM MAPPING SUMMARY ====='
    );

    console.table(
      programSummary
    );


    console.log(
      '\n===== ROW COVERAGE ====='
    );

    console.log(
      'Total source rows:',
      sourceRows.length
    );

    console.log(
      'Mapped rows:',
      mappedRows
    );

    console.log(
      'Unmapped college rows:',
      unmappedCollegeRows
    );

    console.log(
      'Unmapped branch rows:',
      unmappedBranchRows
    );

    console.log(
      'Coverage %:',
      (
        mappedRows /
        sourceRows.length *
        100
      ).toFixed(2)
    );


    /*
    |--------------------------------------------------------------------------
    | 8. Save audit artifacts
    |--------------------------------------------------------------------------
    */

    const outputDir =
      './tmp/csab/mapping-audit';


    await fs.mkdir(
      outputDir,
      {
        recursive: true,
      }
    );


    await fs.writeFile(
      `${outputDir}/college-mappings.json`,

      JSON.stringify(
        collegeMappings,
        null,
        2
      ),

      'utf8'
    );


    await fs.writeFile(
      `${outputDir}/program-mappings.json`,

      JSON.stringify(
        programMappings,
        null,
        2
      ),

      'utf8'
    );


    await fs.writeFile(
      `${outputDir}/unmatched-colleges.json`,

      JSON.stringify(
        collegeMappings.filter(
          row =>
            row.match_type ===
              'UNMATCHED' ||
            row.match_type ===
              'AMBIGUOUS'
        ),
        null,
        2
      ),

      'utf8'
    );


    await fs.writeFile(
      `${outputDir}/unmatched-programs.json`,

      JSON.stringify(
        programMappings.filter(
          row =>
            row.match_type !==
              'EXACT' &&
            row.match_type !==
              'NORMALIZED'
        ),
        null,
        2
      ),

      'utf8'
    );


    const summary = {
      total_source_rows:
        sourceRows.length,

      unique_source_institutes:
        sourceInstitutes.length,

      unique_source_institute_programs:
        sourcePrograms.length,

      college_mapping:
        collegeSummary,

      program_mapping:
        programSummary,

      mapped_rows:
        mappedRows,

      unmapped_college_rows:
        unmappedCollegeRows,

      unmapped_branch_rows:
        unmappedBranchRows,

      coverage_percent:
        Number(
          (
            mappedRows /
            sourceRows.length *
            100
          ).toFixed(2)
        ),

      existing_csab_special:
        existingCsab.rows,

      counselling_constraint:
        constraint.rows,
    };


    await fs.writeFile(
      `${outputDir}/summary.json`,

      JSON.stringify(
        summary,
        null,
        2
      ),

      'utf8'
    );


    console.log(
      '\nSaved under:'
    );

    console.log(
      outputDir
    );


    console.log(
      '\n========================================'
    );

    console.log(
      'MAPPING AUDIT COMPLETE'
    );

    console.log(
      'NO DATABASE CHANGES MADE'
    );

    console.log(
      '========================================'
    );

  } finally {

    client.release();

    await pool.end();
  }
}


main().catch(
  error => {

    console.error(
      '\nMAPPING AUDIT FAILED'
    );

    console.error(
      error
    );

    process.exitCode = 1;
  }
);
