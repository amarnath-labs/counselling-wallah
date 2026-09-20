const fs = require('fs');

const file =
  process.argv[2];

let source =
  fs
    .readFileSync(
      file,
      'utf8'
    )
    .replace(
      /^\uFEFF/,
      ''
    )
    .replace(
      /\r\n/g,
      '\n'
    );


/*
|--------------------------------------------------------------------------
| FIND REAL RECOMMENDATIONS MAP
|--------------------------------------------------------------------------
*/

const scoredIndex =
  source.indexOf(
    'const scored ='
  );

if (
  scoredIndex === -1
) {
  throw new Error(
    'const scored = not found'
  );
}


const mapIndex =
  source.indexOf(
    'realData.rows.map',
    scoredIndex
  );

if (
  mapIndex === -1
) {
  throw new Error(
    'realData.rows.map not found'
  );
}


/*
|--------------------------------------------------------------------------
| FIND scoreAdaptedInput INSIDE RECOMMENDATIONS MAP
|--------------------------------------------------------------------------
*/

const scoringStart =
  source.indexOf(
    'const scoring =',
    mapIndex
  );

if (
  scoringStart === -1
) {
  throw new Error(
    'Recommendation const scoring not found'
  );
}


const scoringCall =
  source.indexOf(
    'scoreAdaptedInput(',
    scoringStart
  );

if (
  scoringCall === -1
) {
  throw new Error(
    'Recommendation scoreAdaptedInput call not found'
  );
}


/*
|--------------------------------------------------------------------------
| Find the semicolon ending:
|
| const scoring =
|   scoreAdaptedInput(
|     ...
|   );
|--------------------------------------------------------------------------
*/

let scoringEnd =
  source.indexOf(
    ');',
    scoringCall
  );

if (
  scoringEnd === -1
) {
  throw new Error(
    'scoreAdaptedInput closing not found'
  );
}

scoringEnd +=
  2;


/*
|--------------------------------------------------------------------------
| Ensure we did not accidentally hit another route.
|--------------------------------------------------------------------------
*/

if (
  scoringEnd -
  scoringStart >
  2000
) {
  throw new Error(
    'Unexpected scoreAdaptedInput structure'
  );
}


/*
|--------------------------------------------------------------------------
| REMOVE PREVIOUS VERSION OF THIS EXACT PATCH IF PRESENT
|--------------------------------------------------------------------------
*/

const markerStart =
  source.indexOf(
    '/* FINAL CANONICALIZE SCORING START */',
    scoringEnd
  );

const returnIndex =
  source.indexOf(
    'return {',
    scoringEnd
  );


if (
  returnIndex === -1
) {
  throw new Error(
    'Recommendation return object not found'
  );
}


if (
  markerStart !== -1 &&
  markerStart <
  returnIndex
) {

  const markerEndText =
    '/* FINAL CANONICALIZE SCORING END */';

  const markerEnd =
    source.indexOf(
      markerEndText,
      markerStart
    );

  if (
    markerEnd === -1
  ) {
    throw new Error(
      'Existing canonical patch end marker missing'
    );
  }

  source =
    source.slice(
      0,
      markerStart
    ) +
    source.slice(
      markerEnd +
      markerEndText.length
    );

}


/*
|--------------------------------------------------------------------------
| RE-CALCULATE POSITIONS AFTER OPTIONAL CLEANUP
|--------------------------------------------------------------------------
*/

const scoredIndex2 =
  source.indexOf(
    'const scored ='
  );

const mapIndex2 =
  source.indexOf(
    'realData.rows.map',
    scoredIndex2
  );

const scoringStart2 =
  source.indexOf(
    'const scoring =',
    mapIndex2
  );

const scoringCall2 =
  source.indexOf(
    'scoreAdaptedInput(',
    scoringStart2
  );

let scoringEnd2 =
  source.indexOf(
    ');',
    scoringCall2
  );

scoringEnd2 +=
  2;


/*
|--------------------------------------------------------------------------
| CANONICALIZE SCORING
|--------------------------------------------------------------------------
|
| row.bucket has already been calculated from:
|
| Round 1 opening
|       ->
| Last available round closing
|
| We overwrite the OLD admission bucket inside scoring BEFORE:
|
| - compareRecommendations()
| - Dream / Target / Safe / Backup grouping
| - final API response
|
|--------------------------------------------------------------------------
*/

