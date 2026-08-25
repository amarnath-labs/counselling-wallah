import { API_BASE_URL } from './apiClient';

import {
  calculatePremiumRecommendation,
} from './premiumRecommendationEngine';

/*
|--------------------------------------------------------------------------
| CATEGORY
|--------------------------------------------------------------------------
*/

function getCategory(category) {
  if (!category) {
    return 'OPEN';
  }

  const value =
    String(category)
      .trim();

  if (
    value === 'General'
  ) {
    return 'OPEN';
  }

  return value;
}

/*
|--------------------------------------------------------------------------
| BUCKET
|--------------------------------------------------------------------------
|
| CURRENT WORKING BUCKET LOGIC
|
| IMPORTANT:
| Keep this unchanged for now so current sorting/filtering
| and existing UI behaviour are not disturbed.
|
|--------------------------------------------------------------------------
*/

function getBucket(
  rank,
  closingRank
) {
  const r =
    Number(rank);

  const c =
    Number(closingRank);

  if (
    !Number.isFinite(r) ||
    !Number.isFinite(c) ||
    c <= 0
  ) {
    return 'backup';
  }

  const ratio =
    r / c;

  if (
    ratio > 1
  ) {
    return 'dream';
  }

  if (
    ratio >= 0.80
  ) {
    return 'target';
  }

  if (
    ratio >= 0.50
  ) {
    return 'safe';
  }

  return 'backup';
}

/*
|--------------------------------------------------------------------------
| OVERALL SCORE
|--------------------------------------------------------------------------
|
| CURRENT WORKING SCORE
|
| Keep this unchanged for now.
| Premium engine has its own separate scoring logic.
|
|--------------------------------------------------------------------------
*/

function getScore(
  rank,
  closingRank
) {
  const r =
    Number(rank);

  const c =
    Number(closingRank);

  if (
    !Number.isFinite(r) ||
    !Number.isFinite(c) ||
    c <= 0
  ) {
    return 50;
  }

  const ratio =
    r / c;

  return Math.max(
    1,
    Math.min(
      99,
      Math.round(
        100 -
          Math.abs(
            ratio - 0.8
          ) *
            40
      )
    )
  );
}

/*
|--------------------------------------------------------------------------
| SAFE NUMBER
|--------------------------------------------------------------------------
*/

function toNumberOrNull(
  value
) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null;
  }

  const number =
    Number(value);

  return Number.isFinite(
    number
  )
    ? number
    : null;
}

/*
|--------------------------------------------------------------------------
| CONVERT API ROW
|--------------------------------------------------------------------------
*/

function convertRow(
  row,
  profile
) {
  const rank =
    toNumberOrNull(
      profile?.rank
    );

  const openingRank =
    toNumberOrNull(
      row?.openingRank ??
      row?.opening_rank
    );

  const closingRank =
    toNumberOrNull(
      row?.closingRank ??
      row?.closing_rank
    );

  /*
  |--------------------------------------------------------------------------
  | EXISTING RESULT STRUCTURE
  |--------------------------------------------------------------------------
  |
  | IMPORTANT:
  | Current website fields remain available:
  |
  | result.bucket
  | result.overall
  | result.breakdown
  |
  |--------------------------------------------------------------------------
  */

  const result = {
    collegeId:
      row?.college_id,

    college: {
      id:
        row?.college_id,

      name:
        row?.college_name ||
        '',

      city:
        row?.city ||
        '',

      state:
        row?.state ||
        '',

      type:
        row?.type ||
        'Government',

      branches: [],
    },

    branch: {
      id:
        row?.branch_id,

      name:
        row?.branch_name ||
        '',

      openingRank,

      closingRank,

      closingRank2026:
        closingRank,

      /*
      |--------------------------------------------------------------------------
      | REAL DATA WHEN AVAILABLE
      |--------------------------------------------------------------------------
      |
      | If backend does not provide a field,
      | keep it null instead of displaying fake zeroes.
      |
      |--------------------------------------------------------------------------
      */

      fees:
        toNumberOrNull(
          row?.fees ??
          row?.annual_fee
        ),

      median:
        toNumberOrNull(
          row?.median_package
        ),

      average:
        toNumberOrNull(
          row?.average_package
        ),

      highest:
        toNumberOrNull(
          row?.highest_package
        ),

      placement:
        toNumberOrNull(
          row?.placement_rate
        ),

      year:
        row?.year,

      round:
        row?.round,

      category:
        row?.category,

      quota:
        row?.quota,

      gender:
        row?.gender,

      source:
        row?.source,

      sourced:
        row?.isVerified,

      verificationStatus:
        row?.verificationStatus,

      sourceUrl:
        row?.sourceUrl,

      retrievedAt:
        row?.retrievedAt,
    },

    /*
    |--------------------------------------------------------------------------
    | CURRENT WORKING ADMISSION FIELDS
    |--------------------------------------------------------------------------
    */

    bucket:
      getBucket(
        rank,
        closingRank
      ),

    overall:
      getScore(
        rank,
        closingRank
      ),

    breakdown: {
      rank:
        getScore(
          rank,
          closingRank
        ),

      branch: 80,

      budget: 80,

      location: 80,
    },
  };

  /*
  |--------------------------------------------------------------------------
  | NEW PREMIUM INTELLIGENCE LAYER
  |--------------------------------------------------------------------------
  |
  | This does NOT overwrite:
  |
  | result.bucket
  | result.overall
  | result.breakdown
  |
  | New data is available under:
  |
  | result.premium.score
  | result.premium.category
  | result.premium.admissionBucket
  | result.premium.breakdown
  | result.premium.historicalFit
  | result.premium.reasons
  |
  |--------------------------------------------------------------------------
  */

  try {
    result.premium =
      calculatePremiumRecommendation(
        result,
        profile
      );
  } catch (error) {
    /*
    |--------------------------------------------------------------------------
    | FAIL-SAFE
    |--------------------------------------------------------------------------
    |
    | If Premium calculation ever fails,
    | current recommendation still works.
    |
    |--------------------------------------------------------------------------
    */

    console.error(
      '[PREMIUM RECOMMENDATION ERROR]',
      {
        collegeId:
          result.collegeId,

        branch:
          result?.branch
            ?.name,

        error,
      }
    );

    result.premium =
      null;
  }

  return result;
}

