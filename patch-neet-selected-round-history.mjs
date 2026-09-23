import fs from 'fs';

const file =
  './backend/src/services/neetRecommendationService.js';

let src =
  fs.readFileSync(
    file,
    'utf8'
  );


/*
|--------------------------------------------------------------------------
| Add round to history function parameters
|--------------------------------------------------------------------------
*/

src =
  src.replace(
`export async function fetchNeetAdmissionHistory({
  collegeName,
  course,
  category = 'Open',
  quota = '',
  rank,
}) {`,
`export async function fetchNeetAdmissionHistory({
  collegeName,
  course,
  category = 'Open',
  quota = '',
  rank,
  round = 1,
}) {`
  );


/*
|--------------------------------------------------------------------------
| Replace final-round based yearly selection
|--------------------------------------------------------------------------
*/

const oldBlock =
`    roundMatches.sort(
      (
        a,
        b
      ) =>
        a.roundOrder -
        b.roundOrder
    );


    const first =
      roundMatches[0];


    const final =
      roundMatches[
        roundMatches.length -
        1
      ];


    const openingRank =
      Number(
        first.openingRank
      );


    const closingRank =
      Number(
        final.closingRank
      );


    years.push({
      year,

      finalRound:
        final.round,

      openingRank:
        Number.isFinite(
          openingRank
        )
          ? openingRank
          : null,

      closingRank:
        Number.isFinite(
          closingRank
        )
          ? closingRank
          : null,

      rankRatio:
        Number.isFinite(
          studentRank
        ) &&
        studentRank > 0 &&
        Number.isFinite(
          closingRank
        ) &&
        closingRank > 0
          ? studentRank /
            closingRank
          : null,

      bucket:
        historyBucket(
          studentRank,
          closingRank
        ),

      roundCount:
        roundMatches.length,

      rounds:
        roundMatches,
    });`;


const newBlock =
`    roundMatches.sort(
      (
        a,
        b
      ) =>
        a.roundOrder -
        b.roundOrder
    );


    /*
    |--------------------------------------------------------------------------
    | SELECTED-ROUND ALIGNMENT
    |--------------------------------------------------------------------------
    |
    | If current result is Round 1, compare historical Round 1.
    | Do NOT silently replace it with a later/final round cutoff.
    |
    */

    const requestedRound =
      historyRoundNumber(
        round,
        String(
          round
        )
      );


    const selected =
      roundMatches.find(
        item =>
          item.roundOrder ===
          requestedRound
      ) ||
      roundMatches[0];


    const latestAvailable =
      roundMatches[
        roundMatches.length -
        1
      ];


    const openingRank =
      Number(
        selected.openingRank
      );


    const closingRank =
      Number(
        selected.closingRank
      );


    years.push({
      year,

      selectedRound:
        selected.round,

      finalRound:
        selected.round,

      openingRank:
        Number.isFinite(
          openingRank
        )
          ? openingRank
          : null,

      closingRank:
        Number.isFinite(
          closingRank
        )
          ? closingRank
          : null,

      rankRatio:
        Number.isFinite(
          studentRank
        ) &&
        studentRank > 0 &&
        Number.isFinite(
          closingRank
        ) &&
        closingRank > 0
          ? studentRank /
            closingRank
          : null,

      bucket:
        historyBucket(
          studentRank,
          closingRank
        ),

      roundCount:
        roundMatches.length,

      latestAvailableRound:
        latestAvailable.round,

      latestAvailableOpeningRank:
        Number.isFinite(
          Number(
            latestAvailable.openingRank
          )
        )
          ? Number(
              latestAvailable.openingRank
            )
          : null,

      latestAvailableClosingRank:
        Number.isFinite(
          Number(
            latestAvailable.closingRank
          )
        )
          ? Number(
              latestAvailable.closingRank
            )
          : null,

      rounds:
        roundMatches,
    });`;


if (
  !src.includes(
    oldBlock
  )
) {
  throw new Error(
    'NEET yearly history block not found.'
  );
}


src =
  src.replace(
    oldBlock,
    newBlock
  );


fs.writeFileSync(
  file,
  src,
  'utf8'
);


console.log(
  'NEET history aligned to selected round.'
);
