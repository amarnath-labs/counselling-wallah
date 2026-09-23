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
| 1. NEET APPLICABLE QUOTA
|--------------------------------------------------------------------------
*/

const quotaPattern =
/\{\s*branch\?\.quota === 'HS'[\s\S]*?: branch\?\.quota \|\|\s*'—'\s*\}/m;


if (
  !quotaPattern.test(
    src
  )
) {
  throw new Error(
    'LIVE Applicable Quota expression not found.'
  );
}


src =
  src.replace(
    quotaPattern,
`{
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
                                          '—'
                              }`
  );


/*
|--------------------------------------------------------------------------
| 2. NEET ELIGIBLE SEAT POOL
|--------------------------------------------------------------------------
*/

const seatPoolPattern =
/\{\s*branch\?\.gender ===\s*'Female-only \(including Supernumerary\)'[\s\S]*?: branch\?\.gender \|\|\s*'—'\s*\}/m;


if (
  !seatPoolPattern.test(
    src
  )
) {
  throw new Error(
    'LIVE Eligible Seat Pool expression not found.'
  );
}


src =
  src.replace(
    seatPoolPattern,
`{
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
                                        '—'
                              }`
  );


fs.writeFileSync(
  file,
  src,
  'utf8'
);


console.log(
  'NEET Applicable Quota + Eligible Seat Pool patched.'
);
