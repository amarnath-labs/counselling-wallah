import fs from 'node:fs/promises';

const INPUT =
  './fee-pilot-batch-01-validated.json';

const OUTPUT =
  './fee-pilot-batch-01-db-previews.json';


/*
|--------------------------------------------------------------------------
| STUDENT CATEGORY NORMALIZER
|--------------------------------------------------------------------------
*/

function normalizeCategory(
  admissionType
) {
  if (
    admissionType ===
    'fee_waiver'
  ) {
    return 'FEE_WAIVER';
  }

  if (
    admissionType ===
    'counseling'
  ) {
    return 'COUNSELING';
  }

  if (
    admissionType ===
    'direct_vacant'
  ) {
    return 'DIRECT/VACANT';
  }

  return 'GENERAL';
}


/*
|--------------------------------------------------------------------------
| ROOM TYPE NORMALIZER
|--------------------------------------------------------------------------
|
| DB constraint allows ONLY:
|
| AC
| non_AC
| double_sharing
| single_occupancy
| NULL
|
|--------------------------------------------------------------------------
*/

function normalizeRoomType(
  value
) {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const text =
    String(value)
      .toLowerCase()
      .replace(
        /[_-]+/g,
        ' '
      )
      .replace(
        /\s+/g,
        ' '
      )
      .trim();


  if (!text) {
    return null;
  }


  /*
  |--------------------------------------------------------------------------
  | SINGLE OCCUPANCY
  |--------------------------------------------------------------------------
  */

  if (
    /\bsingle\b/.test(
      text
    ) ||
    /\b1\s*seater\b/.test(
      text
    ) ||
    /\b1\s*sharing\b/.test(
      text
    ) ||
    /\bone\s*seater\b/.test(
      text
    ) ||
    /\bone\s*sharing\b/.test(
      text
    )
  ) {
    return 'single_occupancy';
  }


  /*
  |--------------------------------------------------------------------------
  | DOUBLE SHARING
  |--------------------------------------------------------------------------
  */

  if (
    /\bdouble\b/.test(
      text
    ) ||
    /\b2\s*seater\b/.test(
      text
    ) ||
    /\b2\s*sharing\b/.test(
      text
    ) ||
    /\btwo\s*seater\b/.test(
      text
    ) ||
    /\btwo\s*sharing\b/.test(
      text
    )
  ) {
    return 'double_sharing';
  }


  /*
  |--------------------------------------------------------------------------
  | NON AC
  |--------------------------------------------------------------------------
  |
  | Check before generic AC.
  |--------------------------------------------------------------------------
  */

  if (
    /\bnon\s*ac\b/.test(
      text
    ) ||
    /\bnonac\b/.test(
      text
    ) ||
    /\bwithout\s*ac\b/.test(
      text
    ) ||
    /\bnon\s*air\s*conditioned\b/.test(
      text
    )
  ) {
    return 'non_AC';
  }


  /*
  |--------------------------------------------------------------------------
  | AC
  |--------------------------------------------------------------------------
  */

  if (
    /\bac\b/.test(
      text
    ) ||
    /\bair\s*conditioned\b/.test(
      text
    )
  ) {
    return 'AC';
  }


  /*
  |--------------------------------------------------------------------------
  | UNSUPPORTED / AMBIGUOUS
  |--------------------------------------------------------------------------
  |
  | Examples:
  |
  | triple seater
  | four seater
  | total 2026-27
  | boys hostel
  | girls hostel
  | 6
  |
  | We do NOT invent a DB room category.
  |--------------------------------------------------------------------------
  */

  return null;
}


/*
|--------------------------------------------------------------------------
| BRANCH FEE MASTER
|--------------------------------------------------------------------------
*/

function buildBranchFee(
  college,
  academicYear
) {
  return {
    college_id:
      college.college_id,

    branch_id:
      null,

    program:
      'B.Tech',

    /*
    |--------------------------------------------------------------------------
    | REQUIRED BY DB CONSTRAINT
    |--------------------------------------------------------------------------
    |
    | branch_id NULL
    | =>
    | fee_scope must be all_btech_branches
    |--------------------------------------------------------------------------
    */

    fee_scope:
      'all_btech_branches',

    academic_year:
      academicYear,

    source_label:
      'Official Institute Fee Source',

    /*
    |--------------------------------------------------------------------------
    | Source metadata is attached later by source gate.
    |--------------------------------------------------------------------------
    */

    source_url:
      null,

    verification_status:
      'verified'
  };
}


