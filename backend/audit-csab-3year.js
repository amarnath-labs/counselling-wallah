import fs from 'node:fs/promises';

const YEARS =
  [2026, 2025, 2024];

function fileFor(year) {
  return (
    `./tmp/csab/raw/${year}/` +
    `csab-${year}-all-rounds.json`
  );
}

function identity(row) {
  return [
    row.year,
    row.round,
    row.institute_name,
    row.program_name,
    row.quota,
    row.category,
    row.gender,
  ].join('|||');
}

function sameCutoffIdentity(row) {
  return [
    row.year,
    row.round,
    row.institute_name,
    row.program_name,
    row.quota,
    row.category,
    row.gender,
    row.opening_rank,
    row.closing_rank,
  ].join('|||');
}

async function main() {

  const all = [];

  const yearSummary = [];

  for (const year of YEARS) {

    const path =
      fileFor(year);

    const raw =
      await fs.readFile(
        path,
        'utf8'
      );

    const rows =
      JSON.parse(raw);

    console.log(
      `Loaded ${year}:`,
      rows.length
    );

    all.push(
      ...rows
    );

    const rounds =
      [...new Set(
        rows.map(
          row => row.round
        )
      )].sort();

    yearSummary.push({
      year,
      rows:
        rows.length,

      rounds:
        rounds.join(', '),

      institutes:
        new Set(
          rows.map(
            row =>
              row.institute_name
          )
        ).size,

      programs:
        new Set(
          rows.map(
            row =>
              row.program_name
          )
        ).size,

      missingOpening:
        rows.filter(
          row =>
            row.opening_rank == null
        ).length,

      missingClosing:
        rows.filter(
          row =>
            row.closing_rank == null
        ).length,
    });
  }


  /*
  |--------------------------------------------------------------------------
  | CROSS-DATASET DUPLICATE AUDIT
  |--------------------------------------------------------------------------
  */

  const seenIdentity =
    new Map();

  const duplicateIdentity =
    [];

  for (const row of all) {

    const key =
      identity(row);

    if (
      seenIdentity.has(key)
    ) {
      duplicateIdentity.push({
        key,
        first:
          seenIdentity.get(key),
        duplicate:
          row,
      });
    } else {
      seenIdentity.set(
        key,
        row
      );
    }
  }


  /*
  |--------------------------------------------------------------------------
  | EXACT DUPLICATES
  |--------------------------------------------------------------------------
  */

  const exactSeen =
    new Set();

  const exactDuplicates =
    [];

  for (const row of all) {

    const key =
      sameCutoffIdentity(
        row
      );

    if (
      exactSeen.has(key)
    ) {
      exactDuplicates.push(
        row
      );
    } else {
      exactSeen.add(
        key
      );
    }
  }


  /*
  |--------------------------------------------------------------------------
  | DATA QUALITY
  |--------------------------------------------------------------------------
  */

  const invalidRanks =
    all.filter(
      row =>
        !Number.isFinite(
          row.opening_rank
        ) ||
        !Number.isFinite(
          row.closing_rank
        ) ||
        row.opening_rank <= 0 ||
        row.closing_rank <= 0
    );


  const reversedRanks =
    all.filter(
      row =>
        row.opening_rank >
        row.closing_rank
    );


  const dasaContamination =
    all.filter(
      row =>
        row.counselling_type !==
          'CSAB' ||
        /\bDASA\b/i.test(
          row.program_name || ''
        ) ||
        /\bDASA\b/i.test(
          row.quota || ''
        )
    );


  const missingCore =
    all.filter(
      row =>
        !row.institute_name ||
        !row.program_name ||
        !row.round ||
        !row.quota ||
        !row.category ||
        !row.gender
    );


  /*
  |--------------------------------------------------------------------------
  | GLOBAL COVERAGE
  |--------------------------------------------------------------------------
  */

  const institutes =
    [...new Set(
      all.map(
        row =>
          row.institute_name
      )
    )].sort();


  const programs =
    [...new Set(
      all.map(
        row =>
          row.program_name
      )
    )].sort();


  const quotas =
    [...new Set(
      all.map(
        row =>
          row.quota
      )
    )].sort();


  const categories =
    [...new Set(
      all.map(
        row =>
          row.category
      )
    )].sort();


  const genders =
    [...new Set(
      all.map(
        row =>
          row.gender
      )
    )].sort();


  /*
  |--------------------------------------------------------------------------
  | SAVE
  |--------------------------------------------------------------------------
  */

  await fs.mkdir(
    './tmp/csab/combined',
    {
      recursive: true,
    }
  );


  await fs.writeFile(
    './tmp/csab/combined/csab-2024-2026-all.json',

    JSON.stringify(
      all,
      null,
      2
    ),

    'utf8'
  );


  await fs.writeFile(
    './tmp/csab/combined/cross-year-duplicates.json',

    JSON.stringify(
      duplicateIdentity,
      null,
      2
    ),

    'utf8'
  );


  await fs.writeFile(
    './tmp/csab/combined/exact-duplicates.json',

    JSON.stringify(
      exactDuplicates,
      null,
      2
    ),

    'utf8'
  );


  await fs.writeFile(
    './tmp/csab/combined/invalid-ranks.json',

    JSON.stringify(
      invalidRanks,
      null,
      2
    ),

    'utf8'
  );


  await fs.writeFile(
    './tmp/csab/combined/reversed-ranks.json',

    JSON.stringify(
      reversedRanks,
      null,
      2
    ),

    'utf8'
  );


  await fs.writeFile(
    './tmp/csab/combined/dasa-contamination.json',

    JSON.stringify(
      dasaContamination,
      null,
      2
    ),

    'utf8'
  );


  await fs.writeFile(
    './tmp/csab/combined/missing-core-fields.json',

    JSON.stringify(
      missingCore,
      null,
      2
    ),

    'utf8'
  );


  const summary = {
    years:
      YEARS,

    total_rows:
      all.length,

    unique_institutes:
      institutes.length,

    unique_programs:
      programs.length,

    cross_year_identity_duplicates:
      duplicateIdentity.length,

    exact_duplicates:
      exactDuplicates.length,

    invalid_ranks:
      invalidRanks.length,

    reversed_opening_closing:
      reversedRanks.length,

    dasa_contamination:
      dasaContamination.length,

    missing_core_fields:
      missingCore.length,

    quotas,

    categories,

    genders,
  };


  await fs.writeFile(
    './tmp/csab/combined/audit-summary.json',

    JSON.stringify(
      {
        summary,
        yearSummary,
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
    'CSAB 3-YEAR AUDIT'
  );

  console.log(
    '========================================'
  );


  console.table(
    yearSummary
  );


  console.log(
    '\nGLOBAL SUMMARY'
  );

  console.log(
    'Total rows:',
    summary.total_rows
  );

  console.log(
    'Unique institutes:',
    summary.unique_institutes
  );

  console.log(
    'Unique programs:',
    summary.unique_programs
  );

  console.log(
    'Identity duplicates:',
    summary.cross_year_identity_duplicates
  );

  console.log(
    'Exact duplicates:',
    summary.exact_duplicates
  );

  console.log(
    'Invalid ranks:',
    summary.invalid_ranks
  );

  console.log(
    'Opening > Closing:',
    summary.reversed_opening_closing
  );

  console.log(
    'DASA contamination:',
    summary.dasa_contamination
  );

  console.log(
    'Missing core fields:',
    summary.missing_core_fields
  );


  console.log(
    '\nQuotas:'
  );

  console.log(
    quotas
  );


  console.log(
    '\nCategories:'
  );

  console.log(
    categories
  );


  console.log(
    '\nGenders:'
  );

  console.log(
    genders
  );


  console.log(
    '\nCombined dataset:'
  );

  console.log(
    './tmp/csab/combined/csab-2024-2026-all.json'
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
