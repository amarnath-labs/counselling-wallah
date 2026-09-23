import {
  useMemo,
  useState,
} from 'react';


function num(value) {
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
  return Math.max(
    min,
    Math.min(
      max,
      value
    )
  );
}


function firstNumber(
  ...values
) {
  for (
    const value of values
  ) {
    const number =
      num(value);

    if (
      number !== null
    ) {
      return number;
    }
  }

  return null;
}


function getBreakdown(row) {
  return (
    row?.premium?.breakdown ||
    {}
  );
}


function getCollegeName(row) {
  return (
    row?.college?.name ||
    row?.college_name ||
    'College'
  );
}


function getBranchName(row) {
  return (
    row?.branch?.name ||
    row?.branch_name ||
    'Branch'
  );
}


function getScore(row) {
  return firstNumber(
    row?.premium?.score,
    row?.overall,
    row?.score
  );
}


function getCoverage(row) {
  const explicit =
    firstNumber(
      row?.premium?.dataCoverage,
      row?.premium?.coverage,
      row?.premium?.evidenceCoverage
    );

  if (
    explicit !== null
  ) {
    return clamp(
      explicit
    );
  }

  const breakdown =
    getBreakdown(row);

  const factors = [
    [
      breakdown?.rank,
      50,
    ],
    [
      breakdown?.branch,
      15,
    ],
    [
      breakdown?.quality,
      15,
    ],
    [
      breakdown?.reviews,
      10,
    ],
    [
      breakdown?.budget,
      7,
    ],
    [
      breakdown?.location,
      3,
    ],
  ];

  let available = 0;

  for (
    const [
      value,
      weight,
    ] of factors
  ) {
    if (
      num(value) !== null
    ) {
      available +=
        weight;
    }
  }

  return available;
}


function getConfidence(row) {
  const coverage =
    getCoverage(row);

  const breakdown =
    getBreakdown(row);

  const coreAvailable =
    num(
      breakdown?.rank
    ) !== null &&
    num(
      breakdown?.branch
    ) !== null &&
    num(
      breakdown?.quality
    ) !== null;

  if (
    coverage >= 85 &&
    coreAvailable
  ) {
    return {
      label:
        'High',
      tone:
        'high',
    };
  }

  if (
    coverage >= 60
  ) {
    return {
      label:
        'Medium',
      tone:
        'medium',
    };
  }

  return {
    label:
      'Limited',
    tone:
      'limited',
  };
}


function getHistorical(row) {
  return (
    row?.premium?.historicalFit ||
    row?.historicalFit ||
    row?.admissionIntelligence ||
    row?.historicalAdmissionIntelligence ||
    {}
  );
}


function getLatestClosing(row) {
  const historical =
    getHistorical(row);

  return firstNumber(
    historical?.latestClosingRank,
    historical?.latestClosing,
    historical?.closingRank,
    historical?.closing_rank,
    row?.branch?.closingRank,
    row?.closingRank,
    row?.closing_rank
  );
}


function getOpening(row) {
  const historical =
    getHistorical(row);

  return firstNumber(
    historical?.latestOpeningRank,
    historical?.latestOpening,
    historical?.openingRank,
    historical?.opening_rank,
    row?.branch?.openingRank,
    row?.openingRank,
    row?.opening_rank
  );
}


function formatRank(value) {
  const number =
    num(value);

  if (
    number === null
  ) {
    return 'Not available';
  }

  return Math.round(
    number
  ).toLocaleString(
    'en-IN'
  );
}


function getHistoricalFitLabel(
  row
) {
  const historical =
    getHistorical(row);

  const raw =
    historical?.label ||
    historical?.bucket ||
    row?.premium
      ?.admissionBucket
      ?.label ||
    row?.premium
      ?.admissionBucket ||
    row?.bucket ||
    'Unknown';

  return String(
    raw
  );
}


function getTrend(row) {
  const historical =
    getHistorical(row);

  return (
    historical?.trend?.label ||
    historical?.trend ||
    historical?.cutoffTrend ||
    historical?.trendLabel ||
    'Not enough evidence'
  );
}


function getVolatility(row) {
  const historical =
    getHistorical(row);

  return (
    historical?.volatilityLabel ||
    historical?.volatility ||
    historical?.stability?.label ||
    historical?.stability ||
    'Not enough evidence'
  );
}


function getEvidenceConfidence(
  row
) {
  const historical =
    getHistorical(row);

  return (
    historical?.confidence?.label ||
    historical?.confidence ||
    historical?.evidenceConfidence ||
    getConfidence(row).label
  );
}