/*
|--------------------------------------------------------------------------
| DAY SCHOLAR ACADEMIC VARIANT
|--------------------------------------------------------------------------
*/

function buildAcademicVariant(
  academic
) {
  const total =
    academic.academic_total ??
    academic.academic_total_calculated ??
    null;

  return {
    semester:
      null,

    fee_period:
      academic.period ||
      'annual',

    student_category:
      normalizeCategory(
        academic.admission_type
      ),

    income_min:
      null,

    income_max:
      null,

    residence_type:
      'day_scholar',

    /*
    |--------------------------------------------------------------------------
    | Day scholar never has room type.
    |--------------------------------------------------------------------------
    */

    room_type:
      null,

    tuition_fee:
      academic.tuition_fee ??
      null,

    admission_fee:
      academic.admission_registration_fee ??
      null,

    institute_fee:
      academic.annual_additional_fee ??
      null,

    hostel_fee:
      null,

    mess_fee:
      null,

    caution_deposit:
      academic.security_deposit ??
      null,

    other_fee:
      academic.examination_fee ??
      null,

    total_fee:
      total,

    is_one_time_included:
      Boolean(
        academic.admission_registration_fee ||
        academic.security_deposit
      ),

    verification_status:
      'verified'
  };
}


/*
|--------------------------------------------------------------------------
| HOSTELLER VARIANTS
|--------------------------------------------------------------------------
*/

function buildHostelVariants(
  college,
  academicVariants
) {
  const output = [];

  if (
    !Array.isArray(
      college.hostel
    ) ||
    college.hostel.length ===
    0
  ) {
    return output;
  }


  for (
    const academic
    of academicVariants
  ) {
    for (
      const hostel
      of college.hostel
    ) {

      /*
      |--------------------------------------------------------------------------
      | Preserve min/max hostel fee amounts.
      |--------------------------------------------------------------------------
      */

      const hostelAmounts =
        [
          hostel.min_fee,
          hostel.max_fee
        ]
          .filter(
            value =>
              Number.isFinite(
                value
              )
          )
          .filter(
            (
              value,
              index,
              array
            ) =>
              array.indexOf(
                value
              ) === index
          );


      /*
      |--------------------------------------------------------------------------
      | Normalize room type ONCE.
      |--------------------------------------------------------------------------
      */

      const normalizedRoomType =
        normalizeRoomType(
          hostel.accommodation
        );


      for (
        const hostelFee
        of hostelAmounts
      ) {
        const academicTotal =
          academic.academic_total ??
          academic.academic_total_calculated ??
          null;


        output.push({
          semester:
            null,

          fee_period:
            academic.period ||
            'annual',

          student_category:
            normalizeCategory(
              academic.admission_type
            ),

          income_min:
            null,

          income_max:
            null,

          residence_type:
            'hosteller',

          /*
          |--------------------------------------------------------------------------
          | DB-safe room type
          |--------------------------------------------------------------------------
          */

          room_type:
            normalizedRoomType,

          tuition_fee:
            academic.tuition_fee ??
            null,

          admission_fee:
            academic.admission_registration_fee ??
            null,

          institute_fee:
            academic.annual_additional_fee ??
            null,

          hostel_fee:
            hostelFee,

          mess_fee:
            null,

          caution_deposit:
            academic.security_deposit ??
            null,

          other_fee:
            academic.examination_fee ??
            null,

          total_fee:
            academicTotal != null
              ? academicTotal +
                hostelFee
              : null,

          is_one_time_included:
            Boolean(
              academic.admission_registration_fee ||
              academic.security_deposit
            ),

          verification_status:
            'verified'
        });
      }
    }
  }


  return output;
}


/*
|--------------------------------------------------------------------------
| COLLEGE PREVIEW
|--------------------------------------------------------------------------
*/

