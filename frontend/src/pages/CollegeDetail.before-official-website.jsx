import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEffect } from 'react';

import PageHero from '../components/PageHero';
import Button from '../components/Button';
import Disclaimer from '../components/Disclaimer';

import { useAppState } from '../hooks/useAppState';

import {
  CATEGORY_RELAXATION,
  BRANCH_ALTERNATIVES,
} from '../data/demoData';

import { getExamName } from '../services/examService';

export default function CollegeDetail() {
  const { id } = useParams();
  const nav = useNavigate();

  const {
    currentCollege,
    currentBranchIdx,
    setCurrentBranchIdx,
    cdTab,
    setCdTab,
    openCollege,
    addCompare,
    addChoice,
    profile,
    selectedExamId,
  } = useAppState();

  useEffect(() => {
    if (!currentCollege || currentCollege.id !== id) {
      openCollege(id);
    }
  }, [id]);

  if (!currentCollege) {
    return (
      <div className="container section">
        <div className="empty-state">
          <h3>College not found</h3>

          <Link
            className="btn btn-primary"
            to="/results"
          >
            Back to Results
          </Link>
        </div>
      </div>
    );
  }

  const c = currentCollege;
  const b = c.branches[currentBranchIdx];

  const relax =
    CATEGORY_RELAXATION[profile.category] || 1;

  const eff =
    Math.round(b.closingRank * relax);

  const ratio =
    profile.rank / eff;

  const match = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        100 - Math.abs(ratio - 0.6) * 70
      )
    )
  );

  const tabs = [
    'overview',
    'cutoffs',
    'fees',
    'placements',
    'admission',
  ];

  return (
    <>
      <PageHero
        title={c.name}
        description={`${c.city}, ${c.state} · Est. ${c.established} · ${c.type}`}
        crumb={
          <>
            <Link to="/">Home</Link> /{' '}
            <Link to="/results">Results</Link> / College Detail
          </>
        }
      />

      <div className="container section">

        <div
          style={{
            display: 'flex',
            gap: 10,
            justifyContent: 'flex-end',
            flexWrap: 'wrap',
          }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              addCompare(c.id, b.name)
            }
          >
            + Add to Compare
          </Button>

          <Button
            variant="orange"
            size="sm"
            onClick={() =>
              addChoice(c.id, b.name)
            }
          >
            Add to Preference List
          </Button>
        </div>

        <div className="detail-tabs">
          {tabs.map((t) => (
            <button
              key={t}
              className={`dtab ${
                cdTab === t ? 'on' : ''
              }`}
              onClick={() => setCdTab(t)}
              type="button"
            >
              {t[0].toUpperCase() +
                t.slice(1)}
            </button>
          ))}
        </div>

        {cdTab === 'overview' && (
          <Overview
            c={c}
            b={b}
            match={match}
            ratio={ratio}
            profile={profile}
            setBranch={setCurrentBranchIdx}
          />
        )}

        {cdTab === 'cutoffs' && (
          <Cutoffs
            b={b}
            profile={profile}
            relax={relax}
          />
        )}

        {cdTab === 'fees' && (
          <Fees b={b} />
        )}

        {cdTab === 'placements' && (
          <Placements b={b} />
        )}

        {cdTab === 'admission' && (
          <Admission
            c={c}
            exam={getExamName(selectedExamId)}
          />
        )}
      </div>
    </>
  );
}

/* =========================================================
   OVERVIEW
========================================================= */

