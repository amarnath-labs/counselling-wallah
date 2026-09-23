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
| 1. CLEAN COMMON MOJIBAKE
|--------------------------------------------------------------------------
|
| Unicode escapes are intentional so PowerShell encoding cannot corrupt
| the replacement strings.
|
*/

const replacements = [
  // â€” -> em dash
  [
    '\u00e2\u20ac\u201d',
    '\u2014',
  ],

  // â€“ -> en dash
  [
    '\u00e2\u20ac\u201c',
    '\u2013',
  ],

  // â†’ -> right arrow
  [
    '\u00e2\u2020\u2019',
    '\u2192',
  ],

  // Â· -> middle dot
  [
    '\u00c2\u00b7',
    '\u00b7',
  ],

  // standalone Â
  [
    '\u00c2',
    '',
  ],
];


for (
  const [
    bad,
    good,
  ] of replacements
) {
  src =
    src.split(
      bad
    ).join(
      good
    );
}


/*
|--------------------------------------------------------------------------
| 2. NEET-SPECIFIC LABELS
|--------------------------------------------------------------------------
*/

src =
  src.replaceAll(
    'Likely JoSAA Round',
    `{isNeetCard
      ? 'MCC Round'
      : 'Likely JoSAA Round'}`
  );


src =
  src.replaceAll(
    'JoSAA Trend',
    `{isNeetCard
      ? 'MCC Trend'
      : 'JoSAA Trend'}`
  );


src =
  src.replaceAll(
    'JoSAA Historical Confidence',
    `{isNeetCard
      ? 'MCC Historical Confidence'
      : 'JoSAA Historical Confidence'}`
  );


src =
  src.replaceAll(
    'Latest Final Closing',
    `{isNeetCard
      ? 'Selected Round Closing'
      : 'Latest Final Closing'}`
  );


/*
|--------------------------------------------------------------------------
| 3. REMOVE ARROW FROM NEET TREND TEXT
|--------------------------------------------------------------------------
*/

src =
  src.replaceAll(
    "{intelligence.trend?.direction === 'MORE_ACCESSIBLE' ? '→ ' : ''}",
    "{isNeetCard ? '' : intelligence.trend?.direction === 'MORE_ACCESSIBLE' ? '→ ' : ''}"
  );


fs.writeFileSync(
  file,
  src,
  'utf8'
);


console.log(
  'CollegeCard UI cleanup complete.'
);
