import fs from 'node:fs';

const file =
  './src/services/cwRecDataV1.js';

const backup =
  './src/services/cwRecDataV1.js.before-csab-support';

let source =
  fs.readFileSync(
    file,
    'utf8'
  );

fs.copyFileSync(
  file,
  backup
);

console.log(
  `✅ Backup: ${backup}`
);

function fail(message) {
  console.error(
    `❌ ${message}`
  );
  process.exit(1);
}


/*
|--------------------------------------------------------------------------
| 1. ROUND NORMALIZATION
|--------------------------------------------------------------------------
*/

const oldRound =
  `if (
    examId === 'uptac'
  ) {`;

const newRound =
  `if (
    [
      'uptac',
      'csab',
    ].includes(
      examId
    )
  ) {`;

if (
  !source.includes(
    oldRound
  )
) {
  fail(
    'Round normalization block not found'
  );
}

source =
  source.replace(
    oldRound,
    newRound
  );


/*
|--------------------------------------------------------------------------
| 2. ADD CSAB TO VALID EXAMS
|--------------------------------------------------------------------------
*/

const validationNeedle =
  `      'jee-main',
      'jee-advanced',
      'uptac',`;

const validationReplacement =
  `      'jee-main',
      'jee-advanced',
      'csab',
      'uptac',`;

if (
  !source.includes(
    validationNeedle
  )
) {
  fail(
    'Exam validation block not found'
  );
}

source =
  source.replace(
    validationNeedle,
    validationReplacement
  );


/*
|--------------------------------------------------------------------------
| 3. JEE MUST BE JOSAA-ONLY
|--------------------------------------------------------------------------
*/

const mixedCounselling =
  `      AND co.counselling_type
        IN (
          'JOSAA',
          'CSAB_SPECIAL',
          'CSAB_SUPERNUMERARY',
          'CSAB_NEUT'
        )`;

const mixedCount =
  source
    .split(
      mixedCounselling
    )
    .length - 1;

if (
  mixedCount !== 2
) {
  fail(
    `Expected 2 mixed JEE counselling blocks, found ${mixedCount}`
  );
}

source =
  source
    .split(
      mixedCounselling
    )
    .join(
      `      AND co.counselling_type =
        'JOSAA'`
    );


/*
|--------------------------------------------------------------------------
| 4. ADD CSAB SPECIAL QUERY BLOCK
|--------------------------------------------------------------------------
*/

const uptacMarker =
  `  /*
=======================================================
     UPTAC
======================================================= */`;

if (
  source.includes(
    'CSAB SPECIAL\n======================================================= */'
  )
) {
  fail(
    'CSAB block already appears to exist'
  );
}

if (
  !source.includes(
    uptacMarker
  )
) {
  fail(
    'UPTAC marker not found'
  );
}

const csabBlock =
  `  /*
=======================================================
     CSAB SPECIAL
======================================================= */

  if (
    normalizedExam ===
    'csab'
  ) {
    query += \`

      AND co.counselling_type =
        'CSAB_SPECIAL'

      AND co.verification_status =
        'VERIFIED'

      AND co.is_verified =
        true

      AND co.opening_rank
        IS NOT NULL

      AND co.closing_rank
        IS NOT NULL

      AND co.opening_rank <=
        co.closing_rank

    \`;
  }


${uptacMarker}`;

source =
  source.replace(
    uptacMarker,
    csabBlock
  );


/*
|--------------------------------------------------------------------------
| 5. JOSAA HOME-STATE BLOCK MUST NOT RUN FOR CSAB
|--------------------------------------------------------------------------
*/

const oldJosaaCondition =
  `    normalizedExam !== 'uptac' &&
    !effectiveQuota &&
    homeState`;

const newJosaaCondition =
  `    [
      'jee-main',
      'jee-advanced',
    ].includes(
      normalizedExam
    ) &&
    !effectiveQuota &&
    homeState`;

if (
  !source.includes(
    oldJosaaCondition
  )
) {
  fail(
    'Existing JOSAA home-state condition not found'
  );
}

source =
  source.replace(
    oldJosaaCondition,
    newJosaaCondition
  );


/*
|--------------------------------------------------------------------------
| 6. ADD CSAB HOME-STATE / SPECIAL QUOTA ELIGIBILITY
|--------------------------------------------------------------------------
*/

const quotaMarker =
  `  /*
=======================================================
     OPTIONAL QUOTA
======================================================= */`;

if (
  !source.includes(
    quotaMarker
  )
) {
  fail(
    'OPTIONAL QUOTA marker not found'
  );
}

const csabQuotaBlock =
  `  /*
=======================================================
     CSAB HOME-STATE QUOTA ELIGIBILITY
======================================================= */

  if (
    normalizedExam === 'csab' &&
    !effectiveQuota &&
    homeState
  ) {
    params.push(
      String(homeState).trim()
    );


    const csabHomeStateParam =
      \`$\${paramIndex++}\`;


    query += \`

      AND (

        /*
        |------------------------------------------------
        | ALL INDIA
        |------------------------------------------------
        */

        co.quota = 'All India'


        /*
        |------------------------------------------------
        | NORMAL HOME STATE
        |------------------------------------------------
        */

        OR (

          co.quota =
            'Home State'

          AND LOWER(
            TRIM(
              c.state::text
            )
          ) =
          LOWER(
            TRIM(
              \${csabHomeStateParam}::text
            )
          )

        )


        /*
        |------------------------------------------------
        | OTHER STATE
        |------------------------------------------------
        */

        OR (

          co.quota =
            'Other State'

          AND LOWER(
            TRIM(
              c.state::text
            )
          ) <>
          LOWER(
            TRIM(
              \${csabHomeStateParam}::text
            )
          )

        )


        /*
        |------------------------------------------------
        | GOA SPECIAL
        |------------------------------------------------
        */

        OR (

          co.quota =
            'Home State for Goa'

          AND LOWER(
            TRIM(
              \${csabHomeStateParam}::text
            )
          ) =
            'goa'

        )


        /*
        |------------------------------------------------
        | JAMMU & KASHMIR SPECIAL
        |------------------------------------------------
        */

        OR (

          co.quota =
            'Jammu & Kashmir (UT)'

          AND LOWER(
            TRIM(
              \${csabHomeStateParam}::text
            )
          ) IN (
            'jammu and kashmir',
            'jammu & kashmir',
            'j&k',
            'jk'
          )

        )


        /*
        |------------------------------------------------
        | LADAKH SPECIAL
        |------------------------------------------------
        */

        OR (

          co.quota =
            'Ladakh (UT)'

          AND LOWER(
            TRIM(
              \${csabHomeStateParam}::text
            )
          ) =
            'ladakh'

        )

      )

    \`;
  }


${quotaMarker}`;

source =
  source.replace(
    quotaMarker,
    csabQuotaBlock
  );


fs.writeFileSync(
  file,
  source,
  'utf8'
);

console.log('');
console.log('✅ examId=csab enabled');
console.log('✅ JEE Main isolated to JOSAA');
console.log('✅ JEE Advanced isolated to JOSAA');
console.log('✅ CSAB_SPECIAL isolated');
console.log('✅ CSAB All India supported');
console.log('✅ CSAB Home State supported');
console.log('✅ CSAB Other State supported');
console.log('✅ Goa special quota supported');
console.log('✅ J&K special quota supported');
console.log('✅ Ladakh special quota supported');
console.log('✅ Existing gender filtering reused');
console.log('✅ CW-REC scoring untouched');
