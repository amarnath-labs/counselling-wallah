const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:4000/api';

async function request(path) {
  const response = await fetch(
    `${API_BASE}${path}`
  );

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(
      data?.error ||
      `API request failed: ${response.status}`
    );
  }

  return data;
}

export async function getCounsellingEvents(examId) {
  const params = new URLSearchParams();

  if (examId) {
    params.set('examId', examId);
  }

  const query = params.toString();

  const response = await request(
    `/counselling/events${
      query ? `?${query}` : ''
    }`
  );

  return response?.data || [];
}

/*
|--------------------------------------------------------------------------
| Convert backend UPTAC flat rows into the structure
| expected by Results.jsx / recommendationService.js
|--------------------------------------------------------------------------
*/

function normalizeUptacRow(row, profile = {}) {
  const rank = Number(
    profile.rank || 0
  );

  const closingRank = Number(
    row.closingRank || 0
  );

  const openingRank = Number(
    row.openingRank || 0
  );

  const fees = Number(
    row.fees || 0
  );

  const medianPackage = Number(
    row.medianPackage || 0
  );

  const averagePackage = Number(
    row.averagePackage || 0
  );

  const highestPackage = Number(
    row.highestPackage || 0
  );

  /*
   * Rank bucket
   */
  let bucket = 'dream';

  if (
    closingRank > 0 &&
    rank > 0
  ) {
    const ratio =
      rank / closingRank;

    if (ratio <= 0.35) {
      bucket = 'backup';
    } else if (ratio <= 0.65) {
      bucket = 'safe';
    } else if (ratio <= 0.95) {
      bucket = 'target';
    } else {
      bucket = 'dream';
    }
  }

  /*
   * Branch matching
   */
  const branchName =
    String(
      row.branch_name || ''
    );

  const preferredBranches =
    Array.isArray(profile.branches)
      ? profile.branches
      : [];

  const branchLower =
    branchName.toLowerCase();

  const branchMatches =
    preferredBranches.length === 0 ||
    preferredBranches.some(
      (branch) => {
        const b =
          String(branch || '')
            .toLowerCase();

        if (
          b === 'cse' ||
          b === 'computer science'
        ) {
          return (
            branchLower.includes(
              'computer science'
            )
          );
        }

        if (b === 'it') {
          return (
            branchLower.includes(
              'information technology'
            )
          );
        }

        if (b === 'ece') {
          return (
            branchLower.includes(
              'electronics'
            ) &&
            branchLower.includes(
              'communication'
            )
          );
        }

        if (b === 'ee') {
          return (
            branchLower.includes(
              'electrical engineering'
            )
          );
        }

        if (b === 'me') {
          return (
            branchLower.includes(
              'mechanical engineering'
            )
          );
        }

        return branchLower.includes(b);
      }
    );

  const branchScore =
    branchMatches
      ? 95
      : 62;

  /*
   * Rank score
   */
  let rankScore = 70;

  if (
    rank > 0 &&
    closingRank > 0
  ) {
    const ratio =
      rank / closingRank;

    rankScore = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          100 -
            Math.abs(
              ratio - 0.6
            ) *
              70
        )
      )
    );
  }

  /*
   * Budget score
   *
   * UPTAC API currently does not
   * provide branch fees in the
   * cutoff response.
   */
  const budget =
    Number(
      profile.budget || 0
    );

  const budgetScore =
    budget <= 0
      ? 75
      : fees <= 0
      ? 75
      : fees <= budget
      ? 92
      : fees <= budget * 1.25
      ? 68
      : 40;

  /*
   * Location score
   */
  const preferredState =
    profile.prefState || '';

  const homeState =
    profile.homeState || '';

  let locationScore = 82;

  if (
    preferredState &&
    preferredState !== 'Any'
  ) {
    locationScore =
      String(row.state || '')
        .toLowerCase() ===
      String(preferredState)
        .toLowerCase()
        ? 96
        : 60;
  } else if (
    homeState &&
    String(row.state || '')
      .toLowerCase() ===
      String(homeState)
        .toLowerCase()
  ) {
    locationScore = 96;
  }

  const overall = Math.round(
    rankScore * 0.4 +
    branchScore * 0.25 +
    budgetScore * 0.2 +
    locationScore * 0.15
  );

  return {
    collegeId:
      row.college_id,

    college: {
      id:
        row.college_id,

      name:
        row.college_name ||
        'Unknown College',

      city:
        row.city ||
        '',

      state:
        row.state ||
        '',

      type:
        row.type ||
        'Unknown',
    },

    branch: {
      id:
        row.branch_id,

      name:
        branchName,

      openingRank:
        openingRank,

      closingRank:
        closingRank,

      fees:
        fees,

      medianPackage:
        medianPackage,

      averagePackage:
        averagePackage,

      highestPackage:
        highestPackage,

      placement:
        Number(
          row.placementRate ||
          row.placement_rate ||
          0
        ),
    },

    bucket,

    overall,

    breakdown: {
      rank:
        rankScore,

      branch:
        branchScore,

      budget:
        budgetScore,

      location:
        locationScore,
    },

    /*
     * Keep original UPTAC data
     * available for the UI/debugging.
     */
    counselling: {
      year:
        Number(row.year || 2025),

      round:
        row.round,

      category:
        row.category,

      quota:
        row.quota,

      gender:
        row.gender,

      openingRank:
        openingRank,

      closingRank:
        closingRank,

      source:
        row.source,

      isVerified:
        Boolean(row.isVerified),

      verificationStatus:
        row.verificationStatus,

      sourceUrl:
        row.sourceUrl,

      retrievedAt:
        row.retrievedAt,
    },
  };
}

