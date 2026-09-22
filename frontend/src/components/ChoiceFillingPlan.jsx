import { useMemo, useState } from 'react';
import {
  BAND_LABELS,
  DEFAULT_WEIGHTS,
  FACTOR_LABELS,
  RISK_MIX,
  buildChoicePlan,
  compareChoices,
  planToCsv,
} from './choicePlanEngine';

/*
|--------------------------------------------------------------------------
| CHOICE-FILLING PLAN  (Rs 999)
|--------------------------------------------------------------------------
| Design notes
|  - The screen is a counseling sheet: an ordered list the student can carry
|    into the counseling portal. Numbering is real, because order matters.
|  - One memorable element: the "list shape" strip, one tick per choice, in
|    order, coloured by band. It shows balance and last-resort tail at a glance.
|  - Everything else stays quiet: white sheet, thin rules, four band colours.
|--------------------------------------------------------------------------
*/

const RUPEE = '\u20B9';
const PRICE = `${RUPEE}999`;

const BAND_COLOR = {
  dream: '#6C4AB6',
  target: '#1F5FBF',
  safe: '#1B7A57',
};

const ACTION_LABEL = {
  freeze: 'Freeze',
  float: 'Float',
  slide: 'Slide',
};

const pct = (v) => `${Math.round(v * 100)}%`;
const signed = (v) => `${v > 0 ? '+' : v < 0 ? '\u2212' : ''}${Math.abs(v)}`;

/* ------------------------------------------------------------------ */
/* Styles                                                              */
/* ------------------------------------------------------------------ */