function getYears(row) {
  const historical =
    getHistorical(row);

  const candidates = [
    historical?.years,
    historical?.history,
    historical?.cutoffs,
    historical?.yearly,
    historical?.yearlyCutoffs,
  ];

  for (
    const candidate of candidates
  ) {
    if (
      Array.isArray(
        candidate
      )
    ) {
      return candidate
        .map(
          (item) => ({
            year:
              item?.year,
            closing:
              firstNumber(
                item?.closingRank,
                item?.closing_rank,
                item?.closing,
                item?.finalClosing
              ),
          })
        )
        .filter(
          (item) =>
            item.year &&
            item.closing !==
              null
        )
        .slice(
          0,
          3
        );
    }
  }

  return [];
}


function reasonText(reason) {
  if (
    typeof reason ===
    'string'
  ) {
    return reason;
  }

  return (
    reason?.text ||
    reason?.label ||
    reason?.reason ||
    ''
  );
}


function getReasonArrays(row) {
  const strongRaw =
    row?.premium
      ?.reasons
      ?.strong;

  const weakRaw =
    row?.premium
      ?.reasons
      ?.weak;

  return {
    strong:
      Array.isArray(
        strongRaw
      )
        ? strongRaw
            .map(
              reasonText
            )
            .filter(
              Boolean
            )
        : [],

    weak:
      Array.isArray(
        weakRaw
      )
        ? weakRaw
            .map(
              reasonText
            )
            .filter(
              Boolean
            )
        : [],
  };
}


function factorPct(
  value,
  max
) {
  const n =
    num(value);

  if (
    n === null
  ) {
    return null;
  }

  return clamp(
    (
      n /
      max
    ) *
      100
  );
}


function buildDecision(
  row,
  index
) {
  const breakdown =
    getBreakdown(row);

  const admission =
    factorPct(
      breakdown?.rank,
      50
    );

  const branch =
    factorPct(
      breakdown?.branch,
      15
    );

  const quality =
    factorPct(
      breakdown?.quality,
      15
    );

  const budget =
    factorPct(
      breakdown?.budget,
      7
    );

  const location =
    factorPct(
      breakdown?.location,
      3
    );

  const positives = [];

  const negatives = [];

  if (
    admission !== null
  ) {
    if (
      admission >= 75
    ) {
      positives.push(
        'strong historical admission fit'
      );
    } else if (
      admission <= 30
    ) {
      negatives.push(
        'admission fit is currently weak'
      );
    }
  }

  if (
    branch !== null
  ) {
    if (
      branch >= 80
    ) {
      positives.push(
        'your branch preference is strongly matched'
      );
    } else if (
      branch <= 45
    ) {
      negatives.push(
        'branch preference is only partially matched'
      );
    }
  }

  if (
    quality !== null &&
    quality >= 75
  ) {
    positives.push(
      'college quality is strong'
    );
  }

  if (
    budget !== null
  ) {
    if (
      budget >= 80
    ) {
      positives.push(
        'it fits your budget well'
      );
    } else if (
      budget <= 40
    ) {
      negatives.push(
        'budget fit is weak'
      );
    }
  }

  if (
    location !== null &&
    location <= 40
  ) {
    negatives.push(
      'location preference is weak'
    );
  }

  const positiveText =
    positives.length
      ? positives
          .slice(
            0,
            3
          )
          .join(
            ', '
          )
      : 'the available factors create a reasonable overall match';

  const negativeText =
    negatives.length
      ? ` Main trade-off: ${
          negatives[0]
        }.`
      : '';

  return {
    whyRanked:
      `Ranked #${
        index + 1
      } because ${positiveText}.${negativeText}`,

    bestFor:
      positives.length
        ? `Best when you value ${
            positives
              .slice(
                0,
                2
              )
              .join(
                ' and '
              )
          }.`
        : 'Best when the overall balance matters more than one single factor.',

    avoidIf:
      negatives.length
        ? `Think carefully if ${
            negatives[0]
          } is non-negotiable for you.`
        : 'No major profile conflict is visible from the available verified factors.',
  };
}


function getTradeoffs(row) {
  const breakdown =
    getBreakdown(row);

  const output = [];

  const branchPct =
    factorPct(
      breakdown?.branch,
      15
    );

  const admissionPct =
    factorPct(
      breakdown?.rank,
      50
    );

  const qualityPct =
    factorPct(
      breakdown?.quality,
      15
    );

  const budgetPct =
    factorPct(
      breakdown?.budget,
      7
    );

  const locationPct =
    factorPct(
      breakdown?.location,
      3
    );

  if (
    qualityPct !== null &&
    qualityPct >= 75
  ) {
    output.push({
      sign:
        '+',
      text:
        'Strong college-quality signal.',
    });
  }

  if (
    branchPct !== null &&
    branchPct >= 80
  ) {
    output.push({
      sign:
        '+',
      text:
        'Strong match with your preferred branch.',
    });
  }

  if (
    admissionPct !== null &&
    admissionPct >= 70
  ) {
    output.push({
      sign:
        '+',
      text:
        'Historical admission evidence supports this option.',
    });
  }

  if (
    branchPct !== null &&
    branchPct < 50
  ) {
    output.push({
      sign:
        '-',
      text:
        'You are sacrificing branch preference for other strengths.',
    });
  }

  if (
    admissionPct !== null &&
    admissionPct <= 30
  ) {
    output.push({
      sign:
        '-',
      text:
        'Admission margin is weak; treat this as an aspirational option.',
    });
  }

  if (
    budgetPct !== null &&
    budgetPct < 50
  ) {
    output.push({
      sign:
        '-',
      text:
        'Cost is less aligned with your stated budget.',
    });
  }

  if (
    locationPct !== null &&
    locationPct < 50
  ) {
    output.push({
      sign:
        '-',
      text:
        'Location is less aligned with your preference.',
    });
  }

  return output.slice(
    0,
    5
  );
}


