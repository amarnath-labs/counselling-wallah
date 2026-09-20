// backend/src/services/reviewScoringService.js

const SENTIMENT_VALUE = {
  positive: 1,
  mixed: 0.5,
  neutral: 0.5,
  negative: 0,
};

const SOURCE_WEIGHTS = {
  Shiksha: 1.0,
  Collegedunia: 1.0,
  Careers360: 0.95,
  Quora: 0.85,
  GetMyUni: 0.85,
  Zollege: 0.8,
  CollegeBatch: 0.8,
  "CollegeBatch.com": 0.8,
  CollegeDekho: 0.8,
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeText(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function normalizeSourceName(value) {
  const text = String(value ?? "").trim();

  if (!text) {
    return null;
  }

  const lower = text.toLowerCase();

  if (lower.startsWith("shiksha")) {
    return "Shiksha";
  }

  if (lower.startsWith("collegedunia")) {
    return "Collegedunia";
  }

  if (lower.startsWith("careers360")) {
    return "Careers360";
  }

  if (lower.startsWith("quora")) {
    return "Quora";
  }

  if (lower.startsWith("getmyuni")) {
    return "GetMyUni";
  }

  if (lower.startsWith("zollege")) {
    return "Zollege";
  }

  if (lower.startsWith("collegebatch")) {
    return "CollegeBatch";
  }

  if (lower.startsWith("collegedekho")) {
    return "CollegeDekho";
  }

  return text;
}

function getSourceWeight(sourceName) {
  const normalized = normalizeSourceName(sourceName);

  if (!normalized) {
    return 0.7;
  }

  return SOURCE_WEIGHTS[normalized] ?? 0.7;
}

function getEvidenceStrengthWeight(value) {
  const strength = normalizeText(value);

  if (strength === "high") {
    return 1;
  }

  if (strength === "medium") {
    return 0.8;
  }

  if (strength === "low") {
    return 0.6;
  }

  return 0.75;
}

function getContentAccessWeight(value) {
  const access = normalizeText(value);

  if (
    access === "full" ||
    access === "full_text" ||
    access === "full review"
  ) {
    return 1;
  }

  if (
    access === "partial" ||
    access === "snippet"
  ) {
    return 0.75;
  }

  return 0.8;
}

function isConfirmedDuplicate(value) {
  const status = normalizeText(value);

  return (
    status === "duplicate" ||
    status === "confirmed_duplicate" ||
    status === "confirmed duplicate"
  );
}

function getProgrammeWeight(programmeLevel, course) {
  const programme = normalizeText(programmeLevel);
  const courseText = normalizeText(course);

  if (
    programme.includes("b.tech") ||
    programme.includes("btech") ||
    programme.includes("undergraduate") ||
    programme === "ug"
  ) {
    return 1;
  }

  if (
    courseText.includes("b.tech") ||
    courseText.includes("btech") ||
    courseText.includes("engineering")
  ) {
    return 1;
  }

  if (
    programme.includes("m.tech") ||
    programme.includes("mba") ||
    programme.includes("phd") ||
    programme.includes("ph.d") ||
    programme.includes("postgraduate") ||
    programme === "pg"
  ) {
    return 0;
  }

  return 0.65;
}

function normalizeBranch(value) {
  return normalizeText(value)
    .replace(/\band\b/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function getBranchWeight({
  requestedBranch,
  targetBranch,
  reviewBranch,
  branchVerified,
}) {
  if (!requestedBranch) {
    return 1;
  }

  const requested = normalizeBranch(requestedBranch);

  const target = normalizeBranch(targetBranch);
  const review = normalizeBranch(reviewBranch);

  if (target && target === requested) {
    return branchVerified ? 1.2 : 1.1;
  }

  if (review && review === requested) {
    return branchVerified ? 1.2 : 1.1;
  }

  if (
    target &&
    (target.includes(requested) ||
      requested.includes(target))
  ) {
    return 1.05;
  }

  if (
    review &&
    (review.includes(requested) ||
      requested.includes(review))
  ) {
    return 1.05;
  }

  if (!target && !review) {
    return 0.85;
  }

  return 0.7;
}

function getScopeWeight(scope) {
  const normalized = normalizeText(scope);

  if (
    normalized.includes("branch") ||
    normalized.includes("department")
  ) {
    return 1;
  }

  if (
    normalized.includes("programme") ||
    normalized.includes("course")
  ) {
    return 0.9;
  }

  if (
    normalized.includes("college") ||
    normalized.includes("institute")
  ) {
    return 0.8;
  }

  return 0.85;
}

function getRecencyWeight(reviewDate) {
  if (!reviewDate) {
    return 0.85;
  }

  const date = new Date(reviewDate);

  if (Number.isNaN(date.getTime())) {
    return 0.85;
  }

  const now = new Date();

  const ageYears =
    (now.getTime() - date.getTime()) /
    (365.25 * 24 * 60 * 60 * 1000);

  if (ageYears <= 1) {
    return 1;
  }

  if (ageYears <= 2) {
    return 0.95;
  }

  if (ageYears <= 3) {
    return 0.9;
  }

  if (ageYears <= 5) {
    return 0.8;
  }

  return 0.7;
}

function calculateConfidence({
  evidenceCount,
  sourceCount,
  weightedEvidence,
}) {
  if (!evidenceCount) {
    return 0;
  }

  const evidenceScore =
    clamp(evidenceCount / 20, 0, 1);

  const sourceScore =
    clamp(sourceCount / 4, 0, 1);

  const qualityScore =
    clamp(weightedEvidence / 15, 0, 1);

  const confidence =
    evidenceScore * 0.4 +
    sourceScore * 0.3 +
    qualityScore * 0.3;

  return Math.round(confidence * 100);
}

function calculateSentimentScore(
  rows,
  requestedBranch = null
) {
  let weightedTotal = 0;
  let totalWeight = 0;

  const sources = new Set();

  let usableEvidenceCount = 0;

  const breakdown = {
    positive: 0,
    negative: 0,
    mixed: 0,
    neutral: 0,
  };

  for (const row of rows) {
    if (isConfirmedDuplicate(row.duplicate_status)) {
      continue;
    }

    const sentiment =
      normalizeText(row.sentiment);

    if (
      !Object.prototype.hasOwnProperty.call(
        SENTIMENT_VALUE,
        sentiment
      )
    ) {
      continue;
    }

    const programmeWeight =
      getProgrammeWeight(
        row.programme_level,
        row.course
      );

    if (programmeWeight === 0) {
      continue;
    }

    const sourceWeight =
      getSourceWeight(
        row.source_name
      );

    const evidenceWeight =
      getEvidenceStrengthWeight(
        row.evidence_strength
      );

    const accessWeight =
      getContentAccessWeight(
        row.content_access
      );

    const branchWeight =
      getBranchWeight({
        requestedBranch,
        targetBranch:
          row.target_branch,
        reviewBranch:
          row.branch_text,
        branchVerified:
          row.branch_verified,
      });

    const scopeWeight =
      getScopeWeight(
        row.scope
      );

    const recencyWeight =
      getRecencyWeight(
        row.review_date
      );

    const weight =
      sourceWeight *
      evidenceWeight *
      accessWeight *
      programmeWeight *
      branchWeight *
      scopeWeight *
      recencyWeight;

    if (weight <= 0) {
      continue;
    }

    const sentimentValue =
      SENTIMENT_VALUE[sentiment];

    weightedTotal +=
      sentimentValue * weight;

    totalWeight += weight;

    usableEvidenceCount++;

    breakdown[sentiment]++;

    if (row.source_name) {
      sources.add(
        normalizeSourceName(
          row.source_name
        )
      );
    }
  }

  if (
    usableEvidenceCount === 0 ||
    totalWeight === 0
  ) {
    return {
      score: null,
      confidence: 0,
      evidenceCount: 0,
      sourceCount: 0,
      breakdown,
    };
  }

  const score =
    clamp(
      (weightedTotal / totalWeight) *
        100,
      0,
      100
    );

  const confidence =
    calculateConfidence({
      evidenceCount:
        usableEvidenceCount,
      sourceCount:
        sources.size,
      weightedEvidence:
        totalWeight,
    });

  return {
    score:
      Math.round(score * 10) /
      10,

    confidence,

    evidenceCount:
      usableEvidenceCount,

    sourceCount:
      sources.size,

    breakdown,
  };
}

function calculateAggregateScore(
  aggregates
) {
  let weightedTotal = 0;
  let totalWeight = 0;

  let usable = 0;

  const sources = new Set();

  for (const row of aggregates) {
    const rating =
      Number(row.aggregate_rating);

    const scale =
      Number(row.rating_scale);

    if (
      !Number.isFinite(rating) ||
      !Number.isFinite(scale) ||
      scale <= 0
    ) {
      continue;
    }

    const normalized =
      clamp(
        rating / scale,
        0,
        1
      ) * 100;

    const sourceWeight =
      getSourceWeight(
        row.source_name
      );

    const evidenceWeight =
      getEvidenceStrengthWeight(
        row.evidence_strength
      );

    let countWeight = 0.75;

    const reviewCount =
      Number(row.review_count);

    if (
      Number.isFinite(reviewCount) &&
      reviewCount > 0
    ) {
      countWeight =
        clamp(
          Math.log10(
            reviewCount + 1
          ) / 3,
          0.5,
          1
        );
    }

    const weight =
      sourceWeight *
      evidenceWeight *
      countWeight;

    weightedTotal +=
      normalized * weight;

    totalWeight += weight;

    usable++;

    if (row.source_name) {
      sources.add(
        normalizeSourceName(
          row.source_name
        )
      );
    }
  }

  if (
    usable === 0 ||
    totalWeight === 0
  ) {
    return {
      score: null,
      evidenceCount: 0,
      sourceCount: 0,
    };
  }

  return {
    score:
      Math.round(
        weightedTotal /
          totalWeight *
          10
      ) / 10,

    evidenceCount: usable,
    sourceCount: sources.size,
  };
}

function combineReviewSignals({
  sentiment,
  aggregate,
}) {
  const hasSentiment =
    sentiment?.score !== null &&
    sentiment?.score !== undefined;

  const hasAggregate =
    aggregate?.score !== null &&
    aggregate?.score !== undefined;

  if (
    !hasSentiment &&
    !hasAggregate
  ) {
    return null;
  }

  if (
    hasSentiment &&
    !hasAggregate
  ) {
    return sentiment.score;
  }

  if (
    !hasSentiment &&
    hasAggregate
  ) {
    return aggregate.score;
  }

  /*
    Sentiment evidence has higher
    importance because it contains
    aspect-level qualitative evidence.

    Aggregate rating is supporting signal.
  */

  const sentimentWeight = 0.65;
  const aggregateWeight = 0.35;

  return (
    Math.round(
      (
        sentiment.score *
          sentimentWeight +
        aggregate.score *
          aggregateWeight
      ) *
        10
    ) / 10
  );
}

export async function getCollegeReviewScore(
  client,
  {
    collegeId,
    branch = null,
  }
) {
  if (!collegeId) {
    throw new Error(
      "collegeId is required"
    );
  }

  const sentimentResult =
    await client.query(
      `
      SELECT
        ras.sentiment,
        ras.aspect,
        ras.target_branch,
        ras.scope,

        cri.branch_text,
        cri.branch_verified,
        cri.programme_level,
        cri.course,
        cri.review_date,
        cri.content_access,
        cri.evidence_strength,
        cri.duplicate_status,

        rs.name AS source_name

      FROM review_aspect_sentiments ras

      JOIN college_review_items cri
        ON cri.id =
           ras.review_item_id

      LEFT JOIN review_sources rs
        ON rs.id =
           cri.source_id

      WHERE cri.college_id = $1
      `,
      [collegeId]
    );

  const aggregateResult =
    await client.query(
      `
      SELECT
        ras.aggregate_rating,
        ras.rating_scale,
        ras.review_count,
        ras.verified_review_count,
        ras.programme_scope,
        ras.evidence_strength,
        ras.observed_at,

        rs.name AS source_name

      FROM review_aggregate_snapshots ras

      LEFT JOIN review_sources rs
        ON rs.id =
           ras.source_id

      WHERE ras.college_id = $1
      `,
      [collegeId]
    );

  const sentiment =
    calculateSentimentScore(
      sentimentResult.rows,
      branch
    );

  const aggregate =
    calculateAggregateScore(
      aggregateResult.rows
    );

  const reviewScore =
    combineReviewSignals({
      sentiment,
      aggregate,
    });

  return {
    collegeId,
    requestedBranch:
      branch ?? null,

    reviewScore,

    sentimentScore:
      sentiment.score,

    aggregateScore:
      aggregate.score,

    confidence:
      sentiment.confidence,

    evidence: {
      sentimentEvidence:
        sentiment.evidenceCount,

      aggregateEvidence:
        aggregate.evidenceCount,

      sentimentSources:
        sentiment.sourceCount,

      aggregateSources:
        aggregate.sourceCount,

      sentimentBreakdown:
        sentiment.breakdown,
    },
  };
}

export function getReviewComponent(
  reviewScore,
  weight = 10
) {
  if (
    reviewScore === null ||
    reviewScore === undefined
  ) {
    return null;
  }

  const normalized =
    clamp(
      Number(reviewScore),
      0,
      100
    );

  return (
    Math.round(
      (
        normalized / 100
      ) *
        weight *
        100
    ) / 100
  );
}