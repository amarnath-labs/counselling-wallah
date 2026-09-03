import { API_BASE_URL } from './apiClient';

const WEIGHTS = Object.freeze({
  admission: 50,
  branch: 15,
  quality: 15,
  reviews: 10,
  budget: 7,
  location: 3,
});

function optionalNumber(value) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}

function weightedPart(score, weight) {
  const value = optionalNumber(score);

  if (value === null) {
    return null;
  }

  return Number(
    (
      (Math.max(0, Math.min(100, value)) / 100) *
      weight
    ).toFixed(4)
  );
}

function normalizeBucket(value) {
  const key = String(value || '')
    .trim()
    .toLowerCase();

  if (
    key === 'dream' ||
    key === 'target' ||
    key === 'safe' ||
    key === 'backup'
  ) {
    return key;
  }

  return 'target';
}

function buildReasons(row) {
  const factors = [
    ['Admission Fit', row?.admission],
    ['Branch Match', row?.branchFit],
    ['College Quality', row?.quality],
    ['Student Reviews', row?.reviews],
    ['Budget', row?.budget],
    ['Location', row?.location],
  ];

  const available = factors
    .filter(([, factor]) =>
      factor?.status === 'AVAILABLE' &&
      optionalNumber(factor?.score) !== null
    )
    .map(([name, factor]) => ({
      name,
      score: Number(factor.score),
    }));

  const strong = [...available]
    .filter((item) => item.score >= 75)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(
      (item) =>
        `${item.name}: ${Math.round(item.score)}/100`
    );

  const weak = [...available]
    .filter((item) => item.score < 70)
    .sort((a, b) => a.score - b.score)
    .slice(0, 4)
    .map(
      (item) =>
        `${item.name}: ${Math.round(item.score)}/100`
    );

  const missing = factors
    .filter(
      ([, factor]) =>
        !factor ||
        factor.status === 'UNAVAILABLE'
    )
    .map(
      ([name]) =>
        `${name}: verified data unavailable`
    )
    .slice(0, 4);

  return {
    strong,
    weak,
    missing,
  };
}

