import fs from 'node:fs/promises';

const INPUT =
  './fee-pilot-batch-01-normalized-preview-v2.json';

const OUTPUT =
  './fee-pilot-batch-01-validated.json';

const FAILED_OUTPUT =
  './fee-pilot-batch-01-validation-failed.json';

function validYear(year) {
  return (
    Number.isInteger(year) &&
    year >= 2025 &&
    year <= 2027
  );
}

function validMoney(value) {
  return (
    value === null ||
    (
      Number.isFinite(value) &&
      value >= 0 &&
      value <= 5000000
    )
  );
}

function validateAcademic(row) {
  const errors = [];

  if (
    !validYear(
      row.academic_year
    )
  ) {
    errors.push(
      'invalid_academic_year'
    );
  }

  if (
    row.program !==
    'B.Tech'
  ) {
    errors.push(
      'program_not_btech'
    );
  }

  if (
    !validMoney(
      row.tuition_fee
    )
  ) {
    errors.push(
      'invalid_tuition'
    );
  }

  const total =
    row.academic_total ??
    row.academic_total_calculated ??
    null;

  if (
    !validMoney(
      total
    )
  ) {
    errors.push(
      'invalid_total'
    );
  }

  if (
    total !== null &&
    row.tuition_fee !== null &&
    total <
      row.tuition_fee
  ) {
    errors.push(
      'total_below_tuition'
    );
  }

  if (
    row.admission_type ===
      'fee_waiver' &&
    row.tuition_fee !==
      0
  ) {
    errors.push(
      'fee_waiver_tuition_not_zero'
    );
  }

  if (
    !Number.isInteger(
      row.source_table_index
    )
  ) {
    errors.push(
      'missing_source_table'
    );
  }

  return errors;
}

function validateHostel(row) {
  const errors = [];

  if (
    !validYear(
      row.academic_year
    )
  ) {
    errors.push(
      'invalid_hostel_year'
    );
  }

  if (
    !Number.isFinite(
      row.min_fee
    ) ||
    !Number.isFinite(
      row.max_fee
    )
  ) {
    errors.push(
      'invalid_hostel_fee'
    );

    return errors;
  }

  if (
    row.min_fee <
      10000
  ) {
    errors.push(
      'hostel_too_low'
    );
  }

  if (
    row.max_fee >
      1000000
  ) {
    errors.push(
      'hostel_too_high'
    );
  }

  if (
    row.max_fee <
      row.min_fee
  ) {
    errors.push(
      'hostel_max_below_min'
    );
  }

  return errors;
}

function validateCollege(
  college
) {
  const errors = [];

  if (
    !college.college_id
  ) {
    errors.push(
      'missing_college_id'
    );
  }

  if (
    !college.college_name
  ) {
    errors.push(
      'missing_college_name'
    );
  }

  if (
    !Array.isArray(
      college.academic
    ) ||
    college.academic.length ===
      0
  ) {
    errors.push(
      'no_academic_variants'
    );
  }

  const academicResults =
    (
      college.academic ||
      []
    ).map(
      row => ({
        row,

        errors:
          validateAcademic(
            row
          )
      })
    );

  const hostelResults =
    (
      college.hostel ||
      []
    ).map(
      row => ({
        row,

        errors:
          validateHostel(
            row
          )
      })
    );

  for (
    const result
    of academicResults
  ) {
    errors.push(
      ...result.errors
    );
  }

  for (
    const result
    of hostelResults
  ) {
    errors.push(
      ...result.errors
    );
  }

  /*
  |--------------------------------------------------------------------------
  | DUPLICATE ACADEMIC VARIANTS
  |--------------------------------------------------------------------------
  */

  const keys =
    new Set();

  for (
    const row
    of college.academic ||
    []
  ) {
    const key =
      [
        row.academic_year,
        row.admission_type,
        row.period,
        row.tuition_fee,
        row.academic_total ??
          row.academic_total_calculated
      ].join('|');

    if (
      keys.has(key)
    ) {
      errors.push(
        'duplicate_academic_variant'
      );
    }

    keys.add(key);
  }

  return {
    ...college,

    validation_errors:
      [
        ...new Set(
          errors
        )
      ],

    validation_status:
      errors.length ===
        0
        ? 'VALIDATED'
        : 'FAILED_VALIDATION'
  };
}

async function main() {
  console.log('');
  console.log(
    '======================================='
  );
  console.log(
    'NORMALIZED FEE VALIDATOR'
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

  const data =
    JSON.parse(
      raw.replace(
        /^\uFEFF/,
        ''
      )
    );

  const validated =
    data.map(
      validateCollege
    );

  const passed =
    validated.filter(
      row =>
        row.validation_status ===
        'VALIDATED'
    );

  const failed =
    validated.filter(
      row =>
        row.validation_status !==
        'VALIDATED'
    );

  await fs.writeFile(
    OUTPUT,
    JSON.stringify(
      passed,
      null,
      2
    ),
    'utf8'
  );

  await fs.writeFile(
    FAILED_OUTPUT,
    JSON.stringify(
      failed,
      null,
      2
    ),
    'utf8'
  );

  console.table(
    validated.map(
      row => ({
        college:
          row.college_name,

        academic_variants:
          row.academic.length,

        hostel_variants:
          row.hostel.length,

        status:
          row.validation_status,

        errors:
          row.validation_errors
            .join(',')
      })
    )
  );

  console.log('');

  console.log(
    'VALIDATED:',
    passed.length
  );

  console.log(
    'FAILED:',
    failed.length
  );

  console.log('');

  console.log(
    'Saved:',
    OUTPUT
  );

  console.log(
    'Saved:',
    FAILED_OUTPUT
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
      error
    );

    process.exitCode = 1;
  }
);