const CSS = `
.cfp{--ink:#17212F;--slate:#566277;--line:#D5DBE5;--canvas:#ECEFF4;--sheet:#fff;
  --dream:${BAND_COLOR.dream};--target:${BAND_COLOR.target};--safe:${BAND_COLOR.safe};--warn:#8A5A00;--warn-bg:#FFF6E0;
  font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:var(--ink);
  background:var(--canvas);padding:20px;border-radius:14px;font-size:14px;line-height:1.5}
.cfp *{box-sizing:border-box}
.cfp h2,.cfp h3,.cfp h4{margin:0;font-family:Georgia,"Times New Roman",serif;font-weight:700}
.cfp p{margin:0}
.cfp button{font:inherit;cursor:pointer}
.cfp :focus-visible{outline:3px solid #1F5FBF;outline-offset:2px}
.cfp-sheet{background:var(--sheet);border:1px solid var(--line);border-radius:10px;padding:18px;margin-bottom:14px}
.cfp-head{display:flex;flex-wrap:wrap;gap:12px;justify-content:space-between;align-items:flex-start}
.cfp-head h2{font-size:22px}
.cfp-sub{color:var(--slate);margin-top:4px;max-width:60ch}
.cfp-actions{display:flex;gap:8px;flex-wrap:wrap}
.cfp-btn{padding:9px 14px;border-radius:8px;border:1px solid var(--ink);background:var(--ink);color:#fff;font-weight:600}
.cfp-btn--ghost{background:#fff;color:var(--ink);border-color:var(--line)}
.cfp-btn:disabled{opacity:.45;cursor:not-allowed}

.cfp-shape{margin-top:16px}
.cfp-shape__bar{display:flex;gap:2px;height:34px;align-items:stretch}
.cfp-tick{flex:1 1 0;min-width:3px;border-radius:2px;border:0;padding:0}
.cfp-tick--tail{outline:2px solid var(--ink);outline-offset:1px}
.cfp-shape__legend{display:flex;flex-wrap:wrap;gap:6px 18px;margin-top:10px;color:var(--slate);font-size:13px}
.cfp-swatch{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:6px;vertical-align:baseline}
.cfp-shape__note{margin-top:6px;color:var(--slate);font-size:12.5px}

.cfp-warn{background:var(--warn-bg);border:1px solid #F0D48A;color:var(--warn);border-radius:8px;padding:10px 12px;margin-bottom:8px}
.cfp-warn strong{color:#5F3E00}

.cfp-controls summary{cursor:pointer;font-weight:600}
.cfp-controls__grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px 22px;margin-top:14px}
.cfp-field label{display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px}
.cfp-field input[type=range]{width:100%}
.cfp-field select{width:100%;padding:8px;border:1px solid var(--line);border-radius:6px;font:inherit;background:#fff}

.cfp-tabs{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 12px}
.cfp-tab{padding:6px 12px;border-radius:999px;border:1px solid var(--line);background:#fff;font-size:13px}
.cfp-tab[aria-pressed=true]{background:var(--ink);color:#fff;border-color:var(--ink)}

.cfp-list{list-style:none;margin:0;padding:0}
.cfp-row{border:1px solid var(--line);border-left-width:6px;border-radius:8px;margin-bottom:8px;background:#fff}
.cfp-row[data-band=dream]{border-left-color:var(--dream)}
.cfp-row[data-band=target]{border-left-color:var(--target)}
.cfp-row[data-band=safe]{border-left-color:var(--safe)}
.cfp-row__main{display:grid;grid-template-columns:44px 1fr auto;gap:12px;align-items:center;padding:12px 14px;width:100%;text-align:left;background:none;border:0}
.cfp-pos{font-family:Georgia,serif;font-size:22px;font-weight:700;text-align:center}
.cfp-name{font-weight:700}
.cfp-branch{color:var(--slate);font-size:13px}
.cfp-badges{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}
.cfp-badge{font-size:12px;padding:2px 8px;border-radius:999px;border:1px solid var(--line);color:var(--slate);background:#F7F8FB}
.cfp-badge--band{color:#fff;border-color:transparent}
.cfp-badge--tail{border-color:var(--ink);color:var(--ink)}
.cfp-score{text-align:right;min-width:92px}
.cfp-score b{font-family:Georgia,serif;font-size:22px}
.cfp-score small{display:block;color:var(--slate);font-size:12px}
.cfp-detail{border-top:1px solid var(--line);padding:14px;display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px}
.cfp-detail h4{font-size:14px;margin-bottom:8px}
.cfp-detail p,.cfp-detail li{font-size:13px}
.cfp-detail ul{margin:0;padding-left:18px}
.cfp-part{display:grid;grid-template-columns:120px 1fr 54px;gap:8px;align-items:center;font-size:13px;margin-bottom:5px}
.cfp-part__bar{height:8px;background:#E6EAF1;border-radius:4px;overflow:hidden}
.cfp-part__fill{height:100%;background:var(--ink)}
.cfp-part__na{color:var(--slate);font-style:italic}
.cfp-trend{display:flex;gap:14px;margin-top:6px}
.cfp-trend div{font-size:13px}
.cfp-trend small{display:block;color:var(--slate)}
.cfp-compare-pick{display:flex;align-items:center;gap:6px;padding:0 14px 12px 70px;font-size:13px;color:var(--slate)}

.cfp-cmp{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px}
.cfp-cmp table{width:100%;border-collapse:collapse;font-size:13px}
.cfp-cmp th,.cfp-cmp td{padding:5px 6px;border-bottom:1px solid var(--line);text-align:right}
.cfp-cmp th:first-child,.cfp-cmp td:first-child{text-align:left}

.cfp-why summary{cursor:pointer;font-weight:600}
.cfp-why ul{margin:10px 0 0;padding-left:18px;color:var(--slate);font-size:13px}
.cfp-foot{color:var(--slate);font-size:12.5px}

.cfp-locked{text-align:center;padding:32px 20px}
.cfp-locked h2{font-size:24px;margin-bottom:8px}
.cfp-locked ul{display:inline-block;text-align:left;margin:16px 0;padding-left:18px}
.cfp-locked li{margin-bottom:4px}

@media (max-width:640px){
  .cfp{padding:10px}
  .cfp-row__main{grid-template-columns:34px 1fr}
  .cfp-score{grid-column:2;text-align:left}
  .cfp-part{grid-template-columns:100px 1fr 48px}
  .cfp-compare-pick{padding-left:14px}
}
@media print{
  .cfp{background:#fff;padding:0}
  .cfp-actions,.cfp-controls,.cfp-tabs,.cfp-compare-pick{display:none}
  .cfp-row{break-inside:avoid}
}
`;

