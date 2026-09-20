import fs from 'node:fs/promises';

const INPUT =
  './fee-priority-current-source-extraction.json';

const OUTPUT =
  './fee-priority-normalized-preview.json';

const REVIEW_OUTPUT =
  './fee-priority-normalization-review.json';


/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function moneyValues(value) {
  const text =
    String(value ?? '');

  const matches =
    text.match(
      /\d{1,3}(?:,\d{2,3})+(?:\/-)?|\d{3,6}(?:\/-)?/g
    ) || [];

  const output = [];

  for (
    const match
    of matches
  ) {
    const number =
      Number(
        match
          .replace(/\/-/g, '')
          .replace(/,/g, '')
      );

    if (
      !Number.isFinite(number)
    ) {
      continue;
    }

    if (
      number >= 2000 &&
      number <= 2100
    ) {
      continue;
    }

    if (
      number < 100 ||
      number > 2000000
    ) {
      continue;
    }

    output.push(number);
  }

  return output;
}


function firstTwoAmounts(line) {
  const values =
    moneyValues(line);

  if (
    values.length < 2
  ) {
    return [
      null,
      null
    ];
  }

  return [
    values[0],
    values[1]
  ];
}


function getLine(
  lines,
  matcher
) {
  return (
    lines.find(
      line =>
        matcher.test(
          String(line)
        )
    ) ||
    null
  );
}


function getLines(
  lines,
  matcher
) {
  return lines.filter(
    line =>
      matcher.test(
        String(line)
      )
  );
}


function safeSum(values) {
  const usable =
    values.filter(
      value =>
        Number.isFinite(value)
    );

  if (
    usable.length === 0
  ) {
    return null;
  }

  return usable.reduce(
    (sum, value) =>
      sum + value,
    0
  );
}


function approximatelyEqual(
  a,
  b,
  tolerance = 2
) {
  if (
    !Number.isFinite(a) ||
    !Number.isFinite(b)
  ) {
    return false;
  }

  return (
    Math.abs(
      a - b
    ) <= tolerance
  );
}


/*
|--------------------------------------------------------------------------
| SOURCE CLASSIFIER
|--------------------------------------------------------------------------
*/

function detectTemplate(row) {
  const text =
    String(
      row.raw_text ||
      row.text ||
      ''
    ).toLowerCase();

  if (
    text.includes(
      'ashoka institute of technology'
    ) &&
    text.includes(
      'fee structure 2026-2027'
    )
  ) {
    return 'MULTI_COLUMN_BTECH_YEAR_TABLE';
  }

  return 'UNKNOWN';
}


/*
|--------------------------------------------------------------------------
| ASHOKA-LIKE MULTI-COLUMN BTECH TABLE
|--------------------------------------------------------------------------
|
| Important:
|
| We are NOT hard-coding the fee amounts.
|
| We read the first two fee columns dynamically from:
|
| Tuition Fee
| Development / other institute charges
| Skills Fee
| Registration Fee
| Caution Money
| Total Fee
|
| The first two columns in this source are the two B.Tech groups.
|--------------------------------------------------------------------------
*/

