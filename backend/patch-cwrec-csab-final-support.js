import fs from 'node:fs';

const file =
  './src/services/cwRecDataV1.js';

const backup =
  './src/services/cwRecDataV1.js.before-csab-final-support';

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
| 1. ADD CSAB TO SUPPORTED EXAMS
|--------------------------------------------------------------------------
*/

if (
  !source.includes(
    "'csab',"
  ) ||
  !source.includes(
    "'uptac',"
  )
) {
  fail(
    'Base exam identifiers not found'
  );
}

const validationPattern =
  /(['"]jee-main['"]\s*,\s*['"]jee-advanced['"]\s*,\s*)(['"]uptac['"]\s*,)/m;

if (
  !validationPattern.test(
    source
  )
) {
  fail(
    'Supported-exam validation block not found'
  );
}

source =
  source.replace(
    validationPattern,
    `$1'csab',
      $2`
  );


/*
|--------------------------------------------------------------------------
| 2. JEE MAIN / ADVANCED = JOSAA ONLY
|--------------------------------------------------------------------------
*/

const mixedPattern =
  /AND\s+co\.counselling_type\s+IN\s*\(\s*'JOSAA'\s*,\s*'CSAB_SPECIAL'\s*,\s*'CSAB_SUPERNUMERARY'\s*,\s*'CSAB_NEUT'\s*\)/g;

const mixedMatches =
  source.match(
    mixedPattern
  ) ?? [];

console.log(
  `Mixed JEE counselling blocks found: ${mixedMatches.length}`
);

if (
  mixedMatches.length !== 2
) {
  fail(
    `Expected 2 mixed JEE blocks, found ${mixedMatches.length}`
  );
}

source =
  source.replace(
    mixedPattern,
    `AND co.counselling_type =
        'JOSAA'`
  );


/*
|--------------------------------------------------------------------------
| 3. ADD DEDICATED CSAB SPECIAL BLOCK
|--------------------------------------------------------------------------
*/

const uptacMarkerPattern =
  /\/\*\s*=+\s*\n\s*UPTAC\s*\n\s*=+\s*\*\//m;

if (
  !uptacMarkerPattern.test(
    source
  )
) {
  fail(
    'UPTAC section marker not found'
  );
}

const csabBlock =
`/*
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


  /*
=======================================================
     UPTAC
======================================================= */`;

source =
  source.replace(
    uptacMarkerPattern,
    csabBlock
  );


/*
|--------------------------------------------------------------------------
| 4. JOSAA HOME-STATE BLOCK ONLY FOR JEE
|--------------------------------------------------------------------------
*/

const josaaConditionPattern =
  /normalizedExam\s*!==\s*['"]uptac['"]\s*&&\s*!effectiveQuota\s*&&\s*homeState/m;

if (
  !josaaConditionPattern.test(
    source
  )
) {
  fail(
    'Existing JOSAA home-state condition not found'
  );
}

source =
  source.replace(
    josaaConditionPattern,
`[
      'jee-main',
      'jee-advanced',
    ].includes(
      normalizedExam
    ) &&
    !effectiveQuota &&
    homeState`
  );


/*
|--------------------------------------------------------------------------
| 5. ADD CSAB HOME-STATE / SPECIAL QUOTA BLOCK
|--------------------------------------------------------------------------
*/

const optionalQuotaMarkerPattern =
  /\/\*\s*=+\s*\n\s*OPTIONAL QUOTA\s*\n\s*=+\s*\*\//m;

if (
  !optionalQuotaMarkerPattern.test(
    source
  )
) {
  fail(
    'OPTIONAL QUOTA marker not found'
  );
}

const csabQuotaBlock =
`/*
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

        co.quota =
          'All India'


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


  /*
=======================================================
     OPTIONAL QUOTA
======================================================= */`;

source =
  source.replace(
    optionalQuotaMarkerPattern,
    csabQuotaBlock
  );


fs.writeFileSync(
  file,
  source,
  'utf8'
);

console.log('');
console.log('✅ CSAB added to validation');
console.log('✅ JEE Main now JOSAA-only');
console.log('✅ JEE Advanced now JOSAA-only');
console.log('✅ CSAB_SPECIAL isolated');
console.log('✅ CSAB home-state eligibility added');
console.log('✅ CSAB special quotas added');
console.log('✅ Gender logic preserved');
console.log('✅ CW-REC scoring untouched');
