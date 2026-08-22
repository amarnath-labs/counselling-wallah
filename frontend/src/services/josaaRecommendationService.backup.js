import { API_BASE_URL } from './apiClient';

/*
|--------------------------------------------------------------------------
| CATEGORY
|--------------------------------------------------------------------------
*/

function getCategory(category) {
  if (!category) {
    return 'OPEN';
  }

  const value = String(category).trim();

  if (value === 'General') {
    return 'OPEN';
  }

  return value;
}


/*
|--------------------------------------------------------------------------
| BUCKET
|--------------------------------------------------------------------------
|
| Original recommendation logic
|
*/

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

  if (ratio > 1) {
    return 'dream';
  }

  if (ratio >= 0.80) {
    return 'target';
  }

  if (ratio >= 0.50) {
    return 'safe';
  }

  return 'backup';
}


/*
|--------------------------------------------------------------------------
| OVERALL SCORE
|--------------------------------------------------------------------------
*/

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


/*
|--------------------------------------------------------------------------
| CONVERT BACKEND ROW
|--------------------------------------------------------------------------
*/

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


/*
|--------------------------------------------------------------------------
| JOOSAA SUPPORTED EXAMS
|--------------------------------------------------------------------------
*/

const JOSAA_EXAMS = new Set([
  'jee-main',
  'jee-advanced',
]);


/*
|--------------------------------------------------------------------------
| FETCH RESULTS
|--------------------------------------------------------------------------
*/

export async function fetchJosaaResults(profile) {
  if (!profile?.rank) {
    return [];
  }

  /*
  |--------------------------------------------------------------------------
  | IMPORTANT:
  | Always get examId from profile.
  |--------------------------------------------------------------------------
  */

  const examId = String(
    profile?.examId || 'jee-main'
  )
    .trim()
    .toLowerCase();

  /*
  |--------------------------------------------------------------------------
  | Do not use JoSAA data for other exams
  |--------------------------------------------------------------------------
  */

  if (!JOSAA_EXAMS.has(examId)) {
    console.log(
      '[COUNSELLING] No JoSAA dataset for:',
      examId
    );

    return [];
  }


  /*
  |--------------------------------------------------------------------------
  | QUERY PARAMETERS
  |--------------------------------------------------------------------------
  */

  const params =
    new URLSearchParams();


  /*
  |--------------------------------------------------------------------------
  | EXAM ID
  |--------------------------------------------------------------------------
  |
  | THIS IS THE IMPORTANT FIX.
  |
  */

  params.set(
    'examId',
    examId
  );


  /*
  |--------------------------------------------------------------------------
  | RANK
  |--------------------------------------------------------------------------
  */

  params.set(
    'rank',
    String(profile.rank)
  );


  /*
  |--------------------------------------------------------------------------
  | CATEGORY
  |--------------------------------------------------------------------------
  */

  params.set(
    'category',
    getCategory(profile.category)
  );


  /*
  |--------------------------------------------------------------------------
  | YEAR
  |--------------------------------------------------------------------------
  */

  params.set(
    'year',
    String(profile.year || 2026)
  );


  /*
  |--------------------------------------------------------------------------
  | ROUND
  |--------------------------------------------------------------------------
  */

  params.set(
    'round',
    String(profile.round || 1)
  );


  /*
  |--------------------------------------------------------------------------
  | QUOTA
  |--------------------------------------------------------------------------
  |
  | NEVER FORCE AI.
  |
  */

  if (profile?.quota) {
    params.set(
      'quota',
      String(profile.quota)
    );
  }


  /*
  |--------------------------------------------------------------------------
  | GENDER
  |--------------------------------------------------------------------------
  */

  if (profile?.gender) {
    const gender =
      String(profile.gender)
        .trim()
        .toLowerCase();

    if (
      gender.includes('female')
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
  |--------------------------------------------------------------------------
  | HOME STATE
  |--------------------------------------------------------------------------
  */

  if (profile?.homeState) {
    params.set(
      'homeState',
      String(profile.homeState)
    );
  }


  /*
  |--------------------------------------------------------------------------
  | FINAL API URL
  |--------------------------------------------------------------------------
  */

  const url =
    `${API_BASE_URL}/counselling/results?${params.toString()}`;


  console.log(
    '[JOSAA API REQUEST]',
    url
  );


  /*
  |--------------------------------------------------------------------------
  | REQUEST
  |--------------------------------------------------------------------------
  */

  const response =
    await fetch(url);


  /*
  |--------------------------------------------------------------------------
  | ERROR
  |--------------------------------------------------------------------------
  */

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
      // Ignore invalid JSON response.
    }

    throw new Error(message);
  }


  /*
  |--------------------------------------------------------------------------
  | RESPONSE
  |--------------------------------------------------------------------------
  */

  const payload =
    await response.json();


  console.log(
    '[JOSAA API RESULTS]',
    payload?.meta
  );


  if (
    !Array.isArray(
      payload?.data
    )
  ) {
    return [];
  }


  /*
  |--------------------------------------------------------------------------
  | RAW ROWS
  |--------------------------------------------------------------------------
  */

  let rows = [
    ...payload.data,
  ];


  /*
  |--------------------------------------------------------------------------
  | JEE MAIN FRONTEND SAFETY
  |--------------------------------------------------------------------------
  |
  | JEE Main:
  | NIT   ✅
  | IIIT  ✅
  | GFTI  ✅
  | IIT   ❌
  |
  */

  if (
    examId === 'jee-main'
  ) {
    rows = rows.filter(
      (row) => {
        const type =
          String(
            row?.type || ''
          )
            .trim()
            .toLowerCase();

        const name =
          String(
            row?.college_name || ''
          )
            .trim()
            .toLowerCase();

        const isIIT =
          type === 'iit' ||
          name.includes(
            'indian institute of technology'
          ) ||
          name.startsWith('iit ');

        if (isIIT) {
          return false;
        }

        return (
          type === 'nit' ||
          type === 'iiit' ||
          type === 'gfti' ||
          type === 'gftis' ||
          name.startsWith(
            'national institute of technology'
          ) ||
          name.includes(
            'indian institute of information technology'
          )
        );
      }
    );
  }


  /*
  |--------------------------------------------------------------------------
  | JEE ADVANCED FRONTEND SAFETY
  |--------------------------------------------------------------------------
  |
  | JEE Advanced:
  | IIT only ✅
  | IIIT ❌
  | NIT ❌
  | GFTI ❌
  |
  */

  if (
    examId === 'jee-advanced'
  ) {
    rows = rows.filter(
      (row) => {
        const type =
          String(
            row?.type || ''
          )
            .trim()
            .toLowerCase();

        const name =
          String(
            row?.college_name || ''
          )
            .trim()
            .toLowerCase();

        const isIIT =
          type === 'iit' ||
          name.startsWith(
            'indian institute of technology'
          );

        const isIIIT =
          type === 'iiit' ||
          name.includes(
            'indian institute of information technology'
          );

        const isNIT =
          type === 'nit' ||
          name.startsWith(
            'national institute of technology'
          );

        const isGFTI =
          type === 'gfti' ||
          type === 'gftis';

        return (
          isIIT &&
          !isIIIT &&
          !isNIT &&
          !isGFTI
        );
      }
    );
  }


  /*
  |--------------------------------------------------------------------------
  | CONVERT TO FRONTEND FORMAT
  |--------------------------------------------------------------------------
  */

  return rows.map(
    (row) =>
      convertRow(
        row,
        profile
      )
  );
}