function normalizeMultiColumnBtech(
  row
) {
  const lines =
    Array.isArray(
      row.lines
    )
      ? row.lines
      : [];

  const errors = [];

  if (
    lines.length === 0
  ) {
    return {
      status:
        'REVIEW',

      errors: [
        'No extracted PDF lines.'
      ],

      normalized:
        null
    };
  }


  /*
  |--------------------------------------------------------------------------
  | BTECH GROUPS
  |--------------------------------------------------------------------------
  */

  const branchGroups = [
    {
      group_id:
        'btech-cse-ai-ml-data-science',

      label:
        'B.Tech - CSE / AI&ML / Data Science',

      branches: [
        'Computer Science and Engineering',
        'Artificial Intelligence and Machine Learning',
        'Data Science'
      ],

      source_column:
        0
    },

    {
      group_id:
        'btech-core-engineering-biotech',

      label:
        'B.Tech - CE / EE / ECE / ME / Biotechnology',

      branches: [
        'Civil Engineering',
        'Electrical Engineering',
        'Electronics and Communication Engineering',
        'Mechanical Engineering',
        'Biotechnology'
      ],

      source_column:
        1
    }
  ];


  /*
  |--------------------------------------------------------------------------
  | LOCATE YEAR SECTIONS
  |--------------------------------------------------------------------------
  */

  const tuitionLines =
    getLines(
      lines,
      /tuition fee/i
    );

  const totalLines =
    getLines(
      lines,
      /total fee/i
    );

  const skillsLines =
    getLines(
      lines,
      /skills fee/i
    );

  /*
  | Development charges are sometimes split across several text lines.
  | The numeric amount appears on the following line.
  */

  const developmentAmountLines =
    [];

  for (
    let i = 0;
    i < lines.length;
    i++
  ) {
    const line =
      String(
        lines[i]
      );

    if (
      !/fee etc\.|etc\.$/i.test(
        line
      )
    ) {
      continue;
    }

    const next =
      lines[i + 1];

    if (
      next &&
      moneyValues(next).length >= 2
    ) {
      developmentAmountLines.push(
        next
      );
    }
  }


  /*
  |--------------------------------------------------------------------------
  | YEAR-I ONE-TIME FEES
  |--------------------------------------------------------------------------
  */

  const registrationLine =
    getLine(
      lines,
      /registration fee/i
    );

  const cautionLine =
    getLine(
      lines,
      /caution money/i
    );

  const [
    registrationGroup1,
    registrationGroup2
  ] =
    registrationLine
      ? firstTwoAmounts(
          registrationLine
        )
      : [
          null,
          null
        ];

  const [
    cautionGroup1,
    cautionGroup2
  ] =
    cautionLine
      ? firstTwoAmounts(
          cautionLine
        )
      : [
          null,
          null
        ];


  /*
  |--------------------------------------------------------------------------
  | EXPECT FOUR BTECH YEARS
  |--------------------------------------------------------------------------
  */

  if (
    tuitionLines.length < 4
  ) {
    errors.push(
      `Expected at least 4 tuition rows, found ${tuitionLines.length}.`
    );
  }

  if (
    totalLines.length < 4
  ) {
    errors.push(
      `Expected at least 4 total rows, found ${totalLines.length}.`
    );
  }

  if (
    skillsLines.length < 4
  ) {
    errors.push(
      `Expected at least 4 skills rows, found ${skillsLines.length}.`
    );
  }

  if (
    developmentAmountLines.length < 4
  ) {
    errors.push(
      `Expected at least 4 development amount rows, found ${developmentAmountLines.length}.`
    );
  }

  if (
    errors.length > 0
  ) {
    return {
      status:
        'REVIEW',

      errors,

      normalized:
        null
    };
  }


  /*
  |--------------------------------------------------------------------------
  | BUILD YEAR RECORDS
  |--------------------------------------------------------------------------
  */

  const variants = [];

  for (
    let yearIndex = 0;
    yearIndex < 4;
    yearIndex++
  ) {
    const yearOfStudy =
      yearIndex + 1;

    const tuition =
      firstTwoAmounts(
        tuitionLines[
          yearIndex
        ]
      );

    const development =
      firstTwoAmounts(
        developmentAmountLines[
          yearIndex
        ]
      );

    const skills =
      firstTwoAmounts(
        skillsLines[
          yearIndex
        ]
      );

    const totals =
      firstTwoAmounts(
        totalLines[
          yearIndex
        ]
      );


    for (
      let groupIndex = 0;
      groupIndex < 2;
      groupIndex++
    ) {
      const group =
        branchGroups[
          groupIndex
        ];

      const tuitionFee =
        tuition[
          groupIndex
        ];

      const instituteFee =
        development[
          groupIndex
        ];

      const trainingFee =
        skills[
          groupIndex
        ];

      const registrationFee =
        yearOfStudy === 1
          ? (
              groupIndex === 0
                ? registrationGroup1
                : registrationGroup2
            )
          : null;

      const cautionDeposit =
        yearOfStudy === 1
          ? (
              groupIndex === 0
                ? cautionGroup1
                : cautionGroup2
            )
          : null;

      const sourceTotal =
        totals[
          groupIndex
        ];

      const calculatedTotal =
        safeSum([
          tuitionFee,
          instituteFee,
          trainingFee,
          registrationFee,
          cautionDeposit
        ]);

      const totalMatches =
        approximatelyEqual(
          calculatedTotal,
          sourceTotal
        );

      variants.push({
        program:
          'B.Tech',

        branch_group_id:
          group.group_id,

        branch_group_label:
          group.label,

        branches:
          group.branches,

        academic_year:
          row.academic_year,

        year_of_study:
          yearOfStudy,

        fee_period:
          'annual',

        student_category:
          'GENERAL',

        residence_type:
          'day_scholar',

        tuition_fee:
          tuitionFee,

        registration_fee:
          registrationFee,

        institute_fee:
          instituteFee,

        training_placement_fee:
          trainingFee,

        caution_deposit:
          cautionDeposit,

        exam_fee:
          null,

        hostel_fee:
          null,

        mess_fee:
          null,

        source_total_fee:
          sourceTotal,

        calculated_total_fee:
          calculatedTotal,

        total_fee:
          sourceTotal,

        total_validation:
          totalMatches
            ? 'MATCH'
            : 'MISMATCH',

        is_one_time_included:
          yearOfStudy === 1,

        verification_status:
          totalMatches
            ? 'verified'
            : 'review'
      });
    }
  }


  /*
  |--------------------------------------------------------------------------
  | VALIDATE EVERY TOTAL
  |--------------------------------------------------------------------------
  */

  const mismatches =
    variants.filter(
      variant =>
        variant.total_validation !==
        'MATCH'
    );

  if (
    mismatches.length > 0
  ) {
    errors.push(
      `${mismatches.length} normalized totals do not match source totals.`
    );
  }


  /*
  |--------------------------------------------------------------------------
  | FINAL NORMALIZED COLLEGE
  |--------------------------------------------------------------------------
  */

  return {
    status:
      errors.length === 0
        ? 'AUTO_READY'
        : 'REVIEW',

    errors,

    normalized: {
      college_id:
        row.college_id,

      college_name:
        row.college_name,

      academic_year:
        row.academic_year,

      program:
        'B.Tech',

      source_url:
        row.source_url,

      official_website:
        row.official_website ||
        null,

      source_type:
        row.source_type,

      source_official:
        true,

      hostel_available_in_source:
        false,

      mess_available_in_source:
        false,

      exam_fee_note:
        'Exam fee payable directly to university; amount not stated in source.',

      branch_groups:
        branchGroups,

      fee_variants:
        variants,

      normalization_status:
        errors.length === 0
          ? 'AUTO_READY'
          : 'REVIEW'
    }
  };
}


