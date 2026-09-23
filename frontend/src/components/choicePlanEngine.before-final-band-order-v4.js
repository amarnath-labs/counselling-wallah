/*
|--------------------------------------------------------------------------
| TRUMARG CHOICE-FILLING PLAN ENGINE  (Rs 999 tier)
|--------------------------------------------------------------------------
| Pure functions only: no React, no network, easy to unit-test.
|
| Two separate questions:
|   1. FEASIBILITY   - can this student realistically get the seat?
|                      -> a band (safe / target / dream / unlikely).
|                      It is a GATE, not a weight.
|   2. DESIRABILITY  - how much does this student want the seat?
|                      -> 0-100 score from the student's own priorities.
|
| The final list is ordered by DESIRABILITY, because counseling fills seats
| by the student's own preference order. FEASIBILITY only decides what is
| allowed on the list and keeps the risk mix healthy.
|
| Rules carried over from the Rs 99 product:
|   - Missing data stays null. It is never replaced by a fake default.
|   - Score is reported as a RANGE when data is missing.
|   - Reviews count only when the 50-review / 3-source / <=60% gate is met.
|   - No fake "% chance". Bands come from cutoff evidence.
|
| INPUT ASSUMPTION: closing ranks in each row are already for the student's
| category / quota / gender pool. The engine compares them to `profile.rank`.
|--------------------------------------------------------------------------
*/

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

export const DEFAULT_WEIGHTS = {
  branch: 25,
  quality: 20,
  placement: 20,
  roi: 10,
  reviews: 10,
  budget: 10,
  location: 5,
};

export const FACTOR_LABELS = {
  branch: 'Branch match',
  quality: 'Institute strength',
  placement: 'Placements',
  roi: 'Fees vs. salary',
  reviews: 'Student reviews',
  budget: 'Budget',
  location: 'Location',
};

/* target share of Dream / Target / Safe for each risk appetite */
export const RISK_MIX = {
  cautious: { dream: 0.15, target: 0.4, safe: 0.45, minSafe: 0.3 },
  balanced: { dream: 0.25, target: 0.45, safe: 0.3, minSafe: 0.2 },
  aggressive: { dream: 0.4, target: 0.4, safe: 0.2, minSafe: 0.15 },
};

export const BAND_LABELS = {
  dream: 'Dream',
  target: 'Target',
  safe: 'Safe',
  unlikely: 'Unlikely',
};

const LAST_RESORT_COUNT = 3;

/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */

/** Number or null. Unlike Number(), null / '' / undefined stay null. */
export function num(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

const clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));
const round1 = (v) => Math.round(v * 10) / 10;
const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;

function stdev(a) {
  if (a.length < 2) return 0;
  const m = mean(a);
  return Math.sqrt(mean(a.map((x) => (x - m) ** 2)));
}

