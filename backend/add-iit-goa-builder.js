import fs from 'node:fs';

const FILE =
  './build-btech-fee-previews.js';

const BACKUP =
  './build-btech-fee-previews.before-iit-goa.js';

let code =
  fs.readFileSync(
    FILE,
    'utf8'
  );

/*
|--------------------------------------------------------------------------
| ALREADY INSTALLED?
|--------------------------------------------------------------------------
*/

if (
  code.includes(
    'function buildIitGoaPreview()'
  )
) {
  console.log(
    'IIT Goa builder already exists.'
  );

  process.exit(0);
}

/*
|--------------------------------------------------------------------------
| BACKUP
|--------------------------------------------------------------------------
*/

fs.copyFileSync(
  FILE,
  BACKUP
);

console.log('');
console.log(
  'Backup created:'
);

console.log(
  BACKUP
);

/*
|--------------------------------------------------------------------------
| IIT GOA BUILDER
|--------------------------------------------------------------------------
*/

const builder = `

/*
|--------------------------------------------------------------------------
| IIT GOA
|--------------------------------------------------------------------------
|
| Official B.Tech Autumn 2026-27 fee structure.
|
| 4 slabs:
|
| Slab I
|   SC/ST/PwD
|   Tuition = 0
|
| Slab II
|   GEN/EWS/OBC
|   Family income below Rs. 1 lakh
|   Tuition = 0
|
| Slab III
|   GEN/EWS/OBC
|   Family income Rs. 1-5 lakh
|   Tuition = 33333
|
| Slab IV
|   GEN/EWS/OBC
|   Family income above Rs. 5 lakh
|   Tuition = 100000
|
| Common recurring non-tuition institute charges:
|
| Examination             500
| Registration            500
| Gymkhana               1750
| Electricity & Water    3500
| Medical                1000
| Benevolent Fund        1000
| --------------------------------
| Institute component    8250
|
| Hostel component:
|
| Hostel seat rent        500
| Hostel establishment   2000
| Hostel subsidy         6000
| --------------------------------
| Hostel component       8500
|
| Mess advance:
| 20345 every semester
|
| One-time non-refundable:
| Admission fee          1400
| Remaining A charges    3600
|
| Refundable deposits at admission:
| Institute security     1000
| Library security       1000
| Mess security          1000
| Extra mess advance     2000
| --------------------------------
| Refundable total       5000
|
| Annual medical insurance:
| 2000 in Autumn semesters
| Semesters 1,3,5,7
|
*/

function buildIitGoaPreview() {
  const branch_fee =
    baseBranchFee({
      college_id:
        'indian-institute-of-technology-goa',

      academic_year:
        2026,

      source_label:
        'IIT Goa Official B.Tech Fee Structure Autumn 2026-27',

      source_url:
        'https://iitgoa.ac.in/wp-content/uploads/B.Tech-Autumn-2026-27.pdf',

      verification_status:
        'verified'
    });

  const fee_variants = [];

  /*
  |--------------------------------------------------------------------------
  | COMMON COMPONENTS
  |--------------------------------------------------------------------------
  */

  const recurringInstituteFee =
    8250;

  const hostelFee =
    8500;

  const semesterMessAdvance =
    20345;

  /*
  |--------------------------------------------------------------------------
  | SLABS
  |--------------------------------------------------------------------------
  */

  const slabs = [
    {
      slab:
        'Slab I',

      category:
        'SC/ST/PwD',

      income_min:
        null,

      income_max:
        null,

      tuition:
        0
    },

    {
      slab:
        'Slab II',

      category:
        'GEN/EWS/OBC',

      income_min:
        null,

      income_max:
        100000,

      tuition:
        0
    },

    {
      slab:
        'Slab III',

      category:
        'GEN/EWS/OBC',

      income_min:
        100000,

      income_max:
        500000,

      tuition:
        33333
    },

    {
      slab:
        'Slab IV',

      category:
        'GEN/EWS/OBC',

      income_min:
        500000,

      income_max:
        null,

      tuition:
        100000
    }
  ];

  /*
  |--------------------------------------------------------------------------
  | BUILD 8 SEMESTERS FOR EACH SLAB
  |--------------------------------------------------------------------------
  */

  for (const slab of slabs) {
    for (
      let semester = 1;
      semester <= 8;
      semester++
    ) {
      const firstSemester =
        semester === 1;

      const autumnSemester =
        semester === 1 ||
        semester === 3 ||
        semester === 5 ||
        semester === 7;

      /*
      |--------------------------------------------------------------------------
      | ONE-TIME FEES
      |--------------------------------------------------------------------------
      */

      const admissionFee =
        firstSemester
          ? 1400
          : null;

      /*
      | Remaining one-time A charges:
      |
      | Grade Card               300
      | Provisional Certificate  200
      | Medical Examination      200
      | Students Welfare Fund   1000
      | Modernisation           1500
      | Identity Card            400
      |
      | Total = 3600
      */

      const oneTimeOtherFees =
        firstSemester
          ? 3600
          : 0;

      /*
      |--------------------------------------------------------------------------
      | REFUNDABLE DEPOSITS
      |--------------------------------------------------------------------------
      |
      | C section:
      |
      | Institute Security = 1000
      | Library Security   = 1000
      | Mess Security      = 1000
      |
      | Plus refundable mess advance = 2000
      |
      */

      const cautionDeposit =
        firstSemester
          ? 5000
          : null;

      /*
      |--------------------------------------------------------------------------
      | ANNUAL MEDICAL INSURANCE
      |--------------------------------------------------------------------------
      */

      const insuranceFee =
        autumnSemester
          ? 2000
          : 0;

      /*
      |--------------------------------------------------------------------------
      | OTHER FEE
      |--------------------------------------------------------------------------
      */

      const otherFee =
        oneTimeOtherFees +
        insuranceFee;

      /*
      |--------------------------------------------------------------------------
      | TOTAL
      |--------------------------------------------------------------------------
      */

      const total =
        slab.tuition +
        recurringInstituteFee +
        hostelFee +
        semesterMessAdvance +
        (admissionFee || 0) +
        (cautionDeposit || 0) +
        otherFee;

      fee_variants.push({
        semester,

        fee_period:
          'semester',

        student_category:
          slab.category,

        income_min:
          slab.income_min,

        income_max:
          slab.income_max,

        residence_type:
          'hosteller',

        room_type:
          null,

        tuition_fee:
          slab.tuition,

        admission_fee:
          admissionFee,

        institute_fee:
          recurringInstituteFee,

        hostel_fee:
          hostelFee,

        mess_fee:
          semesterMessAdvance,

        caution_deposit:
          cautionDeposit,

        other_fee:
          otherFee,

        total_fee:
          total,

        is_one_time_included:
          firstSemester,

        verification_status:
          'verified'
      });
    }
  }

  return {
    filename:
      'iit-goa-fee-preview.json',

    branch_fee,

    fee_variants
  };
}

`;

