import fs from 'fs';

const file =
  './frontend/src/services/neetRecommendationService.js';

let src =
  fs.readFileSync(
    file,
    'utf8'
  );


const oldPattern =
  /params\.set\(\s*['"]counsellingMode['"],\s*String\(\s*profile\?\.counsellingMode\s*\|\|\s*['"]mcc['"]\s*\)\s*\);/m;


const replacement =
`const rawCounsellingMode =
    String(
      profile?.counsellingMode ||
      ''
    )
      .trim()
      .toLowerCase();


  const neetCounsellingMode =
    rawCounsellingMode ===
      'state'
      ? 'state'
      : 'mcc';


  params.set(
    'counsellingMode',
    neetCounsellingMode
  );`;


const matches =
  src.match(
    oldPattern
  );


if (
  !matches
) {
  throw new Error(
    'NEET counsellingMode API anchor not found.'
  );
}


src =
  src.replace(
    oldPattern,
    replacement
  );


fs.writeFileSync(
  file,
  src,
  'utf8'
);


console.log(
  'NEET service counselling mode normalized.'
);
