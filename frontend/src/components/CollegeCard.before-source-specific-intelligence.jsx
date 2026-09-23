import {
  useState,
} from 'react';

import Button from './Button';

import {
  useAppState,
} from '../hooks/useAppState';

import {
  useNavigate,
} from 'react-router-dom';

import {
  fetchCutoffHistory,
} from '../services/counsellingService';

const meta = {
  dream: {
    label: 'Dream',
    color: 'var(--red)',
  },

  target: {
    label: 'Target',
    color: 'var(--amber)',
  },

  safe: {
    label: 'Safe',
    color: 'var(--green)',
  },

  backup: {
    label: 'Backup',
    color: 'var(--blue)',
  },
};

function ScoreLine({
  label,
  value,
  max,
}) {
  if (
    value === null ||
    value === undefined
  ) {
    return (
      <div className="premium-score-line">
        <span>{label}</span>

        <strong>
          Data unavailable
        </strong>
      </div>
    );
  }

  return (
    <div className="premium-score-line">
      <span>{label}</span>

      <strong>
        {value}/{max}
      </strong>
    </div>
  );
}

export default function CollegeCard({
  row,
  mode = 'locked',
}) {

  const counsellingType =
    String(
      row?.counsellingType ||
      row?.counselling_type ||
      ''
    )
      .trim()
      .toUpperCase();


  const counsellingMatchLabel =
    counsellingType ===
      'CSAB_SPECIAL'
      ? 'CSAB Match'
      : 'JoSAA Match';

  const {
    addCompare,
    addChoice,
    openCollege,
    profile,
  } = useAppState();

  const nav = useNavigate();


  /*
  |--------------------------------------------------------------------------
  | ADMISSION HISTORY
  |--------------------------------------------------------------------------
  */

  const [
    historyOpen,
    setHistoryOpen,
  ] = useState(false);


  const [
    historyLoading,
    setHistoryLoading,
  ] = useState(false);


  const [
    historyError,
    setHistoryError,
  ] = useState('');


  const [
    historyData,
    setHistoryData,
  ] = useState(null);


  const [
    historyTab,
    setHistoryTab,
  ] = useState('josaa');


  const [
    expandedHistoryYears,
    setExpandedHistoryYears,
  ] = useState({
    'josaa-2026': true,
    'josaa-2025': false,
    'josaa-2024': false,
    'csab-2026': true,
    'csab-2025': false,
    'csab-2024': false,
  });


  const toggleHistoryYear = (
    route,
    year
  ) => {
    const key =
      `${route}-${year}`;

    setExpandedHistoryYears(
      (current) => ({
        ...current,
        [key]:
          !current[key],
      })
    );
  };


  const historyBucketClass = (
    bucket
  ) =>
    String(
      bucket || ''
    )
      .trim()
      .toLowerCase();


  const formatHistoryTrend = (
    trend
  ) => {
    const direction =
      trend?.direction;

    if (
      direction ===
      'MORE_ACCESSIBLE'
    ) {
      return 'More Accessible';
    }

    if (
      direction ===
      'MORE_COMPETITIVE'
    ) {
      return 'More Competitive';
    }

    if (
      direction ===
      'VOLATILE'
    ) {
      return 'â†• Volatile';
    }

    if (
      direction ===
      'STABLE'
    ) {
      return '→ Stable';
    }

    return (
      trend?.label ||
      'N/A'
    );
  };


  const getRoundStatus = (
    closingRank
  ) => {
    const studentRank =
      Number(
        profile?.rank
      );

    const cutoff =
      Number(
        closingRank
      );

    if (
      !Number.isFinite(
        studentRank
      ) ||
      studentRank <= 0 ||
      !Number.isFinite(
        cutoff
      ) ||
      cutoff <= 0
    ) {
      return {
        label: 'N/A',
        className: 'unknown',
      };
    }

    if (
      studentRank <= cutoff
    ) {
      return {
        label: 'Within Historical Cutoff',
        className: 'within',
      };
    }

    return {
      label: 'Outside Historical Cutoff',
      className: 'outside',
    };
  };

  const historicalAdmissionBucket =
    historyData
      ?.intelligence
      ?.josaa
      ?.historicalBucket;


  const effectiveAdmissionBucket =
    String(
      historicalAdmissionBucket ||
      row?.bucket ||
      row?.admission?.bucket ||
      'backup'
    )
      .trim()
      .toLowerCase();


  const admission =
    meta[
      effectiveAdmissionBucket
    ] ||
    meta.backup;

  const college =
    row?.college || {};

  const branch =
    row?.branch || {};

  const premium =
    row?.premium || null;

  /*
  |--------------------------------------------------------------------------
  | PERSONALIZED V2 DISPLAY SOURCE
  |--------------------------------------------------------------------------
  |
  | Display V2 when available.
  | Legacy premium remains fallback only.
  | Admission bucket logic stays untouched.
  |
  */

  const personalizedV2 =
    row?.personalizedV2 || null;

  const personalizedV2Score =
    Number.isFinite(
      Number(
        personalizedV2?.rawScore
      )
    )
      ? Number(
          personalizedV2.rawScore
        )
      : null;

  const personalizedV2RankingScore =
    Number.isFinite(
      Number(
        personalizedV2?.rankingScore
      )
    )
      ? Number(
          personalizedV2.rankingScore
        )
      : null;

  const personalizedV2Coverage =
    Number.isFinite(
      Number(
        personalizedV2?.coverage
      )
    )
      ? Number(
          personalizedV2.coverage
        )
      : null;

  /*
  |--------------------------------------------------------------------------
  | ORIGINAL CARD PERCENTAGE
  |--------------------------------------------------------------------------
  */

  const currentMatch =
    Number.isFinite(
      Number(row?.overall)
    )
      ? Math.max(
          0,
          Math.min(
            100,
            Math.round(
              Number(row.overall)
            )
          )
        )
      : 0;

  /*
  |--------------------------------------------------------------------------
  | PREMIUM
  |--------------------------------------------------------------------------
  */

  const premiumScore =
    personalizedV2Score ??
    (
      Number.isFinite(
        Number(
          premium?.score
        )
      )
        ? Number(
            premium.score
          )
        : null
    );

  const premiumCategory =
    premium?.category || null;

  /*
  |--------------------------------------------------------------------------
  | BASIC DATA
  |--------------------------------------------------------------------------
  */

  const openingRank =
    Number(branch?.openingRank);

  const closingRank =
    Number(branch?.closingRank);

  const fees =
    Number(branch?.fees);

  const placement =
    Number(branch?.placement);

  const hasOpeningRank =
    Number.isFinite(
      openingRank
    ) &&
    openingRank > 0;

  const hasClosingRank =
    Number.isFinite(
      closingRank
    ) &&
    closingRank > 0;

  const hasFees =
    Number.isFinite(
      fees
    ) &&
    fees > 0;

  const hasPlacement =
    Number.isFinite(
      placement
    ) &&
    placement > 0;

  /*
  |--------------------------------------------------------------------------
  | ACTIONS
  |--------------------------------------------------------------------------
  */

  const loadAdmissionHistory =
    async () => {

      if (historyOpen) {
        setHistoryOpen(false);
        return;
      }


      setHistoryOpen(true);


      /*
       * Already loaded:
       * reopen without another API call.
       */

      if (historyData) {
        return;
      }


      const branchId =
        Number(
          branch?.id
        );


      if (
        !Number.isFinite(
          branchId
        ) ||
        branchId <= 0
      ) {
        setHistoryError(
          'Historical cutoff data is unavailable for this branch.'
        );

        return;
      }


      setHistoryLoading(true);
      setHistoryError('');


      try {

        const response =
          await fetchCutoffHistory({
            branchId,

            rank:
              profile?.rank ??
              null,

            category:
              branch?.category ??
              null,

            quota:
              branch?.quota ??
              null,

            gender:
              branch?.gender ??
              null,
          });


        setHistoryData(
          response?.data ??
          null
        );

      } catch (error) {

        console.error(
          '[ADMISSION HISTORY]',
          error
        );


        setHistoryError(
          error?.message ||
          'Unable to load admission history.'
        );

      } finally {

        setHistoryLoading(false);
      }
    };


  const openDetails = () => {
    openCollege(
      row.collegeId,
      branch.name
    );

    nav(
      `/colleges/${row.collegeId}`
    );
  };

  /*
  |--------------------------------------------------------------------------
  | COMMON ORIGINAL CARD
  |--------------------------------------------------------------------------
  */

  const OriginalCardContent = ({
    showPremium = false,
    showFreeTeaser = false,
  }) => (
    <>
      {/* PERCENTAGE METER */}

      <div
        className="cw-meter"
        style={{
          background:
            `conic-gradient(${admission.color} ${
              currentMatch * 3.6
            }deg,#EAF0FF 0)`,
        }}
      >
        <span>
          {currentMatch}%
        </span>
      </div>

      <div className="cw-body">

        {/* COLLEGE */}

        <h4>
          {college.name}
        </h4>

        <div className="loc">

          {[
            college.city,
            college.state,
          ]
            .filter(Boolean)
            .join(', ')}

          {college.type
            ? ` - ${college.type}`
            : ''}

        </div>

        {/* META */}

        <div className="cw-meta">

          {branch.name && (
            <span className="meta-chip">
              {branch.name}
            </span>
          )}

          {/* CW CATEGORY BADGE */}
          {branch?.category && (
            <span className="meta-chip">
              {branch.category}
            </span>
          )}

          {branch?.quota && (
            <span className="meta-chip">
              {branch.quota === 'HS'
                ? 'Home State'
                : branch.quota === 'OS'
                  ? 'Other State'
                  : branch.quota === 'AI'
                    ? 'All India'
                    : branch.quota}
            </span>
          )}

          {branch?.gender && (
            <span className="meta-chip">
              {String(branch.gender)
                .toLowerCase()
                .includes('female')
                ? 'Female Seat'
                : 'Gender Neutral'}
            </span>
          )}

          {hasOpeningRank && (
            <span className="meta-chip">

              Opening{' '}

              {openingRank
                .toLocaleString(
                  'en-IN'
                )}

            </span>
          )}

          {hasClosingRank && (
            <span className="meta-chip">

              Closing{' '}

              {closingRank
                .toLocaleString(
                  'en-IN'
                )}

            </span>
          )}

          {hasFees && (
            <span className="meta-chip">

              â‚¹
              {(
                fees /
                100000
              ).toFixed(1)}
              L

            </span>
          )}

        </div>

        {/* MATCH */}

        <div
          className="original-match-line"
        >

          <div>
            {counsellingMatchLabel}:{' '}

            <strong
              style={{
                color:
                  admission.color,
              }}
            >
              {admission.label}
            </strong>

            {hasPlacement
              ? ` - Placement ${placement}%`
              : ''}
          </div>

        </div>


        {/* =====================================================
            ADMISSION HISTORY
        ===================================================== */}

        {branch?.id && (
          <div className="admission-history">

            <button
              type="button"
              className="admission-history-toggle"
              onClick={loadAdmissionHistory}
            >
              {historyOpen
                ? 'Hide Admission Intelligence'
                : 'Admission Intelligence'}
            </button>


            {historyOpen && (
              <div className="admission-history-panel">

                {historyLoading && (
                  <div className="admission-history-status">
                    Loading historical cutoffs...
                  </div>
                )}


                {!historyLoading &&
                  historyError && (
                    <div className="admission-history-error">
                      {historyError}
                    </div>
                  )}


                {!historyLoading &&
                  !historyError &&
                  historyData && (
                    <>

                      <div className="admission-history-title">
                        Historical Admission Intelligence
                      </div>


                      {/* =====================================================
                          ELIGIBILITY PROFILE USED
                      ===================================================== */}

                      <div className="admission-profile-context">

                        <div className="admission-profile-context__title">
                          Admission Profile Used
                        </div>


                        <div className="admission-profile-context__grid">

                          <div className="admission-profile-context__item">
                            <span>
                              Category
                            </span>

                            <strong>
                              {
                                branch?.category ||
                                profile?.category ||
                                '—'
                              }
                            </strong>
                          </div>


                          <div className="admission-profile-context__item">
                            <span>
                              Gender
                            </span>

                            <strong>
                              {
                                profile?.gender ||
                                '—'
                              }
                            </strong>
                          </div>


                          <div className="admission-profile-context__item">
                            <span>
                              Home State
                            </span>

                            <strong>
                              {
                                profile?.homeState ||
                                '—'
                              }
                            </strong>
                          </div>


                          <div className="admission-profile-context__item">
                            <span>
                              Applicable Quota
                            </span>

                            <strong>
                              {
                                branch?.quota === 'HS'
                                  ? 'Home State'
                                  : branch?.quota === 'OS'
                                    ? 'Other State'
                                    : branch?.quota === 'AI'
                                      ? 'All India'
                                      : branch?.quota ||
                                        '—'
                              }
                            </strong>
                          </div>


                          <div className="admission-profile-context__item admission-profile-context__item--wide">
                            <span>
                              Eligible Seat Pool
                            </span>

                            <strong>
                              {
                                branch?.gender ===
                                  'Female-only (including Supernumerary)'
                                  ? 'Female-only'
                                  : branch?.gender ===
                                      'Gender-Neutral'
                                    ? 'Gender-Neutral'
                                    : branch?.gender ||
                                      '—'
                              }
                            </strong>
                          </div>

                        </div>


                        <div className="admission-profile-context__note">
                          Historical cutoff comparison uses
                          this category, applicable quota and
                          eligible seat pool.
                        </div>

                      </div>


                      <div className="admission-history-tabs">

                        <button
                          type="button"
                          className={
                            historyTab === 'josaa'
                              ? 'history-tab active'
                              : 'history-tab'
                          }
                          onClick={() =>
                            setHistoryTab(
                              'josaa'
                            )
                          }
                        >
                          JoSAA
                        </button>


                        <button
                          type="button"
                          className={
                            historyTab === 'csab'
                              ? 'history-tab active'
                              : 'history-tab'
                          }
                          onClick={() =>
                            setHistoryTab(
                              'csab'
                            )
                          }
                        >
                          CSAB Special
                        </button>

                      </div>


                      {[
                        {
                          key: 'josaa',
                          label: 'JoSAA',
                          rows:
                            historyData
                              ?.josaa ||
                            [],
                          intelligence:
                            historyData
                              ?.intelligence
                              ?.josaa,
                        },
                        {
                          key: 'csab',
                          label:
                            'CSAB Special',
                          rows:
                            historyData
                              ?.csab ||
                            [],
                          intelligence:
                            historyData
                              ?.intelligence
                              ?.csab,
                        },
                      ].map(
                        (route) => {

                          if (
                            historyTab !==
                            route.key
                          ) {
                            return null;
                          }


                          const intelligence =
                            route
                              .intelligence;


                          if (
                            !intelligence
                              ?.available
                          ) {
                            return (
                              <div
                                className="admission-history-status"
                                key={
                                  route.key
                                }
                              >
                                {route.key ===
                                'csab'
                                  ? 'CSAB Special is not applicable for this option.'
                                  : 'JoSAA historical data unavailable.'}
                              </div>
                            );
                          }


                          const bucket =
                            intelligence
                              .historicalBucket;


                          return (
                            <div
                              className="history-tab-content"
                              key={
                                route.key
                              }
                            >

                              <div className="history-chance-head">

                                <div>

                                  <div className="history-chance-label">
                                    {route.label}{' '}
                                    Historical Chance
                                  </div>

                                  <div
                                    className={
                                      `history-bucket-badge ${
                                        historyBucketClass(
                                          bucket
                                        )
                                      }`
                                    }
                                  >
                                    {bucket}
                                  </div>

                                </div>


                                <div className="history-rank-box">

                                  <span>
                                    Your Rank
                                  </span>

                                  <strong>
                                    {Number(
                                      profile?.rank
                                    ).toLocaleString(
                                      'en-IN'
                                    )}
                                  </strong>

                                </div>

                              </div>


                              <div className="history-summary-grid">

                                <div>

                                  <span>
                                    {`Likely ${
                                      route.key === 'josaa'
                                        ? 'JoSAA'
                                        : 'CSAB'
                                    } Round`}
                                  </span>

                                  <strong>
                                    {intelligence
                                      ?.likelyRound
                                      ?.round
                                      ? `Round ${
                                          intelligence
                                            .likelyRound
                                            .round
                                        }`
                                      : 'N/A'}
                                  </strong>

                                </div>


                                <div>

                                  <span>
                                    {`${
                                      route.key === 'josaa'
                                        ? 'JoSAA'
                                        : 'CSAB'
                                    } Trend`}
                                  </span>

                                  <strong>
                                    {
                                      formatHistoryTrend(
                                        intelligence
                                          ?.trend
                                      )
                                    }
                                  </strong>

                                </div>


                                <div>

                                  <span>
                                    {`${
                                      route.key === 'josaa'
                                        ? 'JoSAA'
                                        : 'CSAB'
                                    } Historical Confidence`}
                                  </span>

                                  <strong>
                                    {
                                      intelligence
                                        ?.confidence
                                        ?.label ||
                                      'N/A'
                                    }
                                  </strong>

                                </div>


                                <div>

                                  <span>
                                    Latest Final Closing
                                  </span>

                                  <strong>
                                    {intelligence
                                      ?.years
                                      ?.[0]
                                      ?.closingRank
                                      ? Number(
                                          intelligence
                                            .years[0]
                                            .closingRank
                                        ).toLocaleString(
                                          'en-IN'
                                        )
                                      : 'N/A'}
                                  </strong>

                                </div>

                              </div>


                              {[2026, 2025, 2024].map(
                                (year) => {

                                  const yearRows =
                                    route.rows
                                      .filter(
                                        (item) =>
                                          Number(
                                            item.year
                                          ) ===
                                          year
                                      )
                                      .sort(
                                        (
                                          a,
                                          b
                                        ) =>
                                          Number(
                                            a.round
                                          ) -
                                          Number(
                                            b.round
                                          )
                                      );


                                  if (
                                    yearRows
                                      .length ===
                                    0
                                  ) {
                                    return null;
                                  }


                                  const key =
                                    `${route.key}-${year}`;


                                  const expanded =
                                    Boolean(
                                      expandedHistoryYears[
                                        key
                                      ]
                                    );


                                  return (
                                    <div
                                      className="history-year"
                                      key={
                                        key
                                      }
                                    >

                                      <button
                                        type="button"
                                        className="history-year-toggle"
                                        onClick={() =>
                                          toggleHistoryYear(
                                            route.key,
                                            year
                                          )
                                        }
                                      >

                                        <span>

                                          {route.label}{' '}
                                          {year}

                                          {year ===
                                            2026 && (
                                            <span className="latest-year-badge">
                                              Latest
                                            </span>
                                          )}

                                        </span>


                                        <span className="history-year-chevron">
                                          {expanded
                                            ? '−'
                                            : '+'}
                                        </span>

                                      </button>


                                      {expanded && (
                                        <div className="history-table-wrap">

                                          <table className="history-table">

                                            <thead>

                                              <tr>

                                                <th>
                                                  Round
                                                </th>

                                                <th>
                                                  Opening
                                                </th>

                                                <th className="closing-column">
                                                  Closing
                                                </th>

                                                <th>
                                                  Status
                                                </th>

                                              </tr>

                                            </thead>


                                            <tbody>

                                              {yearRows.map(
                                                (
                                                  item,
                                                  index
                                                ) => {

                                                  const status =
                                                    getRoundStatus(
                                                      item
                                                        .closingRank
                                                    );


                                                  return (
                                                    <tr
                                                      key={
                                                        `${key}-${item.round}-${index}`
                                                      }
                                                    >

                                                      <td>
                                                        R
                                                        {
                                                          item.round
                                                        }
                                                      </td>


                                                      <td>
                                                        {Number(
                                                          item
                                                            .openingRank
                                                        ).toLocaleString(
                                                          'en-IN'
                                                        )}
                                                      </td>


                                                      <td className="closing-column">
                                                        <strong>
                                                          {Number(
                                                            item
                                                              .closingRank
                                                          ).toLocaleString(
                                                            'en-IN'
                                                          )}
                                                        </strong>
                                                      </td>


                                                      <td>

                                                        <span
                                                          className={
                                                            `history-round-status ${
                                                              status
                                                                .className
                                                            }`
                                                          }
                                                        >
                                                          {
                                                            status
                                                              .label
                                                          }
                                                        </span>

                                                      </td>

                                                    </tr>
                                                  );
                                                }
                                              )}

                                            </tbody>

                                          </table>

                                        </div>
                                      )}

                                    </div>
                                  );
                                }
                              )}

                            </div>
                          );
                        }
                      )}

                    </>
                  )}

              </div>
            )}

          </div>
        )}



        {/* =====================================================
            FREE BEST PREMIUM TEASER
        ===================================================== */}

        {showFreeTeaser && (
          <div className="best-premium-teaser">

            <div className="best-premium-head">

              <div>
                <div className="best-premium-kicker">
                  PREMIUM ANALYSIS
                </div>

                <div className="best-premium-title">
                  Personalized recommendation available
                </div>
              </div>

              <div className="best-premium-lock">
                ðŸ”’
              </div>

            </div>

            {premiumCategory?.label && (
              <div className="best-premium-category">
                {premiumCategory.label}
              </div>
            )}

            <div className="best-premium-grid">

              <div className="best-premium-item">
                <span>
                  Exact Overall Match
                </span>

                <strong>
                  Premium
                </strong>
              </div>

              <div className="best-premium-item">
                <span>
                  Admission Fit
                </span>

                <strong>
                  Locked
                </strong>
              </div>

              <div className="best-premium-item">
                <span>
                  Branch Match
                </span>

                <strong>
                  Locked
                </strong>
              </div>

              <div className="best-premium-item">
                <span>
                  Why Recommended
                </span>

                <strong>
                  Locked
                </strong>
              </div>

            </div>

          </div>
        )}

        {/* =====================================================
            PREMIUM USER
        ===================================================== */}

        {showPremium &&
          premium && (
            <div className="premium-expanded">

              <div className="recommendation-labels">

                <span
                  className="admission-label"
                  style={{
                    color:
                      admission.color,
                  }}
                >
                  {admission.label}
                </span>

                {premiumCategory?.label && (
                  <span className="premium-label">
                    {
                      premiumCategory.label
                    }
                  </span>
                )}

              </div>

              {premiumScore !== null && (
                <div className="overall-match">

                  Overall Match:{' '}

                  <strong>
                    {premiumScore}/100
                  </strong>

                </div>
              )}

              {premium
                ?.historicalFit
                ?.label && (
                <div className="historical-fit">

                  {
                    premium
                      .historicalFit
                      .label
                  }

                </div>
              )}

              {premium?.breakdown && (
                <div className="premium-breakdown">

                  <ScoreLine
                    label="Admission Fit"
                    value={
                      premium
                        .breakdown
                        .rank
                    }
                    max={50}
                  />

                  <ScoreLine
                    label="Branch Match"
                    value={
                      premium
                        .breakdown
                        .branch
                    }
                    max={15}
                  />

                  <ScoreLine
                    label="College Quality"
                    value={
                      premium
                        .breakdown
                        .quality
                    }
                    max={15}
                  />

                  <ScoreLine
                    label="Reviews"
                    value={
                      premium
                        .breakdown
                        .reviews
                    }
                    max={10}
                  />

                  <ScoreLine
                    label="Budget"
                    value={
                      premium
                        .breakdown
                        .budget
                    }
                    max={7}
                  />

                  <ScoreLine
                    label="Location"
                    value={
                      premium
                        .breakdown
                        .location
                    }
                    max={3}
                  />

                </div>
              )}

              {premium
                ?.reasons
                ?.strong
                ?.length >
                0 && (
                <div className="recommendation-reasons strong">

                  <b>
                    Why this is strong
                  </b>

                  {premium
                    .reasons
                    .strong
                    .slice(
                      0,
                      3
                    )
                    .map(
                      (
                        reason,
                        index
                      ) => (
                        <div
                          key={
                            index
                          }
                        >
                          ✓ {reason}
                        </div>
                      )
                    )}

                </div>
              )}

              {premium
                ?.reasons
                ?.weak
                ?.length >
                0 && (
                <div className="recommendation-reasons weak">

                  <b>
                    What reduces the score
                  </b>

                  {premium
                    .reasons
                    .weak
                    .slice(
                      0,
                      3
                    )
                    .map(
                      (
                        reason,
                        index
                      ) => (
                        <div
                          key={
                            index
                          }
                        >
                          - {reason}
                        </div>
                      )
                    )}

                </div>
              )}

            </div>
          )}

        {/* ACTIONS */}

        <div className="cw-actions">

          <Button
            size="sm"
            onClick={
              openDetails
            }
          >
            View College
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              addCompare(
                row.collegeId,
                branch.name
              )
            }
          >
            + Compare
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              addChoice(
                row.collegeId,
                branch.name
              )
            }
          >
            + Choice List
          </Button>

        </div>

      </div>
    </>
  );

  /*
  |--------------------------------------------------------------------------
  | PREMIUM MODE
  |--------------------------------------------------------------------------
  */

  if (
    mode ===
    'premium'
  ) {
    return (
      <div className="cw-card premium-card">

        <OriginalCardContent
          showPremium={
            true
          }
        />

      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | BEST FREE RESULT
  |--------------------------------------------------------------------------
  */

  if (
    mode ===
    'freeBest'
  ) {
    return (
      <div className="cw-card best-free-card">

        <OriginalCardContent
          showFreeTeaser={
            true
          }
        />

      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | REGULAR RESULTS
  |--------------------------------------------------------------------------
  |
  | Original percentage card only.
  | No Premium pill here.
  |--------------------------------------------------------------------------
  */

  return (
    <div className="cw-card">

      <OriginalCardContent />

    </div>
  );
}