import { pool } from "../db/pool.js";

const ASPECTS = [
  "placements",
  "academics",
  "faculty",
  "infrastructure",
  "hostel",
  "campus_life",
  "administration",
  "location",
  "internships",
  "value_for_money",
];

const SOURCE_WEIGHT = {
  strong: 1.0,
  high: 1.0,
  verified: 1.0,
  medium: 0.8,
  moderate: 0.75,
  weak: 0.5,
  low: 0.5,
};

function clamp(value, min = 0, max = 100) {
  return Math.max(
    min,
    Math.min(max, value)
  );
}

function numberOrNull(value) {
  const n = Number(value);

  return Number.isFinite(n)
    ? n
    : null;
}

function ageInMonths(dateValue) {
  if (!dateValue) {
    return null;
  }

  const d = new Date(dateValue);

  if (Number.isNaN(d.getTime())) {
    return null;
  }

  const now = new Date();

  return Math.max(
    0,
    (
      (now.getFullYear() - d.getFullYear()) * 12
    ) +
    (
      now.getMonth() - d.getMonth()
    )
  );
}

function recencyWeight(dateValue) {
  const months =
    ageInMonths(dateValue);

  if (months === null) {
    return 0.65;
  }

  if (months <= 12) {
    return 1.0;
  }

  if (months <= 24) {
    return 0.85;
  }

  if (months <= 36) {
    return 0.7;
  }

  return 0.55;
}

function sentimentToScore(sentiment) {
  const value =
    String(sentiment || "")
      .trim()
      .toLowerCase();

  if (
    value === "positive" ||
    value === "very_positive"
  ) {
    return 85;
  }

  if (
    value === "negative" ||
    value === "very_negative"
  ) {
    return 25;
  }

  if (
    value === "mixed" ||
    value === "neutral"
  ) {
    return 55;
  }

  return 50;
}

function scoreLabel(score) {
  if (score >= 75) {
    return "Positive";
  }

  if (score >= 55) {
    return "Mixed";
  }

  return "Concern";
}

function confidenceLabel(score) {
  if (score >= 75) {
    return "High";
  }

  if (score >= 50) {
    return "Medium";
  }

  return "Low";
}

function agreementLabel(
  positive,
  mixed,
  negative
) {
  const total =
    positive +
    mixed +
    negative;

  if (!total) {
    return "Insufficient evidence";
  }

  const strongest =
    Math.max(
      positive,
      mixed,
      negative
    );

  const share =
    strongest / total;

  if (share >= 0.75) {
    return "Strong agreement";
  }

  if (share >= 0.55) {
    return "Moderate agreement";
  }

  return "Mixed evidence";
}