/*
|--------------------------------------------------------------------------
| INSERT BUILDER BEFORE BUILDERS ARRAY
|--------------------------------------------------------------------------
*/

const buildersMarker =
  'const builders = [';

const buildersIndex =
  code.indexOf(
    buildersMarker
  );

if (
  buildersIndex === -1
) {
  throw new Error(
    'builders array not found'
  );
}

code =
  code.slice(
    0,
    buildersIndex
  ) +
  builder +
  code.slice(
    buildersIndex
  );

/*
|--------------------------------------------------------------------------
| REGISTER IIT GOA BUILDER
|--------------------------------------------------------------------------
*/

const oldBuildersEnd =
  `  buildNitSikkimPreview,
  buildNitRourkelaPreview
];`;

const newBuildersEnd =
  `  buildNitSikkimPreview,
  buildNitRourkelaPreview,
  buildIitGoaPreview
];`;

if (
  !code.includes(
    oldBuildersEnd
  )
) {
  throw new Error(
    'Expected builders array ending not found.'
  );
}

code =
  code.replace(
    oldBuildersEnd,
    newBuildersEnd
  );

/*
|--------------------------------------------------------------------------
| WRITE MASTER
|--------------------------------------------------------------------------
*/

fs.writeFileSync(
  FILE,
  code,
  'utf8'
);

console.log('');
console.log(
  '======================================='
);

console.log(
  'IIT GOA BUILDER INSTALLED'
);

console.log(
  '======================================='
);

console.log('');

console.log(
  'Modified:',
  FILE
);

console.log(
  'Existing builders preserved.'
);

console.log(
  'IIT Goa builder added.'
);

console.log(
  'Expected IIT Goa variants: 32'
);

console.log(
  'Database has NOT been modified.'
);
