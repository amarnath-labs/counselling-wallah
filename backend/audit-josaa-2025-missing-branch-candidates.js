import fs from 'node:fs';
import { pool } from './src/db/pool.js';

const INPUT =
  './josaa-2025-import-map.json';


function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}


function tokens(value) {
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
    tokens(a);

  const right =
    tokens(b);

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


if (
  !fs.existsSync(INPUT)
) {
  throw new Error(
    `Missing file: ${INPUT}`
  );
}


const source =
  JSON.parse(
    fs.readFileSync(
      INPUT,
      'utf8'
    )
  );


const missing =
  Array.isArray(
    source.missingBranches
  )
    ? source.missingBranches
    : [];


console.log(
  '\n========================================'
);

console.log(
  'JOSAA 2025 MISSING BRANCH CANDIDATES'
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

    const result =
      await pool.query(
        `
        SELECT
          b.id AS branch_id,
          b.name AS branch_name
        FROM branches b
        WHERE b.college_id = $1
        ORDER BY b.name
        `,
        [
          item.collegeId,
        ]
      );


    const candidates =
      result.rows
        .map(
          branch => ({
            branchId:
              branch.branch_id,

            branchName:
              branch.branch_name,

            similarity:
              similarity(
                item.academicProgram,
                branch.branch_name
              ),
          })
        )
        .sort(
          (a, b) =>
            b.similarity -
            a.similarity
        );


    output.push({
      collegeId:
        item.collegeId,

      college:
        item.dbCollegeName,

      officialProgram:
        item.academicProgram,

      affectedRows:
        item.rows,

      dbBranchCount:
        result.rows.length,

      topCandidates:
        candidates.slice(
          0,
          8
        ),

      allDbBranches:
        result.rows,
    });


    console.log(
      '\n----------------------------------------'
    );

    console.log(
      'College:',
      item.dbCollegeName
    );

    console.log(
      'Official:',
      item.academicProgram
    );

    console.log(
      'Affected rows:',
      item.rows
    );

    console.log(
      'DB branches:',
      result.rows.length
    );


    console.table(
      candidates
        .slice(
          0,
          8
        )
    );
  }


  fs.writeFileSync(
    './josaa-2025-missing-branch-candidates.json',
    JSON.stringify(
      {
        generatedAt:
          new Date()
            .toISOString(),

        readOnly:
          true,

        missingCount:
          missing.length,

        mappings:
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
    'Missing mappings checked:',
    missing.length
  );

  console.log(
    'Saved:'
  );

  console.log(
    './josaa-2025-missing-branch-candidates.json'
  );

  console.log(
    '\nNO DATABASE CHANGES MADE.'
  );

} finally {

  await pool.end();
}