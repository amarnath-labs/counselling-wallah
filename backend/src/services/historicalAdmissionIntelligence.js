const DEFAULT_YEAR_WEIGHTS = {
  2026: 0.50,
  2025: 0.30,
  2024: 0.20,
};


function toNumber(value) {
  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}


function numericRound(value) {
  const match =
    String(value ?? '')
      .trim()
      .match(/\d+/);

  if (!match) {
    return null;
  }

  return Number(
    match[0]
  );
}


function classifyAdmissionWindow(
  studentRank,
  r1OpeningRank,
  lastRoundClosingRank
) {
  const rank =
    toNumber(
      studentRank
    );

  const opening =
    toNumber(
      r1OpeningRank
    );

  const closing =
    toNumber(
      lastRoundClosingRank
    );


  if (
    rank === null ||
    opening === null ||
    closing === null ||
    closing <= opening
  ) {
    return null;
  }


  if (
    rank <= opening
  ) {
    return 'Backup';
  }


  const position =
    (
      rank -
      opening
    ) /
    (
      closing -
      opening
    );


  if (
    position <= 0.60
  ) {
    return 'Safe';
  }


  if (
    rank <= closing
  ) {
    return 'Target';
  }


  return 'Dream';
}


function classifyRankRatio(
  rankRatio
) {
  if (
    !Number.isFinite(
      rankRatio
    )
  ) {
    return null;
  }

  if (
    rankRatio < 0.50
  ) {
    return 'Backup';
  }

  if (
    rankRatio < 0.80
  ) {
    return 'Safe';
  }

  if (
    rankRatio <= 1.00
  ) {
    return 'Target';
  }

  return 'Dream';
}


function sortRounds(
  rows
) {
  return [
    ...rows,
  ].sort(
    (a, b) => {

      const aRound =
        numericRound(
          a.round
        );

      const bRound =
        numericRound(
          b.round
        );

      if (
        aRound !== null &&
        bRound !== null
      ) {
        return (
          aRound -
          bRound
        );
      }

      return String(
        a.round
      ).localeCompare(
        String(
          b.round
        )
      );
    }
  );
}


function getFinalRoundRow(
  rows
) {
  if (
    !Array.isArray(rows) ||
    rows.length === 0
  ) {
    return null;
  }

  const sorted =
    sortRounds(
      rows
    );

  return (
    sorted[
      sorted.length - 1
    ] || null
  );
}


function buildYearSummaries(
  rows,
  studentRank
) {
  const byYear =
    new Map();


  for (
    const row
    of rows
  ) {

    const year =
      Number(
        row.year
      );

    if (
      !Number.isInteger(year)
    ) {
      continue;
    }

    if (
      !byYear.has(year)
    ) {
      byYear.set(
        year,
        []
      );
    }

    byYear
      .get(year)
      .push(row);
  }


  const years =
    [];


  for (
    const [
      year,
      yearRows,
    ]
    of byYear
  ) {

    const finalRow =
      getFinalRoundRow(
        yearRows
      );

    if (!finalRow) {
      continue;
    }


    const openingRank =
      toNumber(
        finalRow.openingRank ??
        finalRow.opening_rank
      );


    const closingRank =
      toNumber(
        finalRow.closingRank ??
        finalRow.closing_rank
      );


    const rankRatio =
      (
        studentRank !== null &&
        closingRank !== null &&
        closingRank > 0
      )
        ? (
            studentRank /
            closingRank
          )
        : null;


    years.push({
      year,

      finalRound:
        String(
          finalRow.round
        ),

      openingRank,

      closingRank,

      rankRatio,

      bucket:
        classifyRankRatio(
          rankRatio
        ),

      roundCount:
        yearRows.length,

      rounds:
        sortRounds(
          yearRows
        ),
    });
  }


  return years.sort(
    (a, b) =>
      b.year - a.year
  );
}


function calculateWeightedHistory(
  yearSummaries,
  yearWeights =
    DEFAULT_YEAR_WEIGHTS
) {

  let weightedRatio =
    0;

  let usedWeight =
    0;


  const contributions =
    [];


  for (
    const summary
    of yearSummaries
  ) {

    if (
      !Number.isFinite(
        summary.rankRatio
      )
    ) {
      continue;
    }


    const weight =
      Number(
        yearWeights[
          summary.year
        ]
      );


    if (
      !Number.isFinite(weight) ||
      weight <= 0
    ) {
      continue;
    }


    const contribution =
      summary.rankRatio *
      weight;


    weightedRatio +=
      contribution;

    usedWeight +=
      weight;


    contributions.push({
      year:
        summary.year,

      weight,

      rankRatio:
        summary.rankRatio,

      contribution,
    });
  }


  if (
    usedWeight <= 0
  ) {
    return {
      weightedRankRatio:
        null,

      bucket:
        null,

      usedWeight:
        0,

      contributions,
    };
  }


  const normalizedRatio =
    weightedRatio /
    usedWeight;


  return {
    weightedRankRatio:
      normalizedRatio,

    bucket:
      classifyRankRatio(
        normalizedRatio
      ),

    usedWeight,

    contributions,
  };
}


