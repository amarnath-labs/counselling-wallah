/*
|--------------------------------------------------------------------------
| TruMarg V2 - High Demand Intelligence
|--------------------------------------------------------------------------
|
| Demand != college quality.
| Demand != admission probability.
|
| Demand measures how strongly students compete for an option.
|
| Preferred signals:
|
| 1. applicant / choice pressure
| 2. seat fill speed
| 3. counselling persistence
| 4. demand trend
|
| Missing evidence remains null.
|
|--------------------------------------------------------------------------
*/


function numberOrNull(value) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null;
  }

  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}


function clamp(
  value,
  min = 0,
  max = 100
) {
  return Math.min(
    max,
    Math.max(
      min,
      value
    )
  );
}


/*
|--------------------------------------------------------------------------
| Applicant pressure
|--------------------------------------------------------------------------
|
| applicantsPerSeat:
|
| 1 applicant / seat  -> low pressure
| 5                  -> meaningful
| 10+                -> high
| 20+                -> extremely high
|
|--------------------------------------------------------------------------
*/

function applicantPressureScore(
  applicantsPerSeat
) {
  const ratio =
    numberOrNull(
      applicantsPerSeat
    );

  if (
    ratio === null ||
    ratio <= 0
  ) {
    return null;
  }


  /*
  | Log scaling prevents huge colleges / viral programs
  | from dominating.
  */

  const normalized =
    Math.log1p(
      ratio
    ) /
    Math.log1p(
      20
    );


  return Math.round(
    clamp(
      normalized *
      100
    )
  );
}


/*
|--------------------------------------------------------------------------
| Seat fill speed
|--------------------------------------------------------------------------
|
| Example:
|
| roundFilled = 1 -> strongest
| roundFilled = 2 -> strong
| roundFilled = 3 -> moderate
| roundFilled = 5+ -> weaker demand
|
|--------------------------------------------------------------------------
*/

function seatFillScore(
  roundFilled
) {
  const round =
    numberOrNull(
      roundFilled
    );

  if (
    round === null ||
    round <= 0
  ) {
    return null;
  }


  if (round <= 1) return 100;
  if (round <= 2) return 90;
  if (round <= 3) return 75;
  if (round <= 4) return 60;
  if (round <= 5) return 45;

  return 30;
}


/*
|--------------------------------------------------------------------------
| Demand trend
|--------------------------------------------------------------------------
|
| Input expected:
|
| +20 = demand increasing strongly
|  0  = stable
| -20 = weakening
|
|--------------------------------------------------------------------------
*/

function demandTrendScore(
  trendPercent
) {
  const trend =
    numberOrNull(
      trendPercent
    );

  if (
    trend === null
  ) {
    return null;
  }


  return Math.round(
    clamp(
      50 +
      (
        trend *
        2
      )
    )
  );
}


/*
|--------------------------------------------------------------------------
| Preference / choice-list intensity
|--------------------------------------------------------------------------
|
| Should be based on anonymized aggregate behaviour,
| NOT individual user tracking.
|
| 0-100 already normalized.
|
|--------------------------------------------------------------------------
*/

function preferenceIntensityScore(
  value
) {
  const score =
    numberOrNull(
      value
    );

  return score === null
    ? null
    : Math.round(
        clamp(
          score
        )
      );
}


/*
|--------------------------------------------------------------------------
| Main demand score
|--------------------------------------------------------------------------
*/

export function buildHighDemandScore({
  applicantsPerSeat,
  roundFilled,
  demandTrendPercent,
  preferenceIntensity,
}) {
  const factors = {
    applicantPressure:
      applicantPressureScore(
        applicantsPerSeat
      ),

    seatFill:
      seatFillScore(
        roundFilled
      ),

    trend:
      demandTrendScore(
        demandTrendPercent
      ),

    preferenceIntensity:
      preferenceIntensityScore(
        preferenceIntensity
      ),
  };


  const weights = {
    applicantPressure:
      40,

    seatFill:
      25,

    trend:
      15,

    preferenceIntensity:
      20,
  };


  let earned = 0;
  let availableWeight = 0;


  for (
    const [
      key,
      weight,
    ]
    of Object.entries(
      weights
    )
  ) {
    const value =
      factors[key];


    if (
      value === null
    ) {
      continue;
    }


    earned +=
      value *
      weight;

    availableWeight +=
      weight;
  }


  /*
  | Need at least two different demand signals.
  */

  const availableFactors =
    Object.values(
      factors
    )
      .filter(
        value =>
          value !== null
      )
      .length;


  if (
    availableFactors < 2 ||
    availableWeight <= 0
  ) {
    return {
      available:
        false,

      score:
        null,

      factors,

      coverage:
        Math.round(
          availableWeight
        ),

      reason:
        'INSUFFICIENT_DEMAND_EVIDENCE',
    };
  }


  return {
    available:
      true,

    score:
      Math.round(
        clamp(
          earned /
          availableWeight
        )
      ),

    factors,

    coverage:
      Math.round(
        availableWeight
      ),

    reason:
      null,
  };
}