const canonicalBlock =
`

            /* FINAL CANONICALIZE SCORING START */

            const canonicalAdmissionBucket =
              row?.bucket ??
              row?.admission?.bucket ??
              row?.historicalFit?.label ??
              row?.historicalFit?.bucket ??
              scoring?.admission?.bucket ??
              'Admission data pending';


            const canonicalAdmissionKey =
              String(
                canonicalAdmissionBucket
              )
                .trim()
                .toLowerCase();


            /*
            |--------------------------------------------------------------------------
            | TOP-LEVEL BUCKET
            |--------------------------------------------------------------------------
            */

            scoring.bucket =
              canonicalAdmissionBucket;


            scoring.admissionBucket = {

              key:
                canonicalAdmissionKey,

              label:
                canonicalAdmissionBucket,

            };


            /*
            |--------------------------------------------------------------------------
            | ADMISSION OBJECT
            |--------------------------------------------------------------------------
            */

            scoring.admission = {

              ...(
                scoring?.admission ||
                {}
              ),

              ...(
                row?.admission ||
                {}
              ),


              bucket:
                canonicalAdmissionBucket,


              label:
                canonicalAdmissionBucket,


              bucketKey:
                canonicalAdmissionKey,


              r1OpeningRank:
                row?.r1OpeningRank ??
                row?.historicalFit?.r1OpeningRank ??
                row?.admission?.r1OpeningRank ??
                null,


              lastRoundClosingRank:
                row?.lastRoundClosingRank ??
                row?.historicalFit?.lastRoundClosingRank ??
                row?.admission?.lastRoundClosingRank ??
                null,


              lastRoundNumber:
                row?.lastRoundNumber ??
                row?.historicalFit?.lastRoundNumber ??
                row?.admission?.lastRoundNumber ??
                null,


              historicalPosition:
                row?.historicalFit?.position ??
                row?.admission?.historicalPosition ??
                null,


              admissionModel:
                'R1_OPENING_TO_LAST_ROUND_CLOSING',

            };


            /*
            |--------------------------------------------------------------------------
            | HISTORICAL FIT OBJECT
            |--------------------------------------------------------------------------
            */

            scoring.historicalFit = {

              ...(
                scoring?.historicalFit ||
                {}
              ),

              ...(
                row?.historicalFit ||
                {}
              ),


              bucket:
                canonicalAdmissionBucket,


              label:
                canonicalAdmissionBucket,


              key:
                canonicalAdmissionKey,


              r1OpeningRank:
                row?.r1OpeningRank ??
                row?.historicalFit?.r1OpeningRank ??
                null,


              lastRoundClosingRank:
                row?.lastRoundClosingRank ??
                row?.historicalFit?.lastRoundClosingRank ??
                null,

            };


            /*
            |--------------------------------------------------------------------------
            | IF recommendation nested object also contains admission
            |--------------------------------------------------------------------------
            */

            if (
              scoring?.recommendation &&
              typeof scoring.recommendation ===
                'object'
            ) {

              scoring.recommendation = {

                ...scoring.recommendation,


                bucket:
                  canonicalAdmissionBucket,


                admissionBucket:
                  canonicalAdmissionBucket,

              };

            }

            /* FINAL CANONICALIZE SCORING END */
`;


source =
  source.slice(
    0,
    scoringEnd2
  ) +

  canonicalBlock +

  source.slice(
    scoringEnd2
  );


/*
|--------------------------------------------------------------------------
| HARD VALIDATION
|--------------------------------------------------------------------------
*/

const finalScored =
  source.indexOf(
    'const scored ='
  );

const finalMarker =
  source.indexOf(
    '/* FINAL CANONICALIZE SCORING START */',
    finalScored
  );

const finalSort =
  source.indexOf(
    'scored.sort',
    finalScored
  );


if (
  finalMarker === -1
) {
  throw new Error(
    'Canonical scoring marker not inserted'
  );
}


if (
  finalSort === -1
) {
  throw new Error(
    'scored.sort not found'
  );
}


if (
  finalMarker >
  finalSort
) {
  throw new Error(
    'Canonical scoring patch inserted after sorting'
  );
}


fs.writeFileSync(
  file,
  source,
  'utf8'
);


console.log(
  'PASS: canonical bucket applied BEFORE recommendation sorting'
);
