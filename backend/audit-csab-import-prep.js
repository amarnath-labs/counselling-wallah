import 'dotenv/config';
import fs from 'node:fs/promises';
import pg from 'pg';

const { Pool } = pg;

const SOURCE =
  './tmp/csab/combined/csab-2024-2026-all.json';

const BASE_MAPPINGS =
  './tmp/csab/mapping-audit/program-mappings-with-safe-aliases.json';

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


/*
|--------------------------------------------------------------------------
| FINAL TWO VERIFIED HISTORICAL ALIASES
|--------------------------------------------------------------------------
*/

const FINAL_ALIASES = [
  {
    institute:
      'Birla Institute of Technology, Mesra, Ranchi',

    program:
      'Artificial Intelligence and Machine Learning (4 Years, Bachelor of Technology)',

    branch_id:
      '871',

    reason:
      '2024/2025 historical label transitions to 2026 CSE (AI/ML) label',
  },

  {
    institute:
      'Birla Institute of Technology, Patna Off-Campus',

    program:
      'Artificial Intelligence and Machine Learning (4 Years, Bachelor of Technology)',

    branch_id:
      '1047',

    reason:
      '2024/2025 historical label transitions to 2026 CSE (AI/ML) label',
  },
];


function mappingKey(
  institute,
  program
) {
  return `${institute}|||${program}`;
}


function normalizeRound(value) {

  const text =
    String(value || '')
      .trim();

  const match =
    text.match(
      /(\d+)\s*$/
    );

  if (!match) {
    throw new Error(
      `Cannot normalize round: ${value}`
    );
  }

  return match[1];
}


function normalizeQuota(value) {

  const raw =
    String(value || '')
      .trim();


  const map = new Map([
    ['AI', 'All India'],
    ['All India', 'All India'],

    ['HS', 'Home State'],
    ['Home State', 'Home State'],

    ['OS', 'Other State'],
    ['Other State', 'Other State'],

    ['JK', 'Jammu & Kashmir (UT)'],
    ['Jammu & Kashmir (UT)', 'Jammu & Kashmir (UT)'],

    ['LA', 'Ladakh (UT)'],
    ['Ladakh (UT)', 'Ladakh (UT)'],

    ['GO', 'Home State for Goa'],
    ['Home State for Goa', 'Home State for Goa'],
  ]);


  return (
    map.get(raw) ||
    raw
  );
}


function cutoffKey(row) {

  return [
    String(row.branch_id),
    Number(row.year),
    String(row.round),
    String(row.category),
    String(row.quota),
    String(row.gender),
    'CSAB_SPECIAL',
  ].join('|||');
}