export async function getCounsellingResults({
  examId = 'jee-main',
  rank,
  category = 'OPEN',
  year,
  round = 1,
  quota,
  gender,
  homeState,
  profile,
}) {
  if (
    rank === undefined ||
    rank === null ||
    rank === ''
  ) {
    throw new Error(
      'Rank is required'
    );
  }

  const params =
    new URLSearchParams();

  params.set(
    'examId',
    examId
  );

  params.set(
    'rank',
    String(rank)
  );

  params.set(
    'category',
    category
  );

  params.set(
    'year',
    String(
      year ||
      (examId === 'uptac'
        ? 2025
        : 2026)
    )
  );

  params.set(
    'round',
    String(round)
  );

  /*
   * IMPORTANT:
   *
   * Do not send gender/homeState
   * as exact backend filters for
   * UPTAC here.
   *
   * UPTAC cutoff rows can contain
   * Gender-Neutral/Female rows and
   * Home State/All India rows.
   *
   * Backend already returns eligible
   * cutoff records.
   */
  if (
    examId !== 'uptac'
  ) {
    if (quota) {
      params.set(
        'quota',
        quota
      );
    }

    if (gender) {
      params.set(
        'gender',
        gender
      );
    }

    if (homeState) {
      params.set(
        'homeState',
        homeState
      );
    }
  }

  return request(
    `/counselling/results?${params.toString()}`
  );
}

export async function fetchCounsellingResults(
  options = {}
) {
  const response =
    await getCounsellingResults(
      options
    );

  /*
   * Backend UPTAC response:
   *
   * {
   *   data: [ ...rows ],
   *   meta: { ... }
   * }
   *
   * Return the actual rows array to
   * useAppState.jsx.
   */

  let rawRows = [];

  if (Array.isArray(response)) {
    rawRows = response;
  } else if (
    response &&
    Array.isArray(response.data)
  ) {
    rawRows = response.data;
  } else if (
    response &&
    Array.isArray(response.rows)
  ) {
    rawRows = response.rows;
  } else if (
    response &&
    response.data &&
    Array.isArray(response.data.data)
  ) {
    rawRows = response.data.data;
  }

  console.log(
    '[UPTAC] API response:',
    response
  );

  console.log(
    '[UPTAC] Raw API rows:',
    rawRows.length
  );

  /*
   * UPTAC rows returned by backend are
   * already filtered for rank/category/
   * year/round.
   *
   * Only normalize their shape for the
   * frontend.
   */

  if (
    String(
      options.examId || ''
    ).toLowerCase() === 'uptac'
  ) {
    const normalized =
      rawRows
        .map((row) =>
          normalizeUptacRow(
            row,
            options
          )
        )
        .filter(Boolean);

    console.log(
      '[UPTAC] Normalized rows:',
      normalized.length
    );

    console.log(
      '[UPTAC] First normalized row:',
      normalized[0]
    );

    return normalized;
  }

  return rawRows;
}
export async function fetchCounsellingEvents(
  examId
) {
  return getCounsellingEvents(
    examId
  );
}

export function getDocuments(
  profile,
  examName
) {
  return [
    'Class 10 Certificate & Marksheet',

    'Class 12 Certificate & Marksheet',

    `${examName} Rank / Score Card`,

    profile?.category !== 'General'
      ? `${profile?.category} Category Certificate`
      : null,

    'Domicile / Residence Certificate',

    'Income Certificate (if applicable)',

    'Government ID Proof (Aadhaar/Passport)',

    'Passport-size Photographs (multiple)',

    'Medical Fitness Certificate (where required)',
  ].filter(Boolean);
}




