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
| REMOVE BROKEN FALLBACK CHARACTERS
|--------------------------------------------------------------------------
*/

src =
  src.replaceAll(
    "'â€”'",
    "'-'"
  );

src =
  src.replaceAll(
    "'â€“'",
    "'-'"
  );

/*
|--------------------------------------------------------------------------
| REMOVE BROKEN TREND ARROWS
|--------------------------------------------------------------------------
*/

src =
  src.replaceAll(
    "return 'â†‘ More Accessible';",
    "return 'More Accessible';"
  );

src =
  src.replaceAll(
    "return 'â†“ More Competitive';",
    "return 'More Competitive';"
  );

/*
|--------------------------------------------------------------------------
| REMOVE OTHER COMMON BROKEN ARROWS IF PRESENT
|--------------------------------------------------------------------------
*/

src =
  src.replaceAll(
    'â†‘ ',
    ''
  );

src =
  src.replaceAll(
    'â†“ ',
    ''
  );

src =
  src.replaceAll(
    'â†’ ',
    ''
  );

fs.writeFileSync(
  file,
  src,
  'utf8'
);

console.log(
  'Broken characters removed.'
);
