import fs from 'node:fs/promises';

const INPUT =
  './fee-pilot-batch-01-db-previews-final.json';

const OUTPUT =
  './fee-pilot-batch-01-db-previews-final-safe.json';

const REVIEW_OUTPUT =
  './fee-pilot-batch-01-room-type-review.json';


function normalizeRoomType(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const text =
    String(value)
      .toLowerCase()
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  if (!text) {
    return null;
  }


  // SINGLE
  if (
    /\bsingle\b/.test(text) ||
    /\b1\s*seater\b/.test(text) ||
    /\bone\s*seater\b/.test(text) ||
    /\b1\s*sharing\b/.test(text)
  ) {
    return 'single_occupancy';
  }


  // DOUBLE
  if (
    /\bdouble\b/.test(text) ||
    /\b2\s*seater\b/.test(text) ||
    /\btwo\s*seater\b/.test(text) ||
    /\b2\s*sharing\b/.test(text)
  ) {
    return 'double_sharing';
  }


  // NON AC
  // Must be checked before AC.
  if (
    /\bnon\s*ac\b/.test(text) ||
    /\bnonac\b/.test(text) ||
    /\bwithout\s*ac\b/.test(text) ||
    /\bnon\s*air\s*conditioned\b/.test(text)
  ) {
    return 'non_AC';
  }


  // AC
  if (
    /\bac\b/.test(text) ||
    /\bair\s*conditioned\b/.test(text)
  ) {
    return 'AC';
  }


  // DB has no triple_sharing / four_sharing etc.
  return null;
}


function isAllowedRoomType(value) {
  return (
    value === null ||
    value === 'AC' ||
    value === 'non_AC' ||
    value === 'double_sharing' ||
    value === 'single_occupancy'
  );
}


async function main() {
  console.log('');

  console.log(
    '======================================='
  );

  console.log(
    'FINAL FEE ROOM TYPE NORMALIZER'
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


  if (!Array.isArray(data)) {
    throw new Error(
      'Final preview JSON must contain an array.'
    );
  }


  const review = [];

  let totalVariants = 0;

  let changed = 0;

  let unsupportedToNull = 0;

  let dayScholarForcedNull = 0;


  for (const preview of data) {
    if (
      !Array.isArray(
        preview.fee_variants
      )
    ) {
      throw new Error(
        `fee_variants missing for ${preview.college_name}`
      );
    }


    for (
      const variant
      of preview.fee_variants
    ) {
      totalVariants++;


      const original =
        variant.room_type ??
        null;


      /*
      |--------------------------------------------------------------------------
      | DAY SCHOLAR
      |--------------------------------------------------------------------------
      */

      if (
        variant.residence_type ===
        'day_scholar'
      ) {
        if (original !== null) {
          dayScholarForcedNull++;
          changed++;
        }

        variant.room_type =
          null;

        continue;
      }


      /*
      |--------------------------------------------------------------------------
      | HOSTELLER
      |--------------------------------------------------------------------------
      */

      if (
        variant.residence_type ===
        'hosteller'
      ) {
        const normalized =
          normalizeRoomType(
            original
          );


        if (
          original !== normalized
        ) {
          changed++;
        }


        if (
          original !== null &&
          normalized === null
        ) {
          unsupportedToNull++;

          review.push({
            college_id:
              preview.college_id,

            college_name:
              preview.college_name,

            original_room_type:
              original,

            normalized_room_type:
              null,

            hostel_fee:
              variant.hostel_fee ??
              null,

            reason:
              'ROOM_TYPE_NOT_SUPPORTED_BY_CURRENT_DB_ENUM'
          });
        }


        variant.room_type =
          normalized;

        continue;
      }


      /*
      |--------------------------------------------------------------------------
      | UNKNOWN RESIDENCE
      |--------------------------------------------------------------------------
      */

      if (original !== null) {
        changed++;
      }

      variant.room_type =
        null;
    }
  }


  /*
  |--------------------------------------------------------------------------
  | HARD SAFETY GATE
  |--------------------------------------------------------------------------
  */

  const invalid = [];


  for (const preview of data) {
    for (
      const variant
      of preview.fee_variants
    ) {
      if (
        !isAllowedRoomType(
          variant.room_type
        )
      ) {
        invalid.push({
          college:
            preview.college_name,

          residence_type:
            variant.residence_type,

          room_type:
            variant.room_type
        });
      }
    }
  }


  if (invalid.length > 0) {
    console.log(
      'INVALID ROOM TYPES'
    );

    console.table(
      invalid
    );

    throw new Error(
      'DB-invalid room types remain.'
    );
  }


  /*
  |--------------------------------------------------------------------------
  | SAVE SAFE IMPORT FILE
  |--------------------------------------------------------------------------
  */

  await fs.writeFile(
    OUTPUT,

    JSON.stringify(
      data,
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


  console.table([
    {
      metric:
        'Total variants',

      count:
        totalVariants
    },

    {
      metric:
        'Room types changed',

      count:
        changed
    },

    {
      metric:
        'Unsupported -> NULL',

      count:
        unsupportedToNull
    },

    {
      metric:
        'Day scholar forced NULL',

      count:
        dayScholarForcedNull
    },

    {
      metric:
        'Invalid after normalization',

      count:
        invalid.length
    }
  ]);


  console.log('');

  console.log(
    'ROOM TYPES AFTER NORMALIZATION'
  );


  const summary =
    new Map();


  for (const preview of data) {
    for (
      const variant
      of preview.fee_variants
    ) {
      const key =
        JSON.stringify({
          residence_type:
            variant.residence_type ??
            null,

          room_type:
            variant.room_type ??
            null
        });


      summary.set(
        key,
        (summary.get(key) || 0) + 1
      );
    }
  }


  console.table(
    [...summary.entries()]
      .map(
        ([key, count]) => ({
          ...JSON.parse(key),
          count
        })
      )
  );


  console.log('');

  console.log(
    'DB ROOM TYPE CONSTRAINT CHECK: PASS'
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