async function main() {

  const sourceRows =
    JSON.parse(
      await fs.readFile(
        SOURCE,
        'utf8'
      )
    );


  const mappings =
    JSON.parse(
      await fs.readFile(
        BASE_MAPPINGS,
        'utf8'
      )
    );


  const mappingMap =
    new Map(
      mappings.map(
        item => [
          mappingKey(
            item.institute,
            item.program
          ),
          {
            ...item,
          },
        ]
      )
    );


  /*
  |--------------------------------------------------------------------------
  | Add final BIT aliases
  |--------------------------------------------------------------------------
  */

  for (
    const alias
    of FINAL_ALIASES
  ) {

    const key =
      mappingKey(
        alias.institute,
        alias.program
      );


    const current =
      mappingMap.get(
        key
      );


    if (!current) {
      throw new Error(
        `BIT mapping missing: ${key}`
      );
    }


    mappingMap.set(
      key,
      {
        ...current,

        branch_id:
          alias.branch_id,

        match_type:
          'MANUAL_ALIAS_VERIFIED',

        alias_reason:
          alias.reason,
      }
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Build import-ready rows
  |--------------------------------------------------------------------------
  */

  const prepared =
    [];


  const unmapped =
    [];


  for (
    const row
    of sourceRows
  ) {

    const mapping =
      mappingMap.get(
        mappingKey(
          row.institute_name,
          row.program_name
        )
      );


    if (
      !mapping?.branch_id
    ) {

      unmapped.push(
        row
      );

      continue;
    }


    prepared.push({
      branch_id:
        String(
          mapping.branch_id
        ),

      year:
        Number(
          row.year
        ),

      round:
        normalizeRound(
          row.round
        ),

      category:
        row.category,

      quota:
        normalizeQuota(
          row.quota
        ),

      gender:
        row.gender,

      opening_rank:
        Number(
          row.opening_rank
        ),

      closing_rank:
        Number(
          row.closing_rank
        ),

      counselling_type:
        'CSAB_SPECIAL',

      source_label:
        row.source_label,

      source_url:
        row.source_url,

      is_verified:
        true,

      verification_status:
        'VERIFIED',

      original_institute_name:
        row.institute_name,

      original_program_name:
        row.program_name,

      original_quota:
        row.quota,

      mapping_type:
        mapping.match_type,
    });
  }


  console.log(
    '\n========================================'
  );

  console.log(
    'CSAB FINAL IMPORT PREP AUDIT'
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

  console.log(
    'Prepared rows:',
    prepared.length
  );

  console.log(
    'Unmapped rows:',
    unmapped.length
  );


  /*
  |--------------------------------------------------------------------------
  | Internal duplicate audit AFTER normalization
  |--------------------------------------------------------------------------
  */

  const seen =
    new Map();

  const normalizedDuplicates =
    [];


  for (
    const row
    of prepared
  ) {

    const key =
      cutoffKey(
        row
      );


    if (
      seen.has(key)
    ) {

      normalizedDuplicates.push({
        key,

        first:
          seen.get(key),

        duplicate:
          row,
      });

    } else {

      seen.set(
        key,
        row
      );
    }
  }


  console.log(
    'Duplicates after normalization:',
    normalizedDuplicates.length
  );


  /*
  |--------------------------------------------------------------------------
  | Year counts
  |--------------------------------------------------------------------------
  */

  const yearCounts =
    prepared.reduce(
      (acc, row) => {

        acc[row.year] =
          (
            acc[row.year] ||
            0
          ) + 1;

        return acc;
      },
      {}
    );


  console.log(
    '\n===== PREPARED BY YEAR ====='
  );

  console.table(
    yearCounts
  );


  /*
  |--------------------------------------------------------------------------
  | Database comparison
  |--------------------------------------------------------------------------
  */

  const client =
    await pool.connect();


  try {

    const existingResult =
      await client.query(
        `
        SELECT
          branch_id::text,
          year,
          round,
          category,
          quota,
          gender,
          opening_rank,
          closing_rank,
          counselling_type
        FROM cutoffs
        WHERE counselling_type =
          'CSAB_SPECIAL'
        `
      );


    const existing =
      new Map();


    for (
      const row
      of existingResult.rows
    ) {

      existing.set(
        cutoffKey(
          row
        ),
        row
      );
    }


    let alreadyExists =
      0;

    let newRows =
      0;

    let conflictingRows =
      0;


    const conflicts =
      [];


    for (
      const row
      of prepared
    ) {

      const key =
        cutoffKey(
          row
        );


      const current =
        existing.get(
          key
        );


      if (!current) {

        newRows++;

        continue;
      }


      const sameRanks =
        Number(
          current.opening_rank
        ) ===
          Number(
            row.opening_rank
          ) &&
        Number(
          current.closing_rank
        ) ===
          Number(
            row.closing_rank
          );


      if (
        sameRanks
      ) {

        alreadyExists++;

      } else {

        conflictingRows++;


        conflicts.push({
          key,

          source: {
            opening_rank:
              row.opening_rank,

            closing_rank:
              row.closing_rank,
          },

          database: {
            opening_rank:
              current.opening_rank,

            closing_rank:
              current.closing_rank,
          },
        });
      }
    }


    console.log(
      '\n===== DATABASE COMPARISON ====='
    );

    console.log(
      'Existing exact rows:',
      alreadyExists
    );

    console.log(
      'New rows:',
      newRows
    );

    console.log(
      'Conflicting existing rows:',
      conflictingRows
    );


    /*
    |--------------------------------------------------------------------------
    | Expected import rows should only be 2025 + 2024
    |--------------------------------------------------------------------------
    */

    const newByYear =
      {};


    for (
      const row
      of prepared
    ) {

      if (
        existing.has(
          cutoffKey(row)
        )
      ) {
        continue;
      }


      newByYear[row.year] =
        (
          newByYear[row.year] ||
          0
        ) + 1;
    }


    console.log(
      '\n===== NEW ROWS BY YEAR ====='
    );

    console.table(
      newByYear
    );


    /*
    |--------------------------------------------------------------------------
    | Save artifacts
    |--------------------------------------------------------------------------
    */

    const outputDir =
      './tmp/csab/import-prep';


    await fs.mkdir(
      outputDir,
      {
        recursive: true,
      }
    );


    await fs.writeFile(
      `${outputDir}/csab-import-ready.json`,

      JSON.stringify(
        prepared,
        null,
        2
      ),

      'utf8'
    );


    await fs.writeFile(
      `${outputDir}/conflicts.json`,

      JSON.stringify(
        conflicts,
        null,
        2
      ),

      'utf8'
    );


    await fs.writeFile(
      `${outputDir}/duplicates-after-normalization.json`,

      JSON.stringify(
        normalizedDuplicates,
        null,
        2
      ),

      'utf8'
    );


    await fs.writeFile(
      `${outputDir}/unmapped.json`,

      JSON.stringify(
        unmapped,
        null,
        2
      ),

      'utf8'
    );


    const summary = {
      source_rows:
        sourceRows.length,

      prepared_rows:
        prepared.length,

      unmapped_rows:
        unmapped.length,

      normalized_duplicates:
        normalizedDuplicates.length,

      prepared_by_year:
        yearCounts,

      existing_exact_rows:
        alreadyExists,

      new_rows:
        newRows,

      conflicting_existing_rows:
        conflictingRows,

      new_rows_by_year:
        newByYear,
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
      '\n========================================'
    );

    console.log(
      'IMPORT PREP AUDIT COMPLETE'
    );

    console.log(
      'NO DATABASE CHANGES MADE'
    );

    console.log(
      '========================================'
    );


    console.log(
      '\nSaved under:'
    );

    console.log(
      outputDir
    );

  } finally {

    client.release();

    await pool.end();
  }
}


main().catch(
  error => {

    console.error(
      '\nIMPORT PREP AUDIT FAILED'
    );

    console.error(
      error
    );

    process.exitCode = 1;
  }
);
