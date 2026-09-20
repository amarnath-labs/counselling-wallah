import fs from 'node:fs';

const FILE =
  './build-btech-fee-previews.js';

const BACKUP =
  './build-btech-fee-previews.before-nit-rourkela.js';

let code =
  fs.readFileSync(
    FILE,
    'utf8'
  );

if (
  code.includes(
    'function buildNitRourkelaPreview()'
  )
) {
  console.log(
    'NIT Rourkela builder already exists.'
  );

  process.exit(0);
}

fs.copyFileSync(
  FILE,
  BACKUP
);

console.log('');
console.log('Backup created:');
console.log(BACKUP);

const builder = `

/*
|--------------------------------------------------------------------------
| NIT ROURKELA
|--------------------------------------------------------------------------
|
| Domestic B.Tech fee structure only.
|
| Tuition:
| - Full fee: 62500 / semester
| - Income 1-5 lakh: 20833 / semester
| - SC/ST/PH or income below 1 lakh: 0
|
| Other recurring:
| - Other fee: 5000
| - Student activity: 2000
| - Medical: 2000
| - Hostel seat rent: 5000
| - Hall establishment: 5000 where applicable
| - Mess advance: 30000 approximate
|
| One-time:
| - Admission fee: 2500
| - Caution deposit: 10000 refundable
|
| The separate 7500 tuition blocks are intentionally excluded.
|
*/

function buildNitRourkelaPreview() {
  const branch_fee =
    baseBranchFee({
      college_id:
        'national-institute-of-technology-rourkela',

      academic_year:
        2026,

      source_label:
        'NIT Rourkela Official Fee Structure',

      source_url:
        'https://www.nitrkl.ac.in/docs/Announcement/14072026180430277.pdf',

      verification_status:
        'pending_review'
    });

  const fee_variants = [];

  const groups = [
    {
      category:
        'GEN/OBC/EWS',

      income_min:
        500000,

      income_max:
        null,

      tuition:
        62500
    },

    {
      category:
        'GEN/OBC/EWS',

      income_min:
        100000,

      income_max:
        500000,

      tuition:
        20833
    },

    {
      category:
        'SC/ST/PH or income below 1 lakh',

      income_min:
        null,

      income_max:
        100000,

      tuition:
        0
    }
  ];

  for (const group of groups) {
    for (
      let semester = 1;
      semester <= 8;
      semester++
    ) {
      const firstSemester =
        semester === 1;

      const lastSemester =
        semester === 8;

      const admissionFee =
        firstSemester
          ? 2500
          : null;

      const cautionDeposit =
        firstSemester
          ? 10000
          : null;

      const otherAcademic =
        5000 +
        2000 +
        2000;

      const hallEstablishment =
        semester >= 3 &&
        semester <= 7
          ? 5000
          : 0;

      const souvenirFee =
        lastSemester
          ? 500
          : 0;

      const convocationFee =
        lastSemester
          ? 2500
          : 0;

      const hostelFee =
        5000 +
        hallEstablishment;

      const messAdvance =
        30000;

      const total =
        group.tuition +
        otherAcademic +
        hostelFee +
        messAdvance +
        (admissionFee || 0) +
        (cautionDeposit || 0) +
        souvenirFee +
        convocationFee;

      fee_variants.push({
        semester,

        fee_period:
          'semester',

        student_category:
          group.category,

        income_min:
          group.income_min,

        income_max:
          group.income_max,

        residence_type:
          'hosteller',

        room_type:
          null,

        tuition_fee:
          group.tuition,

        admission_fee:
          admissionFee,

        institute_fee:
          otherAcademic,

        hostel_fee:
          hostelFee,

        mess_fee:
          messAdvance,

        caution_deposit:
          cautionDeposit,

        other_fee:
          souvenirFee +
          convocationFee,

        total_fee:
          total,

        is_one_time_included:
          firstSemester,

        verification_status:
          'pending_review'
      });
    }
  }

  return {
    filename:
      'nit-rourkela-fee-preview.json',

    branch_fee,
    fee_variants
  };
}

`;

const validationMarker =
  'function validatePreview(';

const validationIndex =
  code.indexOf(
    validationMarker
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

const anchor =
  '  buildNitSikkimPreview';

const anchorIndex =
  code.indexOf(anchor);

if (
  anchorIndex === -1
) {
  throw new Error(
    'buildNitSikkimPreview not found in builders array'
  );
}

const lineEnd =
  code.indexOf(
    '\n',
    anchorIndex
  );

if (
  lineEnd === -1
) {
  throw new Error(
    'builders array line end not found'
  );
}

const currentLine =
  code.slice(
    anchorIndex,
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
    '  buildNitRourkelaPreview,\n' +
    code.slice(
      lineEnd + 1
    );
} else {
  code =
    code.slice(
      0,
      lineEnd
    ) +
    ',\n  buildNitRourkelaPreview' +
    code.slice(
      lineEnd
    );
}

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
  'NIT ROURKELA BUILDER INSTALLED'
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
  'NIT Rourkela builder added.'
);

console.log(
  'Database has NOT been modified.'
);
