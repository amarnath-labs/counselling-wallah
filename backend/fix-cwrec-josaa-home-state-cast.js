import fs from 'node:fs';

const file =
  './src/services/cwRecDataV1.js';

const backup =
  './src/services/cwRecDataV1.js.before-josaa-text-cast-fix';

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


const oldHs =
  `LOWER(TRIM(c.state)) =
              LOWER(TRIM(\${homeStateParam}))`;

const newHs =
  `LOWER(TRIM(c.state::text)) =
              LOWER(TRIM(\${homeStateParam}::text))`;


const oldOs =
  `LOWER(TRIM(c.state)) <>
              LOWER(TRIM(\${homeStateParam}))`;

const newOs =
  `LOWER(TRIM(c.state::text)) <>
              LOWER(TRIM(\${homeStateParam}::text))`;


let changes = 0;


if (
  source.includes(
    oldHs
  )
) {
  source =
    source.replace(
      oldHs,
      newHs
    );

  changes++;
}


if (
  source.includes(
    oldOs
  )
) {
  source =
    source.replace(
      oldOs,
      newOs
    );

  changes++;
}


if (
  changes !== 2
) {
  console.error(
    `❌ Expected 2 replacements, got ${changes}`
  );

  process.exit(1);
}


fs.writeFileSync(
  file,
  source,
  'utf8'
);


console.log(
  '✅ HS text cast fixed'
);

console.log(
  '✅ OS text cast fixed'
);

console.log(
  '✅ Scoring logic untouched'
);