/*
|--------------------------------------------------------------------------
| NORMALIZER ROUTER
|--------------------------------------------------------------------------
*/

function normalizeRow(row) {
  if (
    row.extraction_status !==
    'EXTRACTED'
  ) {
    return {
      status:
        'REVIEW',

      errors: [
        `Extraction status is ${row.extraction_status}.`
      ],

      normalized:
        null
    };
  }

  const template =
    detectTemplate(
      row
    );

  if (
    template ===
    'MULTI_COLUMN_BTECH_YEAR_TABLE'
  ) {
    return normalizeMultiColumnBtech(
      row
    );
  }

  return {
    status:
      'REVIEW',

    errors: [
      'No compatible normalization template detected.'
    ],

    normalized:
      null
  };
}


/*
|--------------------------------------------------------------------------
| MAIN
|--------------------------------------------------------------------------
*/

async function main() {
  console.log('');

  console.log(
    '======================================='
  );

  console.log(
    'GENERIC FEE NORMALIZER V3'
  );

  console.log(
    '======================================='
  );

  console.log('');

  const raw =
    await fs.readFile(
      INPUT,
      'utf8'
    );

  const extracted =
    JSON.parse(
      raw.replace(
        /^\uFEFF/,
        ''
      )
    );

  if (
    !Array.isArray(
      extracted
    )
  ) {
    throw new Error(
      'Extraction input must be an array.'
    );
  }

  const ready = [];

  const review = [];


  for (
    const row
    of extracted
  ) {
    const result =
      normalizeRow(
        row
      );

    if (
      result.status ===
        'AUTO_READY' &&
      result.normalized
    ) {
      ready.push(
        result.normalized
      );

    } else {
      review.push({
        college_id:
          row.college_id,

        college_name:
          row.college_name,

        errors:
          result.errors
      });
    }
  }


  await fs.writeFile(
    OUTPUT,

    JSON.stringify(
      ready,
      null,
      2
    ),

    'utf8'
  );


  await fs.writeFile(
    REVIEW_OUTPUT,

    JSON.stringify(
      review,
      null,
      2
    ),

    'utf8'
  );


  console.log(
    'NORMALIZATION SUMMARY'
  );

  console.table(
    ready.map(
      college => ({
        college:
          college.college_name,

        year:
          college.academic_year,

        branch_groups:
          college.branch_groups.length,

        variants:
          college.fee_variants.length,

        verified:
          college.fee_variants.filter(
            row =>
              row.verification_status ===
              'verified'
          ).length,

        status:
          college.normalization_status
      })
    )
  );


  console.log('');

  console.log(
    'FEE VARIANTS'
  );


  for (
    const college
    of ready
  ) {
    console.log('');

    console.log(
      college.college_name
    );

    console.table(
      college.fee_variants.map(
        row => ({
          group:
            row.branch_group_label,

          year:
            row.year_of_study,

          tuition:
            row.tuition_fee,

          registration:
            row.registration_fee,

          institute:
            row.institute_fee,

          training:
            row.training_placement_fee,

          caution:
            row.caution_deposit,

          total:
            row.total_fee,

          calculated:
            row.calculated_total_fee,

          validation:
            row.total_validation
        })
      )
    );
  }


  console.log('');

  console.log(
    'AUTO READY:',
    ready.length
  );

  console.log(
    'REVIEW:',
    review.length
  );

  console.log('');

  console.log(
    'Saved:',
    OUTPUT
  );

  console.log(
    'Saved:',
    REVIEW_OUTPUT
  );

  console.log('');

  console.log(
    'DATABASE HAS NOT BEEN MODIFIED.'
  );
}


main().catch(
  error => {
    console.error(
      'FAILED:',
      error.message
    );

    process.exitCode = 1;
  }
);