function scenarioScore(
  row,
  mode
) {
  const breakdown =
    getBreakdown(row);

  const values = {
    admission:
      factorPct(
        breakdown?.rank,
        50
      ),

    branch:
      factorPct(
        breakdown?.branch,
        15
      ),

    quality:
      factorPct(
        breakdown?.quality,
        15
      ),

    reviews:
      factorPct(
        breakdown?.reviews,
        10
      ),

    budget:
      factorPct(
        breakdown?.budget,
        7
      ),

    location:
      factorPct(
        breakdown?.location,
        3
      ),
  };

  const weights = {
    balanced: {
      admission:
        50,
      branch:
        15,
      quality:
        15,
      reviews:
        10,
      budget:
        7,
      location:
        3,
    },

    branch: {
      admission:
        30,
      branch:
        35,
      quality:
        15,
      reviews:
        8,
      budget:
        7,
      location:
        5,
    },

    college: {
      admission:
        35,
      branch:
        10,
      quality:
        30,
      reviews:
        10,
      budget:
        8,
      location:
        7,
    },

    budget: {
      admission:
        35,
      branch:
        15,
      quality:
        12,
      reviews:
        8,
      budget:
        25,
      location:
        5,
    },

    location: {
      admission:
        35,
      branch:
        15,
      quality:
        15,
      reviews:
        5,
      budget:
        10,
      location:
        20,
    },
  };

  const selected =
    weights[
      mode
    ] ||
    weights.balanced;

  let earned = 0;

  let possible = 0;

  for (
    const key of Object.keys(
      selected
    )
  ) {
    const value =
      values[
        key
      ];

    if (
      value !== null
    ) {
      earned +=
        value *
        selected[
          key
        ];

      possible +=
        selected[
          key
        ];
    }
  }

  if (
    possible === 0
  ) {
    return -1;
  }

  return (
    earned /
    possible
  );
}


function findScenarioRank(
  row,
  rows,
  mode
) {
  const sorted =
    [...rows]
      .filter(
        Boolean
      )
      .sort(
        (a, b) =>
          scenarioScore(
            b,
            mode
          ) -
          scenarioScore(
            a,
            mode
          )
      );

  const index =
    sorted.indexOf(
      row
    );

  return index >= 0
    ? index + 1
    : null;
}


function findAlternative(
  row,
  rows,
  mode
) {
  const others =
    rows.filter(
      (candidate) =>
        candidate &&
        candidate !== row
    );

  if (
    !others.length
  ) {
    return null;
  }

  const sorted =
    [...others].sort(
      (a, b) =>
        scenarioScore(
          b,
          mode
        ) -
        scenarioScore(
          a,
          mode
        )
    );

  return (
    sorted[0] ||
    null
  );
}


function AlternativeCard({
  title,
  row,
  reason,
}) {
  if (
    !row
  ) {
    return null;
  }

  return (
    <div className="tdi-alternative">
      <div className="tdi-alternative__label">
        {title}
      </div>

      <strong>
        {getCollegeName(
          row
        )}
      </strong>

      <span>
        {getBranchName(
          row
        )}
      </span>

      <small>
        {reason}
      </small>
    </div>
  );
}



/*
|--------------------------------------------------------------------------
| TRUMARG V1 DECISION INTELLIGENCE HELPERS
|--------------------------------------------------------------------------
*/


function v1Number(value) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null;
  }

  const parsed =
    Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : null;
}


function getV1Factor(
  row,
  key
) {
  const direct =
    row?.factors?.[key];

  if (
    direct &&
    direct.available === true &&
    v1Number(
      direct.score
    ) !== null
  ) {
    return {
      available: true,
      score:
        v1Number(
          direct.score
        ),
    };
  }


  return {
    available: false,
    score: null,
  };
}


