import fs from 'node:fs';

const DATA_FILE =
  './src/services/cwRecDataV1.js';

const ROUTE_FILE =
  './src/routes/cwRecV1-dev.js';


function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}


function countOccurrences(
  source,
  needle
) {
  return source
    .split(needle)
    .length - 1;
}


function replaceExact(
  source,
  oldText,
  newText,
  expectedCount,
  label
) {
  const count =
    countOccurrences(
      source,
      oldText
    );

  if (
    count !== expectedCount
  ) {
    fail(
      `${label}: expected ${expectedCount} occurrence(s), found ${count}`
    );
  }

  return source
    .split(oldText)
    .join(newText);
}


function backupFile(
  file
) {
  const backup =
    `${file}.before-home-state-quota`;

  fs.copyFileSync(
    file,
    backup
  );

  console.log(
    `✅ Backup: ${backup}`
  );
}


/*
|--------------------------------------------------------------------------
| READ
|--------------------------------------------------------------------------
*/

let data =
  fs.readFileSync(
    DATA_FILE,
    'utf8'
  );

let route =
  fs.readFileSync(
    ROUTE_FILE,
    'utf8'
  );


const dataEol =
  data.includes('\r\n')
    ? '\r\n'
    : '\n';

const routeEol =
  route.includes('\r\n')
    ? '\r\n'
    : '\n';


backupFile(
  DATA_FILE
);

backupFile(
  ROUTE_FILE
);


/*
|--------------------------------------------------------------------------
| 1. cwRecDataV1.js
| ADD homeState PARAMETER
|--------------------------------------------------------------------------
*/

if (
  !data.includes(
    '  homeState = null,'
  )
) {
  const oldSignature =
    [
      "  quota = null,",
      "  gender = null,",
      "  limit = 250,",
    ].join(
      dataEol
    );

  const newSignature =
    [
      "  quota = null,",
      "  gender = null,",
      "  homeState = null,",
      "  limit = 250,",
    ].join(
      dataEol
    );

  data =
    replaceExact(
      data,
      oldSignature,
      newSignature,
      1,
      'fetchCWRecRows signature'
    );
}


/*
|--------------------------------------------------------------------------
| 2. cwRecDataV1.js
| ADD EFFECTIVE UPTAC QUOTA
|--------------------------------------------------------------------------
*/

if (
  !data.includes(
    'UPTAC HOME-STATE QUOTA ELIGIBILITY'
  )
) {
  const quotaMarker =
    [
      '  /* =======================================================',
      '     OPTIONAL QUOTA',
      '  ======================================================= */',
    ].join(
      dataEol
    );

  const quotaEligibility =
    [
      '  /* =======================================================',
      '     UPTAC HOME-STATE QUOTA ELIGIBILITY',
      '  ======================================================= */',
      '',
      '  let effectiveQuota =',
      '    quota',
      '      ? String(quota).trim()',
      '      : null;',
      '',
      '',
      '  if (',
      "    normalizedExam === 'uptac' &&",
      '    !effectiveQuota &&',
      '    homeState',
      '  ) {',
      '    const normalizedHomeState =',
      '      normalize(',
      '        homeState',
      '      );',
      '',
      '',
      '    const isUttarPradesh =',
      "      normalizedHomeState === 'uttar pradesh' ||",
      "      normalizedHomeState === 'up' ||",
      "      normalizedHomeState === 'u p';",
      '',
      '',
      '    effectiveQuota =',
      '      isUttarPradesh',
      "        ? 'Home State'",
      "        : 'All India';",
      '  }',
      '',
      '',
      quotaMarker,
    ].join(
      dataEol
    );

  data =
    replaceExact(
      data,
      quotaMarker,
      quotaEligibility,
      1,
      'UPTAC quota eligibility insertion'
    );
}


/*
|--------------------------------------------------------------------------
| 3. cwRecDataV1.js
| MAKE OPTIONAL QUOTA USE effectiveQuota
|--------------------------------------------------------------------------
*/

const oldQuotaBlock =
  [
    '  if (',
    '    quota',
    '  ) {',
    '    params.push(',
    '      String(',
    '        quota',
    '      ).trim()',
    '    );',
  ].join(
    dataEol
  );

const newQuotaBlock =
  [
    '  if (',
    '    effectiveQuota',
    '  ) {',
    '    params.push(',
    '      effectiveQuota',
    '    );',
  ].join(
    dataEol
  );


if (
  data.includes(
    oldQuotaBlock
  )
) {
  data =
    replaceExact(
      data,
      oldQuotaBlock,
      newQuotaBlock,
      1,
      'effectiveQuota SQL filter'
    );
}
else if (
  !data.includes(
    '    effectiveQuota'
  )
) {
  fail(
    'Could not find OPTIONAL QUOTA block'
  );
}


/*
|--------------------------------------------------------------------------
| WRITE DATA SERVICE
|--------------------------------------------------------------------------
*/

fs.writeFileSync(
  DATA_FILE,
  data,
  'utf8'
);


/*
|--------------------------------------------------------------------------
| 4. cwRecV1-dev.js
| READ homeState IN BOTH ROUTES
|--------------------------------------------------------------------------
*/

if (
  !route.includes(
    '      const homeState ='
  )
) {
  const genderInput =
    [
      '      const gender =',
      '        req.query.gender ??',
      '        null;',
    ].join(
      routeEol
    );

  const genderAndHomeState =
    [
      '      const gender =',
      '        req.query.gender ??',
      '        null;',
      '',
      '',
      '      const homeState =',
      '        req.query.homeState ??',
      '        null;',
    ].join(
      routeEol
    );

  route =
    replaceExact(
      route,
      genderInput,
      genderAndHomeState,
      2,
      'route homeState input'
    );
}


/*
|--------------------------------------------------------------------------
| 5. cwRecV1-dev.js
| PASS homeState TO fetchCWRecRows()
|--------------------------------------------------------------------------
*/

const fetchFragment =
  [
    '          quota,',
    '          gender,',
  ].join(
    routeEol
  );

const fetchWithHomeState =
  [
    '          quota,',
    '          gender,',
    '          homeState,',
  ].join(
    routeEol
  );


if (
  countOccurrences(
    route,
    fetchFragment
  ) === 2
) {
  route =
    replaceExact(
      route,
      fetchFragment,
      fetchWithHomeState,
      2,
      'fetchCWRecRows homeState wiring'
    );
}
else if (
  countOccurrences(
    route,
    '          homeState,'
  ) < 2
) {
  fail(
    'Could not safely wire homeState into both fetchCWRecRows calls'
  );
}


/*
|--------------------------------------------------------------------------
| WRITE ROUTE
|--------------------------------------------------------------------------
*/

fs.writeFileSync(
  ROUTE_FILE,
  route,
  'utf8'
);


console.log('');
console.log(
  '✅ UPTAC home-state quota patch applied'
);

console.log(
  '✅ Explicit quota still has priority'
);

console.log(
  '✅ Gender eligibility unchanged'
);

console.log(
  '✅ CW-REC scoring untouched'
);
