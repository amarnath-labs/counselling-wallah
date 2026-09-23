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
| NEET CATEGORY = STUDENT'S ACTUAL PROFILE CATEGORY
|--------------------------------------------------------------------------
*/

src =
  src.replace(
`                                branch?.category ||
                                profile?.category ||
                                '—'`,
`                                isNeetCard
                                  ? (
                                      profile?.category ||
                                      row?.category ||
                                      'General'
                                    )
                                  : (
                                      branch?.category ||
                                      profile?.category ||
                                      '—'
                                    )`
  );


/*
|--------------------------------------------------------------------------
| NEET QUOTA = ACTUAL MCC QUOTA
|--------------------------------------------------------------------------
*/

src =
  src.replace(
`                                isNeetCard
                                  ? (
                                      row?.quota ||
                                      'MCC / All India'
                                    )`,
`                                isNeetCard
                                  ? (
                                      row?.quota ||
                                      'Open Seat Quota'
                                    )`
  );


/*
|--------------------------------------------------------------------------
| NEET SEAT POOL
|--------------------------------------------------------------------------
|
| Current MCC dataset has no engineering-style female-only seat pool.
| Display it consistently as Gender-Neutral unless a genuine row value
| is available later.
|
*/

src =
  src.replace(
`                                isNeetCard
                                  ? (
                                      row?.gender ||
                                      'All Eligible Candidates'
                                    )`,
`                                isNeetCard
                                  ? 'Gender-Neutral'`
  );


fs.writeFileSync(
  file,
  src,
  'utf8'
);

console.log(
  'NEET Admission Profile display fixed.'
);
