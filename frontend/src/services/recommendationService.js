import { BRANCH_LIST } from '../data/branches';
import { BUCKET_META } from '../data/demoData';
import { API_BASE_URL } from './apiClient';

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function normalizeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function getBucket(rank, closingRank) {
  if (!closingRank || closingRank <= 0) {
    return 'backup';
  }

  const ratio = rank / closingRank;

  /*
   * Better-than-cutoff = safer
   * Near cutoff         = target
   * Slightly beyond     = dream
   */

  if (ratio <= 0.35) return 'backup';
  if (ratio <= 0.65) return 'safe';
  if (ratio <= 0.95) return 'target';
  return 'dream';
}

function getOverallScore(rank, closingRank, preferredBranch) {
  if (!closingRank || closingRank <= 0) {
    return 40;
  }

  const ratio = rank / closingRank;

  const rankScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(100 - Math.abs(ratio - 0.65) * 80)
    )
  );

  const branchScore = preferredBranch ? 95 : 75;

  return Math.max(
    1,
    Math.min(
      100,
      Math.round(
        rankScore * 0.75 +
        branchScore * 0.25
      )
    )
  );
}

/*
|--------------------------------------------------------------------------
| Convert backend result -> existing frontend card structure
|--------------------------------------------------------------------------
*/

function normalizeApiRow(row, profile) {
  const closingRank =
    normalizeNumber(row.closingRank);

  const openingRank =
    normalizeNumber(row.openingRank);

  const preferredBranch =
    Array.isArray(profile.branches) &&
    profile.branches.length > 0
      ? profile.branches.some(
          (name) =>
            String(row.branch_name || '')
              .toLowerCase()
              .includes(String(name).toLowerCase())
        )
      : true;

  const overall = getOverallScore(
    Number(profile.rank),
    closingRank,
    preferredBranch
  );

  const bucket = getBucket(
    Number(profile.rank),
    closingRank
  );

  const college = {
    id: row.college_id,
    name: row.college_name,
    city: row.city || '',
    state: row.state || '',
    type: row.type || 'Government',
  };

  const branch = {
    id: row.branch_id,
    name: row.branch_name,

    /*
     * Your JoSAA API currently does not return fee /
     * placement information, so keep safe defaults.
     */

    fees: 0,
    median: 0,
    average: 0,
    highest: 0,
    placement: 0,

    openingRank,
    closingRank,

    closingRank2026: closingRank,

    year: row.year,
    round: row.round,

    category: row.category,
    quota: row.quota,
    gender: row.gender,

    source: row.source,
    sourced: row.isVerified,
    verificationStatus: row.verificationStatus,
    sourceUrl: row.sourceUrl,
    retrievedAt: row.retrievedAt,
  };

  return {
    collegeId: row.college_id,
    college,
    branch,

    bucket,
    overall,

    breakdown: {
      rank: overall,
      branch: preferredBranch ? 95 : 70,
      budget: 75,
      location: 75,
    },
  };
}

/*
|--------------------------------------------------------------------------
| REAL JO SAA API
|--------------------------------------------------------------------------
*/

export async function fetchCounsellingResults(
  profile
) {
  if (!profile || !profile.rank) {
    return [];
  }

  const params = new URLSearchParams();

  params.set(
    'rank',
    String(profile.rank)
  );

  params.set(
    'category',
    profile.category === 'General'
      ? 'OPEN'
      : profile.category
  );

  params.set(
    'year',
    String(profile.year || 2026)
  );

  params.set(
    'round',
    '1'
  );

  /*
   * Gender mapping
   */

  if (profile.gender) {
    if (
      String(profile.gender)
        .toLowerCase()
        .includes('female')
    ) {
      params.set(
        'gender',
        'Female-only (including Supernumerary)'
      );
    } else {
      params.set(
        'gender',
        'Gender-Neutral'
      );
    }
  }

  /*
   * For now JoSAA IIT results use AI.
   * This can later be extended for NIT HS/OS.
   */

  params.set('quota', 'AI');

  const url =
    `${API_BASE_URL}/counselling/results?${params.toString()}`;

  console.log(
    '[COUNSELLING API]',
    url
  );

  const response =
    await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Counselling API failed: ${response.status}`
    );
  }

  const payload =
    await response.json();

  if (!Array.isArray(payload.data)) {
    return [];
  }

  return payload.data.map(
    (row) =>
      normalizeApiRow(
        row,
        profile
      )
  );
}

/*
|--------------------------------------------------------------------------
| Frontend result generator
|--------------------------------------------------------------------------
*/

export async function computeResults(
  profile
) {
  try {
    const rows =
      await fetchCounsellingResults(
        profile
      );

    return rows.sort(
      (a, b) =>
        b.overall - a.overall
    );

  } catch (error) {
    console.error(
      'Failed to load counselling results:',
      error
    );

    return [];
  }
}

/*
|--------------------------------------------------------------------------
| Filters
|--------------------------------------------------------------------------
*/

export function filterAndSortResults(
  results,
  filters = {},
  profile
) {
  let rows = Array.isArray(results)
    ? [...results]
    : [];

  rows = rows.filter((row) => {

    if (
      filters.branch &&
      filters.branch !== 'All Branches'
    ) {
      if (
        !String(row.branch.name)
          .toLowerCase()
          .includes(
            String(filters.branch).toLowerCase()
          )
      ) {
        return false;
      }
    }

    if (
      filters.state &&
      filters.state !== 'All States' &&
      row.college.state !== filters.state
    ) {
      return false;
    }

    if (
      filters.type &&
      filters.type !== 'All College Types' &&
      filters.type !== 'Both' &&
      row.college.type !== filters.type
    ) {
      return false;
    }

    return true;
  });

  if (filters.sort === 'rank') {
    rows.sort(
      (a, b) =>
        Math.abs(
          Number(profile.rank) -
            Number(a.branch.closingRank)
        ) -
        Math.abs(
          Number(profile.rank) -
            Number(b.branch.closingRank)
        )
    );
  } else if (filters.sort === 'placement') {
    rows.sort(
      (a, b) =>
        Number(b.branch.placement || 0) -
        Number(a.branch.placement || 0)
    );
  } else if (filters.sort === 'fees') {
    rows.sort(
      (a, b) =>
        Number(a.branch.fees || 0) -
        Number(b.branch.fees || 0)
    );
  } else {
    rows.sort(
      (a, b) =>
        b.overall - a.overall
    );
  }

  return rows;
}

/*
|--------------------------------------------------------------------------
| Bucket summary
|--------------------------------------------------------------------------
*/

export function summarizeBuckets(
  rows = []
) {
  return rows.reduce(
    (acc, row) => {

      if (row.bucket === 'dream') {
        acc.dream += 1;
      }

      if (row.bucket === 'target') {
        acc.target += 1;
      }

      if (row.bucket === 'safe') {
        acc.safe += 1;
      }

      if (row.bucket === 'backup') {
        acc.backup += 1;
      }

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

export {
  BRANCH_LIST,
  BUCKET_META
};