function buildCollegePreview(
  college
) {
  const academic =
    college.academic ||
    [];


  if (
    academic.length ===
    0
  ) {
    throw new Error(
      `No academic variants: ${college.college_name}`
    );
  }


  /*
  |--------------------------------------------------------------------------
  | EXACTLY ONE ACADEMIC YEAR REQUIRED
  |--------------------------------------------------------------------------
  */

  const years =
    [
      ...new Set(
        academic
          .map(
            row =>
              row.academic_year
          )
          .filter(
            Boolean
          )
      )
    ];


  if (
    years.length !==
    1
  ) {
    throw new Error(
      `Multiple/missing academic years for ${college.college_name}`
    );
  }


  const academicYear =
    years[0];


  /*
  |--------------------------------------------------------------------------
  | BRANCH FEE MASTER
  |--------------------------------------------------------------------------
  */

  const branch_fee =
    buildBranchFee(
      college,
      academicYear
    );


  /*
  |--------------------------------------------------------------------------
  | DAY SCHOLAR VARIANTS
  |--------------------------------------------------------------------------
  */

  const fee_variants =
    academic.map(
      buildAcademicVariant
    );


  /*
  |--------------------------------------------------------------------------
  | HOSTELLER VARIANTS
  |--------------------------------------------------------------------------
  */

  fee_variants.push(
    ...buildHostelVariants(
      college,
      academic
    )
  );


  return {
    college_id:
      college.college_id,

    college_name:
      college.college_name,

    branch_fee,

    fee_variants,

    preview_status:
      'READY_FOR_IMPORT'
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
    'GENERIC FEE DB PREVIEW GENERATOR'
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


  if (
    !Array.isArray(
      data
    )
  ) {
    throw new Error(
      'Validated input must contain an array.'
    );
  }


  /*
  |--------------------------------------------------------------------------
  | BUILD
  |--------------------------------------------------------------------------
  */

  const previews =
    data.map(
      buildCollegePreview
    );


  /*
  |--------------------------------------------------------------------------
  | SAVE
  |--------------------------------------------------------------------------
  */

  await fs.writeFile(
    OUTPUT,

    JSON.stringify(
      previews,
      null,
      2
    ),

    'utf8'
  );


  /*
  |--------------------------------------------------------------------------
  | SUMMARY
  |--------------------------------------------------------------------------
  */

  console.table(
    previews.map(
      preview => {
        const roomTypes =
          [
            ...new Set(
              preview
                .fee_variants
                .filter(
                  row =>
                    row.residence_type ===
                    'hosteller'
                )
                .map(
                  row =>
                    row.room_type
                )
            )
          ];

        return {
          college:
            preview.college_name,

          year:
            preview.branch_fee
              .academic_year,

          fee_scope:
            preview.branch_fee
              .fee_scope,

          branch_id:
            preview.branch_fee
              .branch_id,

          variants:
            preview.fee_variants
              .length,

          day_scholar:
            preview.fee_variants
              .filter(
                row =>
                  row.residence_type ===
                  'day_scholar'
              )
              .length,

          hosteller:
            preview.fee_variants
              .filter(
                row =>
                  row.residence_type ===
                  'hosteller'
              )
              .length,

          room_types:
            roomTypes
              .map(
                value =>
                  value ??
                  'NULL'
              )
              .join(','),

          status:
            preview.preview_status
        };
      }
    )
  );


  console.log('');


  console.log(
    'Total colleges:',
    previews.length
  );


  console.log(
    'Total variants:',
    previews.reduce(
      (
        sum,
        preview
      ) =>
        sum +
        preview.fee_variants.length,

      0
    )
  );


  /*
  |--------------------------------------------------------------------------
  | DB ROOM-TYPE SAFETY CHECK
  |--------------------------------------------------------------------------
  */

  const allowedRoomTypes =
    new Set([
      null,
      'AC',
      'non_AC',
      'double_sharing',
      'single_occupancy'
    ]);


  const invalidRoomTypes =
    [];


  for (
    const preview
    of previews
  ) {
    for (
      const variant
      of preview.fee_variants
    ) {
      if (
        !allowedRoomTypes.has(
          variant.room_type
        )
      ) {
        invalidRoomTypes.push({
          college:
            preview.college_name,

          room_type:
            variant.room_type
        });
      }
    }
  }


  console.log('');


  if (
    invalidRoomTypes.length >
    0
  ) {
    console.log(
      'INVALID ROOM TYPES DETECTED'
    );

    console.table(
      invalidRoomTypes
    );

    throw new Error(
      'Generated preview contains DB-invalid room_type values.'
    );
  }


  console.log(
    'Room type constraint check: PASS'
  );


  console.log('');


  console.log(
    'Saved:',
    OUTPUT
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