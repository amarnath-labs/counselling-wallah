import { BRANCH_LIST } from '../data/branches';
import { BUCKET_META } from '../data/demoData';
import { API_BASE_URL } from './apiClient';

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function normalizeNumber(value) {
  const n = Number(value);

  return Number.isFinite(n)
    ? n
    : 0;
}

/*
|--------------------------------------------------------------------------
| IMPORTANT:
| Review / sentiment data must preserve NULL.
|--------------------------------------------------------------------------
*/

function normalizeOptionalNumber(value) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null;
  }

  const n = Number(value);

  return Number.isFinite(n)
    ? n
    : null;
}

/*
|--------------------------------------------------------------------------
| EXISTING BUCKET LOGIC
|--------------------------------------------------------------------------
*/

function getBucket(
  rank,
  closingRank
) {
  if (
    !closingRank ||
    closingRank <= 0
  ) {
    return 'backup';
  }

  const ratio =
    rank / closingRank;

  /*
   * Existing behaviour preserved.
   */

  if (ratio <= 0.35) {
    return 'backup';
  }

  if (ratio <= 0.65) {
    return 'safe';
  }

  if (ratio <= 0.95) {
    return 'target';
  }

  return 'dream';
}

/*
|--------------------------------------------------------------------------
| EXISTING OVERALL SCORE
|--------------------------------------------------------------------------
*/

