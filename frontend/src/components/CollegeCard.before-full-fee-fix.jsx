import { useState } from 'react';
import Button from './Button';
import { useAppState } from '../hooks/useAppState';
import { useNavigate } from 'react-router-dom';

const meta = {
  dream: { label: 'Dream', color: 'var(--red)' },
  target: { label: 'Target', color: 'var(--amber)' },
  safe: { label: 'Safe', color: 'var(--green)' },
  backup: { label: 'Backup', color: 'var(--blue)' },
};

function formatOfficialFee(value) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return 'Not available';
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 'Not available';
  }

  return (
    '₹' +
    number.toLocaleString('en-IN')
  );
}

function feeValue(...values) {
  for (const value of values) {
    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {
      continue;
    }

    const number = Number(value);

    if (
      Number.isFinite(number) &&
      number >= 0
    ) {
      return number;
    }
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
        justifyContent: 'space-between',
        gap: 12,
        padding: '5px 0',
      }}
    >
      <span>{label}</span>

      <strong
        style={{
          color: strong
            ? '#142858'
            : 'inherit',
        }}
      >
        {value}
      </strong>
    </div>
  );
}

function ScoreLine({ label, value, max }) {
  if (value === null || value === undefined) {
    return (
      <div className="premium-score-line">
        <span>{label}</span>
        <strong>Data unavailable</strong>
      </div>
    );
  }

  return (
    <div className="premium-score-line">
      <span>{label}</span>
      <strong>{value}/{max}</strong>
    </div>
  );
}

export default function CollegeCard({ row, mode = 'locked' }) {
  const { addCompare, addChoice, openCollege } = useAppState();
  const nav = useNavigate();

  const admission = meta[row?.bucket] || meta.backup;
  const college = row?.college || {};
  const branch = row?.branch || {};
  const premium = row?.premium || null;

  const [
    showFeeStructure,
    setShowFeeStructure,
  ] = useState(false);

  const feeYear =
    feeValue(
      row?.fee?.feeYear,
      row?.feeYear
    );

  const tuitionFee =
    feeValue(
      row?.fee?.tuitionFeePerSemester,
      row?.tuitionFeePerSemester
    );

  const academicFee =
    feeValue(
      row?.fee?.academicFeePerSemester,
      row?.academicFeePerSemester
    );

  const firstSemesterFee =
    feeValue(
      row?.fee?.firstSemesterFee,
      row?.firstSemesterFee
    );

  const messFee =
    feeValue(
      row?.fee?.messFeePerSemester,
      row?.messFeePerSemester
    );

  const annualAcademicFee =
    feeValue(
      row?.fee?.annualAcademicFee,
      row?.annualAcademicFee
    );

  const estimatedAnnualFee =
    feeValue(
      row?.fee?.estimatedAnnualBudgetFee,
      row?.estimatedAnnualBudgetFee
    );

  const feeConfidence =
    feeValue(
      row?.fee?.feeConfidence,
      row?.feeConfidence
    );

  const feeVerification =
    row?.fee?.feeVerificationStatus ??
    row?.feeVerificationStatus ??
    null;

  const feeSourceUrl =
    row?.fee?.feeSourceUrl ??
    row?.feeSourceUrl ??
    null;

  const feeCoverage =
    row?.fee?.feeCoverage ??
    row?.feeCoverage ??
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
      value => value !== null
    );