function findLikelyRound(
  latestYearSummary,
  studentRank
) {

  if (
    !latestYearSummary ||
    studentRank === null
  ) {
    return null;
  }


  const rounds =
    sortRounds(
      latestYearSummary.rounds
    );


  for (
    const row
    of rounds
  ) {

    const closingRank =
      toNumber(
        row.closingRank ??
        row.closing_rank
      );


    if (
      closingRank === null
    ) {
      continue;
    }


    if (
      studentRank <=
      closingRank
    ) {

      return {
        year:
          latestYearSummary.year,

        round:
          String(
            row.round
          ),

        openingRank:
          toNumber(
            row.openingRank ??
            row.opening_rank
          ),

        closingRank,

        margin:
          closingRank -
          studentRank,
      };
    }
  }


  return null;
}


/*
|--------------------------------------------------------------------------
| TREND
|--------------------------------------------------------------------------
|
| Higher closing rank means the historical admission boundary moved
| outward, making the route relatively more accessible.
|
*/

function calculateTrend(
  yearSummaries
) {

  const chronological =
    [...yearSummaries]
      .filter(
        item =>
          Number.isFinite(
            item.closingRank
          )
      )
      .sort(
        (a, b) =>
          a.year - b.year
      );


  if (
    chronological.length < 2
  ) {
    return {
      label:
        'Insufficient Data',

      direction:
        'UNKNOWN',

      percentChange:
        null,

      oldestClosingRank:
        chronological[0]
          ?.closingRank ??
        null,

      latestClosingRank:
        chronological[
          chronological.length - 1
        ]?.closingRank ??
        null,
    };
  }


  const oldest =
    chronological[0]
      .closingRank;

  const latest =
    chronological[
      chronological.length - 1
    ].closingRank;


  const percentChange =
    (
      (
        latest -
        oldest
      ) /
      oldest
    ) *
    100;


  const changes =
    [];


  for (
    let index = 1;
    index <
    chronological.length;
    index += 1
  ) {

    const previous =
      chronological[
        index - 1
      ].closingRank;

    const current =
      chronological[
        index
      ].closingRank;


    changes.push(
      current -
      previous
    );
  }


  const hasPositive =
    changes.some(
      value =>
        value > 0
    );

  const hasNegative =
    changes.some(
      value =>
        value < 0
    );


  const directionFlipped =
    hasPositive &&
    hasNegative;


  /*
   * Less than 5% net movement is considered
   * broadly stable.
   */

  if (
    Math.abs(
      percentChange
    ) < 5
  ) {

    return {
      label:
        'Stable',

      direction:
        'STABLE',

      percentChange,

      oldestClosingRank:
        oldest,

      latestClosingRank:
        latest,
    };
  }


  /*
   * If direction changes between years and
   * movement is meaningful, label volatile.
   */

  if (
    directionFlipped
  ) {

    return {
      label:
        'Volatile',

      direction:
        'VOLATILE',

      percentChange,

      oldestClosingRank:
        oldest,

      latestClosingRank:
        latest,
    };
  }


  if (
    percentChange > 0
  ) {

    return {
      label:
        'Improving Opportunity',

      direction:
        'MORE_ACCESSIBLE',

      percentChange,

      oldestClosingRank:
        oldest,

      latestClosingRank:
        latest,
    };
  }


  return {
    label:
      'Becoming More Competitive',

    direction:
      'MORE_COMPETITIVE',

    percentChange,

    oldestClosingRank:
      oldest,

    latestClosingRank:
      latest,
  };
}


/*
|--------------------------------------------------------------------------
| STABILITY
|--------------------------------------------------------------------------
|
| Stability uses the spread of final closing ranks.
|
| 100 = extremely stable
| lower score = greater historical variation
|
*/

function calculateStability(
  yearSummaries
) {

  const values =
    yearSummaries
      .map(
        item =>
          toNumber(
            item.closingRank
          )
      )
      .filter(
        value =>
          value !== null &&
          value > 0
      );


  if (
    values.length === 0
  ) {
    return {
      score:
        null,

      label:
        'Unknown',

      range:
        null,

      rangePercent:
        null,
    };
  }


  if (
    values.length === 1
  ) {
    return {
      score:
        50,

      label:
        'Limited Data',

      range:
        0,

      rangePercent:
        0,
    };
  }


  const minimum =
    Math.min(
      ...values
    );

  const maximum =
    Math.max(
      ...values
    );

  const mean =
    values.reduce(
      (sum, value) =>
        sum + value,
      0
    ) /
    values.length;


  const range =
    maximum -
    minimum;


  const rangePercent =
    mean > 0
      ? (
          range /
          mean
        ) * 100
      : 100;


  const score =
    Math.round(
      Math.max(
        0,
        Math.min(
          100,
          100 -
          rangePercent
        )
      )
    );


  let label =
    'Low';


  if (
    score >= 85
  ) {
    label =
      'Very Stable';
  } else if (
    score >= 70
  ) {
    label =
      'Stable';
  } else if (
    score >= 50
  ) {
    label =
      'Moderate';
  }


  return {
    score,

    label,

    range,

    rangePercent,
  };
}


