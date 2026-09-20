import 'dotenv/config';
import fs from 'node:fs/promises';
import pg from 'pg';

const { Pool } = pg;

const SOURCE_FILE =
  './tmp/csab/combined/csab-2024-2026-all.json';

const MAPPING_FILE =
  './tmp/csab/mapping-audit/program-mappings.json';

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.DB_URL;

if (!connectionString) {
  throw new Error(
    'Database connection string not found.'
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


function normalize(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/\bprogramme\b/g, 'program')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}


function tokens(value = '') {
  return new Set(
    normalize(value)
      .split(' ')
      .filter(
        token =>
          token.length > 1
      )
  );
}


function similarity(a, b) {
  const A =
    tokens(a);

  const B =
    tokens(b);

  if (
    !A.size ||
    !B.size
  ) {
    return 0;
  }

  let intersection =
    0;

  for (
    const token
    of A
  ) {
    if (
      B.has(token)
    ) {
      intersection++;
    }
  }

  const union =
    new Set([
      ...A,
      ...B,
    ]).size;

  return (
    intersection /
    union
  );
}


async function main() {

  const sourceRows =
    JSON.parse(
      await fs.readFile(
        SOURCE_FILE,
        'utf8'
      )
    );

  const mappings =
    JSON.parse(
      await fs.readFile(
        MAPPING_FILE,
        'utf8'
      )
    );


  const unmatched =
    mappings.filter(
      row =>
        row.match_type ===
        'UNMATCHED'
    );


  console.log(
    '\n========================================'
  );

  console.log(
    'CSAB UNMATCHED PROGRAM AUDIT'
  );

  console.log(
    'READ ONLY'
  );

  console.log(
    '========================================'
  );

  console.log(
    'Unmatched unique programs:',
    unmatched.length
  );


  const client =
    await pool.connect();


  try {

    const results =
      [];


    for (
      const mapping
      of unmatched
    ) {

      const affected =
        sourceRows.filter(
          row =>
            row.institute_name ===
              mapping.institute &&
            row.program_name ===
              mapping.program
        );


      const branchResult =
        await client.query(
          `
          SELECT
            id,
            name
          FROM branches
          WHERE college_id = $1
          ORDER BY name
          `,
          [
            mapping.college_id,
          ]
        );


      const ranked =
        branchResult.rows
          .map(
            branch => ({
              branch_id:
                branch.id,

              branch_name:
                branch.name,

              similarity:
                Number(
                  similarity(
                    mapping.program,
                    branch.name
                  ).toFixed(4)
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
            8
          );


      const years =
        [...new Set(
          affected.map(
            row =>
              row.year
          )
        )].sort();


      const rounds =
        [...new Set(
          affected.map(
            row =>
              `${row.year}:${row.round}`
          )
        )].sort();


      results.push({
        institute:
          mapping.institute,

        college_id:
          mapping.college_id,

        source_program:
          mapping.program,

        affected_rows:
          affected.length,

        years,

        rounds,

        candidates:
          ranked,
      });
    }


    /*
    |--------------------------------------------------------------------------
    | Console output
    |--------------------------------------------------------------------------
    */

    for (
      let index = 0;
      index < results.length;
      index++
    ) {

      const item =
        results[index];


      console.log(
        '\n========================================'
      );

      console.log(
        `UNMATCHED ${index + 1}/${results.length}`
      );

      console.log(
        '========================================'
      );

      console.log(
        'Institute:',
        item.institute
      );

      console.log(
        'College ID:',
        item.college_id
      );

      console.log(
        'CSAB Program:',
        item.source_program
      );

      console.log(
        'Affected rows:',
        item.affected_rows
      );

      console.log(
        'Years:',
        item.years.join(', ')
      );

      console.log(
        'Rounds:',
        item.rounds.join(', ')
      );


      console.log(
        '\nClosest existing branches:'
      );

      console.table(
        item.candidates
      );
    }


    /*
    |--------------------------------------------------------------------------
    | Save
    |--------------------------------------------------------------------------
    */

    await fs.writeFile(
      './tmp/csab/mapping-audit/unmatched-program-details.json',

      JSON.stringify(
        results,
        null,
        2
      ),

      'utf8'
    );


    console.log(
      '\n========================================'
    );

    console.log(
      'UNMATCHED PROGRAM AUDIT COMPLETE'
    );

    console.log(
      'NO DATABASE CHANGES MADE'
    );

    console.log(
      '========================================'
    );

    console.log(
      '\nSaved:'
    );

    console.log(
      './tmp/csab/mapping-audit/unmatched-program-details.json'
    );


  } finally {

    client.release();

    await pool.end();
  }
}


main().catch(
  error => {

    console.error(
      '\nAUDIT FAILED'
    );

    console.error(
      error
    );

    process.exitCode = 1;
  }
);