function getV1Evidence(
  row
) {
  const existing =
    row?.evidenceTransparency ??
    row?.premium
      ?.evidenceTransparency;


  if (
    existing &&
    Array.isArray(
      existing.known
    ) &&
    Array.isArray(
      existing.missing
    )
  ) {
    return existing;
  }


  const factors = [
    [
      'Admission data',
      'admission',
    ],
    [
      'Branch preference',
      'branch',
    ],
    [
      'College quality',
      'quality',
    ],
    [
      'Review intelligence',
      'reviews',
    ],
    [
      'Budget / fee fit',
      'budget',
    ],
    [
      'Location fit',
      'location',
    ],
  ];


  const v1Evidence =
    getV1Evidence(
      row
    );

  const known =
    v1Evidence.known;

  const missing =
    v1Evidence.missing;


  for (
    const [
      label,
      key,
    ]
    of factors
  ) {
    const factor =
      getV1Factor(
        row,
        key
      );


    if (
      factor.available
    ) {
      known.push(
        label
      );
    } else {
      missing.push(
        label
      );
    }
  }


  return {
    known,
    missing,
  };
}


/*
|--------------------------------------------------------------------------
| SCENARIO WEIGHTS
|--------------------------------------------------------------------------
|
| Score stays on the same 0-100 scale.
| Missing data contributes zero.
| We DO NOT renormalize only across known factors.
|
|--------------------------------------------------------------------------
*/


const V1_SCENARIO_WEIGHTS = {
  balanced: {
    admission: 50,
    branch: 15,
    quality: 15,
    reviews: 10,
    budget: 7,
    location: 3,
  },

  branch: {
    admission: 35,
    branch: 35,
    quality: 12,
    reviews: 8,
    budget: 7,
    location: 3,
  },

  college: {
    admission: 35,
    branch: 12,
    quality: 35,
    reviews: 10,
    budget: 5,
    location: 3,
  },

  budget: {
    admission: 35,
    branch: 12,
    quality: 12,
    reviews: 8,
    budget: 30,
    location: 3,
  },

  location: {
    admission: 35,
    branch: 12,
    quality: 12,
    reviews: 8,
    budget: 8,
    location: 25,
  },
};


function scenarioScoreV1(
  row,
  mode = 'balanced'
) {
  const weights =
    V1_SCENARIO_WEIGHTS[
      mode
    ] ??
    V1_SCENARIO_WEIGHTS
      .balanced;


  let score = 0;


  for (
    const [
      key,
      weight,
    ]
    of Object.entries(
      weights
    )
  ) {
    const factor =
      getV1Factor(
        row,
        key
      );


    if (
      !factor.available
    ) {
      continue;
    }


    score +=
      (
        factor.score /
        100
      ) *
      weight;
  }


  return Math.round(
    score * 10
  ) / 10;
}


function findScenarioRankV1(
  row,
  rows,
  mode
) {
  const sorted =
    [...rows]
      .filter(Boolean)
      .sort(
        (
          a,
          b
        ) => {
          const scoreDiff =
            scenarioScoreV1(
              b,
              mode
            ) -
            scenarioScoreV1(
              a,
              mode
            );

          if (
            scoreDiff !== 0
          ) {
            return scoreDiff;
          }


          return (
            v1Number(
              b?.dataCoverage ??
              b?.premium
                ?.dataCoverage
            ) ??
            0
          ) -
          (
            v1Number(
              a?.dataCoverage ??
              a?.premium
                ?.dataCoverage
            ) ??
            0
          );
        }
      );


  const index =
    sorted.indexOf(
      row
    );


  return index >= 0
    ? index + 1
    : null;
}


/*
|--------------------------------------------------------------------------
| BETTER ALTERNATIVES
|--------------------------------------------------------------------------
|
| Candidate must actually improve requested factor.
|
|--------------------------------------------------------------------------
*/


function findBetterAlternativeV1(
  row,
  rows,
  factorKey
) {
  const current =
    getV1Factor(
      row,
      factorKey
    );


  /*
  |--------------------------------------------------------------------------
  | If current factor itself is unknown,
  | do not pretend we have a better alternative.
  |--------------------------------------------------------------------------
  */

  if (
    !current.available
  ) {
    return null;
  }


  const candidates =
    rows
      .filter(
        (
          candidate
        ) => {
          if (
            !candidate ||
            candidate === row
          ) {
            return false;
          }


          const factor =
            getV1Factor(
              candidate,
              factorKey
            );


          return (
            factor.available &&
            factor.score >
              current.score
          );
        }
      )
      .sort(
        (
          a,
          b
        ) => {
          const factorA =
            getV1Factor(
              a,
              factorKey
            );

          const factorB =
            getV1Factor(
              b,
              factorKey
            );


          const factorDiff =
            factorB.score -
            factorA.score;


          if (
            factorDiff !== 0
          ) {
            return factorDiff;
          }


          return (
            v1Number(
              b?.matchScore ??
              b?.premium?.score
            ) ??
            -1
          ) -
          (
            v1Number(
              a?.matchScore ??
              a?.premium?.score
            ) ??
            -1
          );
        }
      );


  return (
    candidates[0] ??
    null
  );
}


