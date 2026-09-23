import fs from 'fs';

const file =
  './frontend/src/components/CollegeCard.jsx';

let src =
  fs.readFileSync(
    file,
    'utf8'
  );


/*
|--------------------------------------------------------------------------
| TREND TEXT — NO SYMBOLS
|--------------------------------------------------------------------------
*/

src =
  src.replace(
    /return\s+'[^']*More Accessible';/g,
    "return 'More Accessible';"
  );

src =
  src.replace(
    /return\s+'[^']*More Competitive';/g,
    "return 'More Competitive';"
  );

src =
  src.replace(
    /return\s+'[^']*Volatile';/g,
    "return 'Volatile';"
  );

src =
  src.replace(
    /return\s+'[^']*Stable';/g,
    "return 'Stable';"
  );


/*
|--------------------------------------------------------------------------
| COMMON BROKEN COLLAPSE / EXPAND SYMBOLS
|--------------------------------------------------------------------------
*/

src =
  src.replaceAll(
    "'âˆ’'",
    "'−'"
  );

src =
  src.replaceAll(
    "'â€“'",
    "'−'"
  );

src =
  src.replaceAll(
    "'â€”'",
    "'−'"
  );

src =
  src.replaceAll(
    "'âŒƒ'",
    "'−'"
  );

src =
  src.replaceAll(
    "'âŒ„'",
    "'−'"
  );


/*
|--------------------------------------------------------------------------
| STRAY MOJIBAKE BEFORE VISIBLE WORDS
|--------------------------------------------------------------------------
*/

src =
  src.replace(
    /['"`][^'"`\n]*Volatile['"`]/g,
    "'Volatile'"
  );

src =
  src.replace(
    /['"`][^'"`\n]*More Accessible['"`]/g,
    "'More Accessible'"
  );

src =
  src.replace(
    /['"`][^'"`\n]*More Competitive['"`]/g,
    "'More Competitive'"
  );


fs.writeFileSync(
  file,
  src,
  'utf8'
);

console.log(
  'CollegeCard visible symbols cleaned.'
);
