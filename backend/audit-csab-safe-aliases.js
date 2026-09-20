import fs from 'node:fs/promises';

const SOURCE =
  './tmp/csab/combined/csab-2024-2026-all.json';

const MAPPINGS =
  './tmp/csab/mapping-audit/program-mappings.json';

const SAFE_ALIASES = [
  {
    institute:
      'Maulana Azad National Institute of Technology Bhopal',
    program:
      'Materials Science and Metallurgical Engineering (4 Years, Bachelor of Technology)',
    branch_id:
      '424',
  },

  {
    institute:
      'Sardar Vallabhbhai National Institute of Technology, Surat',
    program:
      'Chemistry (5 Years, Integrated Master of Science)',
    branch_id:
      '689',
  },

  {
    institute:
      'Sardar Vallabhbhai National Institute of Technology, Surat',
    program:
      'Mathematics (5 Years, Integrated Master of Science)',
    branch_id:
      '697',
  },

  {
    institute:
      'Sardar Vallabhbhai National Institute of Technology, Surat',
    program:
      'Physics (5 Years, Integrated Master of Science)',
    branch_id:
      '700',
  },

  {
    institute:
      'Indian Institute of Information Technology(IIIT) Kilohrad, Sonepat, Haryana',
    program:
      'CSE ( Data Science & Analytics) (4 Years, Bachelor of Technology)',
    branch_id:
      '752',
  },

  {
    institute:
      'National Institute of Advanced Manufacturing Technology, Ranchi',
    program:
      'Metallurgy and Materials Engineering (4 Years, Bachelor of Technology)',
    branch_id:
      '906',
  },
];


function key(
  institute,
  program
) {
  return `${institute}|||${program}`;
}


async function main() {

  const rows =
    JSON.parse(
      await fs.readFile(
        SOURCE,
        'utf8'
      )
    );

  const mappings =
    JSON.parse(
      await fs.readFile(
        MAPPINGS,
        'utf8'
      )
    );


  const map =
    new Map(
      mappings.map(
        item => [
          key(
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
  | Apply ONLY explicitly approved aliases
  |--------------------------------------------------------------------------
  */

  for (
    const alias
    of SAFE_ALIASES
  ) {

    const aliasKey =
      key(
        alias.institute,
        alias.program
      );

    const current =
      map.get(
        aliasKey
      );


    if (!current) {
      throw new Error(
        `Alias source mapping missing: ${aliasKey}`
      );
    }


    if (
      current.match_type !==
      'UNMATCHED'
    ) {
      throw new Error(
        `Expected UNMATCHED before alias: ${aliasKey}`
      );
    }


    map.set(
      aliasKey,
      {
        ...current,

        branch_id:
          alias.branch_id,

        match_type:
          'MANUAL_ALIAS_SAFE',

        alias_reason:
          'Historical CSAB naming variant mapped to existing college-scoped branch',
      }
    );
  }


  let mappedRows = 0;

  let remainingRows = 0;


  const remainingPrograms =
    new Map();


  for (
    const row
    of rows
  ) {

    const mapping =
      map.get(
        key(
          row.institute_name,
          row.program_name
        )
      );


    if (
      mapping?.branch_id
    ) {
      mappedRows++;
      continue;
    }


    remainingRows++;


    const remainingKey =
      key(
        row.institute_name,
        row.program_name
      );


    if (
      !remainingPrograms.has(
        remainingKey
      )
    ) {

      remainingPrograms.set(
        remainingKey,
        {
          institute:
            row.institute_name,

          program:
            row.program_name,

          affected_rows:
            0,

          years:
            new Set(),
        }
      );
    }


    const item =
      remainingPrograms.get(
        remainingKey
      );


    item.affected_rows++;

    item.years.add(
      row.year
    );
  }


  const remaining =
    [...remainingPrograms.values()]
      .map(
        item => ({
          ...item,

          years:
            [...item.years]
              .sort(),
        })
      );


  const updatedMappings =
    [...map.values()];


  await fs.writeFile(
    './tmp/csab/mapping-audit/program-mappings-with-safe-aliases.json',

    JSON.stringify(
      updatedMappings,
      null,
      2
    ),

    'utf8'
  );


  await fs.writeFile(
    './tmp/csab/mapping-audit/remaining-unmatched-after-safe-aliases.json',

    JSON.stringify(
      remaining,
      null,
      2
    ),

    'utf8'
  );


  console.log(
    '\n========================================'
  );

  console.log(
    'CSAB SAFE ALIAS AUDIT'
  );

  console.log(
    '========================================'
  );

  console.log(
    'Total rows:',
    rows.length
  );

  console.log(
    'Mapped rows:',
    mappedRows
  );

  console.log(
    'Remaining unmapped rows:',
    remainingRows
  );

  console.log(
    'Coverage %:',
    (
      mappedRows /
      rows.length *
      100
    ).toFixed(2)
  );

  console.log(
    'Remaining unique programs:',
    remaining.length
  );


  console.log(
    '\n===== REMAINING REVIEW ====='
  );

  console.table(
    remaining
  );


  console.log(
    '\nExpected remaining:'
  );

  console.log(
    'BIT Mesra AI/ML'
  );

  console.log(
    'BIT Patna AI/ML'
  );


  console.log(
    '\nNO DATABASE CHANGES MADE'
  );
}


main().catch(
  error => {

    console.error(
      '\nSAFE ALIAS AUDIT FAILED'
    );

    console.error(
      error
    );

    process.exitCode = 1;
  }
);