function getCurrentGlobalRankV1(
  row,
  fallbackIndex
) {
  return (
    v1Number(
      row?.ranking
        ?.globalRank ??
      row?.premium
        ?.ranking
        ?.globalRank
    ) ??
    (
      fallbackIndex +
      1
    )
  );
}



function alternativeCollegeKeyV1(
  row
) {
  return String(
    row?.collegeId ??
    row?.college?.id ??
    row?.college_id ??
    getCollegeName(
      row
    ) ??
    ''
  )
    .trim()
    .toLowerCase();
}


function findUniqueBetterAlternativeV1({
  row,
  rows,
  factorKey,
  usedCollegeKeys,
}) {
  /*
  |--------------------------------------------------------------------------
  | TRUMARG RELATIVE ALTERNATIVE V2
  |--------------------------------------------------------------------------
  |
  | Choose a genuinely better option RELATIVE to the current row.
  |
  | Priority:
  | 1. factor must improve
  | 2. current college itself excluded
  | 3. colleges already used in another alternative slot excluded
  | 4. prefer the SMALLEST positive factor improvement
  | 5. then prefer closest overall score
  | 6. then prefer closest global rank
  |
  | This prevents the same globally strongest colleges from being shown
  | for every recommendation card.
  |
  */

  const currentFactor =
    getV1Factor(
      row,
      factorKey
    );

  if (
    !currentFactor?.available
  ) {
    return null;
  }


  const currentCollegeKey =
    alternativeCollegeKeyV1(
      row
    );


  const currentOverall =
    v1Number(
      row?.personalizedV2
        ?.rawScore ??
      row?.matchScore ??
      row?.premium?.score
    ) ??
    0;


  const currentRank =
    v1Number(
      row?.ranking
        ?.globalRank ??
      row?.premium
        ?.ranking
        ?.globalRank
    );


  const candidates =
    (Array.isArray(rows)
      ? rows
      : []
    )
      .filter(
        (candidate) => {
          if (
            !candidate ||
            candidate === row
          ) {
            return false;
          }


          const candidateCollegeKey =
            alternativeCollegeKeyV1(
              candidate
            );


          /*
          |--------------------------------------------------------------------------
          | Never recommend same college as current row
          |--------------------------------------------------------------------------
          */

          if (
            candidateCollegeKey &&
            currentCollegeKey &&
            candidateCollegeKey ===
              currentCollegeKey
          ) {
            return false;
          }


          /*
          |--------------------------------------------------------------------------
          | Keep different colleges across alternative slots
          |--------------------------------------------------------------------------
          */

          if (
            candidateCollegeKey &&
            usedCollegeKeys?.has(
              candidateCollegeKey
            )
          ) {
            return false;
          }


          const candidateFactor =
            getV1Factor(
              candidate,
              factorKey
            );


          return (
            candidateFactor
              ?.available &&
            Number.isFinite(
              Number(
                candidateFactor.score
              )
            ) &&
            Number(
              candidateFactor.score
            ) >
              Number(
                currentFactor.score
              )
          );
        }
      )
      .map(
        (candidate) => {
          const factor =
            getV1Factor(
              candidate,
              factorKey
            );


          const candidateOverall =
            v1Number(
              candidate
                ?.personalizedV2
                ?.rawScore ??
              candidate
                ?.matchScore ??
              candidate
                ?.premium
                ?.score
            ) ??
            0;


          const candidateRank =
            v1Number(
              candidate?.ranking
                ?.globalRank ??
              candidate?.premium
                ?.ranking
                ?.globalRank
            );


          const factorGain =
            Number(
              factor.score
            ) -
            Number(
              currentFactor.score
            );


          const overallGap =
            Math.abs(
              candidateOverall -
              currentOverall
            );


          const rankGap =
            (
              currentRank !==
                null &&
              candidateRank !==
                null
            )
              ? Math.abs(
                  candidateRank -
                  currentRank
                )
              : Number.POSITIVE_INFINITY;


          return {
            candidate,
            factorGain,
            overallGap,
            rankGap,
          };
        }
      )
      .sort(
        (a, b) => {
          /*
          |--------------------------------------------------------------------------
          | 1. Nearest genuine improvement
          |--------------------------------------------------------------------------
          */

          if (
            a.factorGain !==
            b.factorGain
          ) {
            return (
              a.factorGain -
              b.factorGain
            );
          }


          /*
          |--------------------------------------------------------------------------
          | 2. Similar overall suitability
          |--------------------------------------------------------------------------
          */

          if (
            a.overallGap !==
            b.overallGap
          ) {
            return (
              a.overallGap -
              b.overallGap
            );
          }


          /*
          |--------------------------------------------------------------------------
          | 3. Similar current ranking neighborhood
          |--------------------------------------------------------------------------
          */

          return (
            a.rankGap -
            b.rankGap
          );
        }
      );


  const selected =
    candidates[0]
      ?.candidate ??
    null;


  if (selected) {
    const key =
      alternativeCollegeKeyV1(
        selected
      );

    if (key) {
      usedCollegeKeys.add(
        key
      );
    }
  }


  return selected;
}) {
  const currentFactor =
    getV1Factor(
      row,
      factorKey
    );


  if (
    !currentFactor.available
  ) {
    return null;
  }


  const currentCollegeKey =
    alternativeCollegeKeyV1(
      row
    );


  const currentOverall =
    v1Number(
      row?.matchScore ??
      row?.premium?.score
    ) ??
    0;


  const currentRank =
    v1Number(
      row?.ranking?.globalRank ??
      row?.premium
        ?.ranking
        ?.globalRank
    );


  const candidates =
    rows
      .filter(
        (
          candidate
        ) => {
          if (
            !candidate ||
            candidate === row
          ) {
            return false;
          }


          const collegeKey =
            alternativeCollegeKeyV1(
              candidate
            );


          if (
            !collegeKey ||
            collegeKey ===
              currentCollegeKey ||
            usedCollegeKeys.has(
              collegeKey
            )
          ) {
            return false;
          }


          const candidateFactor =
            getV1Factor(
              candidate,
              factorKey
            );


          if (
            !candidateFactor.available ||
            candidateFactor.score <=
              currentFactor.score
          ) {
            return false;
          }


          /*
          |--------------------------------------------------------------------------
          | Avoid absurd alternatives
          |--------------------------------------------------------------------------
          |
          | Candidate should not be dramatically worse overall.
          |
          */

          const candidateOverall =
            v1Number(
              candidate?.matchScore ??
              candidate?.premium?.score
            ) ??
            0;


          if (
            candidateOverall <
              currentOverall -
              15
          ) {
            return false;
          }


          return true;
        }
      )
      .map(
        (
          candidate
        ) => {
          const factor =
            getV1Factor(
              candidate,
              factorKey
            );


          const candidateOverall =
            v1Number(
              candidate?.matchScore ??
              candidate?.premium?.score
            ) ??
            0;


          const candidateRank =
            v1Number(
              candidate?.ranking
                ?.globalRank ??
              candidate?.premium
                ?.ranking
                ?.globalRank
            );


          const factorGain =
            factor.score -
            currentFactor.score;


          const overallGap =
            Math.abs(
              candidateOverall -
              currentOverall
            );


          const rankGap =
            (
              currentRank !== null &&
              candidateRank !== null
            )
              ? Math.abs(
                  candidateRank -
                  currentRank
                )
              : 100;


          /*
          |--------------------------------------------------------------------------
          | Alternative relevance score
          |--------------------------------------------------------------------------
          |
          | Prefer:
          | 1. real factor improvement
          | 2. similar overall quality
          | 3. nearby global rank
          |
          */

          const relevance =
            (
              factorGain *
              4
            ) -
            (
              overallGap *
              1.5
            ) -
            (
              Math.min(
                rankGap,
                50
              ) *
              0.15
            );


          return {
            candidate,
            relevance,
            factorGain,
            overallGap,
          };
        }
      )
      .sort(
        (
          a,
          b
        ) => {
          if (
            b.relevance !==
            a.relevance
          ) {
            return (
              b.relevance -
              a.relevance
            );
          }


          if (
            b.factorGain !==
            a.factorGain
          ) {
            return (
              b.factorGain -
              a.factorGain
            );
          }


          return (
            a.overallGap -
            b.overallGap
          );
        }
      );


  const selected =
    candidates[0]
      ?.candidate ??
    null;


  if (
    selected
  ) {
    usedCollegeKeys.add(
      alternativeCollegeKeyV1(
        selected
      )
    );
  }


  return selected;
}


