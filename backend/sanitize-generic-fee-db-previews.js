import fs from 'node:fs/promises';

const INPUT =
  './fee-pilot-batch-01-db-previews.json';

const OUTPUT =
  './fee-pilot-batch-01-db-previews-clean.json';

const REVIEW_OUTPUT =
  './fee-pilot-batch-01-db-previews-review.json';


function cleanText(value) {
  if (value == null) {
    return null;
  }

  const text =
    String(value)
      .replace(/\s+/g, ' ')
      .trim();

  return text || null;
}


function normalizeRoomType(value) {
  const text =
    cleanText(value);

  if (!text) {
    return null;
  }

  const upper =
    text.toUpperCase();

  /*
  |--------------------------------------------------------------------------
  | REAL ROOM TYPES
  |--------------------------------------------------------------------------
  */

  if (
    upper.includes('SINGLE')
  ) {
    return 'SINGLE SEATER';
  }

  if (
    upper.includes('DOUBLE')
  ) {
    return 'DOUBLE SEATER';
  }

  if (
    upper.includes('TRIPLE')
  ) {
    return 'TRIPLE SEATER';
  }

  if (
    upper.includes('FOUR') ||
    upper.includes('4 SEATER') ||
    upper.includes('4-SEATER')
  ) {
    return 'FOUR SEATER';
  }

  /*
  |--------------------------------------------------------------------------
  | INVALID / TABLE LABELS
  |--------------------------------------------------------------------------
  */

  if (
    /^TOTAL\b/i.test(text)
  ) {
    return null;
  }

  if (
    /^\d+$/.test(text)
  ) {
    return null;
  }

  if (
    /^\d{4}\s*-\s*\d{2,4}$/.test(text)
  ) {
    return null;
  }

  return text;
}


function normalizeMoney(value) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null;
  }

  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}


function buildVariantKey(row) {
  return [
    row.semester ?? '',
    row.fee_period ?? '',
    row.student_category ?? '',
    row.income_min ?? '',
    row.income_max ?? '',
    row.residence_type ?? '',
    row.room_type ?? '',
    row.tuition_fee ?? '',
    row.admission_fee ?? '',
    row.institute_fee ?? '',
    row.hostel_fee ?? '',
    row.mess_fee ?? '',
    row.caution_deposit ?? '',
    row.other_fee ?? '',
    row.total_fee ?? ''
  ].join('|');
}


function sanitizeVariant(row) {
  const result = {
    ...row,

    semester:
      row.semester ?? null,

    fee_period:
      cleanText(
        row.fee_period
      ),

    student_category:
      cleanText(
        row.student_category
      ),

    residence_type:
      cleanText(
        row.residence_type
      ),

    room_type:
      normalizeRoomType(
        row.room_type
      ),

    tuition_fee:
      normalizeMoney(
        row.tuition_fee
      ),

    admission_fee:
      normalizeMoney(
        row.admission_fee
      ),

    institute_fee:
      normalizeMoney(
        row.institute_fee
      ),

    hostel_fee:
      normalizeMoney(
        row.hostel_fee
      ),

    mess_fee:
      normalizeMoney(
        row.mess_fee
      ),

    caution_deposit:
      normalizeMoney(
        row.caution_deposit
      ),

    other_fee:
      normalizeMoney(
        row.other_fee
      ),

    total_fee:
      normalizeMoney(
        row.total_fee
      )
  };

  if (
    result.residence_type ===
    'day_scholar'
  ) {
    result.room_type =
      null;

    result.hostel_fee =
      null;

    result.mess_fee =
      null;
  }

  return result;
}


function validateVariant(row) {
  const errors = [];

  if (
    ![
      'day_scholar',
      'hosteller'
    ].includes(
      row.residence_type
    )
  ) {
    errors.push(
      'INVALID_RESIDENCE_TYPE'
    );
  }

  if (
    row.tuition_fee !== null &&
    row.tuition_fee < 0
  ) {
    errors.push(
      'NEGATIVE_TUITION'
    );
  }

  if (
    row.hostel_fee !== null &&
    row.hostel_fee < 0
  ) {
    errors.push(
      'NEGATIVE_HOSTEL'
    );
  }

  if (
    row.total_fee !== null &&
    row.total_fee < 0
  ) {
    errors.push(
      'NEGATIVE_TOTAL'
    );
  }

  if (
    row.total_fee !== null &&
    row.tuition_fee !== null &&
    row.total_fee <
      row.tuition_fee
  ) {
    errors.push(
      'TOTAL_BELOW_TUITION'
    );
  }

  if (
    row.student_category ===
      'FEE_WAIVER' &&
    row.tuition_fee !== 0
  ) {
    errors.push(
      'INVALID_FEE_WAIVER'
    );
  }

  return errors;
}


function sanitizeCollege(preview) {
  const original =
    preview.fee_variants || [];

  const cleaned =
    original.map(
      sanitizeVariant
    );

  /*
  |--------------------------------------------------------------------------
  | REMOVE EXACT DUPLICATES
  |--------------------------------------------------------------------------
  */

  const seen =
    new Set();

  const unique = [];

  let duplicatesRemoved =
    0;

  for (
    const row
    of cleaned
  ) {
    const key =
      buildVariantKey(row);

    if (
      seen.has(key)
    ) {
      duplicatesRemoved++;

      continue;
    }

    seen.add(key);

    unique.push(row);
  }

  /*
  |--------------------------------------------------------------------------
  | VALIDATION
  |--------------------------------------------------------------------------
  */

  const reviewed =
    unique.map(
      row => ({
        row,

        errors:
          validateVariant(row)
      })
    );

  const invalid =
    reviewed.filter(
      item =>
        item.errors.length > 0
    );

  return {
    ...preview,

    fee_variants:
      unique,

    sanitization: {
      original_variants:
        original.length,

      cleaned_variants:
        unique.length,

      duplicates_removed:
        duplicatesRemoved,

      invalid_variants:
        invalid.length
    },

    preview_status:
      invalid.length === 0
        ? 'SANITIZED_READY'
        : 'REVIEW_REQUIRED',

    validation_issues:
      invalid
  };
}


async function main() {
  console.log('');

  console.log(
    '======================================='
  );

  console.log(
    'GENERIC FEE PREVIEW SANITIZER'
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

  const results =
    data.map(
      sanitizeCollege
    );

  const ready =
    results.filter(
      row =>
        row.preview_status ===
        'SANITIZED_READY'
    );

  const review =
    results.filter(
      row =>
        row.preview_status !==
        'SANITIZED_READY'
    );

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

  console.table(
    results.map(
      row => ({
        college:
          row.college_name,

        before:
          row.sanitization
            .original_variants,

        after:
          row.sanitization
            .cleaned_variants,

        duplicates_removed:
          row.sanitization
            .duplicates_removed,

        invalid:
          row.sanitization
            .invalid_variants,

        status:
          row.preview_status
      })
    )
  );

  console.log('');

  console.log(
    'READY:',
    ready.length
  );

  console.log(
    'REVIEW:',
    review.length
  );

  console.log('');

  console.log(
    'Total variants before:',
    results.reduce(
      (
        sum,
        row
      ) =>
        sum +
        row.sanitization
          .original_variants,
      0
    )
  );

  console.log(
    'Total variants after:',
    results.reduce(
      (
        sum,
        row
      ) =>
        sum +
        row.sanitization
          .cleaned_variants,
      0
    )
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