function Overview({
  c,
  b,
  match,
  ratio,
  profile,
  setBranch,
}) {
  const alts =
    BRANCH_ALTERNATIVES[b.name];

  return (
    <>
      <div className="grid-2">

        <div className="card">
          <h4 style={{ fontSize: 15 }}>
            Why this college matches you —{' '}
            <span className="mono">
              {match}%
            </span>{' '}
            match
          </h4>

          <p style={{ fontSize: 13 }}>
            Rank compatibility: {match}% · Branch
            preference:{' '}
            {profile.branches.includes(b.name)
              ? 95
              : 62}
            % · Budget:{' '}
            {b.fees <= profile.budget
              ? 92
              : 60}
            %
          </p>

          <ul
            style={{
              fontSize: 13,
              color: 'var(--ink-2)',
              paddingLeft: 18,
            }}
          >
            <li>
              Your rank (
              {profile.rank.toLocaleString(
                'en-IN'
              )}
              ) is{' '}
              {ratio <= 1
                ? 'within'
                : 'close to'}{' '}
              the recent closing rank trend
              for {b.name}.
            </li>

            <li>
              {profile.branches.includes(
                b.name
              )
                ? 'Your preferred branch is available here.'
                : 'This branch is a possible alternative to your top choice.'}
            </li>

            <li>
              {b.fees <= profile.budget
                ? 'Fees fit your selected budget.'
                : 'Fees are above your selected budget — worth reviewing scholarships.'}
            </li>

            <li>
              Estimates are based on
              historical data — not a
              guarantee of admission.
            </li>
          </ul>
        </div>

        <div className="card">
          <h4 style={{ fontSize: 15 }}>
            Branches at this college
          </h4>

          <div className="chip-select">
            {c.branches.map((bb, i) => (
              <button
                type="button"
                className={`chip ${
                  i === c.branches.indexOf(b)
                    ? 'on'
                    : ''
                }`}
                onClick={() => setBranch(i)}
                key={bb.name}
              >
                {bb.name}
              </button>
            ))}
          </div>

          <p
            style={{
              fontSize: 12.5,
              marginTop: 12,
            }}
          >
            Pros: Strong alumni network,
            established recruiter base.
            <br />
            Cons: Competitive cutoffs for
            top branches.
          </p>
        </div>
      </div>

      <div className="source-note">
        Match % uses the closing-rank data
        shown in the Cutoffs tab (real where
        sourced, estimated otherwise). Fee
        and placement figures below are
        illustrative.{' '}
        <span className="demo-tag">
          FEES/PLACEMENT: DEMO DATA
        </span>
      </div>

      {alts && (
        <div
          className="card"
          style={{ marginTop: 14 }}
        >
          <h4 style={{ fontSize: 14 }}>
            What if I don't get {b.name}?
          </h4>

          <p style={{ fontSize: 12.5 }}>
            These are commonly considered
            alternatives — not equivalents.
            Actual availability, cutoffs and
            curriculum differ by college.
          </p>

          <ul style={{ paddingLeft: 18 }}>
            {alts.map((a) => (
              <li
                key={a.name}
                style={{
                  fontSize: 13,
                  color: 'var(--ink-2)',
                  marginBottom: 6,
                }}
              >
                <b>{a.name}</b> — {a.note}
              </li>
            ))}
          </ul>

          <div className="source-note">
            General guidance based on typical
            curriculum overlap and
            closing-rank patterns — not sourced
            from official data.{' '}
            <span className="demo-tag">
              GENERAL GUIDANCE
            </span>
          </div>
        </div>
      )}
    </>
  );
}

/* =========================================================
   CUTOFFS + PROVENANCE
========================================================= */