function buildUniqueAlternativesV1(
  row,
  rows
) {
  const usedCollegeKeys =
    new Set();


  /*
  |--------------------------------------------------------------------------
  | Priority order
  |--------------------------------------------------------------------------
  |
  | Each section gets a different college.
  |
  */

  const admission =
    findUniqueBetterAlternativeV1({
      row,
      rows,
      factorKey:
        'admission',
      usedCollegeKeys,
    });


  const branch =
    findUniqueBetterAlternativeV1({
      row,
      rows,
      factorKey:
        'branch',
      usedCollegeKeys,
    });


  const quality =
    findUniqueBetterAlternativeV1({
      row,
      rows,
      factorKey:
        'quality',
      usedCollegeKeys,
    });


  const budget =
    findUniqueBetterAlternativeV1({
      row,
      rows,
      factorKey:
        'budget',
      usedCollegeKeys,
    });


  const location =
    findUniqueBetterAlternativeV1({
      row,
      rows,
      factorKey:
        'location',
      usedCollegeKeys,
    });


  return {
    admission,
    branch,
    quality,
    budget,
    location,
  };
}


export default function DecisionIntelligencePanel({
  row,
  index = 0,
  rows = [],
}) {
  const [
    scenario,
    setScenario,
  ] = useState(
    'balanced'
  );

  const breakdown =
    getBreakdown(row);

  const confidence =
    getConfidence(row);

  const coverage =
    getCoverage(row);

  const decision =
    buildDecision(
      row,
      index
    );

  const tradeoffs =
    getTradeoffs(row);

  const reasons =
    getReasonArrays(row);

  const historicalYears =
    getYears(row);

  const v1Evidence =
    getV1Evidence(
      row
    );

  const known =
    Array.isArray(
      v1Evidence?.known
    )
      ? v1Evidence.known
      : [];

  const missing =
    Array.isArray(
      v1Evidence?.missing
    )
      ? v1Evidence.missing
      : [];


  const currentRank =
    getCurrentGlobalRankV1(
      row,
      index
    );

  const scenarioRank =
    useMemo(
      () =>
        findScenarioRankV1(
          row,
          rows,
          scenario
        ),
      [
        row,
        rows,
        scenario,
      ]
    );

  const alternativesV1 =
    useMemo(
      () =>
        buildUniqueAlternativesV1(
          row,
          rows
        ),
      [
        row,
        rows,
      ]
    );


  const admissionAlternative =
    alternativesV1.admission;

  const branchAlternative =
    alternativesV1.branch;

  const collegeAlternative =
    alternativesV1.quality;

  const budgetAlternative =
    alternativesV1.budget;

  const locationAlternative =
    alternativesV1.location;


  return (
    <section className="tdi-panel">

      <div className="tdi-heading">
        <div>
          <span className="tdi-kicker">
            TRUMARG DECISION INTELLIGENCE
          </span>

          <h4>
            Why this option is ranked here
          </h4>

          <p>
            {decision.whyRanked}
          </p>
        </div>

        <div
          className={
            `tdi-confidence tdi-confidence--${confidence.tone}`
          }
        >
          <span>
            Recommendation Confidence
          </span>

          <strong>
            {confidence.label}
          </strong>

          <small>
            {Math.round(
              coverage
            )}% evidence coverage
          </small>
        </div>
      </div>


      <div className="tdi-decision-grid">

        <div className="tdi-box">
          <span className="tdi-box__label">
            BEST FOR
          </span>

          <p>
            {decision.bestFor}
          </p>
        </div>

        <div className="tdi-box tdi-box--warning">
          <span className="tdi-box__label">
            THINK TWICE IF
          </span>

          <p>
            {decision.avoidIf}
          </p>
        </div>

      </div>


      <div className="tdi-section">
        <div className="tdi-section__header">
          <div>
            <span className="tdi-kicker">
              ADMISSION EVIDENCE
            </span>

            <h4>
              Evidence, not fake probability
            </h4>
          </div>

          <strong className="tdi-fit">
            {getHistoricalFitLabel(
              row
            )}
          </strong>
        </div>

        <div className="tdi-metrics">
          <div>
            <span>
              Opening
            </span>

            <strong>
              {formatRank(
                getOpening(
                  row
                )
              )}
            </strong>
          </div>

          <div>
            <span>
              Latest Closing
            </span>

            <strong>
              {formatRank(
                getLatestClosing(
                  row
                )
              )}
            </strong>
          </div>

          <div>
            <span>
              Trend
            </span>

            <strong>
              {String(
                getTrend(
                  row
                )
              )}
            </strong>
          </div>

          <div>
            <span>
              Stability
            </span>

            <strong>
              {String(
                getVolatility(
                  row
                )
              )}
            </strong>
          </div>

          <div>
            <span>
              Evidence Confidence
            </span>

            <strong>
              {String(
                getEvidenceConfidence(
                  row
                )
              )}
            </strong>
          </div>
        </div>

        {historicalYears.length >
          0 && (
          <div className="tdi-year-grid">
            {historicalYears.map(
              (
                item
              ) => (
                <div
                  key={
                    item.year
                  }
                >
                  <span>
                    {item.year}
                  </span>

                  <strong>
                    Closing{' '}
                    {formatRank(
                      item.closing
                    )}
                  </strong>
                </div>
              )
            )}
          </div>
        )}
      </div>


      <div className="tdi-section">
        <span className="tdi-kicker">
          OPPORTUNITY COST
        </span>

        <h4>
          What are you gaining or giving up?
        </h4>

        <div className="tdi-tradeoffs">
          {tradeoffs.length ? (
            tradeoffs.map(
              (
                item,
                itemIndex
              ) => (
                <p
                  key={
                    `${item.sign}-${itemIndex}`
                  }
                  className={
                    item.sign ===
                    '+'
                      ? 'is-positive'
                      : 'is-negative'
                  }
                >
                  <strong>
                    {item.sign}
                  </strong>{' '}
                  {item.text}
                </p>
              )
            )
          ) : (
            <p>
              More verified data is needed
              before a meaningful trade-off
              analysis can be shown.
            </p>
          )}
        </div>
      </div>


      <div className="tdi-section">
        <span className="tdi-kicker">
          SCENARIO SIMULATOR
        </span>

        <h4>
          What happens if your priorities change?
        </h4>

        <div className="tdi-scenario-buttons">
          {[
            [
              'balanced',
              'Balanced',
            ],
            [
              'branch',
              'Branch First',
            ],
            [
              'college',
              'College First',
            ],
            [
              'budget',
              'Budget First',
            ],
            [
              'location',
              'Location First',
            ],
          ].map(
            ([
              value,
              label,
            ]) => (
              <button
                type="button"
                key={
                  value
                }
                className={
                  scenario ===
                  value
                    ? 'is-active'
                    : ''
                }
                onClick={() =>
                  setScenario(
                    value
                  )
                }
              >
                {label}
              </button>
            )
          )}
        </div>

        <div className="tdi-scenario-result">
          <div>
            <span>
              Current ranking
            </span>

            <strong>
              #{currentRank}
            </strong>
          </div>

          <div>
            <span>
              Scenario ranking
            </span>

            <strong>
              {scenarioRank
                ? `#${scenarioRank}`
                : '—'}
            </strong>
          </div>

          <div>
            <span>
              Scenario score
            </span>

            <strong>
              {scenarioScoreV1(
                row,
                scenario
              ) < 0
                ? '—'
                : `${Math.round(
                    scenarioScoreV1(
                row,
                scenario
              )
                  )}/100`}
            </strong>
          </div>
        </div>

        <p className="tdi-disclaimer">
          Scenario ranking changes only the
          importance of known factors. It does
          not change cutoff data or admission
          eligibility.
        </p>
      </div>


      <div className="tdi-section">
        <span className="tdi-kicker">
          BETTER ALTERNATIVES
        </span>

        <h4>
          Better options depending on what matters most
        </h4>

        <div className="tdi-alternatives">
          <AlternativeCard
            title="Better admission fit"
            row={
              admissionAlternative
            }
            reason="This option has a stronger verified admission-fit score."
          />

          <AlternativeCard
            title="Better for branch"
            row={
              branchAlternative
            }
            reason="Ranks higher when branch preference gets more importance."
          />

          <AlternativeCard
            title="Better for college"
            row={
              collegeAlternative
            }
            reason="Ranks higher when college quality gets more importance."
          />

          <AlternativeCard
            title="Better for budget"
            row={
              budgetAlternative
            }
            reason="Ranks higher when affordability gets more importance."
          />

          <AlternativeCard
            title="Better for location"
            row={
              locationAlternative
            }
            reason="This option has a stronger verified location-fit score."
          />
        </div>
      </div>


      <div className="tdi-section">
        <span className="tdi-kicker">
          EVIDENCE TRANSPARENCY
        </span>

        <div className="tdi-evidence-grid">
          <div>
            <strong>
              Known
            </strong>

            {known.map(
              (item) => (
                <p
                  key={
                    item
                  }
                  className="is-positive"
                >
                  ✓ {item}
                </p>
              )
            )}
          </div>

          <div>
            <strong>
              Missing / uncertain
            </strong>

            {missing.length ? (
              missing.map(
                (item) => (
                  <p
                    key={
                      item
                    }
                    className="is-negative"
                  >
                    – {item}
                  </p>
                )
              )
            ) : (
              <p className="is-positive">
                ✓ Core evidence is available
              </p>
            )}
          </div>
        </div>
      </div>


      {(reasons.strong.length >
        0 ||
        reasons.weak.length >
        0) && (
        <div className="tdi-section">
          <span className="tdi-kicker">
            PERSONALIZED EXPLANATION
          </span>

          <div className="tdi-evidence-grid">
            <div>
              <strong>
                Why it works for you
              </strong>

              {reasons.strong
                .slice(
                  0,
                  3
                )
                .map(
                  (
                    item,
                    reasonIndex
                  ) => (
                    <p
                      key={
                        reasonIndex
                      }
                      className="is-positive"
                    >
                      ✓ {item}
                    </p>
                  )
                )}
            </div>

            <div>
              <strong>
                Why it may not
              </strong>

              {reasons.weak
                .slice(
                  0,
                  3
                )
                .map(
                  (
                    item,
                    reasonIndex
                  ) => (
                    <p
                      key={
                        reasonIndex
                      }
                      className="is-negative"
                    >
                      – {item}
                    </p>
                  )
                )}
            </div>
          </div>
        </div>
      )}


      <div className="tdi-final">
        <strong>
          Decision Summary
        </strong>

        <p>
          {decision.whyRanked}
        </p>

        <span>
          Match score:{' '}
          <b>
            {getScore(
              row
            ) === null
              ? 'Pending'
              : `${Math.round(
                  getScore(
                    row
                  )
                )}/100`}
          </b>
          {' - '}
          Confidence:{' '}
          <b>
            {confidence.label}
          </b>
        </span>
      </div>

    </section>
  );
}