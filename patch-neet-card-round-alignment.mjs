import fs from 'fs';

const file =
  './frontend/src/components/CollegeCard.jsx';

let src =
  fs.readFileSync(
    file,
    'utf8'
  );


const anchor =
`              rank:
                profile?.rank ??
                row?.admission?.studentRank ??
                null,`;


const replacement =
`${anchor}

              round:
                row?.round ||
                profile?.round ||
                1,`;


if (
  !src.includes(
    anchor
  )
) {
  throw new Error(
    'CollegeCard NEET history rank anchor not found.'
  );
}


src =
  src.replace(
    anchor,
    replacement
  );


/*
|--------------------------------------------------------------------------
| NEET-specific wording
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


fs.writeFileSync(
  file,
  src,
  'utf8'
);


console.log(
  'CollegeCard NEET selected-round history patched.'
);
