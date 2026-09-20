import fs from 'node:fs';

const FILE =
  './build-btech-fee-previews.js';

const BACKUP =
  './build-btech-fee-previews.before-nit-sikkim.js';

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
    'function buildNitSikkimPreview()'
  )
) {
  console.log(
    'NIT Sikkim builder already exists.'
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
| BUILDER CODE
|--------------------------------------------------------------------------
*/

const builder = `

/*
|--------------------------------------------------------------------------
| NIT SIKKIM
|--------------------------------------------------------------------------
|
| B.Tech 2025-2029 batch
|
| Tuition categories:
|
| 1. Full Fee Payer
| 2. 2/3 Tuition Remission
| 3. Full Tuition Waiver
|
| Hostel:
|
| Semester 1 = 16750
| Semester 2-8 = 8250
|
| Mess charges are separately notified.
|
*/

function buildNitSikkimPreview() {
  const branch_fee =
    baseBranchFee({
      college_id:
        'national-institute-of-technology-sikkim',

      academic_year:
        2025,

      source_label:
        'NIT Sikkim Official B.Tech Fee Structure 2025-2029 Batch',

      source_url:
        'https://nitsikkim.ac.in/documents/Fee%20Structure/2025_jan/B.Tech%20Fee%20structure%20for%202025-26.pdf',

      verification_status:
        'verified'
    });

  const fullTuition = [
    62500,
    62500,
    62500,
    62500,
    62500,
    62500,
    62500,
    62500
  ];

  const remissionTuition = [
    20834,
    20834,
    20834,
    20834,
    20834,
    20834,
    20834,
    20834
  ];

  const waivedTuition = [
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0
  ];

  const fullInstituteTotals = [
    71368,
    71368,
    71368,
    71368,
    71368,
    71368,
    71368,
    71368
  ];

  const remissionInstituteTotals = [
    29702,
    29702,
    29702,
    29702,
    29702,
    29702,
    29702,
    29702
  ];

  const waiverInstituteTotals = [
    8868,
    8868,
    8868,
    8868,
    8868,
    8868,
    8868,
    8868
  ];

  const hostelFees = [
    16750,
    8250,
    8250,
    8250,
    8250,
    8250,
    8250,
    8250
  ];

  const fee_variants = [];

  function addCategory({
    category,
    income_min,
    income_max,
    tuition,
    instituteTotals
  }) {
    for (
      let i = 0;
      i < 8;
      i++
    ) {
      const semester =
        i + 1;

      const tuitionFee =
        tuition[i];

      const instituteTotal =
        instituteTotals[i];

      const otherInstituteCharges =
        instituteTotal -
        tuitionFee;

      /*
      |--------------------------------------------------------------------------
      | DAY SCHOLAR
      |--------------------------------------------------------------------------
      */

      fee_variants.push({
        semester,

        fee_period:
          'semester',

        student_category:
          category,

        income_min,
        income_max,

        residence_type:
          'day_scholar',

        room_type:
          null,

        tuition_fee:
          tuitionFee,

        admission_fee:
          null,

        institute_fee:
          otherInstituteCharges,

        hostel_fee:
          null,

        mess_fee:
          null,

        caution_deposit:
          null,

        other_fee:
          null,

        total_fee:
          instituteTotal,

        is_one_time_included:
          false,

        verification_status:
          'verified'
      });

      /*
      |--------------------------------------------------------------------------
      | HOSTELLER
      |--------------------------------------------------------------------------
      */

      fee_variants.push({
        semester,

        fee_period:
          'semester',

        student_category:
          category,

        income_min,
        income_max,

        residence_type:
          'hosteller',

        room_type:
          null,

        tuition_fee:
          tuitionFee,

        admission_fee:
          null,

        institute_fee:
          otherInstituteCharges,

        hostel_fee:
          hostelFees[i],

        mess_fee:
          null,

        caution_deposit:
          null,

        other_fee:
          null,

        total_fee:
          instituteTotal +
          hostelFees[i],

        is_one_time_included:
          semester === 1,

        verification_status:
          'verified'
      });
    }
  }

  /*
  |--------------------------------------------------------------------------
  | FULL FEE PAYER
  |--------------------------------------------------------------------------
  */

  addCategory({
    category:
      'GEN/OBC/EWS',

    income_min:
      500000,

    income_max:
      null,

    tuition:
      fullTuition,

    instituteTotals:
      fullInstituteTotals
  });

  /*
  |--------------------------------------------------------------------------
  | 2/3 TUITION REMISSION
  |--------------------------------------------------------------------------
  */

  addCategory({
    category:
      'GEN/OBC/EWS',

    income_min:
      100000,

    income_max:
      500000,

    tuition:
      remissionTuition,

    instituteTotals:
      remissionInstituteTotals
  });

  /*
  |--------------------------------------------------------------------------
  | FULL TUITION WAIVER
  |--------------------------------------------------------------------------
  */

  addCategory({
    category:
      'SC/ST/PwD or income below 1 lakh',

    income_min:
      null,

    income_max:
      100000,

    tuition:
      waivedTuition,

    instituteTotals:
      waiverInstituteTotals
  });

  return {
    filename:
      'nit-sikkim-fee-preview.json',

    branch_fee,
    fee_variants
  };
}

`;

/*
|--------------------------------------------------------------------------
| INSERT BUILDER BEFORE validatePreview()
|--------------------------------------------------------------------------
*/

const validationFunction =
  'function validatePreview(';

const validationIndex =
  code.indexOf(
    validationFunction
  );

if (
  validationIndex === -1
) {
  throw new Error(
    'validatePreview() not found'
  );
}

code =
  code.slice(
    0,
    validationIndex
  ) +
  builder +
  code.slice(
    validationIndex
  );

/*
|--------------------------------------------------------------------------
| REGISTER BUILDER
|--------------------------------------------------------------------------
*/

const existingBuilder =
  '  buildNitMizoramPreview';

const builderIndex =
  code.indexOf(
    existingBuilder
  );

if (
  builderIndex === -1
) {
  throw new Error(
    'buildNitMizoramPreview not found in builders array'
  );
}

const lineEnd =
  code.indexOf(
    '\n',
    builderIndex
  );

if (
  lineEnd === -1
) {
  throw new Error(
    'Could not locate builders array line end'
  );
}

const currentLine =
  code.slice(
    builderIndex,
    lineEnd
  );

if (
  currentLine.trimEnd().endsWith(',')
) {
  code =
    code.slice(
      0,
      lineEnd + 1
    ) +
    '  buildNitSikkimPreview,\n' +
    code.slice(
      lineEnd + 1
    );

} else {
  code =
    code.slice(
      0,
      lineEnd
    ) +
    ',\n  buildNitSikkimPreview' +
    code.slice(
      lineEnd
    );
}

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
  'NIT SIKKIM BUILDER INSTALLED'
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
  'NIT Sikkim builder added.'
);

console.log(
  'Database has NOT been modified.'
);
