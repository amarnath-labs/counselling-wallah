import fs from 'node:fs';
import { pool } from './src/db/pool.js';

const MAP_2024 =
  './josaa-2024-import-map.json';

const DATA_2025 =
  './josaa-2025-all-rounds-normalized.json';

const DATA_2026 =
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


function canonicalCollege(value) {

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


function tokenSet(value) {

  return new Set(
    normalizeText(value)
      .split(' ')
      .filter(
        token =>
          token.length > 1
      )
  );
}


function similarity(a, b) {

  const left =
    tokenSet(a);

  const right =
    tokenSet(b);

  if (
    left.size === 0 ||
    right.size === 0
  ) {
    return 0;
  }

  let intersection =
    0;

  for (
    const token
    of left
  ) {
    if (
      right.has(token)
    ) {
      intersection += 1;
    }
  }

  const union =
    new Set([
      ...left,
      ...right,
    ]).size;

  return Number(
    (
      intersection /
      union
    ).toFixed(4)
  );
}


function buildYearPrograms(
  source
) {

  const map =
    new Map();

  const rows =
    (source.rows ?? [])
      .filter(
        row =>
          row.rankRecordType === 'STANDARD'
      );


  for (
    const row
    of rows
  ) {

    const collegeKey =
      canonicalCollege(
        row.institute
      );


    if (
      !map.has(
        collegeKey
      )
    ) {
      map.set(
        collegeKey,
        new Map()
      );
    }


    map.get(
      collegeKey
    ).set(
      normalizeText(
        row.academicProgram
      ),
      row.academicProgram
    );
  }

  return map;
}


for (
  const file
  of [
    MAP_2024,
    DATA_2025,
    DATA_2026,
  ]
) {

  if (
    !fs.existsSync(
      file
    )
  ) {
    throw new Error(
      `Missing required file: ${file}`
    );
  }
}


const map2024 =
  JSON.parse(
    fs.readFileSync(
      MAP_2024,
      'utf8'
    )
  );


const source2025 =
  JSON.parse(
    fs.readFileSync(
      DATA_2025,
      'utf8'
    )
  );


const source2026 =
  JSON.parse(
    fs.readFileSync(
      DATA_2026,
      'utf8'
    )
  );


const missing =
  map2024.missingBranches ?? [];


const programs2025 =
  buildYearPrograms(
    source2025
  );


const programs2026 =
  buildYearPrograms(
    source2026
  );


console.log(
  '\n========================================'
);

console.log(
  'JOSAA 2024 MISSING PROGRAM RESOLUTION AUDIT'
);

console.log(
  '========================================\n'
);

console.log(
  'Missing mappings:',
  missing.length
);


try {

  const output =
    [];


  for (
    const item
    of missing
  ) {

    /*
    |--------------------------------------------------------------------------
    | CURRENT DB BRANCHES
    |--------------------------------------------------------------------------
    */

    const dbResult =
      await pool.query(
        `
        SELECT
          id,
          name
        FROM branches
        WHERE college_id = $1
        ORDER BY name
        `,
        [
          item.collegeId,
        ]
      );


    const dbCandidates =
      dbResult.rows
        .map(
          branch => ({
            branchId:
              branch.id,

            branchName:
              branch.name,

            similarity:
              similarity(
                item.academicProgram,
                branch.name
              ),
          })
        )
        .sort(
          (a, b) =>
            b.similarity -
            a.similarity
        );


    /*
    |--------------------------------------------------------------------------
    | 2025 PROGRAMS
    |--------------------------------------------------------------------------
    */

    const collegeKey =
      canonicalCollege(
        item.officialCollege
      );


    const year2025Programs =
      [
        ...(
          programs2025
            .get(
              collegeKey
            )
            ?.values() ??
          []
        ),
      ];


    const exact2025 =
      year2025Programs.find(
        program =>
          normalizeText(
            program
          ) ===
          normalizeText(
            item.academicProgram
          )
      ) ?? null;


    const candidates2025 =
      year2025Programs
        .map(
          program => ({
            program,
            similarity:
              similarity(
                item.academicProgram,
                program
              ),
          })
        )
        .sort(
          (a, b) =>
            b.similarity -
            a.similarity
        )
        .slice(
          0,
          5
        );


    /*
    |--------------------------------------------------------------------------
    | 2026 PROGRAMS
    |--------------------------------------------------------------------------
    */

    const year2026Programs =
      [
        ...(
          programs2026
            .get(
              collegeKey
            )
            ?.values() ??
          []
        ),
      ];


    const exact2026 =
      year2026Programs.find(
        program =>
          normalizeText(
            program
          ) ===
          normalizeText(
            item.academicProgram
          )
      ) ?? null;


    const candidates2026 =
      year2026Programs
        .map(
          program => ({
            program,
            similarity:
              similarity(
                item.academicProgram,
                program
              ),
          })
        )
        .sort(
          (a, b) =>
            b.similarity -
            a.similarity
        )
        .slice(
          0,
          5
        );


    const record = {

      collegeId:
        item.collegeId,

      college:
        item.dbCollegeName,

      program2024:
        item.academicProgram,

      affectedRows:
        item.rows,

      exactSameProgram2025:
        exact2025,

      exactSameProgram2026:
        exact2026,

      topDbCandidates:
        dbCandidates.slice(
          0,
          6
        ),

      top2025Candidates:
        candidates2025,

      top2026Candidates:
        candidates2026,
    };


    output.push(
      record
    );


    console.log(
      '\n----------------------------------------'
    );

    console.log(
      'College:',
      item.dbCollegeName
    );

    console.log(
      '2024 program:',
      item.academicProgram
    );

    console.log(
      'Affected rows:',
      item.rows
    );

    console.log(
      'Exact same in 2025:',
      exact2025 ??
      'NO'
    );

    console.log(
      'Exact same in 2026:',
      exact2026 ??
      'NO'
    );


    console.log(
      '\nCurrent DB candidates'
    );

    console.table(
      dbCandidates.slice(
        0,
        6
      )
    );


    console.log(
      '\n2025 candidates'
    );

    console.table(
      candidates2025
    );


    console.log(
      '\n2026 candidates'
    );

    console.table(
      candidates2026
    );
  }


  fs.writeFileSync(
    './josaa-2024-missing-program-resolution-audit.json',
    JSON.stringify(
      {
        generatedAt:
          new Date()
            .toISOString(),

        readOnly:
          true,

        missingMappings:
          missing.length,

        results:
          output,
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
    'AUDIT COMPLETE'
  );

  console.log(
    '========================================'
  );

  console.log(
    'Mappings checked:',
    missing.length
  );

  console.log(
    'Saved:'
  );

  console.log(
    './josaa-2024-missing-program-resolution-audit.json'
  );

  console.log(
    '\nDATABASE WAS NOT MODIFIED.'
  );


} finally {

  await pool.end();
}