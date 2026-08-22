import { BRANCH_LIST } from '../data/branches';
import { BUCKET_META, CATEGORY_RELAXATION } from '../data/demoData';

function getRelaxation(category) {
  return CATEGORY_RELAXATION[category] || 1;
}

function getBucket(ratio) {
  if (ratio < 0.65) return 'dream';
  if (ratio <= 1.0) return 'target';
  if (ratio <= 1.5) return 'safe';
  return 'backup';
}

function normalizeBranch(branch) {
  return {
    ...branch,

    fees: Number(branch.fees) || 0,
    median: Number(branch.median) || 0,
    average: Number(branch.average) || 0,
    highest: Number(branch.highest) || 0,
    placement: Number(branch.placement) || 0,

    closingRank:
      typeof branch.closingRank === 'number'
        ? branch.closingRank
        : Number(branch.closingRank) || 0,

    closingRank2026:
      branch.closingRank2026 == null
        ? null
        : Number(branch.closingRank2026),
  };
}

export function computeResults(profile, colleges = []) {
  if (!Array.isArray(colleges)) {
    return [];
  }

  const relax = getRelaxation(profile.category);
  const rows = [];

  colleges.forEach((college) => {
    if (!college || !Array.isArray(college.branches)) {
      return;
    }

    // College type filter
    if (
      profile.type &&
      profile.type !== 'Both' &&
      college.type !== profile.type
    ) {
      return;
    }

    college.branches.forEach((rawBranch) => {
      const branch = normalizeBranch(rawBranch);

      // Ignore branches for which we have no cutoff
      if (!branch.closingRank || branch.closingRank <= 0) {
        return;
      }

      const effectiveClosing = Math.max(
        1,
        Math.round(branch.closingRank * relax)
      );

      const ratio = profile.rank / effectiveClosing;

      /*
       * Do not completely discard colleges just because
       * the rank is above the cutoff. Keep them available
       * for the UI as Dream/Target/Backup recommendations.
       */

      const rankScore = Math.max(
        0,
        Math.min(
          100,
          Math.round(
            100 - Math.abs(ratio - 0.6) * 70
          )
        )
      );

      const branchScore =
        !Array.isArray(profile.branches) ||
        profile.branches.length === 0 ||
        profile.branches.includes(branch.name)
          ? 95
          : 62;

      const budget = Number(profile.budget) || 0;

      const budgetScore =
        budget <= 0
          ? 75
          : branch.fees <= budget
          ? 92
          : branch.fees <= budget * 1.25
          ? 68
          : 40;

      const locationScore =
        !profile.prefState ||
        profile.prefState === 'Any'
          ? college.state === profile.homeState
            ? 96
            : 82
          : college.state === profile.prefState
          ? 96
          : 60;

      const overall = Math.round(
        rankScore * 0.4 +
        branchScore * 0.25 +
        budgetScore * 0.2 +
        locationScore * 0.15
      );

      const bucket = getBucket(ratio);

      rows.push({
        collegeId: college.id,
        college,
        branch,
        bucket,
        overall,
        breakdown: {
          rank: rankScore,
          branch: branchScore,
          budget: budgetScore,
          location: locationScore,
        },
      });
    });
  });

  return rows.sort(
    (a, b) => b.overall - a.overall
  );
}

export function filterAndSortResults(
  results,
  filters = {},
  profile
) {
  let rows = Array.isArray(results)
    ? [...results]
    : [];

  rows = rows.filter((r) => {
    if (
      filters.branch &&
      filters.branch !== 'All Branches' &&
      r.branch.name !== filters.branch
    ) {
      return false;
    }

    if (
      filters.state &&
      filters.state !== 'All States' &&
      r.college.state !== filters.state
    ) {
      return false;
    }

    if (
      filters.type &&
      filters.type !== 'Both' &&
      filters.type !== 'All College Types' &&
      r.college.type !== filters.type
    ) {
      return false;
    }

    return true;
  });

  const relax = getRelaxation(profile.category);

  const effectiveClosing = (row) =>
    Math.max(
      1,
      Math.round(
        Number(row.branch.closingRank) * relax
      )
    );

  if (filters.sort === 'fees') {
    rows.sort(
      (a, b) =>
        Number(a.branch.fees || 0) -
        Number(b.branch.fees || 0)
    );
  } else if (filters.sort === 'rank') {
    rows.sort(
      (a, b) =>
        Math.abs(
          Number(profile.rank) -
            effectiveClosing(a)
        ) -
        Math.abs(
          Number(profile.rank) -
            effectiveClosing(b)
        )
    );
  } else if (filters.sort === 'placement') {
    rows.sort(
      (a, b) =>
        Number(b.branch.placement || 0) -
        Number(a.branch.placement || 0)
    );
  } else {
    rows.sort(
      (a, b) => b.overall - a.overall
    );
  }

  return rows;
}

export function summarizeBuckets(rows = []) {
  return rows.reduce(
    (acc, row) => {
      if (row.bucket === 'dream') acc.dream += 1;
      if (row.bucket === 'target') acc.target += 1;
      if (row.bucket === 'safe') acc.safe += 1;
      if (row.bucket === 'backup') acc.backup += 1;

      return acc;
    },
    {
      dream: 0,
      target: 0,
      safe: 0,
      backup: 0,
    }
  );
}

export { BRANCH_LIST, BUCKET_META };