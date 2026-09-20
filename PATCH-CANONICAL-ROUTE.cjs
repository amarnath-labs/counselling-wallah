const fs =
  require('fs');


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
| Find recommendation result object.
|--------------------------------------------------------------------------
|
| We specifically look for:
|
| adaptedInput:
|   adapted,
|
| ...
|
| ...scoring,
|
| scoringVersion:
|
*/


const adaptedIndex =
  source.indexOf(
    'adaptedInput:'
  );


if (
  adaptedIndex === -1
) {
  throw new Error(
    'adaptedInput block not found'
  );
}


let searchIndex =
  adaptedIndex;


let scoringIndex =
  -1;


while (
  searchIndex <
  source.length
) {

  const candidate =
    source.indexOf(
      '...scoring,',
      searchIndex
    );


  if (
    candidate === -1
  ) {
    break;
  }


  /*
  | We want the scoring spread that is reasonably close to adaptedInput.
  */

  if (
    candidate -
    adaptedIndex <
    5000
  ) {

    scoringIndex =
      candidate;

    break;
  }


  searchIndex =
    candidate + 1;
}


if (
  scoringIndex === -1
) {
  throw new Error(
    'recommendation ...scoring block not found'
  );
}


const scoringVersionIndex =
  source.indexOf(
    'scoringVersion:',
    scoringIndex
  );


if (
  scoringVersionIndex === -1
) {
  throw new Error(
    'scoringVersion after recommendation scoring not found'
  );
}


if (
  scoringVersionIndex -
  scoringIndex >
  5000
) {
  throw new Error(
    'Unexpected recommendation object structure'
  );
}


/*
|--------------------------------------------------------------------------
| If canonical block already exists, remove it first.
|--------------------------------------------------------------------------
*/

const between =
  source.slice(
    scoringIndex +
    '...scoring,'.length,
    scoringVersionIndex
  );


let canonicalBlock =
`


              /*
              |--------------------------------------------------------------------------
              | FINAL CANONICAL ADMISSION BUCKET
              |--------------------------------------------------------------------------
              |
              | SINGLE SOURCE OF TRUTH:
              |
              | Round 1 Opening Rank
              |          ->
              | Last Available Round Closing Rank
              |
              */


              bucket:
                row?.bucket ??
                row?.admission?.bucket ??
                'Admission data pending',


              admissionBucket: {

                key:
                  String(
                    row?.bucket ??
                    row?.admission?.bucket ??
                    ''
                  )
                    .trim()
                    .toLowerCase(),

                label:
                  row?.bucket ??
                  row?.admission?.label ??
                  row?.admission?.bucket ??
                  'Admission data pending',

              },


              admission: {

                ...(
                  scoring?.admission ||
                  {}
                ),

                ...(
                  row?.admission ||
                  {}
                ),


                bucket:
                  row?.bucket ??
                  row?.admission?.bucket ??
                  'Admission data pending',


                label:
                  row?.bucket ??
                  row?.admission?.label ??
                  row?.admission?.bucket ??
                  'Admission data pending',


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


                historicalPosition:
                  row?.historicalFit?.position ??
                  row?.admission?.historicalPosition ??
                  null,


                admissionModel:
                  'R1_OPENING_TO_LAST_ROUND_CLOSING',

              },


              historicalFit: {

                ...(
                  row?.historicalFit ||
                  {}
                ),


                bucket:
                  row?.bucket ??
                  row?.historicalFit?.bucket ??
                  row?.admission?.bucket ??
                  'Admission data pending',


                label:
                  row?.bucket ??
                  row?.historicalFit?.label ??
                  row?.admission?.label ??
                  'Admission data pending',

              },


`;


/*
|--------------------------------------------------------------------------
| Replace everything between ...scoring, and scoringVersion:
| ONLY if it already contains an old canonical block.
| Otherwise insert our canonical block.
|--------------------------------------------------------------------------
*/

let newMiddle;


if (
  between.includes(
    'CANONICAL ADMISSION'
  ) ||
  between.includes(
    'FINAL CANONICAL ADMISSION'
  )
) {

  newMiddle =
    canonicalBlock;

}
else {

  newMiddle =
    between +
    canonicalBlock;

}


source =
  source.slice(
    0,
    scoringIndex +
    '...scoring,'.length
  ) +

  newMiddle +

  source.slice(
    scoringVersionIndex
  );


fs.writeFileSync(
  file,
  source,
  'utf8'
);


console.log(
  'PASS: route canonical output inserted'
);