/* ------------------------------------------------------------------ */
/* Pieces                                                              */
/* ------------------------------------------------------------------ */

function ListShape({ choices, mix, risk, onPick }) {
  const target = RISK_MIX[risk];
  return (
    <div className="cfp-shape">
      <div className="cfp-shape__bar" role="list" aria-label="Your list from first choice to last">
        {choices.map((c) => (
          <button
            key={c.key}
            type="button"
            role="listitem"
            className={`cfp-tick${c.lastResort ? ' cfp-tick--tail' : ''}`}
            style={{ background: BAND_COLOR[c.band] }}
            title={`${c.position}. ${c.college} (${BAND_LABELS[c.band]})`}
            aria-label={`Choice ${c.position}: ${c.college}, ${BAND_LABELS[c.band]}`}
            onClick={() => onPick(c.key)}
          />
        ))}
      </div>

      <div className="cfp-shape__legend">
        {['dream', 'target', 'safe'].map((band) => (
          <span key={band}>
            <span className="cfp-swatch" style={{ background: BAND_COLOR[band] }} />
            {BAND_LABELS[band]}: {mix.counts[band]} ({pct(mix.shares[band])}), aim for about {pct(target[band])}
          </span>
        ))}
      </div>
      <p className="cfp-shape__note">
        Read left to right, first choice to last. Outlined ticks at the end are your last-resort seats.
      </p>
    </div>
  );
}

function PriorityControls({ weights, setWeights, risk, setRisk, listSize, setListSize }) {
  return (
    <details className="cfp-sheet cfp-controls">
      <summary>Change your priorities</summary>
      <div className="cfp-controls__grid">
        {Object.keys(DEFAULT_WEIGHTS).map((key) => (
          <div className="cfp-field" key={key}>
            <label htmlFor={`cfp-w-${key}`}>
              <span>{FACTOR_LABELS[key]}</span>
              <b>{weights[key]}</b>
            </label>
            <input
              id={`cfp-w-${key}`}
              type="range"
              min="0"
              max="40"
              step="5"
              value={weights[key]}
              onChange={(e) => setWeights({ ...weights, [key]: Number(e.target.value) })}
            />
          </div>
        ))}

        <div className="cfp-field">
          <label htmlFor="cfp-risk"><span>Risk appetite</span></label>
          <select id="cfp-risk" value={risk} onChange={(e) => setRisk(e.target.value)}>
            <option value="cautious">Cautious: more Safe options</option>
            <option value="balanced">Balanced</option>
            <option value="aggressive">Aggressive: more Dream options</option>
          </select>
        </div>

        <div className="cfp-field">
          <label htmlFor="cfp-size"><span>List length</span></label>
          <select id="cfp-size" value={listSize} onChange={(e) => setListSize(Number(e.target.value))}>
            {[30, 40, 60, 80, 100].map((n) => (
              <option key={n} value={n}>{n} choices</option>
            ))}
          </select>
        </div>
      </div>
      <p className="cfp-foot" style={{ marginTop: 12 }}>
        Priorities change the order of your list. They never make an unlikely seat appear.
      </p>
    </details>
  );
}

function FactorBars({ parts }) {
  return (
    <div>
      {parts.map((p) => (
        <div className="cfp-part" key={p.key}>
          <span>{p.label}</span>
          {p.value === null ? (
            <span className="cfp-part__na">Data pending, not counted</span>
          ) : (
            <span className="cfp-part__bar">
              <span className="cfp-part__fill" style={{ width: `${p.value}%`, display: 'block' }} />
            </span>
          )}
          <span style={{ textAlign: 'right' }}>{p.value === null ? '' : `${p.points}/${p.max}`}</span>
        </div>
      ))}
    </div>
  );
}

