import fs from 'node:fs';
import { pool } from './src/db/pool.js';

const NORMALIZED_INPUT =
  './josaa-2025-all-rounds-normalized.json';

const PLAN_INPUT =
  './josaa-2025-branch-resolution-plan.json';

const OUTPUT =
  './josaa-2025-import-map-final.json';

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

  return (
    aliases.get(normalized) ??
    normalized
  );
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


const aliasPlan =
  (planSource.plan ?? [])
    .filter(
      row =>
        row.action === 'ALIAS'
    );


if (
  aliasPlan.length !== 10
) {
  throw new Error(
    `Expected 10 approved aliases, found ${aliasPlan.length}`
  );
}


console.log(
  '\n========================================'
);

console.log(
  'FINAL JOSAA 2025 IMPORT MAPPING'
);

console.log(
  '========================================\n'
);


try {

  const collegesResult =
    await pool.query(`
      SELECT
        id,
        name
      FROM colleges
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

    branchMap.set(
      [
        normalizeText(
          branch.college_name
        ),

        normalizeText(
          branch.branch_name
        ),
      ].join('|'),
      branch
    );
  }


  /*
  |--------------------------------------------------------------------------
  | APPROVED 2025 ALIASES
  |--------------------------------------------------------------------------
  */

  const approvedAliases =
    new Map();


  for (
    const item
    of aliasPlan
  ) {

    approvedAliases.set(
      [
        item.collegeId,
        normalizeText(
          item.officialProgram
        ),
      ].join('|'),
      String(
        item.existingBranchId
      )
    );
  }


  const branchById =
    new Map(
      branchesResult.rows.map(
        row => [
          String(row.id),
          row,
        ]
      )
    );


  /*
  |--------------------------------------------------------------------------
  | MAP
  |--------------------------------------------------------------------------
  */

  const mappedRows = [];

  const missingColleges = [];

  const missingBranches = [];


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


    let branch =
      branchMap.get(
        [
          normalizeText(
            college.name
          ),

          normalizeText(
            row.academicProgram
          ),
        ].join('|')
      );


    /*
    |--------------------------------------------------------------------------
    | IIT Gandhinagar controlled aliases
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
    | Approved 2025 aliases
    |--------------------------------------------------------------------------
    */

    if (!branch) {

      const aliasBranchId =
        approvedAliases.get(
          [
            college.id,
            normalizeText(
              row.academicProgram
            ),
          ].join('|')
        );


      if (aliasBranchId) {

        branch =
          branchById.get(
            aliasBranchId
          );
      }
    }


    if (!branch) {

      missingBranches.push({
        collegeId:
          college.id,

        college:
          college.name,

        officialProgram:
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
  | DUPLICATE IDENTITY AUDIT
  |--------------------------------------------------------------------------
  */

  const seen =
    new Set();

  const duplicateRows =
    [];


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
      seen.has(key)
    ) {

      duplicateRows.push(
        row
      );

    } else {

      seen.add(
        key
      );
    }
  }


  /*
  |--------------------------------------------------------------------------
  | ROUND SUMMARY
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
    'ROUND SUMMARY'
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

    missingCollegeRows:
      missingColleges.length,

    missingBranchRows:
      missingBranches.length,

    duplicateIdentities:
      duplicateRows.length,
  };


  console.log(
    '\nFINAL SUMMARY'
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
      `Final mapping incomplete: ${mappedRows.length}/${EXPECTED_TOTAL}`
    );
  }


  if (
    missingColleges.length !== 0 ||
    missingBranches.length !== 0
  ) {
    throw new Error(
      'Unmapped rows remain.'
    );
  }


  if (
    duplicateRows.length !== 0
  ) {
    throw new Error(
      `Duplicate mapped identities found: ${duplicateRows.length}`
    );
  }


  fs.writeFileSync(
    OUTPUT,
    JSON.stringify(
      {
        generatedAt:
          new Date()
            .toISOString(),

        year:
          2025,

        counsellingType:
          'JOSAA',

        summary,

        roundSummary,

        mappedRows,
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
    'FINAL JOSAA 2025 MAPPING PASSED'
  );

  console.log(
    '========================================'
  );

  console.log(
    'Mapped:',
    mappedRows.length
  );

  console.log(
    'Unmapped: 0'
  );

  console.log(
    'Duplicate identities: 0'
  );

  console.log(
    'Saved:'
  );

  console.log(
    OUTPUT
  );


  console.log(
    '\nDATABASE WAS NOT MODIFIED.'
  );

} finally {

  await pool.end();
}