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

  const currentRank =
    index + 1;

  const scenarioRank =
    useMemo(
      () =>
        findScenarioRank(
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

  const branchAlternative =
    useMemo(
      () =>
        findAlternative(
          row,
          rows,
          'branch'
        ),
      [
        row,
        rows,
      ]
    );

  const budgetAlternative =
    useMemo(
      () =>
        findAlternative(
          row,
          rows,
          'budget'
        ),
      [
        row,
        rows,
      ]
    );

  const collegeAlternative =
    useMemo(
      () =>
        findAlternative(
          row,
          rows,
          'college'
        ),
      [
        row,
        rows,
      ]
    );

  const known = [];

  const missing = [];

  if (
    num(
      breakdown?.rank
    ) !== null
  ) {
    known.push(
      'Admission data'
    );
  } else {
    missing.push(
      'Admission data'
    );
  }

  if (
    num(
      breakdown?.quality
    ) !== null
  ) {
    known.push(
      'College quality'
    );
  } else {
    missing.push(
      'College quality'
    );
  }

  if (
    num(
      breakdown?.reviews
    ) !== null
  ) {
    known.push(
      'Review intelligence'
    );
  } else {
    missing.push(
      'Verified review intelligence'
    );
  }

  if (
    num(
      breakdown?.budget
    ) !== null
  ) {
    known.push(
      'Budget / fee fit'
    );
  } else {
    missing.push(
      'Fee / budget evidence'
    );
  }

  if (
    num(
      breakdown?.location
    ) !== null
  ) {
    known.push(
      'Location fit'
    );
  } else {
    missing.push(
      'Location evidence'
    );
  }


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
              {scenarioScore(
                row,
                scenario
              ) < 0
                ? '—'
                : `${Math.round(
                    scenarioScore(
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
          {' · '}
          Confidence:{' '}
          <b>
            {confidence.label}
          </b>
        </span>
      </div>

    </section>
  );
}