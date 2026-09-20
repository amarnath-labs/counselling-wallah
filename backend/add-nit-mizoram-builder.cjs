const fs = require('fs');

const FILE = './build-btech-fee-previews.js';

if (!fs.existsSync(FILE)) {
  console.error(
    'ERROR: build-btech-fee-previews.js not found'
  );
  process.exit(1);
}

let code = fs.readFileSync(
  FILE,
  'utf8'
).replace(/^\uFEFF/, '');

/*
|--------------------------------------------------------------------------
| SAFETY
|--------------------------------------------------------------------------
*/

if (
  code.includes(
    'function buildNitMizoramPreview()'
  )
) {
  console.log('');
  console.log(
    'NIT Mizoram function already exists.'
  );
  console.log(
    'No duplicate function inserted.'
  );
  process.exit(0);
}

/*
|--------------------------------------------------------------------------
| NIT MIZORAM BUILDER
|--------------------------------------------------------------------------
*/

const mizoramFunction = `

/*
|--------------------------------------------------------------------------
| NIT MIZORAM
|--------------------------------------------------------------------------
|
| Official B.Tech semester fee structure.
|
| Fee groups:
|
| 1. GEN/OBC - parental income above 5 lakh
| 2. GEN/OBC - parental income 1 lakh to 5 lakh
| 3. GEN/OBC - parental income below 1 lakh
| 4. SC/ST/PH
|
| IMPORTANT:
|
| Tuition and semester grand totals are directly mapped.
|
| The difference between total and tuition is NOT automatically labelled
| as hostel/institute/mess because the source contains multiple academic
| and other components.
|
| Therefore the remaining amount is stored in other_fee.
|
|--------------------------------------------------------------------------
*/

function buildNitMizoramPreview() {

  const branch_fee =
    baseBranchFee({

      college_id:
        'national-institute-of-technology-mizoram',

      academic_year:
        2025,

      source_label:
        'NIT Mizoram Official B.Tech Fee Structure',

      source_url:
        'https://nitmz.ac.in/',

      verification_status:
        'pending_review'
    });


  /*
  |--------------------------------------------------------------------------
  | FULL TUITION
  | GEN/OBC
  | PARENTAL INCOME ABOVE 5 LAKH
  |--------------------------------------------------------------------------
  */

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

  const fullTotals = [
    69400,
    67100,
    67650,
    67350,
    67650,
    67350,
    67650,
    68850
  ];


  /*
  |--------------------------------------------------------------------------
  | TWO-THIRD TUITION REMISSION
  | GEN/OBC
  | PARENTAL INCOME 1 LAKH TO 5 LAKH
  |--------------------------------------------------------------------------
  */

  const remissionTuition = [
    20833,
    20833,
    20833,
    20833,
    20833,
    20833,
    20833,
    20833
  ];

  const remissionTotals = [
    27733,
    25433,
    25983,
    25683,
    25983,
    25683,
    25983,
    27183
  ];


  /*
  |--------------------------------------------------------------------------
  | FULL TUITION WAIVER
  | GEN/OBC
  | PARENTAL INCOME BELOW 1 LAKH
  |--------------------------------------------------------------------------
  */

  const lowIncomeTuition = [
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0
  ];

  const lowIncomeTotals = [
    6900,
    4600,
    5150,
    4850,
    5150,
    4850,
    5150,
    6350
  ];


  /*
  |--------------------------------------------------------------------------
  | SC/ST/PH
  | FULL TUITION WAIVER
  |--------------------------------------------------------------------------
  */

  const reservedTuition = [
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0
  ];

  const reservedTotals = [
    6900,
    4600,
    5150,
    4850,
    5150,
    4850,
    5150,
    6350
  ];


  const fee_variants = [];


  /*
  |--------------------------------------------------------------------------
  | COMMON 8-SEMESTER GENERATOR
  |--------------------------------------------------------------------------
  */

  function addSemesterVariants({
    category,
    income_min,
    income_max,
    tuition,
    totals
  }) {

    for (
      let index = 0;
      index < 8;
      index++
    ) {

      const semester =
        index + 1;

      const tuitionFee =
        tuition[index];

      const totalFee =
        totals[index];

      const remainingFee =
        totalFee -
        tuitionFee;


      fee_variants.push({

        semester,

        fee_period:
          'semester',

        student_category:
          category,

        income_min,

        income_max,

        /*
        |--------------------------------------------------------------------------
        | Hostel status is not assumed from this table.
        |--------------------------------------------------------------------------
        */

        residence_type:
          null,

        room_type:
          null,


        /*
        |--------------------------------------------------------------------------
        | VERIFIED NUMERIC VALUES
        |--------------------------------------------------------------------------
        */

        tuition_fee:
          tuitionFee,

        admission_fee:
          null,

        institute_fee:
          null,

        hostel_fee:
          null,

        mess_fee:
          null,

        caution_deposit:
          null,


        /*
        |--------------------------------------------------------------------------
        | Difference between semester total and tuition.
        |
        | This may include multiple components.
        |--------------------------------------------------------------------------
        */

        other_fee:
          remainingFee,

        total_fee:
          totalFee,


        /*
        |--------------------------------------------------------------------------
        | Exact one-time split has not been independently mapped.
        |--------------------------------------------------------------------------
        */

        is_one_time_included:
          false,

        verification_status:
          'pending_review'
      });
    }
  }


  /*
  |--------------------------------------------------------------------------
  | CATEGORY 1
  | GEN/OBC > 5 LAKH
  |--------------------------------------------------------------------------
  */

  addSemesterVariants({

    category:
      'GEN/OBC',

    income_min:
      500000,

    income_max:
      null,

    tuition:
      fullTuition,

    totals:
      fullTotals
  });


  /*
  |--------------------------------------------------------------------------
  | CATEGORY 2
  | GEN/OBC 1-5 LAKH
  |--------------------------------------------------------------------------
  */

  addSemesterVariants({

    category:
      'GEN/OBC',

    income_min:
      100000,

    income_max:
      500000,

    tuition:
      remissionTuition,

    totals:
      remissionTotals
  });


  /*
  |--------------------------------------------------------------------------
  | CATEGORY 3
  | GEN/OBC BELOW 1 LAKH
  |--------------------------------------------------------------------------
  */

  addSemesterVariants({

    category:
      'GEN/OBC',

    income_min:
      null,

    income_max:
      100000,

    tuition:
      lowIncomeTuition,

    totals:
      lowIncomeTotals
  });


  /*
  |--------------------------------------------------------------------------
  | CATEGORY 4
  | SC/ST/PH
  |--------------------------------------------------------------------------
  */

  addSemesterVariants({

    category:
      'SC/ST/PH',

    income_min:
      null,

    income_max:
      null,

    tuition:
      reservedTuition,

    totals:
      reservedTotals
  });


  /*
  |--------------------------------------------------------------------------
  | FINAL PREVIEW
  |--------------------------------------------------------------------------
  */

  return {

    filename:
      'nit-mizoram-fee-preview.json',

    branch_fee,

    fee_variants
  };
}

`;


