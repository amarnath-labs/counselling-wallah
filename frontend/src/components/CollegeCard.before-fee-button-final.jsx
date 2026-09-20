import { useState } from 'react';
import Button from './Button';
import { useAppState } from '../hooks/useAppState';
import { useNavigate } from 'react-router-dom';

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


/*
|--------------------------------------------------------------------------
| FEE HELPERS
|--------------------------------------------------------------------------
*/

function feeValue(...values) {
  for (const value of values) {
    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {
      continue;
    }

    const number =
      Number(value);

    if (
      Number.isFinite(number) &&
      number >= 0
    ) {
      return number;
    }
  }

  return null;
}


function formatMoney(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return 'Not available';
  }

  return (
    '₹' +
    Number(value)
      .toLocaleString('en-IN')
  );
}


function formatVerification(value) {
  const status =
    String(value || '')
      .trim()
      .toLowerCase();

  if (status === 'verified') {
    return 'Verified';
  }

  if (
    status ===
    'high_confidence'
  ) {
    return 'High confidence';
  }

  if (
    status ===
    'review_recommended'
  ) {
    return 'Review recommended';
  }

  if (
    status ===
    'needs_review'
  ) {
    return 'Needs review';
  }

  return null;
}


function FeeRow({
  label,
  value,
  strong = false,
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent:
          'space-between',
        alignItems: 'center',
        gap: 16,
        padding: '6px 0',
      }}
    >
      <span
        style={{
          color: '#667085',
        }}
      >
        {label}
      </span>

      <strong
        style={{
          color: strong
            ? '#142858'
            : '#344054',

          textAlign: 'right',
        }}
      >
        {value}
      </strong>
    </div>
  );
}


/*
|--------------------------------------------------------------------------
| PREMIUM SCORE LINE
|--------------------------------------------------------------------------
*/

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
        <span>
          {label}
        </span>

        <strong>
          Data unavailable
        </strong>
      </div>
    );
  }

  return (
    <div className="premium-score-line">
      <span>
        {label}
      </span>

      <strong>
        {value}/{max}
      </strong>
    </div>
  );
}


/*
|--------------------------------------------------------------------------
| COLLEGE CARD
|--------------------------------------------------------------------------
*/