const currentMatch =
    Number.isFinite(Number(row?.overall))
      ? Math.max(0, Math.min(100, Math.round(Number(row.overall))))
      : 0;

  const premiumScore =
    Number.isFinite(Number(premium?.score))
      ? Number(premium.score)
      : null;

  const premiumCategory = premium?.category || null;

  const openingRank = Number(branch?.openingRank);
  const closingRank = Number(branch?.closingRank);
  const fees = Number(branch?.fees);
  const placement = Number(branch?.placement);

  const hasOpeningRank = Number.isFinite(openingRank) && openingRank > 0;
  const hasClosingRank = Number.isFinite(closingRank) && closingRank > 0;
  const hasFees = Number.isFinite(fees) && fees > 0;
  const hasPlacement = Number.isFinite(placement) && placement > 0;

  const openDetails = () => {
    openCollege(row.collegeId, branch.name);
    nav(`/colleges/${row.collegeId}`);
  };

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
        <span>{currentMatch}%</span>
      </div>

      <div className="cw-body">
        <h4>{college.name}</h4>

        <div className="loc">
          {[college.city, college.state].filter(Boolean).join(', ')}
          {college.type ? ` - ${college.type}` : ''}
        </div>

        <div className="cw-meta">
          {branch.name && (
            <span className="meta-chip">{branch.name}</span>
          )}

          {hasOpeningRank && (
            <span className="meta-chip">
              Opening {openingRank.toLocaleString('en-IN')}
            </span>
          )}

          {hasClosingRank && (
            <span className="meta-chip">
              Closing {closingRank.toLocaleString('en-IN')}
            </span>
          )}

          {estimatedAnnualFee !== null && (
            <span className="meta-chip">
              Official Annual{' '}
              {formatOfficialFee(
                estimatedAnnualFee
              )}
            </span>
          )}
        </div>

        <div className="original-match-line">
          Match:{' '}
          <strong style={{ color: admission.color }}>
            {admission.label}
          </strong>
          {hasPlacement ? ` - Placement ${placement}%` : ''}
        </div>

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
                <span>Exact Overall Match</span>
                <strong>Premium</strong>
              </div>

              <div className="best-premium-item">
                <span>Admission Fit</span>
                <strong>Locked</strong>
              </div>

              <div className="best-premium-item">
                <span>Branch Match</span>
                <strong>Locked</strong>
              </div>

              <div className="best-premium-item">
                <span>Why Recommended</span>
                <strong>Locked</strong>
              </div>
            </div>
          </div>
        )}

        {showPremium && premium && (
          <div className="premium-expanded">
            <div className="recommendation-labels">
              <span
                className="admission-label"
                style={{ color: admission.color }}
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
                Overall Match: <strong>{premiumScore}/100</strong>
              </div>
            )}

            {premium?.historicalFit?.label && (
              <div className="historical-fit">
                {premium.historicalFit.label}
              </div>
            )}

            {premium?.breakdown && (
              <div className="premium-breakdown">
                <ScoreLine
                  label="Admission Fit"
                  value={premium.breakdown.rank}
                  max={50}
                />
                <ScoreLine
                  label="Branch Match"
                  value={premium.breakdown.branch}
                  max={15}
                />
                <ScoreLine
                  label="College Quality"
                  value={premium.breakdown.quality}
                  max={15}
                />
                <ScoreLine
                  label="Reviews"
                  value={premium.breakdown.reviews}
                  max={10}
                />
                <ScoreLine
                  label="Budget"
                  value={premium.breakdown.budget}
                  max={7}
                />
                <ScoreLine
                  label="Location"
                  value={premium.breakdown.location}
                  max={3}
                />
              </div>
            )}
          </div>
        )}

        <div
          style={{
            marginTop: 12,
            marginBottom: 12,
            padding: 12,
            border:
              '1px solid #e3e8f2',
            borderRadius: 12,
            background: '#fafbfe',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent:
                'space-between',
              alignItems: 'center',
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
                }}
              >
                {hasOfficialFee
                  ? estimatedAnnualFee !== null
                    ? (
                      'Estimated annual fee: ' +
                      formatOfficialFee(
                        estimatedAnnualFee
                      )
                    )
                    : 'Official fee details available'
                  : 'Fee data not available yet'}
              </div>
            </div>

            {hasOfficialFee && (
              <button
                type="button"
                className=
                  "btn btn-ghost btn-sm"
                onClick={() =>
                  setShowFeeStructure(
                    value => !value
                  )
                }
              >
                {showFeeStructure
                  ? 'Hide Fees'
                  : 'View Fee Structure'}
              </button>
            )}
          </div>


          {hasOfficialFee &&
            showFeeStructure && (

            <div
              style={{
                marginTop: 10,
                paddingTop: 10,
                borderTop:
                  '1px solid #e3e8f2',
                color: '#56627a',
                fontSize: 11,
              }}
            >

              {tuitionFee !== null && (
                <FeeRow
                  label="Tuition / Semester"
                  value={
                    formatOfficialFee(
                      tuitionFee
                    )
                  }
                />
              )}

              {academicFee !== null && (
                <FeeRow
                  label="Academic / Semester"
                  value={
                    formatOfficialFee(
                      academicFee
                    )
                  }
                />
              )}

              {firstSemesterFee !== null && (
                <FeeRow
                  label="First Semester"
                  value={
                    formatOfficialFee(
                      firstSemesterFee
                    )
                  }
                />
              )}

              {messFee !== null && (
                <FeeRow
                  label="Mess / Semester"
                  value={
                    formatOfficialFee(
                      messFee
                    )
                  }
                />
              )}

              {annualAcademicFee !== null && (
                <FeeRow
                  label="Annual Academic"
                  value={
                    formatOfficialFee(
                      annualAcademicFee
                    )
                  }
                />
              )}

              {estimatedAnnualFee !== null && (
                <FeeRow
                  label="Estimated Annual"
                  value={
                    formatOfficialFee(
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

              {feeVerification && (
                <FeeRow
                  label="Status"
                  value={
                    String(
                      feeVerification
                    )
                      .replaceAll(
                        '_',
                        ' '
                      )
                  }
                />
              )}

              {feeConfidence !== null && (
                <FeeRow
                  label="Confidence"
                  value={
                    feeConfidence + '%'
                  }
                />
              )}

              {feeSourceUrl && (
                <div
                  style={{
                    marginTop: 9,
                  }}
                >
                  <a
                    href={feeSourceUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Official Fee Source
                  </a>
                </div>
              )}

              <div
                style={{
                  marginTop: 8,
                  color: '#8a94a9',
                  fontSize: 9,
                }}
              >
                Hostel fee is not included unless
                separately verified.
              </div>

            </div>
          )}
        </div>


        <div className="cw-actions">
          <Button size="sm" onClick={openDetails}>
            View College
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => addCompare(row.collegeId, branch.name)}
          >
            + Compare
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => addChoice(row.collegeId, branch.name)}
          >
            + Choice List
          </Button>
        </div>
      </div>
    </>
  );

  if (mode === 'premium') {
    return (
      <div className="cw-card premium-card">
        <OriginalCardContent showPremium={true} />
      </div>
    );
  }

  if (mode === 'freeBest') {
    return (
      <div className="cw-card best-free-card">
        <OriginalCardContent showFreeTeaser={true} />
      </div>
    );
  }

  return (
    <div className="cw-card">
      <OriginalCardContent />
    </div>
  );
}
