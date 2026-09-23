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
| 1. APPLICABLE QUOTA
|--------------------------------------------------------------------------
*/

const oldQuota =
`                              {
                                branch?.quota === 'HS'
                                  ? 'Home State'
                                  : branch?.quota === 'OS'
                                    ? 'Other State'
                                    : branch?.quota === 'AI'
                                      ? 'All India'
                                      : branch?.quota ||
                                        '-'
                              }`;


const newQuota =
`                              {
                                isNeetCard
                                  ? (
                                      row?.quota ||
                                      'MCC / All India'
                                    )
                                  : branch?.quota === 'HS'
                                    ? 'Home State'
                                    : branch?.quota === 'OS'
                                      ? 'Other State'
                                      : branch?.quota === 'AI'
                                        ? 'All India'
                                        : branch?.quota ||
                                          '-'
                              }`;


if (
  !src.includes(
    oldQuota
  )
) {
  throw new Error(
    'Applicable Quota block not found.'
  );
}


src =
  src.replace(
    oldQuota,
    newQuota
  );


/*
|--------------------------------------------------------------------------
| 2. ELIGIBLE SEAT POOL
|--------------------------------------------------------------------------
*/

const oldSeatPool =
`                              {
                                branch?.gender ===
                                  'Female-only (including Supernumerary)'
                                  ? 'Female-only'
                                  : branch?.gender ===
                                      'Gender-Neutral'
                                    ? 'Gender-Neutral'
                                    : branch?.gender ||
                                      '-'
                              }`;


const newSeatPool =
`                              {
                                isNeetCard
                                  ? (
                                      row?.gender ||
                                      'All Eligible Candidates'
                                    )
                                  : branch?.gender ===
                                      'Female-only (including Supernumerary)'
                                    ? 'Female-only'
                                    : branch?.gender ===
                                        'Gender-Neutral'
                                      ? 'Gender-Neutral'
                                      : branch?.gender ||
                                        '-'
                              }`;


if (
  !src.includes(
    oldSeatPool
  )
) {
  throw new Error(
    'Eligible Seat Pool block not found.'
  );
}


src =
  src.replace(
    oldSeatPool,
    newSeatPool
  );


fs.writeFileSync(
  file,
  src,
  'utf8'
);


console.log(
  'NEET quota + eligible seat pool fixed.'
);