function getOverallScore(
  rank,
  closingRank,
  preferredBranch
) {
  if (
    !closingRank ||
    closingRank <= 0
  ) {
    return 40;
  }

  const ratio =
    rank / closingRank;

  const rankScore =
    Math.max(
      0,
      Math.min(
        100,
        Math.round(
          100 -
          Math.abs(
            ratio - 0.65
          ) * 80
        )
      )
    );

  const branchScore =
    preferredBranch
      ? 95
      : 75;

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
| BACKEND RESULT -> FRONTEND CARD STRUCTURE
|--------------------------------------------------------------------------
*/

function normalizeApiRow(
  row,
  profile
) {
  const closingRank =
    normalizeNumber(
      row.closingRank
    );

  const openingRank =
    normalizeNumber(
      row.openingRank
    );

  /*
  |--------------------------------------------------------------------------
  | BRANCH PREFERENCE
  |--------------------------------------------------------------------------
  */

  const preferredBranch =
    Array.isArray(
      profile?.branches
    ) &&
    profile.branches.length > 0
      ? profile.branches.some(
          (name) =>
            String(
              row.branch_name || ''
            )
              .toLowerCase()
              .includes(
                String(name)
                  .toLowerCase()
              )
        )
      : true;

  /*
  |--------------------------------------------------------------------------
  | EXISTING NON-PREMIUM SCORE
  |--------------------------------------------------------------------------
  */

  const overall =
    getOverallScore(
      Number(
        profile?.rank
      ),
      closingRank,
      preferredBranch
    );

  const bucket =
    getBucket(
      Number(
        profile?.rank
      ),
      closingRank
    );

  /*
  |--------------------------------------------------------------------------
  | REVIEW + SENTIMENT DATA
  |--------------------------------------------------------------------------
  |
  | These values come from:
  |
  | college_sentiment_summary
  |        â†“
  | counselling backend API
  |        â†“
  | recommendationService
  |
  | Missing review data MUST stay null.
  |--------------------------------------------------------------------------
  */

  const reviewScore =
    normalizeOptionalNumber(
      row.reviewScore
    );

  const analyzedReviews =
    normalizeOptionalNumber(
      row.analyzedReviews
    );

  const reviewConfidence =
    normalizeOptionalNumber(
      row.reviewConfidence
    );

  const overallSentiment =
    normalizeOptionalNumber(
      row.overallSentiment
    );

  /*
  |--------------------------------------------------------------------------
  | SOURCE SENTIMENT
  |--------------------------------------------------------------------------
  */

  const googleSentiment =
    normalizeOptionalNumber(
      row.googleSentiment
    );

  const redditSentiment =
    normalizeOptionalNumber(
      row.redditSentiment
    );

  const quoraSentiment =
    normalizeOptionalNumber(
      row.quoraSentiment
    );

  /*
  |--------------------------------------------------------------------------
  | TOPIC SENTIMENT
  |--------------------------------------------------------------------------
  */

  const placementSentiment =
    normalizeOptionalNumber(
      row.placementSentiment
    );

  const facultySentiment =
    normalizeOptionalNumber(
      row.facultySentiment
    );

  const campusSentiment =
    normalizeOptionalNumber(
      row.campusSentiment
    );

  const hostelSentiment =
    normalizeOptionalNumber(
      row.hostelSentiment
    );

  const infrastructureSentiment =
    normalizeOptionalNumber(
      row.infrastructureSentiment
    );

  /*
   * Fees / ROI sentiment
   */

  const feeRoiSentiment =
    normalizeOptionalNumber(
      row.feeRoiSentiment
    );

  /*
  |--------------------------------------------------------------------------
  | GOOGLE METADATA
  |--------------------------------------------------------------------------
  */

  const googleRating =
    normalizeOptionalNumber(
      row.googleRating
    );

  const googleReviewCount =
    normalizeOptionalNumber(
      row.googleReviewCount
    );

  /*
  |--------------------------------------------------------------------------
  | COLLEGE
  |--------------------------------------------------------------------------
  */

  const college = {
    id:
      row.college_id,

    name:
      row.college_name,

    city:
      row.city || '',

    state:
      row.state || '',

    type:
      row.type ||
      'Government',

    /*
     * Review summary
     */

    reviewScore,
    analyzedReviews,
    reviewConfidence,
    overallSentiment,

    /*
     * Topic sentiment
     */

    placementSentiment,
    facultySentiment,
    campusSentiment,
    hostelSentiment,
    infrastructureSentiment,
    feeRoiSentiment,

    /*
     * Source sentiment
     */

    googleSentiment,
    redditSentiment,
    quoraSentiment,

    /*
     * Google metadata
     */

    googleRating,
    googleReviewCount,
  };

  /*
  |--------------------------------------------------------------------------
  | BRANCH
  |--------------------------------------------------------------------------
  */

  const branch = {
    id:
      row.branch_id,

    name:
      row.branch_name,

    /*
     * Existing safe defaults preserved.
     *
     * Do not replace these with review sentiment.
     */

    fees: 0,
    median: 0,
    average: 0,
    highest: 0,
    placement: 0,

    /*
     * Cutoffs
     */

    openingRank,
    closingRank,

    closingRank2026:
      closingRank,

    year:
      row.year,

    round:
      row.round,

    category:
      row.category,

    quota:
      row.quota,

    gender:
      row.gender,

    /*
     * Provenance
     */

    source:
      row.source,

    sourced:
      row.isVerified,

    verificationStatus:
      row.verificationStatus,

    sourceUrl:
      row.sourceUrl,

    retrievedAt:
      row.retrievedAt,
  };

  /*
  |--------------------------------------------------------------------------
  | FINAL FRONTEND RESULT
  |--------------------------------------------------------------------------
  */

  return {
    collegeId:
      row.college_id,

    college,

    branch,

    /*
     * Existing values
     */

    bucket,
    overall,

    /*
    |--------------------------------------------------------------------------
    | REVIEW DATA AT TOP LEVEL
    |--------------------------------------------------------------------------
    |
    | Premium engine can read these directly.
    |--------------------------------------------------------------------------
    */

    reviewScore,
    analyzedReviews,
    reviewConfidence,
    overallSentiment,

    /*
     * Topic sentiment
     */

    placementSentiment,
    facultySentiment,
    campusSentiment,
    hostelSentiment,
    infrastructureSentiment,
    feeRoiSentiment,

    /*
     * Source sentiment
     */

    googleSentiment,
    redditSentiment,
    quoraSentiment,

    /*
     * Google metadata
     */

    googleRating,
    googleReviewCount,

    /*
    |--------------------------------------------------------------------------
    | EXISTING BREAKDOWN + REVIEWS
    |--------------------------------------------------------------------------
    */

    breakdown: {
      rank:
        overall,

      branch:
        preferredBranch
          ? 95
          : 70,

      budget:
        75,

      location:
        75,

      /*
       * Actual backend review score.
       *
       * Reviewed:
       *   78.77 -> 78.77
       *
       * Missing:
       *   null -> null
       */

      reviews:
        reviewScore,
    },
  };
}

/*
|--------------------------------------------------------------------------
| REAL COUNSELLING API
|--------------------------------------------------------------------------
*/

export async function fetchCounsellingResults(
  profile
) {
  if (
    !profile ||
    !profile.rank
  ) {
    return [];
  }

  const params =
    new URLSearchParams();

  /*
  |--------------------------------------------------------------------------
  | EXAM
  |--------------------------------------------------------------------------
  */

  const examId =
    profile.examId ||
    profile.exam_id ||
    profile.exam ||
    'jee-main';

  params.set(
    'examId',
    String(examId)
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
    profile.category ===
      'General'
      ? 'OPEN'
      : (
          profile.category ||
          'OPEN'
        )
  );

  /*
  |--------------------------------------------------------------------------
  | YEAR
  |--------------------------------------------------------------------------
  |
  | UPTAC currently uses imported 2025 cutoff data.
  | Existing JoSAA default remains 2026.
  |--------------------------------------------------------------------------
  */

  const normalizedExam =
    String(examId)
      .trim()
      .toLowerCase();

  const defaultYear =
    normalizedExam ===
      'uptac'
      ? 2025
      : 2026;

  params.set(
    'year',
    String(
      profile.year ||
      defaultYear
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
  | GENDER
  |--------------------------------------------------------------------------
  */

  if (
    profile.gender
  ) {
    if (
      normalizedExam ===
      'uptac'
    ) {
      params.set(
        'gender',
        String(
          profile.gender
        )
      );

    } else if (
      String(
        profile.gender
      )
        .toLowerCase()
        .includes(
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
  | QUOTA
  |--------------------------------------------------------------------------
  */

  /*
  |--------------------------------------------------------------------------
  | QUOTA / HOME-STATE ELIGIBILITY
  |--------------------------------------------------------------------------
  |
  | JEE Main:
  | HS / OS must be derived automatically from homeState.
  | Do NOT force AI when homeState exists.
  |
  | Explicit special quota can still be sent.
  |--------------------------------------------------------------------------
  */

  const normalizedQuota =
    String(
      profile.quota || ''
    )
      .trim()
      .toUpperCase();

  const automaticJosaaQuotas =
    new Set([
      '',
      'AI',
      'HS',
      'OS',
      'ALL INDIA',
      'HOME STATE',
      'OTHER STATE',
    ]);

  const useAutomaticHomeStateQuota =
    normalizedExam === 'jee-main' &&
    Boolean(profile.homeState) &&
    automaticJosaaQuotas.has(
      normalizedQuota
    );

  if (
    profile.quota &&
    !useAutomaticHomeStateQuota
  ) {
    params.set(
      'quota',
      String(
        profile.quota
      )
    );
  }

  /*
   * IMPORTANT:
   * No default quota=AI for JEE Main.
   * Backend derives HS/OS from homeState.
   */

  /*
  |--------------------------------------------------------------------------
  | HOME STATE
  |--------------------------------------------------------------------------
  */

  if (
    profile.homeState
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
  | REQUEST
  |--------------------------------------------------------------------------
  */

  const url =
    `${API_BASE_URL}/counselling/results?${params.toString()}`;

  console.log(
    '[COUNSELLING API]',
    url
  );

  const response =
    await fetch(
      url
    );

  if (
    !response.ok
  ) {
    throw new Error(
      `Counselling API failed: ${response.status}`
    );
  }

  const payload =
    await response.json();

  if (
    !Array.isArray(
      payload.data
    )
  ) {
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
| FRONTEND RESULT GENERATOR
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
        b.overall -
        a.overall
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
| FILTERS
|--------------------------------------------------------------------------
*/

export function filterAndSortResults(
  results,
  filters = {},
  profile
) {
  let rows =
    Array.isArray(
      results
    )
      ? [...results]
      : [];

  rows =
    rows.filter(
      (row) => {
        /*
         * Branch
         */

        if (
          filters.branch &&
          filters.branch !==
            'All Branches'
        ) {
          if (
            !String(
              row.branch.name
            )
              .toLowerCase()
              .includes(
                String(
                  filters.branch
                )
                  .toLowerCase()
              )
          ) {
            return false;
          }
        }

        /*
         * State
         */

        if (
          filters.state &&
          filters.state !==
            'All States' &&
          row.college.state !==
            filters.state
        ) {
          return false;
        }

        /*
         * College type
         */

        if (
          filters.type &&
          filters.type !==
            'All College Types' &&
          filters.type !==
            'Both' &&
          row.college.type !==
            filters.type
        ) {
          return false;
        }

        return true;
      }
    );

  /*
  |--------------------------------------------------------------------------
  | SORTING
  |--------------------------------------------------------------------------
  */

  if (
    filters.sort ===
    'rank'
  ) {
    rows.sort(
      (a, b) =>
        Math.abs(
          Number(
            profile.rank
          ) -
          Number(
            a.branch
              .closingRank
          )
        ) -
        Math.abs(
          Number(
            profile.rank
          ) -
          Number(
            b.branch
              .closingRank
          )
        )
    );

  } else if (
    filters.sort ===
    'placement'
  ) {
    rows.sort(
      (a, b) =>
        Number(
          b.branch
            .placement || 0
        ) -
        Number(
          a.branch
            .placement || 0
        )
    );

  } else if (
    filters.sort ===
    'fees'
  ) {
    rows.sort(
      (a, b) =>
        Number(
          a.branch
            .fees || 0
        ) -
        Number(
          b.branch
            .fees || 0
        )
    );

  } else {
    rows.sort(
      (a, b) => {
        const aRank =
          Number(
            a?.college?.nirfRank
          );

        const bRank =
          Number(
            b?.college?.nirfRank
          );

        const aValid =
          Number.isFinite(
            aRank
          ) &&
          aRank > 0;

        const bValid =
          Number.isFinite(
            bRank
          ) &&
          bRank > 0;

        if (
          aValid &&
          bValid &&
          aRank !== bRank
        ) {
          return (
            aRank -
            bRank
          );
        }

        if (
          aValid &&
          !bValid
        ) {
          return -1;
        }

        if (
          !aValid &&
          bValid
        ) {
          return 1;
        }

        return (
          Number(
            b?.overall || 0
          ) -
          Number(
            a?.overall || 0
          )
        );
      }
    );
  }

  return rows;
}

/*
|--------------------------------------------------------------------------
| BUCKET SUMMARY
|--------------------------------------------------------------------------
*/

export function summarizeBuckets(
  rows = []
) {
  return rows.reduce(
    (acc, row) => {
      if (
        row.bucket ===
        'dream'
      ) {
        acc.dream += 1;
      }

      if (
        row.bucket ===
        'target'
      ) {
        acc.target += 1;
      }

      if (
        row.bucket ===
        'safe'
      ) {
        acc.safe += 1;
      }

      if (
        row.bucket ===
        'backup'
      ) {
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

/*
|--------------------------------------------------------------------------
| EXPORTS
|--------------------------------------------------------------------------
*/

export {
  BRANCH_LIST,
  BUCKET_META,
};
