import Button from './Button';
import { useAppState } from '../hooks/useAppState';
import { useNavigate } from 'react-router-dom';

const meta = {
  dream: {
    label: 'Dream',
    emoji: '🔥',
    color: 'var(--red)',
  },
  target: {
    label: 'Target',
    emoji: '🎯',
    color: 'var(--amber)',
  },
  safe: {
    label: 'Safe',
    emoji: '🛡',
    color: 'var(--green)',
  },
  backup: {
    label: 'Backup',
    emoji: '🔵',
    color: 'var(--blue)',
  },
};

function ScoreLine({
  emoji,
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
          {emoji} {label}
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
        {emoji} {label}
      </span>

      <strong>
        {value}/{max}
      </strong>
    </div>
  );
}

export default function CollegeCard({
  row,
}) {
  const {
    addCompare,
    addChoice,
    openCollege,
  } = useAppState();

  const nav = useNavigate();

  const admission =
    meta[row?.bucket] ||
    meta.backup;

  const currentMatch =
    Number(row?.overall || 0);

  const premium =
    row?.premium || null;

  const premiumScore =
    Number.isFinite(
      Number(premium?.score)
    )
      ? Number(premium.score)
      : null;

  const premiumCategory =
    premium?.category || null;

  const branch =
    row?.branch || {};

  const college =
    row?.college || {};

  const fees =
    Number(branch?.fees);

  const placement =
    Number(branch?.placement);

  const hasFees =
    Number.isFinite(fees) &&
    fees > 0;

  const hasPlacement =
    Number.isFinite(placement) &&
    placement > 0;

  const openingRank =
    Number(branch?.openingRank);

  const closingRank =
    Number(branch?.closingRank);

  const hasOpeningRank =
    Number.isFinite(openingRank) &&
    openingRank > 0;

  const hasClosingRank =
    Number.isFinite(closingRank) &&
    closingRank > 0;

  return (
    <div className="cw-card premium-card">

      {/* CURRENT WORKING METER */}

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
            ? ` · ${college.type}`
            : ''}
        </div>

        {/* META */}

        <div className="cw-meta">

          {branch.name && (
            <span className="meta-chip">
              {branch.name}
            </span>
          )}

          {hasOpeningRank && (
            <span className="meta-chip">
              Opening{' '}
              {openingRank.toLocaleString(
                'en-IN'
              )}
            </span>
          )}

          {hasClosingRank && (
            <span className="meta-chip">
              Closing{' '}
              {closingRank.toLocaleString(
                'en-IN'
              )}
            </span>
          )}

          {hasFees && (
            <span className="meta-chip">
              ₹
              {(
                fees / 100000
              ).toFixed(1)}
              L
            </span>
          )}

          {hasPlacement && (
            <span className="meta-chip">
              Placement{' '}
              {placement}%
            </span>
          )}

        </div>

        {/* ADMISSION + PREMIUM LABELS */}

        <div className="recommendation-labels">

          <span
            className="admission-label"
            style={{
              color:
                admission.color,
            }}
          >
            {admission.emoji}{' '}
            {admission.label}
          </span>

          {premiumCategory && (
            <span className="premium-label">
              {premiumCategory.emoji}{' '}
              {premiumCategory.label}
            </span>
          )}

        </div>

        {/* PREMIUM OVERALL SCORE */}

        {premiumScore !== null && (
          <div className="overall-match">
            Overall Match:{' '}
            <strong>
              {premiumScore}/100
            </strong>
          </div>
        )}

        {/* HISTORICAL FIT */}

        {premium
          ?.historicalFit
          ?.label && (
          <div className="historical-fit">
            ⚡{' '}
            {
              premium
                .historicalFit
                .label
            }
          </div>
        )}

        {/* PREMIUM BREAKDOWN */}

        {premium?.breakdown && (
          <div className="premium-breakdown">

            <ScoreLine
              emoji="🎯"
              label="Admission Fit"
              value={
                premium
                  .breakdown
                  .rank
              }
              max={50}
            />

            <ScoreLine
              emoji="🎓"
              label="Branch Match"
              value={
                premium
                  .breakdown
                  .branch
              }
              max={15}
            />

            <ScoreLine
              emoji="🏫"
              label="College Quality"
              value={
                premium
                  .breakdown
                  .quality
              }
              max={15}
            />

            <ScoreLine
              emoji="⭐"
              label="Reviews"
              value={
                premium
                  .breakdown
                  .reviews
              }
              max={10}
            />

            <ScoreLine
              emoji="💰"
              label="Budget"
              value={
                premium
                  .breakdown
                  .budget
              }
              max={7}
            />

            <ScoreLine
              emoji="📍"
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

        {/* WHY STRONG */}

        {premium?.reasons
          ?.strong?.length >
          0 && (
          <div className="recommendation-reasons strong">

            <b>
              🟢 Why this is strong
            </b>

            {premium.reasons.strong
              .slice(0, 3)
              .map(
                (
                  reason,
                  index
                ) => (
                  <div key={index}>
                    ✓ {reason}
                  </div>
                )
              )}

          </div>
        )}

        {/* WHAT REDUCES */}

        {premium?.reasons
          ?.weak?.length >
          0 && (
          <div className="recommendation-reasons weak">

            <b>
              🔴 What reduces the score
            </b>

            {premium.reasons.weak
              .slice(0, 3)
              .map(
                (
                  reason,
                  index
                ) => (
                  <div key={index}>
                    ⚠ {reason}
                  </div>
                )
              )}

          </div>
        )}

        {/* CURRENT ACTIONS */}

        <div className="cw-actions">

          <Button
            size="sm"
            onClick={() => {
              openCollege(
                row.collegeId,
                branch.name
              );

              nav(
                `/colleges/${row.collegeId}`
              );
            }}
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
    </div>
  );
}