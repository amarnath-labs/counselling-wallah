import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const FILE =
  './src/routes/counselling.js';

const ORIGINAL_BACKUP =
  './src/routes/counselling.js.before-csab-route';

const PATCH_BACKUP =
  './src/routes/counselling.js.before-csab-route-v2';


if (!fs.existsSync(FILE)) {
  throw new Error(`Missing ${FILE}`);
}

if (!fs.existsSync(ORIGINAL_BACKUP)) {
  throw new Error(
    `Missing backup: ${ORIGINAL_BACKUP}`
  );
}


/*
|--------------------------------------------------------------------------
| RESTORE ORIGINAL PRE-CSAB VERSION
|--------------------------------------------------------------------------
*/

fs.copyFileSync(
  ORIGINAL_BACKUP,
  FILE
);

fs.copyFileSync(
  FILE,
  PATCH_BACKUP
);


let text =
  fs.readFileSync(
    FILE,
    'utf8'
  );

let lines =
  text.split(/\r?\n/);


function findUnique(
  predicate,
  label
) {

  const matches = [];

  for (
    let i = 0;
    i < lines.length;
    i += 1
  ) {

    if (predicate(lines[i], i)) {
      matches.push(i);
    }
  }

  if (matches.length !== 1) {
    throw new Error(
      `${label}: expected 1 match, found ${matches.length}`
    );
  }

  return matches[0];
}


function findAfter(
  start,
  predicate,
  label
) {

  for (
    let i = start;
    i < lines.length;
    i += 1
  ) {

    if (predicate(lines[i], i)) {
      return i;
    }
  }

  throw new Error(
    `${label} not found`
  );
}


/*
|--------------------------------------------------------------------------
| SAFETY
|--------------------------------------------------------------------------
*/

if (
  text.includes("'csab-special'") ||
  text.includes("'CSAB_SPECIAL'")
) {
  throw new Error(
    'CSAB route already exists. Aborting.'
  );
}


/*
|--------------------------------------------------------------------------
| SUPPORTED EXAMS
|--------------------------------------------------------------------------
*/

const supportedStart =
  findUnique(
    line =>
      line.includes(
        'const SUPPORTED_COUNSELLING_EXAMS = ['
      ),
    'SUPPORTED_COUNSELLING_EXAMS'
  );


const uptacEntry =
  findAfter(
    supportedStart,
    line =>
      line.trim() === "'uptac',",
    'UPTAC supported entry'
  );


lines.splice(
  uptacEntry,
  0,
  "        'csab-special',"
);


/*
|--------------------------------------------------------------------------
| JEE MAIN => JOSAA
|--------------------------------------------------------------------------
*/

const jeeMainSection =
  findUnique(
    line =>
      line.includes('| JEE MAIN'),
    'JEE MAIN section'
  );


const jeeMainCondition =
  findAfter(
    jeeMainSection,
    line =>
      line.includes(
        "examId === 'jee-main'"
      ),
    'JEE Main condition'
  );


const jeeMainQuery =
  findAfter(
    jeeMainCondition,
    line =>
      line.includes('query += `'),
    'JEE Main query'
  );


lines.splice(
  jeeMainQuery + 1,
  0,
  "          AND co.counselling_type = 'JOSAA'",
  ""
);


/*
|--------------------------------------------------------------------------
| JEE ADVANCED => JOSAA
|--------------------------------------------------------------------------
*/

const jeeAdvancedSection =
  findUnique(
    line =>
      line.includes('| JEE ADVANCED'),
    'JEE ADVANCED section'
  );


const jeeAdvancedCondition =
  findAfter(
    jeeAdvancedSection,
    line =>
      line.includes(
        "examId === 'jee-advanced'"
      ),
    'JEE Advanced condition'
  );


const jeeAdvancedQuery =
  findAfter(
    jeeAdvancedCondition,
    line =>
      line.includes('query += `'),
    'JEE Advanced query'
  );


lines.splice(
  jeeAdvancedQuery + 1,
  0,
  "          AND co.counselling_type = 'JOSAA'",
  ""
);


/*
|--------------------------------------------------------------------------
| CSAB SPECIAL SECTION
|--------------------------------------------------------------------------
*/

