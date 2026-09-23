/*
|--------------------------------------------------------------------------
| TruMarg V2 - Cutoff Selectivity Intelligence
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| 1. Smaller closing-rank number = more selective.
| 2. This is NOT admission probability.
| 3. Compare only within an equivalent counselling cohort.
| 4. Never directly compare OPEN rank with SC/ST/OBC rank.
| 5. Missing cutoff data remains null.
|
|--------------------------------------------------------------------------
*/


function finiteNumber(
  value
) {
  const number =
    Number(
      value
    );

  return Number.isFinite(
    number
  )
    ? number
    : null;
}


function clamp(
  value,
  minimum = 0,
  maximum = 100
) {
  return Math.min(
    maximum,
    Math.max(
      minimum,
      value
    )
  );
}


/*
|--------------------------------------------------------------------------
| Percentile based selectivity
|--------------------------------------------------------------------------
|
| closingRanks must contain comparable rows:
|
| same exam
| same year
| same category
| same quota/pool where applicable
| same gender pool where applicable
|
| Lower closing rank receives higher selectivity.
|
|--------------------------------------------------------------------------
*/

export function calculateCutoffSelectivityScore({
  closingRank,
  cohortClosingRanks = [],
}) {
  const target =
    finiteNumber(
      closingRank
    );


  if (
    target === null ||
    target <= 0
  ) {
    return null;
  }


  const cohort =
    cohortClosingRanks
      .map(
        finiteNumber
      )
      .filter(
        value =>
          value !== null &&
          value > 0
      )
      .sort(
        (
          left,
          right
        ) =>
          left - right
      );


  /*
  |--------------------------------------------------------------------------
  | Do not pretend precision with tiny comparison sets
  |--------------------------------------------------------------------------
  */

  if (
    cohort.length < 20
  ) {
    return null;
  }


  const belowOrEqual =
    cohort.filter(
      value =>
        value <= target
    ).length;


  const percentile =
    belowOrEqual /
    cohort.length;


  /*
  |--------------------------------------------------------------------------
  | Lower rank = stronger selectivity
  |--------------------------------------------------------------------------
  |
  | Best/lowest cutoff approaches 100.
  | Largest cutoff approaches 0.
  |
  */

  const score =
    (
      1 -
      percentile
    ) *
    100;


  return Math.round(
    clamp(
      score
    )
  );
}


/*
|--------------------------------------------------------------------------
| Optional confidence
|--------------------------------------------------------------------------
*/

export function calculateCutoffSelectivityConfidence({
  cohortClosingRanks = [],
}) {
  const usable =
    cohortClosingRanks
      .map(
        finiteNumber
      )
      .filter(
        value =>
          value !== null &&
          value > 0
      )
      .length;


  if (
    usable >= 200
  ) {
    return 1;
  }


  if (
    usable >= 100
  ) {
    return 0.9;
  }


  if (
    usable >= 50
  ) {
    return 0.8;
  }


  if (
    usable >= 20
  ) {
    return 0.65;
  }


  return 0;
}