function ChoiceRow({ choice, open, onToggle, comparing, onCompareToggle, compareDisabled }) {
  const { desirability: d, feasibility: f } = choice;
  const showRange = d.max - d.min > 5;
  const cutoffText = f.trend.map((t) => (t.year ? `${t.year}: ${t.closing.toLocaleString('en-IN')}` : t.closing.toLocaleString('en-IN')));

  return (
    <li className="cfp-row" data-band={choice.band} id={`cfp-${choice.key}`}>
      <button
        type="button"
        className="cfp-row__main"
        aria-expanded={open}
        onClick={onToggle}
      >
        <span className="cfp-pos">{choice.position}</span>

        <span>
          <span className="cfp-name">{choice.college}</span>
          <span className="cfp-branch" style={{ display: 'block' }}>{choice.branch}</span>
          <span className="cfp-badges">
            <span className="cfp-badge cfp-badge--band" style={{ background: BAND_COLOR[choice.band] }}>
              {BAND_LABELS[choice.band]}
            </span>
            <span className="cfp-badge">{ACTION_LABEL[choice.strategy.action]}</span>
            {choice.lastResort && <span className="cfp-badge cfp-badge--tail">Last resort</span>}
            {choice.promoted && <span className="cfp-badge">Added for balance</span>}
            {choice.lowData && <span className="cfp-badge">Limited data</span>}
          </span>
        </span>

        <span className="cfp-score">
          <b>{Math.round(d.score)}</b>
          <small>
            {showRange ? `range ${Math.round(d.min)} to ${Math.round(d.max)}` : 'how much you want it'}
          </small>
        </span>
      </button>

      <label className="cfp-compare-pick">
        <input
          type="checkbox"
          checked={comparing}
          disabled={compareDisabled && !comparing}
          onChange={onCompareToggle}
        />
        Compare this option
      </label>

      {open && (
        <div className="cfp-detail">
          <div>
            <h4>What makes up the score</h4>
            <FactorBars parts={d.parts} />
            {d.missing.length > 0 && (
              <p className="cfp-foot">
                Not counted: {d.missing.map((k) => FACTOR_LABELS[k].toLowerCase()).join(', ')}.
                {d.missing.includes('reviews') && ' Reviews are counted only after 50+ reviews from 3+ sources.'}
              </p>
            )}
          </div>

          <div>
            <h4>Your chances, from cutoff evidence</h4>
            <p>
              Your rank is {f.margin >= 0 ? `${Math.round(f.margin * 100)}% better than` : `${Math.abs(Math.round(f.margin * 100))}% behind`} the
              average closing rank.
            </p>
            <div className="cfp-trend">
              {cutoffText.map((t) => <div key={t}><small>Closing rank</small>{t}</div>)}
            </div>
            {f.thinEvidence && <p className="cfp-foot">Only {f.yearsUsed} year of cutoff data, so the band is cautious.</p>}
            {f.volatile && <p className="cfp-foot">Cutoffs moved a lot between years.</p>}
          </div>

          <div>
            <h4>What to do in counseling</h4>
            <p>{choice.strategy.text}</p>
            <ul style={{ marginTop: 8 }}>
              {choice.tradeoff.biggestLoss && (
                <li>Biggest trade-off: {choice.tradeoff.biggestLoss.label.toLowerCase()} costs {Math.round(choice.tradeoff.biggestLoss.points)} points.</li>
              )}
              {choice.tradeoff.biggestGain && (
                <li>Strongest point: {choice.tradeoff.biggestGain.label.toLowerCase()}.</li>
              )}
              {choice.vsPrevious && choice.vsPrevious.length > 0 && (
                <li>
                  Compared with choice {choice.position - 1}: {choice.vsPrevious.map((x) => `${x.label.toLowerCase()} ${signed(x.points)}`).join(', ')}.
                </li>
              )}
            </ul>
          </div>
        </div>
      )}
    </li>
  );
}

