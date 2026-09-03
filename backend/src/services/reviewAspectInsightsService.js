// backend/src/services/reviewAspectInsightsService.js

const CORE_ASPECTS = Object.freeze([
  "placements",
  "faculty",
  "academics",
  "infrastructure",
  "hostel",
  "campus_life",
  "administration",
  "fees",
]);

function normalizeText(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function normalizeBranch(value) {
  return normalizeText(value)
    .replace(/\band\b/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function normalizeAspect(value) {
  const raw = normalizeText(value)
    .replace(/[\s-]+/g, "_");

  const aliases = {
    placement: "placements",
    placements: "placements",

    faculty: "faculty",
    teaching: "faculty",

    academic: "academics",
    academics: "academics",

    infrastructure: "infrastructure",

    hostel: "hostel",
    hostels: "hostel",
    mess: "hostel",

    campus: "campus_life",
    campus_life: "campus_life",

    administration: "administration",
    admin: "administration",

    fees: "fees",
    fee: "fees",
    fee_roi: "fees",
    value_for_money: "fees",

    location: "location",
  };

  return aliases[raw] || raw;
}

function isConfirmedDuplicate(value) {
  const status = normalizeText(value);

  return (
    status === "duplicate" ||
    status === "confirmed_duplicate" ||
    status === "confirmed duplicate"
  );
}

function isExcludedProgramme(
  programmeLevel,
  course
) {
  const programme =
    normalizeText(programmeLevel);

  const courseText =
    normalizeText(course);

  if (
    programme.includes("m.tech") ||
    programme.includes("mba") ||
    programme.includes("phd") ||
    programme.includes("ph.d") ||
    programme.includes("postgraduate") ||
    programme === "pg"
  ) {
    return true;
  }

  if (
    courseText.includes("m.tech") ||
    courseText.includes("mba") ||
    courseText.includes("phd")
  ) {
    return true;
  }

  return false;
}

function branchMatches(
  requestedBranch,
  targetBranch,
  itemBranch
) {
  if (!requestedBranch) {
    return false;
  }

  const requested =
    normalizeBranch(requestedBranch);

  const target =
    normalizeBranch(targetBranch);

  const item =
    normalizeBranch(itemBranch);

  const matches = (candidate) => {
    if (!candidate) {
      return false;
    }

    return (
      candidate === requested ||
      candidate.includes(requested) ||
      requested.includes(candidate)
    );
  };

  return (
    matches(target) ||
    matches(item)
  );
}

function isUsableForBranch(
  row,
  requestedBranch
) {
  if (
    isConfirmedDuplicate(
      row.duplicate_status
    )
  ) {
    return false;
  }

  if (
    isExcludedProgramme(
      row.programme_level,
      row.course
    )
  ) {
    return false;
  }

  const scope =
    normalizeText(row.scope);

  /*
  |--------------------------------------------------------------------------
  | College-wide evidence
  |--------------------------------------------------------------------------
  |
  | Hostel, campus, administration etc. may legitimately apply across
  | branches.
  |--------------------------------------------------------------------------
  */

  if (
    scope.includes("college") ||
    scope.includes("institute") ||
    !scope
  ) {
    return true;
  }

  /*
  |--------------------------------------------------------------------------
  | Branch / department evidence
  |--------------------------------------------------------------------------
  |
  | Never show evidence from another branch as if it belongs to the
  | requested branch.
  |--------------------------------------------------------------------------
  */

  if (
    scope.includes("branch") ||
    scope.includes("department") ||
    scope.includes("course") ||
    scope.includes("programme")
  ) {
    return branchMatches(
      requestedBranch,
      row.target_branch,
      row.branch_text
    );
  }

  return true;
}

function buildEvidenceItem(row) {
  const text =
    String(
      row.evidence_summary ?? ""
    ).trim();

  if (!text) {
    return null;
  }

  return {
    reviewItemId:
      row.review_item_id
        ? String(row.review_item_id)
        : null,

    text,

    sentiment:
      normalizeText(
        row.sentiment
      ),

    source:
      row.source_name || null,

    sourceUrl:
      row.source_url || null,

    scope:
      row.scope || null,

    branch:
      row.target_branch ||
      row.branch_text ||
      null,

    programme:
      row.programme_level ||
      null,

    course:
      row.course ||
      null,

    contentAccess:
      row.content_access ||
      null,

    evidenceStrength:
      row.evidence_strength ||
      null,

    reviewDate:
      row.review_date ||
      null,
  };
}

function classifyAspect(rows) {
  const counts = {
    positive: 0,
    negative: 0,
    mixed: 0,
    neutral: 0,
  };

  for (const row of rows) {
    const sentiment =
      normalizeText(
        row.sentiment
      );

    if (
      Object.prototype
        .hasOwnProperty.call(
          counts,
          sentiment
        )
    ) {
      counts[sentiment]++;
    }
  }

  const total =
    counts.positive +
    counts.negative +
    counts.mixed +
    counts.neutral;

  if (!total) {
    return {
      classification: "missing",
      counts,
      total: 0,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | Display-only classification
  |--------------------------------------------------------------------------
  |
  | IMPORTANT:
  | This does NOT affect CW-REC score.
  |--------------------------------------------------------------------------
  */

  if (
    counts.positive >
      counts.negative &&
    counts.positive /
      total >=
      0.5
  ) {
    return {
      classification:
        "strength",
      counts,
      total,
    };
  }

  if (
    counts.negative >
      counts.positive &&
    counts.negative /
      total >=
      0.4
  ) {
    return {
      classification:
        "concern",
      counts,
      total,
    };
  }

  return {
    classification:
      "mixed",
    counts,
    total,
  };
}

function selectRepresentative(
  rows,
  sentiment,
  limit = 2
) {
  const seen =
    new Set();

  const result = [];

  for (const row of rows) {
    if (
      normalizeText(
        row.sentiment
      ) !== sentiment
    ) {
      continue;
    }

    const item =
      buildEvidenceItem(row);

    if (!item?.text) {
      continue;
    }

    const key =
      item.text
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();

    if (
      !key ||
      seen.has(key)
    ) {
      continue;
    }

    seen.add(key);
    result.push(item);

    if (
      result.length >= limit
    ) {
      break;
    }
  }

  return result;
}

export async function getReviewAspectInsights(
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

  const result =
    await client.query(
      `
      SELECT

        ras.review_item_id,
        ras.aspect,
        ras.target_branch,
        ras.scope,
        ras.sentiment,
        ras.evidence_summary,

        cri.source_url,
        cri.branch_text,
        cri.branch_verified,
        cri.programme_level,
        cri.course,
        cri.review_date,
        cri.content_access,
        cri.evidence_strength,
        cri.duplicate_status,

        rs.name
          AS source_name

      FROM
        review_aspect_sentiments ras

      JOIN
        college_review_items cri
          ON cri.id =
             ras.review_item_id

      LEFT JOIN
        review_sources rs
          ON rs.id =
             cri.source_id

      WHERE
        cri.college_id = $1

      ORDER BY
        ras.id ASC
      `,
      [
        collegeId
      ]
    );

  const usableRows =
    result.rows.filter(
      (row) =>
        isUsableForBranch(
          row,
          branch
        )
    );

  const grouped =
    new Map();

  for (
    const row of usableRows
  ) {
    const aspect =
      normalizeAspect(
        row.aspect
      );

    if (!aspect) {
      continue;
    }

    if (
      !grouped.has(aspect)
    ) {
      grouped.set(
        aspect,
        []
      );
    }

    grouped
      .get(aspect)
      .push(row);
  }

  const aspects = {};

  const strengths = [];
  const concerns = [];
  const mixedAspects = [];

  for (
    const [
      aspect,
      rows
    ] of grouped.entries()
  ) {
    const classification =
      classifyAspect(rows);

    if (
      classification
        .classification ===
      "strength"
    ) {
      strengths.push(aspect);
    }

    if (
      classification
        .classification ===
      "concern"
    ) {
      concerns.push(aspect);
    }

    if (
      classification
        .classification ===
      "mixed"
    ) {
      mixedAspects.push(
        aspect
      );
    }

    aspects[aspect] = {
      classification:
        classification
          .classification,

      evidenceCount:
        classification.total,

      sentimentBreakdown:
        classification.counts,

      representativePositiveSentences:
        selectRepresentative(
          rows,
          "positive"
        ),

      representativeNegativeSentences:
        selectRepresentative(
          rows,
          "negative"
        ),

      representativeMixedSentences:
        selectRepresentative(
          rows,
          "mixed"
        ),

      representativeNeutralSentences:
        selectRepresentative(
          rows,
          "neutral"
        ),
    };
  }

  const missingAspects =
    CORE_ASPECTS.filter(
      (aspect) =>
        !grouped.has(aspect)
    );

  const sources =
    new Set(
      usableRows
        .map(
          (row) =>
            normalizeText(
              row.source_name
            )
        )
        .filter(Boolean)
    );

  const reviewIds =
    new Set(
      usableRows
        .map(
          (row) =>
            row.review_item_id
        )
        .filter(Boolean)
    );

  return {
    strengths,
    concerns,
    mixedAspects,
    missingAspects,
    aspects,

    insightEvidence: {
      usableAspectEvidence:
        usableRows.length,

      usableReviews:
        reviewIds.size,

      independentSources:
        sources.size,
    },
  };
}
