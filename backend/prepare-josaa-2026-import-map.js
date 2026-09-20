import fs from 'node:fs';
import { pool } from './src/db/pool.js';

const INPUT =
  './josaa-2026-all-rounds-normalized.json';

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

  const aliases = new Map([
    [
      'indian institute of technology gandhinagar',
      'iit gandhinagar',
    ],
  ]);

  return aliases.get(normalized) ??
    normalized;
}

const source =
  JSON.parse(
    fs.readFileSync(
      INPUT,
      'utf8'
    )
  );

const rows =
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
  'JOSAA 2026 IMPORT MAPPING DRY-RUN'
);

console.log(
  '========================================\n'
);

console.log(
  'Standard official rows:',
  rows.length
);

try {

  const collegesResult =
    await pool.query(`
      SELECT
        id,
        name
      FROM colleges
      ORDER BY name
    `);

  const branchesResult =
    await pool.query(`
      SELECT
        b.id,
        b.college_id,
        b.name AS branch_name,
        c.name AS college_name
      FROM branches b
      JOIN colleges c
        ON c.id = b.college_id
      ORDER BY
        c.name,
        b.name
    `);


  /*
  |--------------------------------------------------------------------------
  | COLLEGE MAP
  |--------------------------------------------------------------------------
  */

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


  /*
  |--------------------------------------------------------------------------
  | BRANCH MAP
  |--------------------------------------------------------------------------
  */

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


  const mappedRows = [];

  const missingColleges =
    new Map();

  const missingBranches =
    new Map();


  for (
    const row
    of rows
  ) {

    const officialCollegeKey =
      canonicalCollegeName(
        row.institute
      );

    const college =
      collegeMap.get(
        officialCollegeKey
      );


    if (!college) {

      if (
        !missingColleges.has(
          row.institute
        )
      ) {
        missingColleges.set(
          row.institute,
          0
        );
      }

      missingColleges.set(
        row.institute,
        missingColleges.get(
          row.institute
        ) + 1
      );

      continue;
    }


    const branchKey =
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
        branchKey
      );


    /*
    |--------------------------------------------------------------------------
    | IIT Gandhinagar legacy branch aliases
    |--------------------------------------------------------------------------
    |
    | Existing TruMarg DB uses short names for three older branches.
    | Reuse the existing branch IDs instead of creating duplicates.
    |
    */

    if (
      !branch &&
      college.id === 'iit-gandhinagar'
    ) {

      const branchAliases =
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
        branchAliases.get(
          normalizeText(
            row.academicProgram
          )
        );


      if (aliasName) {

        const aliasKey =
          [
            normalizeText(
              college.name
            ),
            normalizeText(
              aliasName
            ),
          ].join('|');


        branch =
          branchMap.get(
            aliasKey
          );
      }
    }


    if (!branch) {

      const missingKey =
        [
          college.id,
          row.academicProgram,
        ].join('|');

      if (
        !missingBranches.has(
          missingKey
        )
      ) {
        missingBranches.set(
          missingKey,
          {
            collegeId:
              college.id,

            dbCollegeName:
              college.name,

            officialCollege:
              row.institute,

            academicProgram:
              row.academicProgram,

            rows:
              0,
          }
        );
      }

      missingBranches.get(
        missingKey
      ).rows += 1;

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


  const roundSummary =
    ['1','2','3','4','5']
      .map(
        round => ({
          round,

          official:
            rows.filter(
              row =>
                row.round ===
                round
            ).length,

          mapped:
            mappedRows.filter(
              row =>
                row.round ===
                round
            ).length,
        })
      );


  const summary = {
    officialStandardRows:
      rows.length,

    mappedRows:
      mappedRows.length,

    unmappedRows:
      rows.length -
        mappedRows.length,

    missingCollegeNames:
      missingColleges.size,

    missingBranchMappings:
      missingBranches.size,
  };


  console.log(
    '\nROUND MAPPING SUMMARY'
  );

  console.table(
    roundSummary
  );


  console.log(
    '\nFINAL MAPPING SUMMARY'
  );

  console.table(
    summary
  );


  console.log(
    '\nMISSING COLLEGES'
  );

  console.table(
    [...missingColleges.entries()]
      .map(
        ([college, rowCount]) => ({
          college,
          rowCount,
        })
      )
  );


  console.log(
    '\nMISSING BRANCHES'
  );

  console.table(
    [...missingBranches.values()]
      .slice(
        0,
        100
      )
  );


  fs.writeFileSync(
    './josaa-2026-import-map.json',
    JSON.stringify(
      {
        generatedAt:
          new Date()
            .toISOString(),

        readOnly:
          true,

        summary,

        roundSummary,

        missingColleges:
          [...missingColleges.entries()]
            .map(
              ([college, rowCount]) => ({
                college,
                rowCount,
              })
            ),

        missingBranches:
          [...missingBranches.values()],

        mappedRows,
      },
      null,
      2
    ),
    'utf8'
  );


  console.log(
    '\nSaved:'
  );

  console.log(
    './josaa-2026-import-map.json'
  );

  console.log(
    '\nNO DATABASE CHANGES MADE.'
  );

} finally {
  await pool.end();
}