function norm(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/* ------------------------------------------------------------------ */
/* Row adapter: your API row  ->  one flat, predictable shape          */
/* ------------------------------------------------------------------ */

function factorFromRow(row, key, breakdownMax) {
  const direct = row?.factors?.[key];
  if (direct && direct.available === true && num(direct.score) !== null) {
    return clamp(num(direct.score));
  }
  if (breakdownMax) {
    const raw = num(row?.premium?.breakdown?.[key]);
    if (raw !== null) return clamp((raw / breakdownMax) * 100);
  }
  return null;
}

/** Review score counts only if enough aspects pass the 50 / 3 / 60% gate. */
export function reviewGate(row, minReadyAspects = 3) {
  const aspects = row?.reviewIntelligenceV3?.aspects;
  if (!aspects || typeof aspects !== 'object') return { ready: false, readyAspects: 0 };

  let readyAspects = 0;
  for (const data of Object.values(aspects)) {
    const reviews = num(data?.effectiveReviewCount) ?? 0;
    const sources = num(data?.effectiveSourceCount) ?? 0;
    const share = num(data?.maxSourceShare);
    if (reviews >= 50 && sources >= 3 && share !== null && share <= 0.6) readyAspects += 1;
  }
  return { ready: readyAspects >= minReadyAspects, readyAspects };
}

/**
 * ROI = median package / total course fee, mapped to 0-100.
 * A ratio of 3x or more scores 100. Tune ROI_FULL_MARKS_RATIO with real data.
 */
const ROI_FULL_MARKS_RATIO = 3;

function roiFromRow(row) {
  const explicit = num(row?.factors?.roi?.score);
  if (row?.factors?.roi?.available === true && explicit !== null) return clamp(explicit);

  const ctc = num(row?.placement?.medianCtc);
  const fee = num(row?.fees?.total) ?? (num(row?.fees?.annual) !== null ? num(row.fees.annual) * 4 : null);
  if (ctc === null || fee === null || fee <= 0) return null;
  return clamp((ctc / fee / ROI_FULL_MARKS_RATIO) * 100);
}

function yearsFromRow(row) {
  const h = row?.premium?.historicalFit || row?.historicalFit || row?.admissionIntelligence || {};
  const lists = [h.years, h.history, h.cutoffs, h.yearly, h.yearlyCutoffs, row?.cutoffs];

  for (const list of lists) {
    if (!Array.isArray(list)) continue;
    const out = list
      .map((it) => ({
        year: num(it?.year),
        closing: num(it?.closingRank ?? it?.closing_rank ?? it?.closing ?? it?.finalClosing),
      }))
      .filter((it) => it.year !== null && it.closing !== null && it.closing > 0)
      .sort((a, b) => b.year - a.year)
      .slice(0, 3);
    if (out.length) return out;
  }

  const single = num(h.latestClosingRank ?? h.latestClosing ?? h.closingRank ?? row?.closingRank);
  return single !== null && single > 0 ? [{ year: null, closing: single }] : [];
}

export function normalizeRow(row) {
  const college = row?.college?.name || row?.college_name || row?.collegeName || 'College';
  const branch = row?.branch?.name || row?.branch_name || row?.branchName || 'Branch';
  const collegeId = row?.collegeId ?? row?.college?.id ?? row?.college_id ?? college;
  const annualFee =
    num(row?.fees?.annual) ?? (num(row?.fees?.total) !== null ? num(row.fees.total) / 4 : null);

  const gate = reviewGate(row);
  const reviewsScore = gate.ready ? num(row?.reviewIntelligenceV3?.score) : null;

  return {
    key: `${norm(collegeId)}::${norm(row?.branch?.id ?? row?.branchId ?? branch)}`,
    college,
    branch,
    state: row?.college?.state ?? row?.state ?? null,
    annualFee,
    years: yearsFromRow(row),
    factors: {
      branch: factorFromRow(row, 'branch', 15),
      quality: factorFromRow(row, 'quality', 15),
      placement: num(row?.factors?.placement?.score) !== null && row?.factors?.placement?.available === true
        ? clamp(num(row.factors.placement.score))
        : num(row?.placement?.score) !== null
          ? clamp(num(row.placement.score))
          : null,
      roi: roiFromRow(row),
      reviews: reviewsScore !== null ? clamp(reviewsScore) : null,
      budget: factorFromRow(row, 'budget', 7),
      location: factorFromRow(row, 'location', 3),
    },
    reviewGate: gate,
    raw: row,
  };
}

/* ------------------------------------------------------------------ */
/* 1. FEASIBILITY                                                      */
/* ------------------------------------------------------------------ */

/**
 * margin = (closing - myRank) / closing
 *   > 0  : my rank is better (lower) than last year's closing
 *   < 0  : my rank is worse than last year's closing
 *
 * Bands (starting rules, tune on real data):
 *   Safe      every year's margin >= 15%  (+ buffer when evidence is thin)
 *   Target    average margin >= -5%, or results mixed across years
 *   Dream     average margin between -20% and -5%
 *   Unlikely  even the best year is worse than -20%
 *
 * Buffer: thin history (1-2 years) or volatile cutoffs make Safe harder to earn.
 */
export function computeFeasibility(myRank, years) {
  if (!Array.isArray(years) || years.length === 0) {
    return { band: null, reason: 'no-cutoff-data', yearsUsed: 0 };
  }

  const margins = years.map((y) => (y.closing - myRank) / y.closing);
  const avg = mean(margins);
  const min = Math.min(...margins);
  const max = Math.max(...margins);
  const volatile = stdev(margins) > 0.15;

  const buffer = (years.length >= 3 ? 0 : years.length === 2 ? 0.05 : 0.1) + (volatile ? 0.05 : 0);
  const safeThreshold = 0.15 + buffer;

  let band;
  if (max < -0.2) band = 'unlikely';
  else if (min >= safeThreshold) band = 'safe';
  else if (avg >= -0.05) band = 'target';
  else band = 'dream';

  return {
    band,
    margin: round1(avg * 100) / 100, // e.g. 0.04
    minMargin: round1(min * 100) / 100,
    maxMargin: round1(max * 100) / 100,
    yearsUsed: years.length,
    volatile,
    thinEvidence: years.length < 3,
    trend: years.map((y) => ({ year: y.year, closing: y.closing })),
  };
}

/* ------------------------------------------------------------------ */
/* 2. DESIRABILITY                                                     */
/* ------------------------------------------------------------------ */

/**
 * Returns a point estimate plus a range.
 *   score : known factors, re-weighted to 100
 *   min   : missing factors count as 0
 *   max   : missing factors count as full marks
 */
export function computeDesirability(factors, weights = DEFAULT_WEIGHTS) {
  const keys = Object.keys(weights).filter((k) => weights[k] > 0);
  const totalW = keys.reduce((s, k) => s + weights[k], 0);
  if (totalW === 0) return { score: null, min: null, max: null, known: [], missing: keys, parts: [] };

  const known = keys.filter((k) => factors[k] !== null && factors[k] !== undefined);
  const missing = keys.filter((k) => !known.includes(k));
  const knownW = known.reduce((s, k) => s + weights[k], 0);
  const earned = known.reduce((s, k) => s + (factors[k] / 100) * weights[k], 0);

  /* every factor as points on the 0-100 desirability scale */
  const parts = keys.map((k) => {
    const value = factors[k] ?? null;
    const share = (weights[k] / totalW) * 100;
    return {
      key: k,
      label: FACTOR_LABELS[k] || k,
      value,
      max: round1(share),
      points: value === null ? null : round1((value / 100) * share),
      lost: value === null ? null : round1(((100 - value) / 100) * share),
    };
  });

  return {
    score: knownW ? round1((earned / knownW) * 100) : null,
    min: round1((earned / totalW) * 100),
    max: round1(((earned + (totalW - knownW)) / totalW) * 100),
    coverage: Math.round((knownW / totalW) * 100),
    known,
    missing,
    parts,
  };
}

/* ------------------------------------------------------------------ */
/* Explanations                                                        */
/* ------------------------------------------------------------------ */

/** Biggest trade-off = the factor that costs the most points. */
function describeTradeoff(desirability) {
  const scored = desirability.parts.filter((p) => p.lost !== null).sort((a, b) => b.lost - a.lost);
  const best = [...desirability.parts].filter((p) => p.points !== null).sort((a, b) => b.points - a.points);
  return {
    biggestLoss: scored[0] && scored[0].lost >= 3 ? { label: scored[0].label, points: scored[0].lost } : null,
    biggestGain: best[0] ? { label: best[0].label, points: best[0].points } : null,
  };
}

function roundStrategy(band, margin) {
  if (band === 'safe') {
    return {
      action: 'freeze',
      text: 'Very likely to open early. Freeze it if you are happy to take this seat.',
    };
  }
  if (band === 'target' && margin >= 0.05) {
    return {
      action: 'slide',
      text: 'Good chance in the early rounds. Slide to keep this seat and still improve within the college.',
    };
  }
  if (band === 'target') {
    return {
      action: 'float',
      text: 'Could go either way. Float and keep a Safe choice below as protection.',
    };
  }
  return {
    action: 'float',
    text: 'Opens only if seats vacate in later rounds. Float and treat any offer as a bonus.',
  };
}

/* ------------------------------------------------------------------ */
/* 3. THE PLAN                                                         */
/* ------------------------------------------------------------------ */

/**
 * profile = {
 *   rank: number (required),
 *   listSize?: number            default 40 (30-100 recommended)
 *   risk?: 'cautious'|'balanced'|'aggressive'
 *   weights?: partial DEFAULT_WEIGHTS
 *   hard?: { maxAnnualFee?, excludeStates?: [], onlyStates?: [] }
 * }
 */
export function buildChoicePlan(rows, profile = {}) {
  const rank = num(profile.rank);
  if (rank === null || rank <= 0) throw new Error('buildChoicePlan: profile.rank must be a positive number');

  const listSize = clamp(Math.round(num(profile.listSize) ?? 40), 10, 150);
  const risk = RISK_MIX[profile.risk] ? profile.risk : 'balanced';
  const mixTarget = RISK_MIX[risk];
  const weights = { ...DEFAULT_WEIGHTS, ...(profile.weights || {}) };
  const hard = profile.hard || {};
  const excludeStates = (hard.excludeStates || []).map(norm);
  const onlyStates = (hard.onlyStates || []).map(norm);

  const excluded = [];
  const seen = new Set();
  const eligible = [];

  for (const raw of rows || []) {
    if (!raw) continue;
    const item = normalizeRow(raw);
    const skip = (reason, code) =>
      excluded.push({ key: item.key, college: item.college, branch: item.branch, code, reason });

    if (seen.has(item.key)) {
      skip('Duplicate of another option in your list.', 'duplicate');
      continue;
    }
    seen.add(item.key);

    /* hard constraints: filters, never weights */
    const state = norm(item.state);
    if (excludeStates.length && state && excludeStates.includes(state)) {
      skip(`Removed because you excluded ${item.state}.`, 'hard-state');
      continue;
    }
    if (onlyStates.length && (!state || !onlyStates.includes(state))) {
      skip('Outside the states you chose.', 'hard-state');
      continue;
    }
    const maxFee = num(hard.maxAnnualFee);
    if (maxFee !== null && item.annualFee !== null && item.annualFee > maxFee) {
      skip('Annual fee is above your hard limit.', 'hard-fee');
      continue;
    }

    /* feasibility gate */
    const feasibility = computeFeasibility(rank, item.years);
    if (feasibility.band === null) {
      skip('No cutoff data yet, so we cannot judge your chances.', 'no-cutoff-data');
      continue;
    }
    if (feasibility.band === 'unlikely') {
      skip('Your rank is far above the cutoff in every year we have.', 'unlikely');
      continue;
    }

    const desirability = computeDesirability(item.factors, weights);
    if (desirability.score === null) {
      skip('No scored factors are available for this option.', 'no-data');
      continue;
    }

    eligible.push({ ...item, feasibility, desirability });
  }

  const byDesirability = (a, b) =>
    b.desirability.score - a.desirability.score || b.feasibility.margin - a.feasibility.margin;
  eligible.sort(byDesirability);

  /* pick the top N by desirability */
  let main = eligible.slice(0, listSize);
  const rest = eligible.slice(listSize);
  const promoted = new Set();

  /* keep a healthy number of Safe options: swap in the best Safe from outside */
  const safeNeeded = Math.min(
    Math.ceil(listSize * mixTarget.minSafe),
    eligible.filter((e) => e.feasibility.band === 'safe').length
  );
  let safeInMain = main.filter((e) => e.feasibility.band === 'safe').length;
  if (safeInMain < safeNeeded) {
    const candidates = rest.filter((e) => e.feasibility.band === 'safe');
    const replaceable = main
      .filter((e) => e.feasibility.band !== 'safe')
      .sort((a, b) => a.desirability.score - b.desirability.score);
    while (safeInMain < safeNeeded && candidates.length && replaceable.length) {
      const incoming = candidates.shift();
      const outgoing = replaceable.shift();
      main = main.filter((e) => e.key !== outgoing.key);
      main.push(incoming);
      promoted.add(incoming.key);
      excluded.push({
        key: outgoing.key,
        college: outgoing.college,
        branch: outgoing.branch,
        code: 'swapped-for-safe',
        reason: 'Replaced by a Safe option to keep your list balanced.',
      });
      safeInMain += 1;
    }
  }

  /* last-resort block: the safest options go to the end */
  const safest = eligible
    .filter((e) => e.feasibility.band === 'safe')
    .sort((a, b) => b.feasibility.minMargin - a.feasibility.minMargin)
    .slice(0, LAST_RESORT_COUNT);
  const lastResortKeys = new Set(safest.map((e) => e.key));

  /*
  |--------------------------------------------------------------------------
  | TRUMARG STRICT DREAM TARGET SAFE ORDER
  |--------------------------------------------------------------------------
  |
  | Final counselling order:
  | Dream -> Target -> Safe
  |
  | Within each band:
  | higher desirability stays above lower desirability.
  |--------------------------------------------------------------------------
  */

  const BAND_PRIORITY = {
    dream: 0,
    target: 1,
    safe: 2,
    unlikely: 3,
  };

  const byBandThenDesirability =
    (a, b) => {
      const bandDiff =
        (BAND_PRIORITY[
          a?.feasibility?.band
        ] ?? 99) -
        (BAND_PRIORITY[
          b?.feasibility?.band
        ] ?? 99);

      if (bandDiff !== 0) {
        return bandDiff;
      }

      return byDesirability(
        a,
        b
      );
    };


  const front =
    main
      .filter(
        (e) =>
          !lastResortKeys.has(
            e.key
          )
      )
      .sort(
        byBandThenDesirability
      );


  const back =
    safest.sort(
      byDesirability
    );

  /* anything that did not make the list */
  const listed = new Set([...front, ...back].map((e) => e.key));
  for (const e of eligible) {
    if (!listed.has(e.key) && !excluded.some((x) => x.key === e.key)) {
      excluded.push({
        key: e.key,
        college: e.college,
        branch: e.branch,
        code: 'below-cut',
        reason: `Ranked below your top ${listSize} by how much you want it.`,
      });
    }
  }

  const choices = [...front, ...back].map((e, i) => ({
    position: i + 1,
    key: e.key,
    college: e.college,
    branch: e.branch,
    state: e.state,
    band: e.feasibility.band,
    feasibility: e.feasibility,
    desirability: e.desirability,
    factors: e.factors,
    tradeoff: describeTradeoff(e.desirability),
    strategy: roundStrategy(e.feasibility.band, e.feasibility.margin),
    lastResort: lastResortKeys.has(e.key),
    promoted: promoted.has(e.key),
    lowData: e.desirability.coverage < 60,
    evidence: {
      cutoffYears: e.feasibility.yearsUsed,
      thinCutoffs: e.feasibility.thinEvidence,
      volatileCutoffs: e.feasibility.volatile,
      reviews: e.reviewGate.ready ? 'verified' : 'not counted',
    },
  }));

  /* delta against the option above it */
  choices.forEach((c, i) => {
    if (i === 0) {
      c.vsPrevious = null;
      return;
    }
    const prev = choices[i - 1];
    const deltas = c.desirability.parts
      .map((p, idx) => {
        const before = prev.desirability.parts[idx];
        if (p.points === null || before.points === null) return null;
        return { label: p.label, points: round1(p.points - before.points) };
      })
      .filter((d) => d && Math.abs(d.points) >= 1)
      .sort((a, b) => Math.abs(b.points) - Math.abs(a.points))
      .slice(0, 2);
    c.vsPrevious = deltas;
  });

  /* mix + warnings */
  const count = { dream: 0, target: 0, safe: 0 };
  choices.forEach((c) => (count[c.band] += 1));
  const total = choices.length || 1;
  const mix = {
    counts: count,
    shares: {
      dream: Math.round((count.dream / total) * 100) / 100,
      target: Math.round((count.target / total) * 100) / 100,
      safe: Math.round((count.safe / total) * 100) / 100,
    },
    target: { dream: mixTarget.dream, target: mixTarget.target, safe: mixTarget.safe },
  };

  const warnings = [];
  if (choices.length < listSize) {
    warnings.push({
      code: 'short-list',
      text: `Only ${choices.length} options passed your filters, fewer than the ${listSize} you asked for.`,
    });
  }
  if (mix.shares.safe < mixTarget.minSafe) {
    warnings.push({
      code: 'low-safe',
      text: `Only ${count.safe} Safe option${count.safe === 1 ? '' : 's'} (${Math.round(mix.shares.safe * 100)}%). Widen your filters or add Safe colleges so you are not left without a seat.`,
    });
  }
  if (mix.shares.dream > mixTarget.dream + 0.15) {
    warnings.push({
      code: 'high-dream',
      text: `${Math.round(mix.shares.dream * 100)}% of your list is Dream. That is riskier than the ${risk} setting you chose.`,
    });
  }
  if (back.length < LAST_RESORT_COUNT) {
    warnings.push({
      code: 'no-last-resort',
      text: 'Fewer than 3 guaranteed-safe options exist. Consider adding state-level or private colleges as a final fallback.',
    });
  }
  const lowDataCount = choices.filter((c) => c.lowData).length;
  if (choices.length && lowDataCount / choices.length > 0.3) {
    warnings.push({
      code: 'low-data',
      text: `${lowDataCount} options have limited data, so their scores are shown as ranges.`,
    });
  }

  return { profile: { rank, listSize, risk, weights, hard }, choices, mix, warnings, excluded };
}

/* ------------------------------------------------------------------ */
/* 4. REGRET COMPARISON                                                */
/* ------------------------------------------------------------------ */

export function compareChoices(a, b) {
  const rows = a.desirability.parts.map((p, i) => {
    const q = b.desirability.parts[i];
    const diff = p.points !== null && q.points !== null ? round1(p.points - q.points) : null;
    return { key: p.key, label: p.label, a: p.points, b: q.points, diff };
  });

  const usable = rows.filter((r) => r.diff !== null);
  const aWins = usable.filter((r) => r.diff >= 1).sort((x, y) => y.diff - x.diff);
  const bWins = usable.filter((r) => r.diff <= -1).sort((x, y) => x.diff - y.diff);

  return {
    rows,
    aWins,
    bWins,
    marginA: a.feasibility.margin,
    marginB: b.feasibility.margin,
    saferOption:
      Math.abs(a.feasibility.margin - b.feasibility.margin) < 0.02
        ? null
        : a.feasibility.margin > b.feasibility.margin
          ? 'a'
          : 'b',
    incomplete: rows.filter((r) => r.diff === null).map((r) => r.label),
  };
}

/* ------------------------------------------------------------------ */
/* 5. EXPORT                                                           */
/* ------------------------------------------------------------------ */

const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

export function planToCsv(plan) {
  const header = [
    'Position', 'College', 'Branch', 'State', 'Band', 'Rank margin %',
    'Desirability', 'Range low', 'Range high', 'Action', 'Note',
  ];
  const lines = plan.choices.map((c) =>
    [
      c.position, c.college, c.branch, c.state ?? '', BAND_LABELS[c.band],
      Math.round(c.feasibility.margin * 100),
      c.desirability.score, c.desirability.min, c.desirability.max,
      c.strategy.action,
      c.lastResort ? 'Last resort' : c.lowData ? 'Limited data' : '',
    ].map(csvCell).join(',')
  );
  /* leading BOM so Excel reads UTF-8 correctly */
  return '\uFEFF' + [header.map(csvCell).join(','), ...lines].join('\r\n');
}