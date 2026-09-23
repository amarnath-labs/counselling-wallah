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
| NEET LABELS
|--------------------------------------------------------------------------
*/

src =
  src.replace(
    /Likely\s+JoSAA\s+Round/g,
    "{isNeetCard ? 'MCC Round' : 'Likely JoSAA Round'}"
  );


src =
  src.replace(
    /JoSAA\s+Trend/g,
    "{isNeetCard ? 'MCC Trend' : 'JoSAA Trend'}"
  );


src =
  src.replace(
    /JoSAA\s+Historical\s+Confidence/g,
    "{isNeetCard ? 'MCC Historical Confidence' : 'JoSAA Historical Confidence'}"
  );


/*
|--------------------------------------------------------------------------
| CLEAN BROKEN MOJIBAKE
|--------------------------------------------------------------------------
*/

src =
  src
    .replaceAll(
      '\u00e2\u2020\u2019',
      ''
    )
    .replaceAll(
      '\u00e2\u20ac\u201d',
      '\u2014'
    )
    .replaceAll(
      '\u00e2\u20ac\u201c',
      '\u2013'
    )
    .replaceAll(
      '\u00c2',
      ''
    );


/*
|--------------------------------------------------------------------------
| FOR NEET, DO NOT SHOW SYMBOL BEFORE TREND
|--------------------------------------------------------------------------
*/

src =
  src.replace(
    /\{\s*intelligence\.trend\?\.direction[\s\S]{0,180}?'[^']*'\s*:\s*''\s*\}/g,
    "{isNeetCard ? '' : ''}"
  );


fs.writeFileSync(
  file,
  src,
  'utf8'
);

console.log(
  'NEET UI labels cleaned.'
);
