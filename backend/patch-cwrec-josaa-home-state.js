import fs from 'node:fs';

const FILE =
  './src/services/cwRecDataV1.js';

const backup =
  './src/services/cwRecDataV1.js.before-josaa-home-state';

let source =
  fs.readFileSync(
    FILE,
    'utf8'
  );

fs.copyFileSync(
  FILE,
  backup
);

console.log(
  `✅ Backup created: ${backup}`
);

const eol =
  source.includes('\r\n')
    ? '\r\n'
    : '\n';


function fail(message) {
  console.error(
    `❌ ${message}`
  );
  process.exit(1);
}


function countOccurrences(
  text,
  needle
) {
  return text
    .split(needle)
    .length - 1;
}


/*
|--------------------------------------------------------------------------
| INSERT JOSAA HOME-STATE FILTER
|--------------------------------------------------------------------------
|
| Rules:
|
| explicit quota:
|   existing exact quota filter wins
|
| without explicit quota:
|
| AI:
|   always eligible
|
| HS:
|   college state must match candidate homeState
|
| OS:
|   college state must NOT match candidate homeState
|
| GO / JK / LA:
|   excluded from automatic home-state derivation
|   can still be requested explicitly through quota=
|
*/

const marker =
  [
    '  /* =======================================================',
    '     OPTIONAL QUOTA',
    '  ======================================================= */',
  ].join(
    eol
  );


if (
  source.includes(
    'JOSAA HOME-STATE QUOTA ELIGIBILITY'
  )
) {
  console.log(
    'ℹ️ JOSAA home-state block already exists'
  );
}
else {
  const count =
    countOccurrences(
      source,
      marker
    );

  if (
    count !== 1
  ) {
    fail(
      `OPTIONAL QUOTA marker expected once, found ${count}`
    );
  }


  const block =
    [
      '  /* =======================================================',
      '     JOSAA HOME-STATE QUOTA ELIGIBILITY',
      '  ======================================================= */',
      '',
      '  if (',
      "    normalizedExam !== 'uptac' &&",
      '    !effectiveQuota &&',
      '    homeState',
      '  ) {',
      '    params.push(',
      '      String(homeState).trim()',
      '    );',
      '',
      '',
      '    const homeStateParam =',
      '      `$${paramIndex++}`;',
      '',
      '',
      '    query += `',
      '',
      '      AND (',
      '',
      "        co.quota = 'AI'",
      '',
      '        OR (',
      "          co.quota = 'HS'",
      '          AND LOWER(TRIM(c.state)) =',
      '              LOWER(TRIM(${homeStateParam}))',
      '        )',
      '',
      '        OR (',
      "          co.quota = 'OS'",
      '          AND LOWER(TRIM(c.state)) <>',
      '              LOWER(TRIM(${homeStateParam}))',
      '        )',
      '',
      '      )',
      '',
      '    `;',
      '  }',
      '',
      '',
      marker,
    ].join(
      eol
    );


  source =
    source.replace(
      marker,
      block
    );
}


fs.writeFileSync(
  FILE,
  source,
  'utf8'
);

console.log('');
console.log(
  '✅ JOSAA home-state quota eligibility added'
);
console.log(
  '✅ AI remains eligible for every home state'
);
console.log(
  '✅ HS requires college.state == homeState'
);
console.log(
  '✅ OS requires college.state != homeState'
);
console.log(
  '✅ GO / JK / LA excluded from automatic mapping'
);
console.log(
  '✅ Explicit quota still overrides automatic logic'
);
console.log(
  '✅ Gender logic untouched'
);
console.log(
  '✅ CW-REC scoring untouched'
);