/*
|--------------------------------------------------------------------------
| FIND BUILDERS ARRAY
|--------------------------------------------------------------------------
*/

const buildersRegex =
  /const\s+builders\s*=\s*\[([\s\S]*?)\];/;

const match =
  code.match(buildersRegex);

if (!match) {

  console.error('');
  console.error(
    'ERROR: builders array not found.'
  );

  console.error(
    'Existing file has NOT been modified.'
  );

  process.exit(1);
}


/*
|--------------------------------------------------------------------------
| BACKUP ORIGINAL FILE
|--------------------------------------------------------------------------
*/

fs.copyFileSync(
  FILE,
  './build-btech-fee-previews.backup.js'
);

console.log('');
console.log(
  'Backup created:'
);

console.log(
  './build-btech-fee-previews.backup.js'
);


/*
|--------------------------------------------------------------------------
| INSERT FUNCTION BEFORE BUILDERS ARRAY
|--------------------------------------------------------------------------
*/

const buildersPosition =
  match.index;

code =
  code.slice(
    0,
    buildersPosition
  ) +

  mizoramFunction +

  '\n' +

  code.slice(
    buildersPosition
  );


/*
|--------------------------------------------------------------------------
| ADD BUILDER
|--------------------------------------------------------------------------
*/

code =
  code.replace(
    /const\s+builders\s*=\s*\[([\s\S]*?)\];/,

    (
      full,
      inside
    ) => {

      if (
        inside.includes(
          'buildNitMizoramPreview'
        )
      ) {
        return full;
      }

      const trimmed =
        inside.trimEnd();

      let updated;

      if (
        trimmed.trim().length === 0
      ) {

        updated =
          '\n  buildNitMizoramPreview\n';

      } else {

        const withoutTrailingComma =
          trimmed.replace(
            /,\s*$/,
            ''
          );

        updated =
          withoutTrailingComma +
          ',\n  buildNitMizoramPreview\n';
      }

      return (
        'const builders = [' +
        updated +
        '];'
      );
    }
  );


/*
|--------------------------------------------------------------------------
| WRITE MODIFIED MASTER
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
  'NIT MIZORAM BUILDER INSTALLED'
);

console.log(
  '======================================='
);

console.log('');
console.log(
  'Modified:'
);

console.log(
  FILE
);

console.log('');
console.log(
  'Existing builders preserved.'
);

console.log(
  'NIT Mizoram builder added.'
);

console.log(
  'Database has NOT been modified.'
);