/*
|--------------------------------------------------------------------------
| FETCH COUNSELLING RESULTS
|--------------------------------------------------------------------------
*/

export async function fetchJosaaResults(
  profile
) {
  /*
  |--------------------------------------------------------------------------
  | BASIC VALIDATION
  |--------------------------------------------------------------------------
  */

  if (
    !profile ||
    !profile.rank
  ) {
    return [];
  }

  /*
  |--------------------------------------------------------------------------
  | IMPORTANT:
  | DO NOT FALL BACK TO JEE MAIN
  |--------------------------------------------------------------------------
  */

  const examId =
    String(
      profile?.examId || ''
    )
      .trim()
      .toLowerCase();

  /*
  |--------------------------------------------------------------------------
  | Missing exam = ERROR
  |--------------------------------------------------------------------------
  */

  if (!examId) {
    throw new Error(
      'Exam ID is missing from profile.'
    );
  }

  console.log(
    '[SERVICE] Exam ID received:',
    profile?.examId
  );

  console.log(
    '[SERVICE] Exam ID used:',
    examId
  );

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
    String(
      profile.rank
    )
  );

  /*
  |--------------------------------------------------------------------------
  | CATEGORY
  |--------------------------------------------------------------------------
  */

  params.set(
    'category',
    getCategory(
      profile.category
    )
  );

  /*
  |--------------------------------------------------------------------------
  | YEAR
  |--------------------------------------------------------------------------
  */

  params.set(
    'year',
    String(
      profile.year ||
        2026
    )
  );

  /*
  |--------------------------------------------------------------------------
  | ROUND
  |--------------------------------------------------------------------------
  */

  params.set(
    'round',
    String(
      profile.round ||
        1
    )
  );

  /*
  |--------------------------------------------------------------------------
  | QUOTA
  |--------------------------------------------------------------------------
  |
  | Do NOT force quota=AI.
  |
  | Only send quota when Profile provides it.
  |--------------------------------------------------------------------------
  */

  if (
    profile?.quota
  ) {
    params.set(
      'quota',
      String(
        profile.quota
      )
    );
  }

  /*
  |--------------------------------------------------------------------------
  | GENDER
  |--------------------------------------------------------------------------
  */

  if (
    profile?.gender
  ) {
    const gender =
      String(
        profile.gender
      )
        .trim()
        .toLowerCase();

    if (
      gender.includes(
        'female'
      )
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

  if (
    profile?.homeState
  ) {
    params.set(
      'homeState',
      String(
        profile.homeState
      )
    );
  }

  /*
  |--------------------------------------------------------------------------
  | API URL
  |--------------------------------------------------------------------------
  */

  const url =
    `${API_BASE_URL}/counselling/results?${params.toString()}`;

  console.log(
    '[COUNSELLING API REQUEST]',
    url
  );

  /*
  |--------------------------------------------------------------------------
  | FETCH
  |--------------------------------------------------------------------------
  */

  let response;

  try {
    response =
      await fetch(
        url
      );
  } catch (error) {
    console.error(
      '[COUNSELLING API NETWORK ERROR]',
      error
    );

    throw new Error(
      'Unable to connect to counselling API.'
    );
  }

  /*
  |--------------------------------------------------------------------------
  | HTTP ERROR
  |--------------------------------------------------------------------------
  */

  if (
    !response.ok
  ) {
    let message =
      `Counselling API returned ${response.status}`;

    try {
      const body =
        await response.json();

      if (
        body?.error
      ) {
        message =
          body.error;
      }
    } catch {
      // Ignore invalid JSON.
    }

    throw new Error(
      message
    );
  }

  /*
  |--------------------------------------------------------------------------
  | RESPONSE JSON
  |--------------------------------------------------------------------------
  */

  const payload =
    await response.json();

  console.log(
    '[COUNSELLING API META]',
    payload?.meta
  );

  /*
  |--------------------------------------------------------------------------
  | INVALID DATA
  |--------------------------------------------------------------------------
  */

  if (
    !Array.isArray(
      payload?.data
    )
  ) {
    return [];
  }

  /*
  |--------------------------------------------------------------------------
  | CONVERT RESPONSE
  |--------------------------------------------------------------------------
  |
  | Backend is responsible for exam-specific
  | IIT / NIT / IIIT / GFTI filtering.
  |
  | We do NOT filter those here.
  |--------------------------------------------------------------------------
  */

  const results =
    payload.data.map(
      (row) =>
        convertRow(
          row,
          profile
        )
    );

  console.log(
    '[SERVICE] Results converted:',
    results.length
  );

  if (
    results.length > 0
  ) {
    console.log(
      '[SERVICE] Sample premium result:',
      {
        college:
          results[0]
            ?.college
            ?.name,

        branch:
          results[0]
            ?.branch
            ?.name,

        currentBucket:
          results[0]
            ?.bucket,

        currentOverall:
          results[0]
            ?.overall,

        premium:
          results[0]
            ?.premium,
      }
    );
  }

  return results;
}