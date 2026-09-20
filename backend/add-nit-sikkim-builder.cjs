const fs = require('fs');

const FILE =
  './build-btech-fee-previews.js';

const BACKUP =
  './build-btech-fee-previews.before-nit-sikkim.js';

let code =
  fs.readFileSync(
    FILE,
    'utf8'
  );

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
console.log('Backup created:');
console.log(BACKUP);

/*
|--------------------------------------------------------------------------
| NIT SIKKIM BUILDER
|--------------------------------------------------------------------------
*/

const builder = `

/*
|--------------------------------------------------------------------------
| NIT SIKKIM
|--------------------------------------------------------------------------
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
    62500,62500,62500,62500,
    62500,62500,62500,62500
  ];

  const remissionTuition = [
    20834,20834,20834,20834,
    20834,20834,20834,20834
  ];

  const waivedTuition = [
    0,0,0,0,0,0,0,0
  ];

  const fullInstituteTotals = [
    71368,71368,71368,71368,
    71368,71368,71368,71368
  ];

  const remissionInstituteTotals = [
    29702,29702,29702,29702,
    29702,29702,29702,29702
  ];

  const waiverInstituteTotals = [
    8868,8868,8868,8868,
    8868,8868,8868,8868
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
  | FULL FEE
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
  | 2/3 REMISSION
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
  | FULL WAIVER
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
| INSERT BUILDER BEFORE VALIDATION
|--------------------------------------------------------------------------
*/

const validationMarker =
  '/*\n|--------------------------------------------------------------------------\n| VALIDATION';

const validationIndex =
  code.indexOf(
    validationMarker
  );

if (
  validationIndex === -1
) {
  throw new Error(
    'VALIDATION marker not found'
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
| ADD TO BUILDERS ARRAY WITHOUT REGEX
|--------------------------------------------------------------------------
*/

const buildersStartMarker =
  'const builders = [';

const buildersStart =
  code.indexOf(
    buildersStartMarker
  );

if (
  buildersStart === -1
) {
  throw new Error(
    'builders array start not found'
  );
}

const buildersEnd =
  code.indexOf(
    '];',
    buildersStart
  );

if (
  buildersEnd === -1
) {
  throw new Error(
    'builders array end not found'
  );
}

const buildersBlock =
  code.slice(
    buildersStart,
    buildersEnd + 2
  );

if (
  !buildersBlock.includes(
    'buildNitSikkimPreview'
  )
) {
  const insertionPoint =
    buildersEnd;

  const before =
    code.slice(
      0,
      insertionPoint
    );

  const after =
    code.slice(
      insertionPoint
    );

  const needsComma =
    !before
      .trimEnd()
      .endsWith(',');

  code =
    before +
    (
      needsComma
        ? ','
        : ''
    ) +
    '\n  buildNitSikkimPreview\n' +
    after;
}

/*
|--------------------------------------------------------------------------
| WRITE
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
