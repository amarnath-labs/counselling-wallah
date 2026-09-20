import fs from 'node:fs';

const file =
  './src/services/cwRecDataV1.js';

const backup =
  './src/services/cwRecDataV1.js.before-josaa-cast-regex-fix';

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


/*
|--------------------------------------------------------------------------
| FIX c.state TRIM TYPE
|--------------------------------------------------------------------------
*/

const statePattern =
  /LOWER\s*\(\s*TRIM\s*\(\s*c\.state\s*\)\s*\)/g;

const homeStatePattern =
  /LOWER\s*\(\s*TRIM\s*\(\s*\$\{homeStateParam\}\s*\)\s*\)/g;


const stateMatches =
  source.match(
    statePattern
  ) ?? [];

const homeStateMatches =
  source.match(
    homeStatePattern
  ) ?? [];


console.log(
  `Found c.state expressions: ${stateMatches.length}`
);

console.log(
  `Found homeStateParam expressions: ${homeStateMatches.length}`
);


if (
  stateMatches.length < 2
) {
  console.error(
    '❌ Expected at least 2 c.state expressions'
  );

  process.exit(1);
}


if (
  homeStateMatches.length < 2
) {
  console.error(
    '❌ Expected at least 2 homeStateParam expressions'
  );

  process.exit(1);
}


source =
  source.replace(
    statePattern,
    'LOWER(TRIM(c.state::text))'
  );


source =
  source.replace(
    homeStatePattern,
    'LOWER(TRIM(${homeStateParam}::text))'
  );


fs.writeFileSync(
  file,
  source,
  'utf8'
);


console.log('');
console.log(
  '✅ JOSAA HS/OS text casts applied'
);

console.log(
  '✅ Existing eligibility logic preserved'
);

console.log(
  '✅ CW-REC scoring untouched'
);
