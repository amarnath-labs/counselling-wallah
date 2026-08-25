import Button from './Button';
import { useAppState } from '../hooks/useAppState';
import { useNavigate } from 'react-router-dom';

const meta = {
  dream: { label: 'Dream', color: 'var(--red)' },
  target: { label: 'Target', color: 'var(--amber)' },
  safe: { label: 'Safe', color: 'var(--green)' },
  backup: { label: 'Backup', color: 'var(--blue)' },
};

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

          {hasFees && (
            <span className="meta-chip">
              Rs. {(fees / 100000).toFixed(1)}L
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