const uptacSection =
  findUnique(
    line =>
      line.includes('| UPTAC'),
    'UPTAC section'
  );


let commentStart =
  uptacSection;

while (
  commentStart >= 0 &&
  lines[commentStart].trim() !== '/*'
) {
  commentStart -= 1;
}


if (commentStart < 0) {
  throw new Error(
    'UPTAC comment start not found'
  );
}


const csabBlock = [
  '      /*',
  '      |--------------------------------------------------------------------------',
  '      | CSAB SPECIAL',
  '      |--------------------------------------------------------------------------',
  '      */',
  '',
  '      if (',
  "        examId === 'csab-special'",
  '      ) {',
  '',
  '        query += `',
  "          AND co.counselling_type = 'CSAB_SPECIAL'",
  '',
  "          AND co.verification_status = 'VERIFIED'",
  '',
  '          AND co.is_verified = true',
  '',
  '          AND (',
  '            LOWER(c.type) IN (',
  "              'nit',",
  "              'iiit',",
  "              'gfti',",
  "              'gftis'",
  '            )',
  '',
  '            OR LOWER(c.name) LIKE',
  "              'national institute of technology%'",
  '',
  '            OR LOWER(c.name) LIKE',
  "              '%indian institute of information technology%'",
  '          )',
  '',
  "          AND LOWER(c.type) <> 'iit'",
  '',
  '          AND LOWER(c.name) NOT LIKE',
  "            'indian institute of technology%'",
  '',
  '          AND LOWER(c.name) NOT LIKE',
  "            'iit %'",
  '        `;',
  '      }',
  '',
  '',
];


lines.splice(
  commentStart,
  0,
  ...csabBlock
);


/*
|--------------------------------------------------------------------------
| FINAL SAFETY FILTER
|--------------------------------------------------------------------------
*/

const safetySection =
  findUnique(
    line =>
      line.includes(
        '| FINAL JEE MAIN SAFETY FILTER'
      ),
    'Final safety section'
  );


const safetyCondition =
  findAfter(
    safetySection,
    line =>
      line.trim() ===
      "examId === 'jee-main'",
    'Final JEE Main condition'
  );


const indent =
  lines[safetyCondition]
    .match(/^\s*/)?.[0] || '';


lines[safetyCondition] =
  `${indent}examId === 'jee-main' ||`;


lines.splice(
  safetyCondition + 1,
  0,
  `${indent}examId === 'csab-special'`
);


/*
|--------------------------------------------------------------------------
| VERIFY OUTPUT BEFORE WRITE
|--------------------------------------------------------------------------
*/

const output =
  lines.join('\n');


const josaaCount =
  (
    output.match(
      /co\.counselling_type = 'JOSAA'/g
    ) || []
  ).length;


const csabTypeCount =
  (
    output.match(
      /co\.counselling_type = 'CSAB_SPECIAL'/g
    ) || []
  ).length;


if (josaaCount !== 2) {
  throw new Error(
    `Expected 2 JOSAA filters, found ${josaaCount}`
  );
}


if (csabTypeCount !== 1) {
  throw new Error(
    `Expected 1 CSAB_SPECIAL filter, found ${csabTypeCount}`
  );
}


if (
  !output.includes(
    "'csab-special',"
  )
) {
  throw new Error(
    'csab-special missing from supported exams'
  );
}


/*
|--------------------------------------------------------------------------
| WRITE + SYNTAX
|--------------------------------------------------------------------------
*/

fs.writeFileSync(
  FILE,
  output,
  'utf8'
);


try {

  execFileSync(
    process.execPath,
    [
      '--check',
      FILE,
    ],
    {
      stdio: 'inherit',
    }
  );

} catch (error) {

  fs.copyFileSync(
    PATCH_BACKUP,
    FILE
  );

  throw new Error(
    'Syntax failed; counselling.js restored.'
  );
}


console.log(
  '\n========================================'
);

console.log(
  'CSAB ROUTE PATCH PASSED'
);

console.log(
  '========================================'
);

console.log(
  'JOSAA SQL filters:',
  josaaCount
);

console.log(
  'CSAB_SPECIAL SQL filters:',
  csabTypeCount
);

console.log(
  'DATABASE WAS NOT MODIFIED.'
);