function Cutoffs({
  b,
  profile,
  relax,
}) {
  const rows = [
    {
      yr: 2025,
      round:
        b.round || 'Round 6 (final)',
      closing: b.closingRank,
    },

    ...(typeof b.closingRank2026 ===
    'number'
      ? [
          {
            yr: 2026,
            round:
              b.round2026 ||
              'Round (see note)',
            closing:
              b.closingRank2026,
          },
        ]
      : []),
  ];

  /*
   * Phase-3 verification status.
   *
   * DEMO        = prototype/demo data
   * UNVERIFIED  = source recorded but not independently verified
   * VERIFIED    = source verified
   * STALE       = previously verified but now outdated
   * REJECTED    = source/data rejected
   */

  const status =
    b.verificationStatus || 'DEMO';

  const statusConfig = {
    VERIFIED: {
      label: '✓ Verified Source',
      className: 'verified',
    },

    UNVERIFIED: {
      label: '⚠ Unverified',
      className: 'unverified',
    },

    STALE: {
      label: '⚠ Stale Data',
      className: 'stale',
    },

    REJECTED: {
      label: '✕ Rejected Source',
      className: 'rejected',
    },

    DEMO: {
      label: 'Demo / Prototype Data',
      className: 'demo',
    },
  };

  const statusInfo =
    statusConfig[status] ||
    statusConfig.DEMO;

  return (
    <div className="card">
      <table className="cutoff-table">
        <thead>
          <tr>
            <th>Year</th>
            <th>Round</th>
            <th>Category</th>
            <th>Quota</th>
            <th>Branch</th>
            <th>Closing (Open baseline)</th>
            <th>
              Closing ({profile.category},
              est.)
            </th>
          </tr>
        </thead>

        <tbody>
          {rows.map((r) => (
            <tr key={r.yr}>
              <td>{r.yr}</td>

              <td>{r.round}</td>

              <td>Open</td>

              <td>OS</td>

              <td>{b.name}</td>

              <td className="mono">
                {r.closing.toLocaleString(
                  'en-IN'
                )}
              </td>

              <td className="mono">
                {Math.round(
                  r.closing * relax
                ).toLocaleString('en-IN')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* =====================================================
          SOURCE / VERIFICATION INFORMATION
      ===================================================== */}

      <div className="source-note">

        <div style={{ marginBottom: 8 }}>
          <span
            className={`verification-badge ${statusInfo.className}`}
          >
            {statusInfo.label}
          </span>
        </div>

        {/* DEMO */}
        {status === 'DEMO' && (
          <p style={{ margin: '6px 0' }}>
            This cutoff is prototype/demo
            data and should not be treated as
            an official closing rank.
          </p>
        )}

        {/* UNVERIFIED */}
        {status === 'UNVERIFIED' && (
          <p style={{ margin: '6px 0' }}>
            A source has been recorded for
            this cutoff, but the figure has
            not yet been independently
            verified.
          </p>
        )}

        {/* VERIFIED */}
        {status === 'VERIFIED' && (
          <p style={{ margin: '6px 0' }}>
            This cutoff has been verified
            against the recorded source.
          </p>
        )}

        {/* SOURCE LABEL */}
        {b.source && (
          <div style={{ marginTop: 6 }}>
            <b>Source:</b> {b.source}
          </div>
        )}

        {/* SOURCE URL */}
        {b.sourceUrl && (
          <div style={{ marginTop: 4 }}>
            <b>Source URL:</b>{' '}
            <a
              href={b.sourceUrl}
              target="_blank"
              rel="noreferrer"
            >
              Open source
            </a>
          </div>
        )}

      </div>
    </div>
  );
}

/* =========================================================
   FEES
========================================================= */

function Fees({ b }) {
  return (
    <div className="card">
      <h4>Fees</h4>

      <p>
        Estimated annual tuition:
        <strong>
          {' '}
          ₹
          {Number(
            b.fees || 0
          ).toLocaleString('en-IN')}
        </strong>
      </p>

      <div className="source-note">
        Fee figures are illustrative/demo
        data unless independently verified.
      </div>
    </div>
  );
}

/* =========================================================
   PLACEMENTS
========================================================= */

function Placements({ b }) {
  return (
    <div className="card">
      <h4>Placements</h4>

      <p>
        Placement information for{' '}
        <strong>{b.name}</strong> is shown
        for guidance only.
      </p>

      <Disclaimer />
    </div>
  );
}

/* =========================================================
   ADMISSION
========================================================= */

function Admission({
  c,
  exam,
}) {
  return (
    <div className="card">
      <h4>Admission</h4>

      <p>
        Admission route:
        <strong> {exam}</strong>
      </p>

      <p>
        College:
        <strong> {c.name}</strong>
      </p>

      <div className="source-note">
        Confirm current admission rules,
        dates and eligibility from the
        official counselling authority.
      </div>
    </div>
  );
}