function ComparePanel({ a, b, onClear }) {
  const cmp = useMemo(() => compareChoices(a, b), [a, b]);
  const safer = cmp.saferOption === 'a' ? a : cmp.saferOption === 'b' ? b : null;

  return (
    <section className="cfp-sheet" aria-label="Comparison">
      <div className="cfp-head">
        <h3>{a.college} {a.branch} or {b.college} {b.branch}</h3>
        <button type="button" className="cfp-btn cfp-btn--ghost" onClick={onClear}>Close comparison</button>
      </div>

      <div className="cfp-cmp" style={{ marginTop: 12 }}>
        <table>
          <thead>
            <tr><th>Points</th><th>Choice {a.position}</th><th>Choice {b.position}</th></tr>
          </thead>
          <tbody>
            {cmp.rows.map((r) => (
              <tr key={r.key}>
                <td>{r.label}</td>
                <td>{r.a === null ? 'n/a' : r.a}</td>
                <td>{r.b === null ? 'n/a' : r.b}</td>
              </tr>
            ))}
            <tr>
              <td><b>Total</b></td>
              <td><b>{Math.round(a.desirability.score)}</b></td>
              <td><b>{Math.round(b.desirability.score)}</b></td>
            </tr>
          </tbody>
        </table>

        <div>
          <h4>If you pick {a.college}</h4>
          <p>
            {cmp.aWins.length
              ? `You gain: ${cmp.aWins.slice(0, 2).map((x) => `${x.label.toLowerCase()} (${signed(x.diff)})`).join(', ')}.`
              : 'No clear advantage on the factors we can score.'}
            {' '}
            {cmp.bWins.length
              ? `You give up: ${cmp.bWins.slice(0, 2).map((x) => `${x.label.toLowerCase()} (${signed(-x.diff)})`).join(', ')}.`
              : ''}
          </p>
          <h4 style={{ marginTop: 12 }}>Seat safety</h4>
          <p>
            {safer
              ? `${safer.college} is the safer seat to actually get.`
              : 'Both are about equally likely.'}
          </p>
          {cmp.incomplete.length > 0 && (
            <p className="cfp-foot" style={{ marginTop: 8 }}>
              Not compared, data missing for one option: {cmp.incomplete.join(', ').toLowerCase()}.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function LockedPlan({ isLoggedIn, onUnlock, onLogin }) {
  return (
    <section className="cfp">
      <style>{CSS}</style>
      <div className="cfp-sheet cfp-locked">
        <h2>Your choice-filling plan</h2>
        <p className="cfp-sub" style={{ margin: '0 auto' }}>
          An ordered list of 30 to 100 colleges, ready to enter in the counseling portal.
        </p>
        <ul>
          <li>Ordered by what you want, filtered by what you can get</li>
          <li>Balanced mix of Dream, Target and Safe seats</li>
          <li>Freeze, float or slide advice for each choice</li>
          <li>Compare any two options and see what you gain or give up</li>
          <li>Colleges we left out, with the reason</li>
          <li>Download as a spreadsheet, and re-run as cutoffs update</li>
        </ul>
        <div>
          <button type="button" className="cfp-btn" onClick={isLoggedIn ? onUnlock : onLogin}>
            {isLoggedIn ? `Unlock plan for ${PRICE}` : 'Log in to unlock'}
          </button>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */

export default function ChoiceFillingPlan({
  rows = [],
  profile = {},
  hasPlanAccess = false,
  isLoggedIn = false,
  onUnlock,
  onLogin,
  onBookReview,
  dataAsOf,
}) {
  const [weights, setWeights] = useState({ ...DEFAULT_WEIGHTS, ...(profile.weights || {}) });
  const [risk, setRisk] = useState(profile.risk || 'balanced');
  const [listSize, setListSize] = useState(profile.listSize || 40);
  const [band, setBand] = useState('all');
  const [openKey, setOpenKey] = useState(null);
  const [compare, setCompare] = useState([]);

  const built = useMemo(() => {
    try {
      return { plan: buildChoicePlan(rows, { ...profile, weights, risk, listSize }), error: null };
    } catch (err) {
      return { plan: null, error: err.message };
    }
  }, [rows, profile, weights, risk, listSize]);

  if (!hasPlanAccess) {
    return <LockedPlan isLoggedIn={isLoggedIn} onUnlock={onUnlock} onLogin={onLogin} />;
  }

  if (built.error) {
    return (
      <section className="cfp">
        <style>{CSS}</style>
        <div className="cfp-sheet">
          <h3>We need your rank first</h3>
          <p className="cfp-sub">Add your rank, category and quota in your profile, then reopen this plan.</p>
        </div>
      </section>
    );
  }

  const { plan } = built;
  const visible = band === 'all' ? plan.choices : plan.choices.filter((c) => c.band === band);
  const compared = compare.map((k) => plan.choices.find((c) => c.key === k)).filter(Boolean);

  const download = () => {
    const blob = new Blob([planToCsv(plan)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'choice-filling-plan.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const jumpTo = (key) => {
    setBand('all');
    setOpenKey(key);
    requestAnimationFrame(() => {
      document.getElementById(`cfp-${key}`)?.scrollIntoView({ block: 'center' });
    });
  };

  const toggleCompare = (key) =>
    setCompare((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : prev.length < 2 ? [...prev, key] : prev));

  return (
    <section className="cfp">
      <style>{CSS}</style>

      <div className="cfp-sheet">
        <div className="cfp-head">
          <div>
            <h2>Your choice-filling plan</h2>
            <p className="cfp-sub">
              {plan.choices.length} choices for rank {plan.profile.rank.toLocaleString('en-IN')}. Enter them in this
              order. The order follows what you want most, and every seat is one you can realistically get.
            </p>
          </div>
          <div className="cfp-actions">
            <button type="button" className="cfp-btn" onClick={download}>Download spreadsheet</button>
            <button type="button" className="cfp-btn cfp-btn--ghost" onClick={() => window.print()}>Print</button>
            {onBookReview && (
              <button type="button" className="cfp-btn cfp-btn--ghost" onClick={onBookReview}>
                Book counselor review
              </button>
            )}
          </div>
        </div>

        <ListShape choices={plan.choices} mix={plan.mix} risk={plan.profile.risk} onPick={jumpTo} />
      </div>

      {plan.warnings.map((w) => (
        <div className="cfp-warn" key={w.code} role="status">
          <strong>Check this: </strong>{w.text}
        </div>
      ))}

      <PriorityControls
        weights={weights}
        setWeights={setWeights}
        risk={risk}
        setRisk={setRisk}
        listSize={listSize}
        setListSize={setListSize}
      />

      {compared.length === 2 && (
        <ComparePanel a={compared[0]} b={compared[1]} onClear={() => setCompare([])} />
      )}

      <div className="cfp-sheet">
        <div className="cfp-tabs" role="group" aria-label="Filter by band">
          {[['all', `All (${plan.choices.length})`], ...['dream', 'target', 'safe'].map((b) => [b, `${BAND_LABELS[b]} (${plan.mix.counts[b]})`])].map(([value, label]) => (
            <button
              key={value}
              type="button"
              className="cfp-tab"
              aria-pressed={band === value}
              onClick={() => setBand(value)}
            >
              {label}
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <p className="cfp-sub">
            Nothing to show here. Widen your filters or change your risk setting to see more options.
          </p>
        ) : (
          <ol className="cfp-list">
            {visible.map((c) => (
              <ChoiceRow
                key={c.key}
                choice={c}
                open={openKey === c.key}
                onToggle={() => setOpenKey(openKey === c.key ? null : c.key)}
                comparing={compare.includes(c.key)}
                onCompareToggle={() => toggleCompare(c.key)}
                compareDisabled={compare.length >= 2}
              />
            ))}
          </ol>
        )}
      </div>

      {plan.excluded.length > 0 && (
        <details className="cfp-sheet cfp-why">
          <summary>Why {plan.excluded.length} options are not on your list</summary>
          <ul>
            {plan.excluded.map((x, i) => (
              <li key={`${x.key}-${i}`}>
                <b>{x.college}, {x.branch}:</b> {x.reason}
              </li>
            ))}
          </ul>
        </details>
      )}

      <p className="cfp-foot">
        Bands come from past closing ranks, not a made-up percentage. Cutoffs can change every year.
        {dataAsOf ? ` Cutoff data last verified ${dataAsOf}.` : ''} Freeze, float and slide follow JoSAA-style
        counseling. Check the rules of your own counseling process before you lock any seat.
      </p>
    </section>
  );
}