/*
|--------------------------------------------------------------------------
| CONFIDENCE
|--------------------------------------------------------------------------
|
| Confidence means confidence in the historical prediction,
| NOT probability of admission.
|
| Components:
|
| 40% historical-year coverage
| 40% cutoff stability
| 20% distance from bucket threshold
|
*/

function calculateConfidence({
  yearSummaries,
  weightedRankRatio,
  stability,
}) {

  const availableYears =
    yearSummaries.length;


  const coverageScore =
    Math.min(
      availableYears / 3,
      1
    ) *
    40;


  const stabilityScore =
    Number.isFinite(
      stability?.score
    )
      ? (
          stability.score /
          100
        ) * 40
      : 0;


  const thresholds = [
    0.50,
    0.80,
    1.00,
  ];


  let boundaryScore =
    0;


  if (
    Number.isFinite(
      weightedRankRatio
    )
  ) {

    const nearestDistance =
      Math.min(
        ...thresholds.map(
          threshold =>
            Math.abs(
              weightedRankRatio -
              threshold
            )
        )
      );


    /*
     * 0.20 ratio distance is treated as
     * comfortably away from a bucket boundary.
     */

    boundaryScore =
      Math.min(
        nearestDistance /
        0.20,
        1
      ) *
      20;
  }


  const score =
    Math.round(
      coverageScore +
      stabilityScore +
      boundaryScore
    );


  let label =
    'Low';


  if (
    score >= 80
  ) {
    label =
      'High';
  } else if (
    score >= 60
  ) {
    label =
      'Medium';
  }


  return {
    score,

    label,

    availableYears,

    components: {
      coverageScore,

      stabilityScore,

      boundaryScore,
    },
  };
}


function buildRouteIntelligence({
  rows,
  studentRank,
  route,
  yearWeights =
    DEFAULT_YEAR_WEIGHTS,
}) {

  const normalizedRank =
    toNumber(
      studentRank
    );


  if (
    !Array.isArray(rows) ||
    rows.length === 0
  ) {

    return {
      route,

      available:
        false,

      historicalBucket:
        null,

      weightedRankRatio:
        null,

      latestYear:
        null,

      likelyRound:
        null,

      trend:
        null,

      stability:
        null,

      confidence:
        null,

      years: [],
    };
  }


  const years =
    buildYearSummaries(
      rows,
      normalizedRank
    );


  const weighted =
    calculateWeightedHistory(
      years,
      yearWeights
    );


  const latestYear =
    years[0] || null;


  const likelyRound =
    findLikelyRound(
      latestYear,
      normalizedRank
    );


  const trend =
    calculateTrend(
      years
    );


  const stability =
    calculateStability(
      years
    );


  const confidence =
    calculateConfidence({
      yearSummaries:
        years,

      weightedRankRatio:
        weighted.weightedRankRatio,

      stability,
    });


  return {
    route,

    available:
      true,

    historicalBucket:
      classifyAdmissionWindow(
        normalizedRank,
        latestYear?.openingRank,
        latestYear?.closingRank
      ) ??
      weighted.bucket,

    weightedRankRatio:
      weighted.weightedRankRatio,

    usedWeight:
      weighted.usedWeight,

    latestYear:
      latestYear
        ? latestYear.year
        : null,

    likelyRound,

    trend,

    stability,

    confidence,

    years:
      years.map(
        year => ({
          year:
            year.year,

          finalRound:
            year.finalRound,

          openingRank:
            year.openingRank,

          closingRank:
            year.closingRank,

          rankRatio:
            year.rankRatio,

          bucket:
            year.bucket,

          roundCount:
            year.roundCount,
        })
      ),

    contributions:
      weighted.contributions,
  };
}


function buildHistoricalAdmissionIntelligence({
  studentRank,
  josaaRows = [],
  csabRows = [],
  yearWeights =
    DEFAULT_YEAR_WEIGHTS,
}) {

  return {
    studentRank:
      toNumber(
        studentRank
      ),

    formula: {
      rankRatio:
        'studentRank / closingRank',

      yearWeights,

      thresholds: {
        backupBelow:
          0.50,

        safeBelow:
          0.80,

        targetMax:
          1.00,
      },

      openingRankUsage:
        'R1-opening-rank',

      closingRankUsage:
        'last-round-closing-rank',

      confidenceMeaning:
        'historical-prediction-reliability',
    },

    josaa:
      buildRouteIntelligence({
        rows:
          josaaRows,

        studentRank,

        route:
          'JOSAA',

        yearWeights,
      }),

    csab:
      buildRouteIntelligence({
        rows:
          csabRows,

        studentRank,

        route:
          'CSAB_SPECIAL',

        yearWeights,
      }),
  };
}


export {
  DEFAULT_YEAR_WEIGHTS,
  classifyRankRatio,
  calculateTrend,
  calculateStability,
  calculateConfidence,
  buildHistoricalAdmissionIntelligence,
  buildRouteIntelligence,
};