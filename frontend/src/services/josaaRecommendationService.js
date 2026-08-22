import { API_BASE_URL } from './apiClient';

function getCategory(category) {
  if (!category) return 'OPEN';

  const value = String(category).trim();

  return value === 'General'
    ? 'OPEN'
    : value;
}

function getBucket(rank, closingRank) {
  const r = Number(rank);
  const c = Number(closingRank);

  if (
    !Number.isFinite(r) ||
    !Number.isFinite(c) ||
    c <= 0
  ) {
    return 'backup';
  }

  const ratio = r / c;

  if (ratio > 1) return 'dream';
  if (ratio >= 0.80) return 'target';
  if (ratio >= 0.50) return 'safe';

  return 'backup';
}

function getScore(rank, closingRank) {
  const r = Number(rank);
  const c = Number(closingRank);

  if (
    !Number.isFinite(r) ||
    !Number.isFinite(c) ||
    c <= 0
  ) {
    return 50;
  }

  const ratio = r / c;

  return Math.max(
    1,
    Math.min(
      99,
      Math.round(
        100 -
          Math.abs(ratio - 0.8) * 40
      )
    )
  );
}

function convertRow(row, profile) {
  const rank = Number(profile?.rank);

  const openingRank = Number(
    row?.openingRank
  );

  const closingRank = Number(
    row?.closingRank
  );

  return {
    collegeId: row?.college_id,

    college: {
      id: row?.college_id,
      name: row?.college_name || '',
      city: row?.city || '',
      state: row?.state || '',
      type: row?.type || 'Government',
      branches: [],
    },

    branch: {
      id: row?.branch_id,
      name: row?.branch_name || '',

      openingRank,
      closingRank,
      closingRank2026: closingRank,

      fees: null,
      median: null,
      average: null,
      highest: null,
      placement: null,

      year: row?.year,
      round: row?.round,
      category: row?.category,
      quota: row?.quota,
      gender: row?.gender,

      source: row?.source,
      sourced: row?.isVerified,
      verificationStatus:
        row?.verificationStatus,
      sourceUrl: row?.sourceUrl,
      retrievedAt: row?.retrievedAt,
    },

    bucket: getBucket(
      rank,
      closingRank
    ),

    overall: getScore(
      rank,
      closingRank
    ),

    breakdown: {
      rank: getScore(
        rank,
        closingRank
      ),
      branch: 80,
      budget: 80,
      location: 80,
    },
  };
}

export async function fetchJosaaResults(
  profile
) {
  if (!profile?.rank) {
    return [];
  }

  const examId = String(
    profile?.examId || 'jee-main'
  )
    .trim()
    .toLowerCase();

  const params = new URLSearchParams();

  params.set(
    'examId',
    examId
  );

  params.set(
    'rank',
    String(profile.rank)
  );

  params.set(
    'category',
    getCategory(profile.category)
  );

  params.set(
    'year',
    String(profile.year || 2026)
  );

  params.set(
    'round',
    String(profile.round || 1)
  );

  if (profile?.quota) {
    params.set(
      'quota',
      String(profile.quota)
    );
  }

  if (profile?.gender) {
    const gender =
      String(profile.gender)
        .trim()
        .toLowerCase();

    params.set(
      'gender',
      gender.includes('female')
        ? 'Female-only (including Supernumerary)'
        : 'Gender-Neutral'
    );
  }

  if (profile?.homeState) {
    params.set(
      'homeState',
      String(profile.homeState)
    );
  }

  const url =
    `${API_BASE_URL}/counselling/results?${params.toString()}`;

  console.log(
    '[COUNSELLING API REQUEST]',
    url
  );

  const response =
    await fetch(url);

  if (!response.ok) {
    let message =
      `Counselling API returned ${response.status}`;

    try {
      const body =
        await response.json();

      if (body?.error) {
        message = body.error;
      }
    } catch {
      // Ignore invalid JSON.
    }

    throw new Error(message);
  }

  const payload =
    await response.json();

  console.log(
    '[COUNSELLING API META]',
    payload?.meta
  );

  if (
    !Array.isArray(
      payload?.data
    )
  ) {
    return [];
  }

  return payload.data.map(
    (row) =>
      convertRow(
        row,
        profile
      )
  );
}