function normalizeBranch(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function branchMatches(
  targetBranch,
  requestedBranch
) {
  if (
    !targetBranch ||
    !requestedBranch
  ) {
    return false;
  }

  const a =
    normalizeBranch(targetBranch);

  const b =
    normalizeBranch(requestedBranch);

  return (
    a === b ||
    a.includes(b) ||
    b.includes(a)
  );
}

export async function buildDeepReviewIntelligence({
  collegeId,
  branchName = null,
}) {
  if (!collegeId) {
    return {
      available: false,
      reason: "college_id_missing",
    };
  }

  const itemsResult =
    await pool.query(`
      SELECT
        cri.id,
        cri.review_date,
        cri.observed_at,
        cri.evidence_strength,
        cri.course,
        cri.course_verified,
        cri.department,
        cri.branch_text,
        cri.branch_verified,
        cri.rating,
        cri.rating_scale,
        cri.duplicate_status,

        ras.aspect,
        ras.target_branch,
        ras.scope,
        ras.sentiment,
        ras.evidence_summary,

        rs.name AS source_name,
        rs.source_type

      FROM college_review_items cri

      LEFT JOIN review_aspect_sentiments ras
        ON ras.review_item_id = cri.id

      LEFT JOIN review_sources rs
        ON rs.id = cri.source_id

      WHERE cri.college_id = $1
        AND (
          cri.duplicate_status IS NULL
          OR LOWER(cri.duplicate_status)
             NOT IN (
               'duplicate',
               'excluded'
             )
        )
      ORDER BY
        COALESCE(
          cri.review_date,
          cri.observed_at::date
        ) DESC NULLS LAST
    `, [collegeId]);

  const platformResult =
    await pool.query(`
      SELECT
        rpar.aspect,
        rpar.rating,
        rpar.rating_scale,
        rpar.programme_scope,
        rpar.observed_at,
        rs.name AS source_name,
        rs.source_type
      FROM review_platform_aspect_ratings rpar
      LEFT JOIN review_sources rs
        ON rs.id = rpar.source_id
      WHERE rpar.college_id = $1
    `, [collegeId]);

  const summaryResult =
    await pool.query(`
      SELECT *
      FROM college_sentiment_summary
      WHERE college_id = $1
      LIMIT 1
    `, [collegeId]);

  const aspectMap =
    new Map(
      ASPECTS.map(
        aspect => [
          aspect,
          {
            aspect,
            weightedScoreTotal: 0,
            weightedScoreWeight: 0,
            evidenceCount: 0,
            recentCount: 0,
            branchSpecificCount: 0,
            strongEvidenceCount: 0,
            positive: 0,
            mixed: 0,
            negative: 0,
            sources: new Set(),
          },
        ]
      )
    );

  let totalEvidence = 0;
  let recentEvidence = 0;
  let branchSpecificEvidence = 0;
  let strongEvidence = 0;

  for (
    const row of itemsResult.rows
  ) {
    if (
      !row.aspect ||
      !aspectMap.has(row.aspect)
    ) {
      continue;
    }

    const bucket =
      aspectMap.get(row.aspect);

    const date =
      row.review_date ||
      row.observed_at;

    const recency =
      recencyWeight(date);

    const strengthKey =
      String(
        row.evidence_strength || ""
      ).toLowerCase();

    const sourceWeight =
      SOURCE_WEIGHT[strengthKey] ??
      0.7;

    const branchSpecific =
      Boolean(
        row.branch_verified ||
        branchMatches(
          row.branch_text,
          branchName
        ) ||
        branchMatches(
          row.target_branch,
          branchName
        ) ||
        String(row.scope || "")
          .toLowerCase()
          .includes("branch")
      );

    const scopeWeight =
      branchSpecific
        ? 1.15
        : 1.0;

    const weight =
      recency *
      sourceWeight *
      scopeWeight;

    const sentimentScore =
      sentimentToScore(
        row.sentiment
      );

    bucket.weightedScoreTotal +=
      sentimentScore * weight;

    bucket.weightedScoreWeight +=
      weight;

    bucket.evidenceCount += 1;

    totalEvidence += 1;

    const months =
      ageInMonths(date);

    if (
      months !== null &&
      months <= 24
    ) {
      bucket.recentCount += 1;
      recentEvidence += 1;
    }

    if (branchSpecific) {
      bucket.branchSpecificCount += 1;
      branchSpecificEvidence += 1;
    }

    if (
      sourceWeight >= 0.9
    ) {
      bucket.strongEvidenceCount += 1;
      strongEvidence += 1;
    }

    if (row.source_name) {
      bucket.sources.add(
        row.source_name
      );
    }

    const s =
      String(
        row.sentiment || ""
      ).toLowerCase();

    if (s.includes("positive")) {
      bucket.positive += 1;
    }
    else if (
      s.includes("negative")
    ) {
      bucket.negative += 1;
    }
    else {
      bucket.mixed += 1;
    }
  }

  for (
    const row of platformResult.rows
  ) {
    if (
      !row.aspect ||
      !aspectMap.has(row.aspect)
    ) {
      continue;
    }

    const rating =
      numberOrNull(
        row.rating
      );

    const scale =
      numberOrNull(
        row.rating_scale
      );

    if (
      rating === null ||
      !scale
    ) {
      continue;
    }

    const bucket =
      aspectMap.get(row.aspect);

    const normalized =
      clamp(
        (rating / scale) * 100
      );

    const recency =
      recencyWeight(
        row.observed_at
      );

    const scope =
      String(
        row.programme_scope || ""
      ).toLowerCase();

    const branchSpecific =
      scope.includes("branch") ||
      scope.includes("course");

    const weight =
      recency *
      (branchSpecific ? 1.15 : 1.0) *
      0.9;

    bucket.weightedScoreTotal +=
      normalized * weight;

    bucket.weightedScoreWeight +=
      weight;

    bucket.evidenceCount += 1;
    totalEvidence += 1;

    const months =
      ageInMonths(
        row.observed_at
      );

    if (
      months !== null &&
      months <= 24
    ) {
      bucket.recentCount += 1;
      recentEvidence += 1;
    }

    if (branchSpecific) {
      bucket.branchSpecificCount += 1;
      branchSpecificEvidence += 1;
    }

    if (row.source_name) {
      bucket.sources.add(
        row.source_name
      );
    }
  }

  const aspects =
    ASPECTS.map(
      aspect => {
        const bucket =
          aspectMap.get(aspect);

        if (
          bucket.evidenceCount === 0 ||
          bucket.weightedScoreWeight === 0
        ) {
          return {
            aspect,
            available: false,
            score: null,
            sentiment: null,
            confidence: "Low",
            evidenceCount: 0,
            recentEvidencePercent: 0,
            branchSpecificPercent: 0,
            agreement: "Insufficient evidence",
            sourceCount: 0,
          };
        }

        const score =
          Math.round(
            bucket.weightedScoreTotal /
            bucket.weightedScoreWeight
          );

        const coverageConfidence =
          Math.min(
            40,
            bucket.evidenceCount * 8
          );

        const strongShare =
          bucket.evidenceCount
            ? (
                bucket.strongEvidenceCount /
                bucket.evidenceCount
              )
            : 0;

        const recentShare =
          bucket.evidenceCount
            ? (
                bucket.recentCount /
                bucket.evidenceCount
              )
            : 0;

        const branchShare =
          bucket.evidenceCount
            ? (
                bucket.branchSpecificCount /
                bucket.evidenceCount
              )
            : 0;

        const confidenceScore =
          clamp(
            coverageConfidence +
            strongShare * 25 +
            recentShare * 20 +
            branchShare * 15
          );

        return {
          aspect,
          available: true,
          score,
          sentiment:
            scoreLabel(score),
          confidence:
            confidenceLabel(
              confidenceScore
            ),
          confidenceScore:
            Math.round(
              confidenceScore
            ),
          evidenceCount:
            bucket.evidenceCount,
          recentEvidencePercent:
            Math.round(
              recentShare * 100
            ),
          branchSpecificPercent:
            Math.round(
              branchShare * 100
            ),
          agreement:
            agreementLabel(
              bucket.positive,
              bucket.mixed,
              bucket.negative
            ),
          sourceCount:
            bucket.sources.size,
        };
      }
    );

  const supported =
    aspects.filter(
      item => item.available
    );

  const overallScore =
    supported.length
      ? Math.round(
          supported.reduce(
            (sum, item) =>
              sum + item.score,
            0
          ) /
          supported.length
        )
      : null;

  const coveragePercent =
    Math.round(
      (
        supported.length /
        ASPECTS.length
      ) * 100
    );

  const recentPercent =
    totalEvidence
      ? Math.round(
          (
            recentEvidence /
            totalEvidence
          ) * 100
        )
      : 0;

  const branchPercent =
    totalEvidence
      ? Math.round(
          (
            branchSpecificEvidence /
            totalEvidence
          ) * 100
        )
      : 0;

  const strongPercent =
    totalEvidence
      ? Math.round(
          (
            strongEvidence /
            totalEvidence
          ) * 100
        )
      : 0;

  const overallConfidenceScore =
    clamp(
      coveragePercent * 0.35 +
      recentPercent * 0.25 +
      strongPercent * 0.25 +
      branchPercent * 0.15
    );

  const strengths =
    supported
      .filter(
        item =>
          item.score >= 70
      )
      .sort(
        (a, b) =>
          b.score - a.score
      )
      .slice(0, 4)
      .map(
        item => item.aspect
      );

  const concerns =
    supported
      .filter(
        item =>
          item.score < 55
      )
      .sort(
        (a, b) =>
          a.score - b.score
      )
      .slice(0, 4)
      .map(
        item => item.aspect
      );

  const missingEvidence =
    aspects
      .filter(
        item => !item.available
      )
      .map(
        item => item.aspect
      );

  return {
    version: "V4",
    available:
      totalEvidence > 0,

    scoringImpact:
      "NONE",

    note:
      "Deep Review Intelligence V4 is an additive evidence layer and does not change the existing recommendation score.",

    overallReviewScore:
      overallScore,

    evidenceConfidence: {
      score:
        Math.round(
          overallConfidenceScore
        ),
      label:
        confidenceLabel(
          overallConfidenceScore
        ),
    },

    coverage: {
      supportedAspects:
        supported.length,
      totalAspects:
        ASPECTS.length,
      percent:
        coveragePercent,
    },

    evidence: {
      total:
        totalEvidence,
      recentPercent,
      branchSpecificPercent:
        branchPercent,
      strongEvidencePercent:
        strongPercent,
    },

    strengths,
    concerns,
    missingEvidence,
    aspects,

    existingSummary:
      summaryResult.rows[0] || null,
  };
}

export default {
  buildDeepReviewIntelligence,
};