export function adaptCWRecRow(row) {
  const admissionScore =
    optionalNumber(row?.admission?.score);

  const branchScore =
    optionalNumber(row?.branchFit?.score);

  const qualityScore =
    optionalNumber(row?.quality?.score);

  const reviewScore =
    optionalNumber(row?.reviews?.score);

  const budgetScore =
    optionalNumber(row?.budget?.score);

  const locationScore =
    row?.location?.status === 'AVAILABLE'
      ? optionalNumber(row?.location?.score)
      : null;

  const bucket =
    normalizeBucket(
      row?.admission?.bucket
    );

  return {
    ...row,

    cwRecAuthoritative:
      true,

    reviewIntelligenceV3:
      row?.reviewIntelligenceV3 ??
      null,

    collegeId:
      row?.collegeId,

    college: {
      id:
        row?.collegeId,

      name:
        row?.collegeName || 'College',

      city:
        row?.city || '',

      state:
        row?.state || '',

      type:
        row?.collegeType || '',
    },

    branch: {
      id:
        row?.branchId,

      name:
        row?.branchName || 'Branch',

      openingRank:
        optionalNumber(
          row?.openingRank
        ),

      closingRank:
        optionalNumber(
          row?.closingRank
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

      sourceUrl:
        row?.sourceUrl,

      sourced:
        Boolean(
          row?.isVerified
        ),

      verificationStatus:
        row?.verificationStatus,
    },

    bucket,

    overall:
      optionalNumber(
        row?.matchScore
      ) ?? 0,

    premium: {
      score:
        optionalNumber(
          row?.matchScore
        ),

      finalScore:
        optionalNumber(
          row?.matchScore
        ),

      matchCategory:
        row?.matchCategory || null,

      confidenceScore:
        optionalNumber(
          row?.confidenceScore
        ),

      confidenceLabel:
        row?.confidenceLabel || null,

      dataCoverage:
        optionalNumber(
          row?.dataCoverage
        ),

      admissionBucket: {
        key: bucket,

        label:
          row?.admission?.bucket ||
          'Admission Fit',
      },

      breakdown: {
        rank:
          weightedPart(
            admissionScore,
            WEIGHTS.admission
          ),

        branch:
          weightedPart(
            branchScore,
            WEIGHTS.branch
          ),

        quality:
          weightedPart(
            qualityScore,
            WEIGHTS.quality
          ),

        reviews:
          weightedPart(
            reviewScore,
            WEIGHTS.reviews
          ),

        budget:
          weightedPart(
            budgetScore,
            WEIGHTS.budget
          ),

        location:
          weightedPart(
            locationScore,
            WEIGHTS.location
          ),
      },

      rawFactorScores: {
        admission:
          admissionScore,

        branch:
          branchScore,

        quality:
          qualityScore,

        reviews:
          reviewScore,

        budget:
          budgetScore,

        location:
          locationScore,
      },

      reasons:
        buildReasons(row),

      historicalFit: {
        label:
          row?.admission?.medianClosingRank
            ? `Historical closing-rank fit based on ${Number(
                row.admission.medianClosingRank
              ).toLocaleString('en-IN')}.`
            : null,

        studentRank:
          optionalNumber(
            row?.adaptedInput
              ?.studentRank
          ),

        closingRank:
          optionalNumber(
            row?.admission
              ?.medianClosingRank
          ),

        relativeMargin:
          optionalNumber(
            row?.admission
              ?.relativeMargin
          ),
      },

      weights: {
        rank: 50,
        branch: 15,
        quality: 15,
        reviews: 10,
        budget: 7,
        location: 3,
      },
    },
  };
}

function getExamId(profile = {}) {
  return String(
    profile.examId ||
    profile.exam_id ||
    profile.exam ||
    'jee-main'
  )
    .trim()
    .toLowerCase();
}

function getCategory(profile = {}) {
  const value =
    profile.category || 'OPEN';

  return String(value)
    .trim()
    .toLowerCase() === 'general'
      ? 'OPEN'
      : String(value);
}

function getBranchPreferences(profile = {}) {
  const value =
    profile.branches ||
    profile.preferredBranches ||
    profile.preferredBranch ||
    [];

  if (Array.isArray(value)) {
    return value
      .map((item) =>
        String(item || '').trim()
      )
      .filter(Boolean);
  }

  if (!value) {
    return [];
  }

  return [
    String(value).trim(),
  ].filter(Boolean);
}

function getAnnualBudget(profile = {}) {
  const candidates = [
    profile.annualBudget,
    profile.maximumAnnualBudget,
    profile.maxAnnualBudget,
    profile.maximumBudget,
    profile.maxBudget,
    profile.budget,
  ];

  for (const candidate of candidates) {
    const number =
      optionalNumber(candidate);

    if (
      number !== null &&
      number > 0
    ) {
      return number;
    }
  }

  return null;
}

export async function fetchCWRecommendations(
  profile = {},
  {
    limit = 100,
    locationMode = 'NONE',
  } = {}
) {
  const rank =
    optionalNumber(
      profile.rank
    );

  if (
    rank === null ||
    rank <= 0
  ) {
    return {
      data: [],
      meta: null,
    };
  }

  const examId =
    getExamId(profile);

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
    getCategory(profile)
  );

  params.set(
    'year',
    String(
      profile.year ||
      (
        examId === 'uptac'
          ? 2025
          : 2026
      )
    )
  );

  params.set(
    'round',
    String(
      profile.round || 1
    )
  );

  const branches =
    getBranchPreferences(
      profile
    );

  if (branches.length) {
    params.set(
      'branchPreferences',
      branches.join(',')
    );
  }

  const annualBudget =
    getAnnualBudget(
      profile
    );

  if (
    annualBudget !== null
  ) {
    params.set(
      'annualBudget',
      String(annualBudget)
    );
  }

  if (profile.quota) {
    params.set(
      'quota',
      String(profile.quota)
    );
  }

  if (profile.gender) {
    params.set(
      'gender',
      String(profile.gender)
    );
  }

  params.set(
    'locationMode',
    String(
      locationMode || 'NONE'
    ).toUpperCase()
  );

  params.set(
    'limit',
    String(
      Math.max(
        1,
        Math.min(
          1000,
          Number(limit) || 100
        )
      )
    )
  );

  const url =
    `${API_BASE_URL}/dev/cw-rec/recommendations?${params.toString()}`;

  console.log(
    '[CW-REC FRONTEND]',
    url
  );

  const response =
    await fetch(url);

  if (!response.ok) {
    throw new Error(
      `CW-REC API failed: ${response.status}`
    );
  }

  const payload =
    await response.json();

  const rows =
    Array.isArray(payload?.data)
      ? payload.data.map(
          adaptCWRecRow
        )
      : [];

  return {
    data: rows,
    meta:
      payload?.meta || null,

    scoringVersion:
      payload?.scoringVersion ||
      null,
  };
}