export default function CollegeCard({
  row,
  mode = 'locked',
}) {
  const {
    addCompare,
    addChoice,
    openCollege,
  } = useAppState();

  const nav =
    useNavigate();

  const [
    showFeeStructure,
    setShowFeeStructure,
  ] = useState(false);


  /*
  |--------------------------------------------------------------------------
  | BASIC DATA
  |--------------------------------------------------------------------------
  */

  const admission =
    meta[row?.bucket] ||
    meta.backup;

  const college =
    row?.college || {};

  const branch =
    row?.branch || {};

  const premium =
    row?.premium || null;


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


  const premiumScore =
    Number.isFinite(
      Number(premium?.score)
    )
      ? Number(
          premium.score
        )
      : null;


  const premiumCategory =
    premium?.category ||
    null;


  /*
  |--------------------------------------------------------------------------
  | RANK / PLACEMENT
  |--------------------------------------------------------------------------
  */

  const openingRank =
    Number(
      branch?.openingRank
    );

  const closingRank =
    Number(
      branch?.closingRank
    );

  const placement =
    Number(
      branch?.placement
    );


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


  const hasPlacement =
    Number.isFinite(
      placement
    ) &&
    placement > 0;


  /*
  |--------------------------------------------------------------------------
  | OFFICIAL FEE DATA
  |--------------------------------------------------------------------------
  |
  | Supports:
  |
  | row.fee.*
  | OR
  | row.* direct backend fields
  |
  */

  const fee =
    row?.fee || {};


  const feeYear =
    feeValue(
      fee?.feeYear,
      row?.feeYear
    );


  const tuitionFee =
    feeValue(
      fee?.tuitionFeePerSemester,
      row?.tuitionFeePerSemester
    );


  const academicFee =
    feeValue(
      fee?.academicFeePerSemester,
      row?.academicFeePerSemester
    );


  const firstSemesterFee =
    feeValue(
      fee?.firstSemesterFee,
      row?.firstSemesterFee
    );


  const messFee =
    feeValue(
      fee?.messFeePerSemester,
      row?.messFeePerSemester
    );


  const annualAcademicFee =
    feeValue(
      fee?.annualAcademicFee,
      row?.annualAcademicFee
    );


  const estimatedAnnualFee =
    feeValue(
      fee?.estimatedAnnualBudgetFee,
      row?.estimatedAnnualBudgetFee
    );


  const feeConfidence =
    feeValue(
      fee?.feeConfidence,
      row?.feeConfidence
    );


  const feeVerificationStatus =
    fee?.feeVerificationStatus ??
    row?.feeVerificationStatus ??
    null;


  const feeSourceUrl =
    fee?.feeSourceUrl ??
    row?.feeSourceUrl ??
    null;


  const feeCoverage =
    fee?.feeCoverage ??
    row?.feeCoverage ??
    null;


  const budgetStatus =
    fee?.budgetStatus ??
    row?.budgetStatus ??
    null;


  const hasOfficialFee =
    [
      tuitionFee,
      academicFee,
      firstSemesterFee,
      messFee,
      annualAcademicFee,
      estimatedAnnualFee,
    ].some(
      (value) =>
        value !== null
    );


  /*
  |--------------------------------------------------------------------------
  | OPEN COLLEGE
  |--------------------------------------------------------------------------
  */

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
  | FEE TOGGLE
  |--------------------------------------------------------------------------
  */

  const toggleFeeStructure = () => {
    if (!hasOfficialFee) {
      return;
    }

    setShowFeeStructure(
      (current) =>
        !current
    );
  };


  const handleFeeKeyDown =
    (event) => {
      if (!hasOfficialFee) {
        return;
      }

      if (
        event.key === 'Enter' ||
        event.key === ' '
      ) {
        event.preventDefault();

        toggleFeeStructure();
      }
    };


  /*
  |--------------------------------------------------------------------------
  | ORIGINAL CARD CONTENT
  |--------------------------------------------------------------------------
  */

  const OriginalCardContent = ({
    showPremium = false,
    showFreeTeaser = false,
  }) => (
    <>
      <div
        className="cw-meter"
        style={{
          background:
            `conic-gradient(${admission.color} ${currentMatch * 3.6}deg,#EAF0FF 0)`,
        }}
      >
        <span>
          {currentMatch}%
        </span>
      </div>


      <div className="cw-body">

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


        <div className="cw-meta">

          {branch.name && (
            <span className="meta-chip">
              {branch.name}
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

        </div>


        <div className="original-match-line">

          Match:{' '}

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


        {/* ============================================================
            FEE STRUCTURE
        ============================================================ */}

        <div
          role={
            hasOfficialFee
              ? 'button'
              : undefined
          }

          tabIndex={
            hasOfficialFee
              ? 0
              : undefined
          }

          onClick={
            toggleFeeStructure
          }

          onKeyDown={
            handleFeeKeyDown
          }

          aria-expanded={
            hasOfficialFee
              ? showFeeStructure
              : undefined
          }

          style={{
            marginTop: 12,
            marginBottom: 12,
            padding: 12,

            border:
              hasOfficialFee &&
              showFeeStructure
                ? '1px solid #cbd7f5'
                : '1px solid #e3e8f2',

            borderRadius: 12,

            background:
              hasOfficialFee &&
              showFeeStructure
                ? '#f8faff'
                : '#fafbfe',

            cursor:
              hasOfficialFee
                ? 'pointer'
                : 'default',

            transition:
              'all 0.2s ease',
          }}
        >

          {/* HEADER */}

          <div
            style={{
              display: 'flex',
              justifyContent:
                'space-between',
              alignItems:
                'center',
              gap: 12,
            }}
          >

            <div>

              <div
                style={{
                  color: '#142858',
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                Fee Structure
              </div>


              <div
                style={{
                  marginTop: 3,
                  color: '#7d879c',
                  fontSize: 10,
                  lineHeight: 1.4,
                }}
              >

                {hasOfficialFee
                  ? estimatedAnnualFee !==
                    null
                    ? (
                      'Estimated annual fee: ' +
                      formatMoney(
                        estimatedAnnualFee
                      )
                    )
                    : (
                      'Official fee details available'
                    )
                  : (
                    'Fee data not available yet'
                  )}

              </div>

            </div>


            {hasOfficialFee && (

              <span
                aria-hidden="true"
                style={{
                  display:
                    'inline-flex',

                  alignItems:
                    'center',

                  justifyContent:
                    'center',

                  width: 26,
                  height: 26,

                  borderRadius:
                    '50%',

                  background:
                    '#edf2ff',

                  color:
                    '#24469b',

                  fontSize: 11,

                  fontWeight:
                    900,

                  flexShrink: 0,
                }}
              >
                {showFeeStructure
                  ? '▲'
                  : '▼'}
              </span>

            )}

          </div>


          {/* EXPANDED FEE DETAILS */}

          {hasOfficialFee &&
            showFeeStructure && (

            <div
              onClick={
                (event) =>
                  event.stopPropagation()
              }

              style={{
                marginTop: 12,
                paddingTop: 10,

                borderTop:
                  '1px solid #e3e8f2',

                color:
                  '#56627a',

                fontSize: 11,
              }}
            >

              {tuitionFee !== null && (
                <FeeRow
                  label="Tuition / Semester"
                  value={
                    formatMoney(
                      tuitionFee
                    )
                  }
                />
              )}


              {academicFee !== null && (
                <FeeRow
                  label="Academic / Semester"
                  value={
                    formatMoney(
                      academicFee
                    )
                  }
                />
              )}


              {firstSemesterFee !==
                null && (
                <FeeRow
                  label="First Semester Fee"
                  value={
                    formatMoney(
                      firstSemesterFee
                    )
                  }
                />
              )}


              {messFee !== null && (
                <FeeRow
                  label="Mess / Semester"
                  value={
                    formatMoney(
                      messFee
                    )
                  }
                />
              )}


              {annualAcademicFee !==
                null && (
                <FeeRow
                  label="Annual Academic Fee"
                  value={
                    formatMoney(
                      annualAcademicFee
                    )
                  }
                />
              )}


              {estimatedAnnualFee !==
                null && (
                <FeeRow
                  label={
                    feeCoverage ===
                    'academic_plus_mess'
                      ? 'Estimated Annual (Academic + Mess)'
                      : 'Estimated Annual Fee'
                  }

                  value={
                    formatMoney(
                      estimatedAnnualFee
                    )
                  }

                  strong
                />
              )}


              {feeYear !== null && (
                <FeeRow
                  label="Fee Year"
                  value={feeYear}
                />
              )}


              {feeCoverage && (
                <FeeRow
                  label="Coverage"
                  value={
                    feeCoverage ===
                    'academic_plus_mess'
                      ? 'Academic + Mess'
                      : 'Academic only'
                  }
                />
              )}


              {formatVerification(
                feeVerificationStatus
              ) && (
                <FeeRow
                  label="Verification"
                  value={
                    formatVerification(
                      feeVerificationStatus
                    )
                  }
                />
              )}


              {feeConfidence !== null && (
                <FeeRow
                  label="Confidence"
                  value={
                    `${feeConfidence}%`
                  }
                />
              )}


              {budgetStatus && (
                <FeeRow
                  label="Budget Status"
                  value={
                    String(
                      budgetStatus
                    )
                      .replaceAll(
                        '_',
                        ' '
                      )
                  }
                />
              )}


              {feeSourceUrl && (

                <div
                  style={{
                    marginTop: 10,
                  }}
                >

                  <a
                    href={feeSourceUrl}
                    target="_blank"
                    rel="noreferrer"

                    onClick={
                      (event) =>
                        event.stopPropagation()
                    }

                    style={{
                      color: '#3558d4',
                      fontSize: 10.5,
                      fontWeight: 800,
                      textDecoration:
                        'none',
                    }}
                  >
                    View Official Fee Source ↗
                  </a>

                </div>

              )}


              <div
                style={{
                  marginTop: 10,
                  paddingTop: 8,

                  borderTop:
                    '1px dashed #e3e8f2',

                  color:
                    '#8a94a9',

                  fontSize: 9.5,

                  lineHeight: 1.45,
                }}
              >
                Hostel charges are excluded
                unless separately verified.
              </div>

            </div>

          )}

        </div>


        {/* ============================================================
            FREE PREMIUM TEASER
        ============================================================ */}

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
                LOCKED
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


        {/* ============================================================
            PREMIUM
        ============================================================ */}

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
                  {premiumCategory.label}
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


            {premium?.historicalFit
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

          </div>

        )}


        {/* ============================================================
            ACTIONS
        ============================================================ */}

        <div className="cw-actions">

          <Button
            size="sm"
            onClick={openDetails}
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

  if (mode === 'premium') {
    return (
      <div className="cw-card premium-card">
        <OriginalCardContent
          showPremium={true}
        />
      </div>
    );
  }


  /*
  |--------------------------------------------------------------------------
  | FREE BEST
  |--------------------------------------------------------------------------
  */

  if (mode === 'freeBest') {
    return (
      <div className="cw-card best-free-card">
        <OriginalCardContent
          showFreeTeaser={true}
        />
      </div>
    );
  }


  /*
  |--------------------------------------------------------------------------
  | NORMAL
  |--------------------------------------------------------------------------
  */

  return (
    <div className="cw-card">
      <OriginalCardContent />
    </div>
  );
}
