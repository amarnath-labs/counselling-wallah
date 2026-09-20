import fs from 'node:fs';
import { pool } from './src/db/pool.js';

const NORMALIZED_INPUT =
  './josaa-2024-all-rounds-normalized.json';

const PLAN_INPUT =
  './josaa-2024-branch-resolution-plan.json';

const OUTPUT =
  './josaa-2024-import-map-final.json';

const EXPECTED_TOTAL =
  55961;

const EXPECTED_ROUNDS = {
  '1': 11484,
  '2': 11190,
  '3': 11119,
  '4': 11093,
  '5': 11075,
};


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


for (
  const file
  of [
    NORMALIZED_INPUT,
    PLAN_INPUT,
  ]
) {

  if (!fs.existsSync(file)) {
    throw new Error(
      `Missing required file: ${file}`
    );
  }
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
  (normalized.rows ?? [])
    .filter(
      row =>
        row.rankRecordType ===
          'STANDARD' &&
        row.usableForStandardPrediction ===
          true
    );


if (
  officialRows.length !==
  EXPECTED_TOTAL
) {
  throw new Error(
    `Expected ${EXPECTED_TOTAL} standard rows, got ${officialRows.length}`
  );
}


const resolutionPlan =
  planSource.plan ?? [];


const aliasPlan =
  resolutionPlan.filter(
    row =>
      row.action === 'ALIAS'
  );


console.log(
  '\n========================================'
);

console.log(
  'FINALIZE JOSAA 2024 IMPORT MAP'
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


try {

  /*
  |--------------------------------------------------------------------------
  | LOAD CURRENT DATABASE STATE
  |--------------------------------------------------------------------------
  */

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


  const branchState =
    await pool.query(`
      SELECT
        COUNT(*)::int AS branch_count,
        MAX(id) AS max_id
      FROM branches
    `);


  console.log(
    '\nCURRENT BRANCH STATE'
  );

  console.table(
    branchState.rows
  );


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
  | BRANCH MAPS
  |--------------------------------------------------------------------------
  */

  const branchMap =
    new Map();

  const branchById =
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


    branchById.set(
      String(
        branch.id
      ),
      branch
    );
  }


  /*
  |--------------------------------------------------------------------------
  | VALIDATE APPROVED ALIASES
  |--------------------------------------------------------------------------
  */

  const approvedAliases =
    new Map();


  for (
    const item
    of aliasPlan
  ) {

    const branch =
      branchById.get(
        String(
          item.existingBranchId
        )
      );


    if (!branch) {
      throw new Error(
        `Alias target branch not found: ${item.existingBranchId}`
      );
    }


    if (
      branch.college_id !==
      item.collegeId
    ) {
      throw new Error(
        `Alias ${item.existingBranchId} belongs to wrong college`
      );
    }


    approvedAliases.set(
      [
        item.collegeId,
        normalizeText(
          item.officialProgram
        ),
      ].join('|'),
      branch
    );
  }


  /*
  |--------------------------------------------------------------------------
  | MAP ALL OFFICIAL ROWS
  |--------------------------------------------------------------------------
  */

  const mappedRows =
    [];

  const missingColleges =
    new Map();

  const missingBranches =
    new Map();


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

      missingColleges.set(
        row.institute,
        (
          missingColleges.get(
            row.institute
          ) ??
          0
        ) + 1
      );

      continue;
    }


    /*
    |--------------------------------------------------------------------------
    | EXACT BRANCH
    |--------------------------------------------------------------------------
    */

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
    | EXISTING IIT GANDHINAGAR 4-YEAR SHORT-NAME ALIASES
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
    | APPROVED 2024 ALIASES
    |--------------------------------------------------------------------------
    */

    if (!branch) {

      branch =
        approvedAliases.get(
          [
            college.id,
            normalizeText(
              row.academicProgram
            ),
          ].join('|')
        ) ?? null;
    }


    if (!branch) {

      const key =
        [
          college.id,
          row.academicProgram,
        ].join('|');


      if (
        !missingBranches.has(
          key
        )
      ) {

        missingBranches.set(
          key,
          {
            collegeId:
              college.id,

            college:
              college.name,

            program:
              row.academicProgram,

            rows:
              0,
          }
        );
      }


      missingBranches.get(
        key
      ).rows +=
        1;

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
  | ROUND COUNTS
  |--------------------------------------------------------------------------
  */

  const roundSummary =
    Object.keys(
      EXPECTED_ROUNDS
    ).map(
      round => {

        const official =
          officialRows.filter(
            row =>
              row.round ===
              round
          ).length;


        const mapped =
          mappedRows.filter(
            row =>
              row.round ===
              round
          ).length;


        return {
          round,
          official,
          mapped,
        };
      }
    );


  console.log(
    '\nROUND MAPPING SUMMARY'
  );

  console.table(
    roundSummary
  );


  for (
    const row
    of roundSummary
  ) {

    const expected =
      EXPECTED_ROUNDS[
        row.round
      ];


    if (
      row.official !==
        expected ||
      row.mapped !==
        expected
    ) {
      throw new Error(
        `Round ${row.round} mismatch. Expected ${expected}, official=${row.official}, mapped=${row.mapped}`
      );
    }
  }


  /*
  |--------------------------------------------------------------------------
  | DUPLICATE IDENTITY CHECK
  |--------------------------------------------------------------------------
  */

  const identityMap =
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
      ]
        .map(
          value =>
            String(
              value ?? ''
            )
              .trim()
              .toLowerCase()
        )
        .join('|');


    identityMap.set(
      key,
      (
        identityMap.get(
          key
        ) ??
        0
      ) + 1
    );
  }


  const duplicateIdentities =
    [
      ...identityMap.entries(),
    ]
      .filter(
        ([, count]) =>
          count > 1
      );


  /*
  |--------------------------------------------------------------------------
  | SUMMARY
  |--------------------------------------------------------------------------
  */

  const summary = {

    officialStandardRows:
      officialRows.length,

    mappedRows:
      mappedRows.length,

    unmappedRows:
      officialRows.length -
      mappedRows.length,

    missingCollegeNames:
      missingColleges.size,

    missingBranchMappings:
      missingBranches.size,

    duplicateIdentities:
      duplicateIdentities.length,
  };


  console.log(
    '\nFINAL MAPPING SUMMARY'
  );

  console.table(
    summary
  );


  if (
    missingColleges.size >
    0
  ) {

    console.log(
      '\nMISSING COLLEGES'
    );

    console.table(
      [
        ...missingColleges.entries(),
      ].map(
        ([name, rows]) => ({
          name,
          rows,
        })
      )
    );
  }


  if (
    missingBranches.size >
    0
  ) {

    console.log(
      '\nMISSING BRANCHES'
    );

    console.table(
      [
        ...missingBranches.values(),
      ]
    );
  }


  if (
    mappedRows.length !==
      EXPECTED_TOTAL ||
    missingColleges.size !==
      0 ||
    missingBranches.size !==
      0 ||
    duplicateIdentities.length !==
      0
  ) {
    throw new Error(
      'Final 2024 mapping integrity validation failed.'
    );
  }


  /*
  |--------------------------------------------------------------------------
  | SAVE FINAL IMPORT MAP
  |--------------------------------------------------------------------------
  */

  fs.writeFileSync(
    OUTPUT,
    JSON.stringify(
      {
        generatedAt:
          new Date()
            .toISOString(),

        year:
          2024,

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
    'JOSAA 2024 FINAL IMPORT MAP PASSED'
  );

  console.log(
    '========================================'
  );

  console.log(
    'Official standard rows:',
    officialRows.length
  );

  console.log(
    'Mapped rows:',
    mappedRows.length
  );

  console.log(
    'Unmapped rows:',
    summary.unmappedRows
  );

  console.log(
    'Duplicate identities:',
    summary.duplicateIdentities
  );

  console.log(
    '\nSaved:'
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